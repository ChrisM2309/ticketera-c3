-- Caducidad de compras pendientes (decisión D-69).
-- Una compra que sigue esperando pago 30 minutos después de iniciada se cierra: la persona debe volver a pedirla.
--   órdenes de entradas `pending`                   → `cancelled`
--   destacados `awaiting_payment`                   → `payment_failed`
--   paquetes empresas `awaiting_payment`            → `payment_failed`
-- Si Wompi aprueba después de cerrarla, el webhook la deja para revisión manual (no emite nada automáticamente).

create or replace function public.expire_pending_purchases(p_now timestamptz default now())
returns table (orders_cancelled integer, featured_closed integer, packages_closed integer)
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_cutoff timestamptz := p_now - interval '30 minutes';
  v_orders integer;
  v_featured integer;
  v_packages integer;
begin
  update public.orders o
     set status = 'cancelled'
   where o.status = 'pending'
     and o.created_at < v_cutoff;
  get diagnostics v_orders = row_count;

  update public.featured_placements f
     set status = 'payment_failed'
   where f.status = 'awaiting_payment'
     and f.created_at < v_cutoff;
  get diagnostics v_featured = row_count;

  update public.business_packages p
     set status = 'payment_failed'
   where p.status = 'awaiting_payment'
     and p.created_at < v_cutoff;
  get diagnostics v_packages = row_count;

  return query select v_orders, v_featured, v_packages;
end;
$$;

revoke all on function public.expire_pending_purchases(timestamptz) from public, anon, authenticated;
grant execute on function public.expire_pending_purchases(timestamptz) to service_role;

-- Programación cada 5 minutos con pg_cron de Supabase. Si la extensión no está habilitada, la migración no falla:
-- se avisa y la limpieza también corre al crear órdenes (respaldo en la aplicación).
do $$
begin
  create extension if not exists pg_cron;
  perform cron.schedule(
    'expirar-compras-pendientes',
    '*/5 * * * *',
    'select public.expire_pending_purchases()'
  );
exception when others then
  raise notice 'pg_cron no disponible: habilitalo en Supabase (Database > Extensions) para caducar compras automáticamente. Detalle: %', sqlerrm;
end
$$;
