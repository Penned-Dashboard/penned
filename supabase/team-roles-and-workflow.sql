-- Team roles + order workflow fields (Liam team handover, Nov 2026).
-- Run in Supabase SQL editor after client-terms-and-vat.sql.

do $$
begin
  if not exists (
    select 1 from pg_enum e
    join pg_type t on t.oid = e.enumtypid
    where t.typname = 'app_role' and e.enumlabel = 'account_manager'
  ) then
    alter type public.app_role add value 'account_manager';
  end if;
  if not exists (
    select 1 from pg_enum e
    join pg_type t on t.oid = e.enumtypid
    where t.typname = 'app_role' and e.enumlabel = 'editor'
  ) then
    alter type public.app_role add value 'editor';
  end if;
end $$;

alter table public.profiles
  add column if not exists account_manager_id uuid references public.profiles(id),
  add column if not exists editor_senior boolean not null default false,
  add column if not exists editor_tiers text[] not null default '{}',
  add column if not exists editor_languages text[] not null default '{}',
  add column if not exists away boolean not null default false;

alter table public.orders
  add column if not exists workflow_status text,
  add column if not exists editor_id uuid references public.profiles(id),
  add column if not exists client_due_at timestamptz,
  add column if not exists writer_due_at timestamptz,
  add column if not exists pause_started_at timestamptz,
  add column if not exists total_paused_minutes integer not null default 0,
  add column if not exists preferred_writer_id uuid references public.profiles(id),
  add column if not exists industry text,
  add column if not exists account_manager_id uuid references public.profiles(id);

comment on column public.orders.workflow_status is 'Liam workflow status key, e.g. brief_check, waiting_on_client, with_editor.';
comment on column public.profiles.account_manager_id is 'For client accounts: assigned Penned Account Manager profile id.';
