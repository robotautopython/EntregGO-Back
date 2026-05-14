-- M-01 - Initial EntregGO domain schema for Supabase/PostgreSQL.
-- Additive foundation only: no seed data, no real credentials, no endpoint behavior.

create extension if not exists pgcrypto with schema extensions;

create type public.user_role as enum ('admin', 'logista', 'motoboy');
create type public.user_status as enum ('pendente', 'ativo', 'bloqueado');
create type public.delivery_status as enum (
  'aguardando',
  'aceita',
  'coletada',
  'em_transito',
  'entregue',
  'expirada',
  'cancelada'
);

comment on type public.user_role is
  'Domain roles for EntregGO users: admin, logista, motoboy.';
comment on type public.user_status is
  'Administrative approval status for domain users.';
comment on type public.delivery_status is
  'Lifecycle status for delivery requests.';

create table public.users (
  id uuid primary key default extensions.gen_random_uuid(),
  auth_id uuid not null unique references auth.users(id) on delete cascade,
  email text not null unique,
  role public.user_role not null,
  status public.user_status not null default 'pendente',
  approved_at timestamptz,
  approved_by uuid references public.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint users_email_not_empty check (length(btrim(email)) > 3),
  constraint users_approved_by_not_self check (approved_by is null or approved_by <> id)
);

comment on table public.users is
  'EntregGO domain user profile linked to Supabase Auth through auth_id. Credentials remain in auth.users.';
comment on column public.users.auth_id is
  'Supabase Auth user id. Do not store password hashes in the domain schema.';
comment on column public.users.email is
  'PII. Used for operational identification and must not be logged in plaintext unnecessarily.';

create table public.stores (
  id uuid primary key default extensions.gen_random_uuid(),
  user_id uuid not null unique references public.users(id) on delete cascade,
  name text not null,
  owner_name text not null,
  address text not null,
  logo_url text,
  description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint stores_name_not_empty check (length(btrim(name)) > 0),
  constraint stores_owner_name_not_empty check (length(btrim(owner_name)) > 0),
  constraint stores_address_not_empty check (length(btrim(address)) > 0)
);

comment on table public.stores is
  'Store profile owned by a logista domain user. Address and owner_name are PII/business-sensitive.';

create table public.couriers (
  id uuid primary key default extensions.gen_random_uuid(),
  user_id uuid not null unique references public.users(id) on delete cascade,
  full_name text not null,
  bike_photo_url text,
  license_photo_url text,
  is_online boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint couriers_full_name_not_empty check (length(btrim(full_name)) > 0)
);

comment on table public.couriers is
  'Courier profile owned by a motoboy domain user. Name and document image URLs are PII.';
comment on column public.couriers.license_photo_url is
  'Sensitive document URL. Storage policies must be validated before real uploads.';

create table public.payments (
  id uuid primary key default extensions.gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  reference_month text not null,
  due_date date not null,
  paid boolean not null default false,
  paid_at timestamptz,
  marked_by uuid references public.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint payments_reference_month_format check (
    reference_month ~ '^[0-9]{4}-(0[1-9]|1[0-2])$'
  ),
  constraint payments_paid_marker_check check (
    (paid = false and paid_at is null and marked_by is null)
    or
    (paid = true and paid_at is not null and marked_by is not null)
  ),
  constraint payments_user_reference_month_unique unique (user_id, reference_month)
);

create table public.delivery_requests (
  id uuid primary key default extensions.gen_random_uuid(),
  store_id uuid not null references public.stores(id),
  destination_address text not null,
  notes text,
  status public.delivery_status not null default 'aguardando',
  courier_id uuid references public.couriers(id),
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default (now() + interval '1 minute'),
  accepted_at timestamptz,
  collected_at timestamptz,
  in_transit_at timestamptz,
  delivered_at timestamptz,
  updated_at timestamptz not null default now(),
  constraint delivery_requests_destination_not_empty check (length(btrim(destination_address)) > 0),
  constraint delivery_requests_expires_after_created check (expires_at > created_at),
  constraint delivery_requests_waiting_has_no_courier check (
    status <> 'aguardando' or (courier_id is null and accepted_at is null)
  ),
  constraint delivery_requests_active_requires_acceptance check (
    status not in ('aceita', 'coletada', 'em_transito', 'entregue')
    or (courier_id is not null and accepted_at is not null)
  ),
  constraint delivery_requests_collected_requires_timestamp check (
    status not in ('coletada', 'em_transito', 'entregue') or collected_at is not null
  ),
  constraint delivery_requests_in_transit_requires_timestamp check (
    status not in ('em_transito', 'entregue') or in_transit_at is not null
  ),
  constraint delivery_requests_delivered_requires_timestamp check (
    status <> 'entregue' or delivered_at is not null
  ),
  constraint delivery_requests_timestamps_order check (
    (accepted_at is null or accepted_at >= created_at)
    and (collected_at is null or (accepted_at is not null and collected_at >= accepted_at))
    and (in_transit_at is null or (collected_at is not null and in_transit_at >= collected_at))
    and (delivered_at is null or (in_transit_at is not null and delivered_at >= in_transit_at))
  )
);

comment on table public.delivery_requests is
  'Delivery requests created by stores and accepted by couriers. Acceptance must use a conditional update in the backend.';
comment on column public.delivery_requests.destination_address is
  'Recipient address is PII. Initial RLS only exposes waiting requests to active online couriers.';

create table public.push_subscriptions (
  id uuid primary key default extensions.gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  endpoint text not null unique,
  subscription_json jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint push_subscriptions_endpoint_not_empty check (length(btrim(endpoint)) > 0),
  constraint push_subscriptions_json_object check (jsonb_typeof(subscription_json) = 'object')
);

