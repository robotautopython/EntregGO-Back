create index if not exists idx_payments_paid_reference_month_due_date_id
  on public.payments (paid, reference_month desc, due_date asc, id asc);
