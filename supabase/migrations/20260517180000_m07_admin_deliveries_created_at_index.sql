create index if not exists idx_delivery_requests_created_at_id_desc
  on public.delivery_requests (created_at desc, id desc);