comment on table public.push_subscriptions is
  'Browser push subscriptions. Endpoint is unique to deduplicate subscriptions; VAPID private key is never stored here.';

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger set_users_updated_at
before update on public.users
for each row execute function public.set_updated_at();

create trigger set_stores_updated_at
before update on public.stores
for each row execute function public.set_updated_at();

create trigger set_couriers_updated_at
before update on public.couriers
for each row execute function public.set_updated_at();

create trigger set_payments_updated_at
before update on public.payments
for each row execute function public.set_updated_at();

create trigger set_delivery_requests_updated_at
before update on public.delivery_requests
for each row execute function public.set_updated_at();

create trigger set_push_subscriptions_updated_at
before update on public.push_subscriptions
for each row execute function public.set_updated_at();

create index idx_users_role_status_created_at
  on public.users (role, status, created_at desc);

create index idx_couriers_online
  on public.couriers (is_online)
  where is_online = true;

create index idx_payments_paid_due_date
  on public.payments (paid, due_date);

create index idx_delivery_requests_status_created_at
  on public.delivery_requests (status, created_at desc);

create index idx_delivery_requests_store_status_created_at
  on public.delivery_requests (store_id, status, created_at desc);

create index idx_delivery_requests_courier_status_created_at
  on public.delivery_requests (courier_id, status, created_at desc)
  where courier_id is not null;

create index idx_delivery_requests_waiting_expires
  on public.delivery_requests (expires_at)
  where status = 'aguardando';

create index idx_delivery_requests_waiting_acceptance
  on public.delivery_requests (id, created_at)
  where status = 'aguardando' and courier_id is null;

create index idx_push_subscriptions_user_id
  on public.push_subscriptions (user_id);

create or replace function public.current_domain_user_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select u.id
  from public.users u
  where u.auth_id = auth.uid()
  limit 1
$$;

create or replace function public.current_domain_user_role()
returns public.user_role
language sql
stable
security definer
set search_path = public
as $$
  select u.role
  from public.users u
  where u.auth_id = auth.uid()
  limit 1
$$;

create or replace function public.current_domain_user_status()
returns public.user_status
language sql
stable
security definer
set search_path = public
as $$
  select u.status
  from public.users u
  where u.auth_id = auth.uid()
  limit 1
$$;

revoke all on function public.current_domain_user_id() from public;
revoke all on function public.current_domain_user_role() from public;
revoke all on function public.current_domain_user_status() from public;
grant execute on function public.current_domain_user_id() to authenticated, service_role;
grant execute on function public.current_domain_user_role() to authenticated, service_role;
grant execute on function public.current_domain_user_status() to authenticated, service_role;

alter table public.users enable row level security;
alter table public.stores enable row level security;
alter table public.couriers enable row level security;
alter table public.payments enable row level security;
alter table public.delivery_requests enable row level security;
alter table public.push_subscriptions enable row level security;

revoke all on public.users from anon, authenticated;
revoke all on public.stores from anon, authenticated;
revoke all on public.couriers from anon, authenticated;
revoke all on public.payments from anon, authenticated;
revoke all on public.delivery_requests from anon, authenticated;
revoke all on public.push_subscriptions from anon, authenticated;

grant select on public.users to authenticated;
grant select on public.stores to authenticated;
grant select on public.couriers to authenticated;
grant select on public.delivery_requests to authenticated;
grant select on public.push_subscriptions to authenticated;

create policy users_select_own
on public.users
for select
to authenticated
using (auth_id = auth.uid());

comment on policy users_select_own on public.users is
  'Authenticated users can read only their own domain profile. Admin list reads go through backend service role.';

create policy stores_select_own
on public.stores
for select
to authenticated
using (user_id = public.current_domain_user_id());

comment on policy stores_select_own on public.stores is
  'Store users can read only their own store profile. Client writes are intentionally not granted in M-01.';

create policy couriers_select_own
on public.couriers
for select
to authenticated
using (user_id = public.current_domain_user_id());

comment on policy couriers_select_own on public.couriers is
  'Courier users can read only their own courier profile. Online status writes remain backend-only in M-01.';

create policy delivery_requests_select_allowed_domain_rows
on public.delivery_requests
for select
to authenticated
using (
  exists (
    select 1
    from public.stores s
    where s.id = delivery_requests.store_id
      and s.user_id = public.current_domain_user_id()
  )
  or exists (
    select 1
    from public.couriers c
    where c.id = delivery_requests.courier_id
      and c.user_id = public.current_domain_user_id()
  )
  or (
    delivery_requests.status = 'aguardando'
    and delivery_requests.courier_id is null
    and public.current_domain_user_role() = 'motoboy'
    and public.current_domain_user_status() = 'ativo'
    and exists (
      select 1
      from public.couriers c
      where c.user_id = public.current_domain_user_id()
        and c.is_online = true
    )
  )
);

comment on policy delivery_requests_select_allowed_domain_rows on public.delivery_requests is
  'Stores can read their own requests; assigned couriers can read their requests; active online couriers can read unassigned waiting requests for future Realtime.';

create policy push_subscriptions_select_own
on public.push_subscriptions
for select
to authenticated
using (user_id = public.current_domain_user_id());

comment on policy push_subscriptions_select_own on public.push_subscriptions is
  'Users can read only their own push subscriptions. Subscription writes remain backend-only in M-01.';

comment on table public.payments is
  'Internal administrative payment control. RLS is enabled and no anon/authenticated policies are granted in M-01; backend service role is required.';
