create sequence public.order_public_code_seq start with 1001;
alter table public.orders add column public_code text;
update public.orders set public_code = 'TC3-' || nextval('public.order_public_code_seq') where public_code is null;
alter table public.orders alter column public_code set default ('TC3-' || nextval('public.order_public_code_seq'));
alter table public.orders alter column public_code set not null;
alter table public.orders add constraint orders_public_code_unique unique (public_code);
