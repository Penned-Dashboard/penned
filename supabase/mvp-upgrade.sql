create table if not exists public.payout_requests (
  id uuid primary key default gen_random_uuid(),
  writer_id uuid not null references public.profiles(id),
  amount_cents integer not null,
  status text not null default 'pending',
  requested_at timestamptz not null default now(),
  approved_at timestamptz,
  approved_by uuid references public.profiles(id)
);

create table if not exists public.client_folders (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.profiles(id) on delete cascade,
  name text not null,
  brief_template_url text,
  brand_notes text,
  tone_guide text,
  preferred_content_types text[] not null default '{}',
  default_word_count integer,
  target_audience text,
  compliance_notes text,
  delivery_preference text,
  content_calendar_notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.orders
  add column if not exists client_folder_id uuid references public.client_folders(id),
  add column if not exists client_label text,
  add column if not exists tone_of_voice text,
  add column if not exists word_count integer,
  add column if not exists priority text not null default 'standard',
  add column if not exists target_keywords text[] not null default '{}',
  add column if not exists language text not null default 'English',
  add column if not exists service_tier text not null default 'on-demand',
  add column if not exists intake_details jsonb not null default '{}'::jsonb;

alter table public.profiles
  add column if not exists password_hash text;

alter table public.orders
  alter column updated_at set default now();
