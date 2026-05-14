# Supabase - M-01 database foundation

This folder contains versioned SQL migrations for the EntregGO Supabase/PostgreSQL schema.

## Current migration

- `migrations/20260514173000_m01_initial_schema.sql`
  - Creates domain enums: `user_role`, `user_status`, `delivery_status`.
  - Creates domain tables: `users`, `stores`, `couriers`, `payments`, `delivery_requests`, `push_subscriptions`.
  - Enables RLS on all domain tables.
  - Grants client-side `select` only where the initial RLS policies allow it.
  - Leaves all writes to backend/service-role flows until the real auth/register cycle is implemented.

## Security notes

- `public.users` links to Supabase Auth through `auth_id`; passwords are not stored in the domain schema.
- `payments` has RLS enabled but no anon/authenticated policy. It is backend/service-role only in M-01.
- `delivery_requests` exposes unassigned waiting requests only to active online couriers to support future Realtime usage.
- Policies are intentionally conservative and must be revalidated during the real auth/cadastro cycle.
- Do not commit real Supabase keys, VAPID private keys, JWT secrets, service role keys, or seed data with PII.

## Operational notes

- Apply migrations only to a planned Supabase environment.
- Do not run destructive SQL against a remote database without a backup, explicit confirmation, and a rollback plan.
- This migration does not enable Supabase Realtime publication and does not create seeds.

## Manual rollback plan

For a fresh environment where this migration must be reverted before real data exists, drop objects in dependency order:

```sql
drop table if exists public.push_subscriptions;
drop table if exists public.delivery_requests;
drop table if exists public.payments;
drop table if exists public.couriers;
drop table if exists public.stores;
drop table if exists public.users;
drop function if exists public.current_domain_user_status();
drop function if exists public.current_domain_user_role();
drop function if exists public.current_domain_user_id();
drop function if exists public.set_updated_at();
drop type if exists public.delivery_status;
drop type if exists public.user_status;
drop type if exists public.user_role;
```

Do not apply that rollback to an environment with production data unless the data lifecycle has been explicitly approved.
