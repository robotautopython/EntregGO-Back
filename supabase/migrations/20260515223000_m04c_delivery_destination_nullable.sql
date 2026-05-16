-- M-04C: Allow delivery requests without a destination address.
-- The backend normalizes missing, empty or whitespace-only destinationAddress to null.

alter table public.delivery_requests
  drop constraint if exists delivery_requests_destination_not_empty;

alter table public.delivery_requests
  alter column destination_address drop not null;

alter table public.delivery_requests
  add constraint delivery_requests_destination_null_or_not_empty
  check (
    destination_address is null
    or length(btrim(destination_address)) > 0
  );

comment on column public.delivery_requests.destination_address is
  'Optional delivery destination address. Empty request values are normalized to null by the backend.';
