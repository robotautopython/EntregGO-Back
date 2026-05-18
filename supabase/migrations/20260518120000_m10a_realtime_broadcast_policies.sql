-- M-10A - Private Supabase Realtime Broadcast authorization.
-- REST remains the source of truth. Clients may listen to private broadcast topics,
-- but authenticated clients are not granted insert/update/delete on realtime.messages.

alter table realtime.messages enable row level security;

revoke insert, update, delete on realtime.messages from anon, authenticated;
grant select on realtime.messages to authenticated;

drop policy if exists realtime_delivery_available_select_m10a on realtime.messages;
drop policy if exists realtime_delivery_store_detail_select_m10a on realtime.messages;

create policy realtime_delivery_available_select_m10a
on realtime.messages
for select
to authenticated
using (
  realtime.messages.extension = 'broadcast'
  and (select realtime.topic()) = 'delivery:available'
  and public.current_domain_user_role() = 'motoboy'
  and public.current_domain_user_status() = 'ativo'
  and exists (
    select 1
    from public.couriers c
    where c.user_id = public.current_domain_user_id()
      and c.is_online = true
  )
);

create policy realtime_delivery_store_detail_select_m10a
on realtime.messages
for select
to authenticated
using (
  realtime.messages.extension = 'broadcast'
  and (select realtime.topic()) ~* '^delivery:[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$'
  and public.current_domain_user_role() = 'logista'
  and public.current_domain_user_status() = 'ativo'
  and exists (
    select 1
    from public.delivery_requests dr
    join public.stores s on s.id = dr.store_id
    where s.user_id = public.current_domain_user_id()
      and dr.id = (
        case
          when (select realtime.topic()) ~* '^delivery:[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$'
          then substring((select realtime.topic()) from '^delivery:([0-9a-fA-F-]{36})$')::uuid
          else null
        end
      )
  )
);

comment on policy realtime_delivery_available_select_m10a on realtime.messages is
  'M-10A: active online couriers can receive private delivery.created broadcasts on delivery:available and must refetch REST.';

comment on policy realtime_delivery_store_detail_select_m10a on realtime.messages is
  'M-10A: active owner stores can receive private delivery accepted/status broadcasts for delivery:<uuid>; malformed topics fail closed before UUID cast.';
