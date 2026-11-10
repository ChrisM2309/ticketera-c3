-- Correo de confirmación con Brevo (plan 2026-11-10-correo-brevo.md).
-- El correo de boleto pasa por pending → sent | failed. Los demás canales siguen en simulated.
-- Nunca se guardan el correo completo ni el token: el destino sigue enmascarado.

alter table public.notification_outbox
  drop constraint if exists notification_outbox_status_check;

alter table public.notification_outbox
  add constraint notification_outbox_status_check
  check (status in ('simulated', 'cancelled', 'pending', 'sent', 'failed'));

alter table public.notification_outbox
  add column if not exists provider_message_id text,
  add column if not exists attempts integer not null default 0 check (attempts >= 0),
  add column if not exists last_error text check (last_error is null or char_length(last_error) <= 200),
  add column if not exists sent_at timestamptz;
