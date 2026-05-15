-- M-04A - Delivery request RLS hardening.
-- Restricts client-side reads to active owner stores and active assigned couriers.
-- Delivery discovery, Realtime, push and concurrent acceptance remain future scoped work.

drop policy if exists delivery_requests_select_allowed_domain_rows on public.delivery_requests;

revoke insert, update, delete on public.delivery_requests from anon, authenticated;
grant select on public.delivery_requests to authenticated;

create policy delivery_requests_select_own_store_or_assigned_courier
on public.delivery_requests
for select
to authenticated
using (
  (
    public.current_domain_user_role() = 'logista'
    and public.current_domain_user_status() = 'ativo'
    and exists (
      select 1
      from public.stores s
      where s.id = delivery_requests.store_id
        and s.user_id = public.current_domain_user_id()
    )
  )
  or (
    public.current_domain_user_role() = 'motoboy'
    and public.current_domain_user_status() = 'ativo'
    and exists (
      select 1
      from public.couriers c
      where c.id = delivery_requests.courier_id
        and c.user_id = public.current_domain_user_id()
    )
  )
);

comment on policy delivery_requests_select_own_store_or_assigned_courier
on public.delivery_requests is
  'M-04A: active stores can read their own requests and active couriers can read only already assigned requests. Broad courier discovery, Realtime and acceptance require future Security/Performance validation.';

comment on column public.delivery_requests.destination_address is
  'Recipient address is PII. M-04A RLS exposes delivery rows only to the active owner store or active assigned courier.';
