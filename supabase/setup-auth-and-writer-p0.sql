-- Combined setup for password auth + Writer P0.
-- Safe to re-run. Run this in the Supabase SQL editor for project skvlfdgnvexoorfgfyrk
-- BEFORE asking Liam to create accounts or use the writer portal.

-- Password-based workspace auth
alter table public.profiles
  add column if not exists password_hash text;

-- Writer P0 columns
alter table public.orders
  add column if not exists reserved_by uuid references public.profiles(id),
  add column if not exists reserved_until timestamptz,
  add column if not exists attachments text[] not null default '{}';

create index if not exists orders_marketplace_idx
  on public.orders (status, reserved_until)
  where writer_id is null;

create index if not exists orders_writer_status_idx
  on public.orders (writer_id, status);

alter table public.profiles
  add column if not exists bio text,
  add column if not exists niche_tags text[] not null default '{}',
  add column if not exists available boolean not null default true,
  add column if not exists payment_info text,
  add column if not exists tax_info text,
  add column if not exists notification_prefs jsonb not null default '{}'::jsonb;

-- Optional seed admin for Liam once he has an account:
-- update public.profiles set role = 'admin' where email = 'liam@...';
