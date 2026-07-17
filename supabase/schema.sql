create type public.app_role as enum ('client', 'writer', 'admin');

create type public.order_status as enum (
  'draft',
  'open',
  'claimed',
  'submitted',
  'in_review',
  'revision_requested',
  'accepted',
  'cancelled'
);

create type public.submission_status as enum (
  'draft',
  'submitted',
  'revision_requested',
  'resubmitted',
  'accepted'
);

create type public.transaction_type as enum (
  'earning',
  'payout',
  'adjustment'
);

create table if not exists public.profiles (
  id uuid primary key default gen_random_uuid(),
  external_auth_id text unique,
  email text unique not null,
  password_hash text,
  full_name text not null,
  role public.app_role not null default 'client',
  company_name text,
  avatar_url text,
  created_at timestamptz not null default now()
);

create table if not exists public.content_types (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  description text,
  base_price_cents integer not null,
  turnaround_days integer not null,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.profiles(id),
  writer_id uuid references public.profiles(id),
  content_type_id uuid references public.content_types(id),
  client_label text,
  title text not null,
  brief text not null,
  primary_cta text,
  reference_links text[] not null default '{}',
  target_audience text,
  tone_of_voice text,
  target_keywords text[] not null default '{}',
  word_count integer,
  priority text not null default 'standard',
  due_date date,
  status public.order_status not null default 'draft',
  budget_cents integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.submissions (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  writer_id uuid not null references public.profiles(id),
  version integer not null default 1,
  google_doc_url text,
  notes text,
  status public.submission_status not null default 'submitted',
  submitted_at timestamptz not null default now()
);

create table if not exists public.submission_comments (
  id uuid primary key default gen_random_uuid(),
  submission_id uuid not null references public.submissions(id) on delete cascade,
  author_id uuid not null references public.profiles(id),
  body text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.wallets (
  id uuid primary key default gen_random_uuid(),
  writer_id uuid not null unique references public.profiles(id),
  available_cents integer not null default 0,
  pending_cents integer not null default 0,
  updated_at timestamptz not null default now()
);

create table if not exists public.transactions (
  id uuid primary key default gen_random_uuid(),
  wallet_id uuid not null references public.wallets(id) on delete cascade,
  order_id uuid references public.orders(id),
  type public.transaction_type not null,
  amount_cents integer not null,
  stripe_reference text,
  created_at timestamptz not null default now()
);

create table if not exists public.payout_requests (
  id uuid primary key default gen_random_uuid(),
  writer_id uuid not null references public.profiles(id),
  amount_cents integer not null,
  status text not null default 'pending',
  requested_at timestamptz not null default now(),
  approved_at timestamptz,
  approved_by uuid references public.profiles(id)
);

create table if not exists public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.profiles(id),
  stripe_customer_id text unique,
  stripe_subscription_id text unique,
  plan_name text not null,
  status text not null,
  current_period_end timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.rankings (
  id uuid primary key default gen_random_uuid(),
  writer_id uuid not null unique references public.profiles(id),
  score integer not null default 0,
  rating numeric(2,1) not null default 0,
  quality_deductions integer not null default 0,
  completed_jobs integer not null default 0,
  recalculated_at timestamptz not null default now()
);

create table if not exists public.disputes (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id),
  opened_by uuid not null references public.profiles(id),
  assigned_to uuid references public.profiles(id),
  reason text not null,
  status text not null default 'open',
  resolution_notes text,
  created_at timestamptz not null default now()
);

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id),
  client_label text,
  title text not null,
  body text not null,
  read_at timestamptz,
  created_at timestamptz not null default now()
);
