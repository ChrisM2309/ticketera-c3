import { randomUUID } from 'node:crypto';

import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

import { consentCookieName, parseConsent } from '@/lib/analytics/consent';
import { analyticsEventNames } from '@/lib/analytics/track';
import { createServiceRoleClient } from '@/lib/supabase/server';

export const runtime = 'nodejs';

function isUuid(value: string | undefined): value is string {
  return typeof value === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

export async function POST(request: Request) {
  const jar = await cookies();
  if (parseConsent(jar.toString()) !== 'granted') return new Response(null, { status: 204 });

  let input: unknown;
  try { input = await request.json(); } catch { return new Response(null, { status: 204 }); }
  if (typeof input !== 'object' || input === null) return new Response(null, { status: 204 });
  const value = input as Record<string, unknown>;
  const name = value.name;
  const path = value.path;
  const referrerHost = value.referrerHost;
  if (typeof name !== 'string' || !analyticsEventNames.includes(name as (typeof analyticsEventNames)[number]) || typeof path !== 'string' || !path.startsWith('/') || path.length > 200 || (referrerHost !== null && referrerHost !== undefined && (typeof referrerHost !== 'string' || referrerHost.length > 100))) {
    return new Response(null, { status: 204 });
  }

  const client = createServiceRoleClient();
  if (!client) return new Response(null, { status: 204 });
  const existingAnonId = jar.get('ticketera_anon')?.value;
  const anonId = isUuid(existingAnonId) ? existingAnonId : randomUUID();
  const result = await client.from('analytics_events').insert({ name, path, referrer_host: referrerHost ?? null, anon_id: anonId });
  if (result.error) return new Response(null, { status: 204 });

  const response = new NextResponse(null, { status: 204 });
  if (!isUuid(existingAnonId)) response.cookies.set('ticketera_anon', anonId, { httpOnly: true, sameSite: 'lax', secure: process.env.NODE_ENV === 'production', path: '/', maxAge: 15552000 });
  response.headers.set('x-analytics-consent', consentCookieName);
  return response;
}
