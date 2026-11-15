-- Launch hardening from Liam's private security notes (Section A / B).
-- Run in Supabase SQL editor. Do not commit secrets.

alter table public.profiles
  add column if not exists approval_status text not null default 'approved',
  add column if not exists writer_terms_accepted_at timestamptz,
  add column if not exists writer_terms_version text;

-- Existing writers stay usable; brand-new Join as Writer style accounts should be set to pending.
comment on column public.profiles.approval_status is 'pending | approved | paused. Writers with pending cannot see jobs.';

create table if not exists public.stripe_webhook_events (
  event_id text primary key,
  event_type text not null,
  processed_at timestamptz not null default now()
);

create table if not exists public.wallet_ledger (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.profiles(id) on delete cascade,
  kind text not null,
  amount_cents integer not null,
  stripe_event_id text unique,
  note text,
  created_at timestamptz not null default now()
);

create index if not exists wallet_ledger_client_id_idx on public.wallet_ledger (client_id, created_at desc);

-- Client prepaid content-budget balance (credited by Stripe webhook on top-up).
create table if not exists public.client_wallets (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null unique references public.profiles(id) on delete cascade,
  available_cents integer not null default 0,
  pending_cents integer not null default 0,
  updated_at timestamptz not null default now()
);
