-- Writer Dashboard P0 (Release 1) upgrade.
-- Safe to re-run. Run in the Supabase SQL editor BEFORE deploying the matching app build.

-- 1. Job reservations + attachments on orders ---------------------------------
alter table public.orders
  add column if not exists reserved_by uuid references public.profiles(id),
  add column if not exists reserved_until timestamptz,
  add column if not exists attachments text[] not null default '{}';

create index if not exists orders_marketplace_idx
  on public.orders (status, reserved_until)
  where writer_id is null;

create index if not exists orders_writer_status_idx
  on public.orders (writer_id, status);

-- 2. Writer settings on profiles ---------------------------------------------
alter table public.profiles
  add column if not exists bio text,
  add column if not exists niche_tags text[] not null default '{}',
  add column if not exists available boolean not null default true,
  add column if not exists payment_info text,
  add column if not exists tax_info text,
  add column if not exists notification_prefs jsonb not null default '{}'::jsonb;

-- 3. Order status enum ---------------------------------------------------------
-- Intentionally NOT extended with 'in_progress' / 'paid'.
-- ALTER TYPE ... ADD VALUE cannot be used in the same transaction as statements that
-- reference the new value, and the app maps the existing statuses instead:
--   claimed (+ intake_details.writer_started)  -> In progress / Not started
--   submitted, in_review                       -> In review
--   revision_requested                         -> Revisions requested
--   accepted                                   -> Approved (Paid once a payout settles it)
-- "started" is tracked in orders.intake_details->>'writer_started'.
