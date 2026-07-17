create table if not exists public.payout_requests (
  id uuid primary key default gen_random_uuid(),
  writer_id uuid not null references public.profiles(id),
  amount_cents integer not null,
  status text not null default 'pending',
  requested_at timestamptz not null default now(),
  approved_at timestamptz,
  approved_by uuid references public.profiles(id)
);

alter table public.orders
  add column if not exists client_label text,
  add column if not exists tone_of_voice text,
  add column if not exists word_count integer,
  add column if not exists priority text not null default 'standard',
  add column if not exists target_keywords text[] not null default '{}';

alter table public.profiles
  add column if not exists password_hash text;

alter table public.orders
  alter column updated_at set default now();
