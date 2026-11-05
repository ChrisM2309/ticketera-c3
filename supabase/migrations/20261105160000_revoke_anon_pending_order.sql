-- T17: la revisión de seguridad encontró que create_pending_order seguía ejecutable por anon y
-- authenticated. Supabase concede EXECUTE a esos roles sobre funciones de public por defecto, y
-- revocar solo de PUBLIC no lo quita. La función es SECURITY DEFINER, así que cualquiera con la
-- clave pública podía crear órdenes pendientes y omitir la comisión (p_fee_percent) sin pasar por la API.
-- Solo el servidor (service_role) debe llamarla, como indica la migración 20261104130000.

revoke all on function public.create_pending_order(uuid, jsonb, text, text, text, integer)
  from public, anon, authenticated;
grant execute on function public.create_pending_order(uuid, jsonb, text, text, text, integer)
  to service_role;
