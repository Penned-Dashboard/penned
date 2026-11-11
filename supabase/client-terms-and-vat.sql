-- Client terms acceptance + UK VAT billing fields (Liam, Nov 2026).
-- Run in Supabase SQL editor before relying on these columns in production.

alter table public.profiles
  add column if not exists terms_accepted_at timestamptz,
  add column if not exists terms_version text,
  add column if not exists billing_country text,
  add column if not exists vat_number text,
  add column if not exists is_uk_company boolean not null default false,
  add column if not exists onboarding_answers jsonb not null default '{}'::jsonb;

comment on column public.profiles.terms_accepted_at is 'When the client accepted Penned Client Terms of Service at sign-up.';
comment on column public.profiles.terms_version is 'Terms version string accepted, e.g. 1.0';
comment on column public.profiles.is_uk_company is 'When true, content writing bills include 20% UK VAT.';
comment on column public.profiles.onboarding_answers is 'Agency questions + Typeform completion flags from multi-step client signup.';
