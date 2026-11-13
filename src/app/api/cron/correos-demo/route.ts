import { NextResponse } from 'next/server';
import { createServiceRoleClient } from '@/lib/supabase/server';
import { siteConfig } from '@/lib/site-config';
import { sendReminder, buildWeeklyEmail } from '@/features/reminders/emails';
import { readBrevoConfig, sendBrevoEmail } from '@/features/ticketing/email/brevo';

export const runtime = 'nodejs';

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get('authorization') !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }
  const db = createServiceRoleClient();
  if (!db) return NextResponse.json({ error: 'No configurado' }, { status: 503 });
  await db.from('cart_email_reminders').delete().in('status', ['sent','failed','cancelled']).lt('updated_at', new Date(Date.now()-30*86400000).toISOString());

  let cartSent = 0;
  const due = await db.from('cart_email_reminders').select('id,email,event_id,items,token_hash,events(title,slug,status,starts_at)').eq('status','pending').lte('updated_at', new Date(Date.now()-86400000).toISOString()).limit(50);
  for (const row of due.data ?? []) {
    const event = row.events as unknown as {title:string;slug:string;status:string;starts_at:string}|null;
    if (!event || event.status !== 'published' || new Date(event.starts_at) <= new Date()) {
      await db.from('cart_email_reminders').update({status:'cancelled'}).eq('id',row.id).eq('status','pending'); continue;
    }
    const claim = await db.from('cart_email_reminders').update({status:'processing'}).eq('id',row.id).eq('status','pending').select('id').maybeSingle();
    if (!claim.data) continue;
    const query = encodeURIComponent((row.items as {ticketTypeId:string;quantity:number}[]).map(i=>`${i.ticketTypeId}:${i.quantity}`).join(','));
    const url = `${siteConfig.siteUrl}/carrito/?evento=${row.event_id}&entradas=${query}`;
    const sent = await sendReminder(row.email, undefined, event.title, url, 'carrito-abandonado');
    await db.from('cart_email_reminders').update({status:sent?'sent':'failed',email:sent?'[redacted]':row.email}).eq('id',row.id);
    if (sent) cartSent++;
  }

  let weeklySent = 0;
  const now = new Date();
  const local = new Intl.DateTimeFormat('en-US',{timeZone:'America/El_Salvador',weekday:'short',hour:'2-digit',hourCycle:'h23'}).formatToParts(now);
  if (local.find(p=>p.type==='weekday')?.value === 'Mon' && local.find(p=>p.type==='hour')?.value === '09') {
    const events = await db.from('events').select('id,slug,title,starts_at,event_type:categories!events_event_type_fk(slug),topic:categories!events_topic_fk(slug)').eq('status','published').gt('starts_at',now.toISOString()).order('starts_at').limit(3);
    const mailEvents = (events.data??[]).map(e=>{
      const eventType=Array.isArray(e.event_type)?e.event_type[0]:e.event_type;
      const topic=Array.isArray(e.topic)?e.topic[0]:e.topic;
      const categorySlug=(eventType as {slug:string}|null)?.slug??'eventos';
      const topicSlug=(topic as {slug:string}|null)?.slug;
      return {title:e.title,url:`${siteConfig.siteUrl}/${categorySlug}/${topicSlug?`${topicSlug}/`:''}${e.slug}/`,startsAt:new Intl.DateTimeFormat('es-SV',{dateStyle:'medium',timeStyle:'short',timeZone:'America/El_Salvador'}).format(new Date(e.starts_at))};
    });
    if(mailEvents.length) {
      const authUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
      const config = readBrevoConfig();
      if(authUrl && key && config) {
        let page=1; let more=true;
        while(more && page<=20) {
          const response=await fetch(`${authUrl}/auth/v1/admin/users?page=${page}&per_page=100`,{headers:{apikey:key,Authorization:`Bearer ${key}`}});
          if(!response.ok) break;
          const payload=await response.json() as {users?:{id:string,email?:string,email_confirmed_at?:string,user_metadata?:{display_name?:string}}[]};
          const users=payload.users??[]; more=users.length===100; page++;
          for(const user of users) {
            if(!user.email || !user.email_confirmed_at) continue;
            const profile=await db.from('profiles').select('marketing_opt_in').eq('id',user.id).maybeSingle();
            if(!profile.data?.marketing_opt_in) continue;
            const week=new Date(now); week.setUTCHours(0,0,0,0); week.setUTCDate(week.getUTCDate()-((week.getUTCDay()+6)%7));
            const claim=await db.from('weekly_event_email_deliveries').insert({user_id:user.id,week_start:week.toISOString().slice(0,10),status:'pending'}).select('user_id').maybeSingle();
            if(claim.error) continue;
            const mail=buildWeeklyEmail(mailEvents);
            const result=await sendBrevoEmail(config,{to:{email:user.email,name:user.user_metadata?.display_name},...mail,tag:'novedades-semanales'});
            await db.from('weekly_event_email_deliveries').update({status:result.ok?'sent':'failed'}).eq('user_id',user.id).eq('week_start',week.toISOString().slice(0,10));
            if(result.ok) weeklySent++;
          }
        }
      }
    }
  }
  return NextResponse.json({cartSent,weeklySent});
}
