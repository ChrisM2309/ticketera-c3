import { NextResponse } from 'next/server';
import { buildReminderEmail, buildWeeklyEmail } from '@/features/reminders/emails';
import { readBrevoConfig, sendBrevoEmail } from '@/features/ticketing/email/brevo';
import { createServiceRoleClient } from '@/lib/supabase/server';
import { siteConfig } from '@/lib/site-config';

export const runtime = 'nodejs';

/** Envío de muestra al único destinatario de prueba configurado en servidor. No consume el boletín semanal. */
export async function POST(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get('authorization') !== `Bearer ${secret}`) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  const recipient = process.env.DEMO_TEST_EMAIL?.trim();
  const config = readBrevoConfig();
  if (!recipient || !config) return NextResponse.json({ error: 'Configurá DEMO_TEST_EMAIL y Brevo.' }, { status: 503 });
  let body: { type?: unknown };
  try { body = await request.json() as { type?: unknown }; } catch { return NextResponse.json({ error: 'Solicitud no válida.' }, { status: 400 }); }
  if (body.type !== 'cart' && body.type !== 'weekly') return NextResponse.json({ error: 'Indicá type cart o weekly.' }, { status: 400 });

  let message;
  let tag: string;
  if (body.type === 'cart') {
    message = buildReminderEmail('Evento de prueba', `${siteConfig.siteUrl}/congresos/`);
    tag = 'prueba-recordatorio-carrito';
  } else {
    const db = createServiceRoleClient();
    if (!db) return NextResponse.json({ error: 'No disponible.' }, { status: 503 });
    const events = await db.from('events').select('id,slug,title,starts_at,event_type:categories!events_event_type_fk(slug),topic:categories!events_topic_fk(slug)').eq('status','published').gt('starts_at',new Date().toISOString()).order('starts_at').limit(3);
    if (events.error || !events.data?.length) return NextResponse.json({ error: 'No hay eventos próximos publicados para mostrar.' }, { status: 503 });
    const values = events.data.map(event => {
      const eventType = Array.isArray(event.event_type) ? event.event_type[0] : event.event_type;
      const topic = Array.isArray(event.topic) ? event.topic[0] : event.topic;
      return { title:event.title,url:`${siteConfig.siteUrl}/${(eventType as {slug:string}|null)?.slug??'eventos'}/${(topic as {slug:string}|null)?.slug?`${(topic as {slug:string}).slug}/`:''}${event.slug}/`,startsAt:new Intl.DateTimeFormat('es-SV',{dateStyle:'medium',timeStyle:'short',timeZone:'America/El_Salvador'}).format(new Date(event.starts_at)) };
    });
    message = buildWeeklyEmail(values);
    tag = 'prueba-novedades-semanales';
  }
  const result = await sendBrevoEmail(config,{to:{email:recipient},...message,tag});
  if (!result.ok) return NextResponse.json({ error: result.reason }, { status: 502 });
  return NextResponse.json({ sent: true, type: body.type });
}
