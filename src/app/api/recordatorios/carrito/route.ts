import { createHash, randomBytes } from 'node:crypto';
import { NextResponse } from 'next/server';
import { readOptionalSession } from '@/lib/auth/optional-session';
import { createServiceRoleClient } from '@/lib/supabase/server';

export const runtime = 'nodejs';
const emailPattern = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;
const hash = (token: string) => createHash('sha256').update(token).digest('hex');

export async function POST(request: Request) {
  const origin = request.headers.get('origin');
  if (origin && origin !== new URL(request.url).origin) return NextResponse.json({error:'Solicitud no válida.'},{status:403});
  let body: unknown;
  try { body = await request.json(); } catch { return NextResponse.json({error:'Datos no válidos.'},{status:400}); }
  if (!body || typeof body !== 'object') return NextResponse.json({error:'Datos no válidos.'},{status:400});
  const data = body as Record<string, unknown>;
  if (data.consent !== true || typeof data.email !== 'string' || !emailPattern.test(data.email.trim()) || data.email.length > 254 || typeof data.eventId !== 'string' || !Array.isArray(data.items) || data.items.length < 1 || data.items.length > 10) return NextResponse.json({error:'Revisá el correo y la selección.'},{status:400});
  const items: {ticketTypeId:string;quantity:number}[] = [];
  for (const raw of data.items) {
    if (!raw || typeof raw !== 'object') return NextResponse.json({error:'Selección no válida.'},{status:400});
    const item=raw as Record<string,unknown>;
    if(typeof item.ticketTypeId!=='string'||!Number.isSafeInteger(item.quantity)||(item.quantity as number)<1||(item.quantity as number)>10) return NextResponse.json({error:'Selección no válida.'},{status:400});
    items.push({ticketTypeId:item.ticketTypeId,quantity:item.quantity as number});
  }
  if(new Set(items.map(i=>i.ticketTypeId)).size!==items.length) return NextResponse.json({error:'Selección no válida.'},{status:400});
  const db=createServiceRoleClient(); if(!db) return NextResponse.json({error:'No disponible.'},{status:503});
  const event=await db.from('events').select('id,status,starts_at,ticket_types(id,is_active,max_per_order,quantity_total,quantity_sold)').eq('id',data.eventId).eq('status','published').maybeSingle();
  if(event.error||!event.data||new Date(event.data.starts_at)<=new Date()) return NextResponse.json({error:'Evento no disponible.'},{status:400});
  const types=event.data.ticket_types as {id:string;is_active:boolean;max_per_order:number;quantity_total:number;quantity_sold:number}[];
  if(items.some(i=>{const t=types.find(x=>x.id===i.ticketTypeId);return !t||!t.is_active||i.quantity>t.max_per_order||i.quantity>t.quantity_total-t.quantity_sold;})) return NextResponse.json({error:'La selección ya no está disponible.'},{status:400});
  const session=await readOptionalSession();
  const email=session?.email?.trim().toLowerCase()||data.email.trim().toLowerCase();
  if(session?.email && email!==session.email.trim().toLowerCase()) return NextResponse.json({error:'Usá el correo de tu cuenta.'},{status:400});
  const token=randomBytes(32).toString('hex');
  const old=await db.from('cart_email_reminders').update({status:'cancelled'}).eq('email',email).eq('event_id',event.data.id).eq('status','pending');
  if(old.error) return NextResponse.json({error:'No se pudo guardar el recordatorio.'},{status:500});
  const saved=await db.from('cart_email_reminders').insert({email,event_id:event.data.id,items,token_hash:hash(token)}).select('id').single();
  if(saved.error) return NextResponse.json({error:'No se pudo guardar el recordatorio.'},{status:500});
  return NextResponse.json({ok:true,token});
}

export async function DELETE(request: Request) {
  const origin=request.headers.get('origin'); if(origin&&origin!==new URL(request.url).origin) return NextResponse.json({error:'Solicitud no válida.'},{status:403});
  let token=''; try { const body=await request.json() as {token?:unknown}; token=typeof body.token==='string'?body.token:''; } catch { return NextResponse.json({error:'Datos no válidos.'},{status:400}); }
  if(!/^[a-f0-9]{64}$/.test(token)) return NextResponse.json({error:'No encontrado.'},{status:404});
  const db=createServiceRoleClient(); if(!db) return NextResponse.json({error:'No disponible.'},{status:503});
  await db.from('cart_email_reminders').update({status:'cancelled'}).eq('token_hash',hash(token)).eq('status','pending');
  return NextResponse.json({ok:true});
}
