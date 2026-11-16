-- Email notifications: one row per timed email already sent, so the reminder
-- job (every 15 minutes) never sends the same email twice. Run once in the
-- Supabase SQL editor. Only the server (service role) reads or writes it.
create table if not exists public.notification_log (
  key text primary key,
  sent_at timestamptz not null default now()
);

alter table public.notification_log enable row level security;

comment on table public.notification_log is 'Keys of reminder/alert/summary emails already sent (see src/lib/notification-scheduler.ts).';
