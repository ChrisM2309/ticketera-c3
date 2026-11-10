'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import type { SupabaseClient } from '@supabase/supabase-js';

import { requireRole } from '@/lib/auth/require-role';

import { parseSettingsForm } from './form';

const settingsPath = '/admin/ajustes/';

async function setSetting(client: SupabaseClient, key: string, value: unknown) {
  const { error } = await client.rpc('admin_set_setting', { p_key: key, p_value: value === null ? null : JSON.stringify(value) });
  if (error) throw new Error(error.message);
}

export async function updateSettingsAction(formData: FormData): Promise<void> {
  const account = await requireRole('admin', settingsPath);
  const parsed = parseSettingsForm(formData);
  if (!parsed.valid) redirect(`${settingsPath}?error=formulario`);

  try {
    await setSetting(account.client, 'featured_daily_rate_cents', parsed.data.dailyRateCents);
    await setSetting(account.client, 'package_annual_price_cents', parsed.data.packagePriceCents);
    await setSetting(account.client, 'package_benefits', parsed.data.benefits);
  } catch {
    redirect(`${settingsPath}?error=guardar`);
  }

  revalidatePath('/robots.txt');
  revalidatePath('/sitemap.xml');
  revalidatePath('/');
  redirect(`${settingsPath}?ok=guardar`);
}

export async function toggleIndexingAction(formData: FormData): Promise<void> {
  const account = await requireRole('admin', settingsPath);
  const enabled = formData.get('indexingEnabled') === 'true';
  if (enabled && formData.get('acknowledgeDemo') !== 'on') {
    redirect(`${settingsPath}?error=confirmacion`);
  }

  try {
    await setSetting(account.client, 'indexing_enabled', enabled);
  } catch {
    redirect(`${settingsPath}?error=guardar`);
  }

  revalidatePath('/robots.txt');
  revalidatePath('/sitemap.xml');
  revalidatePath('/');
  redirect(`${settingsPath}?ok=indexacion`);
}
