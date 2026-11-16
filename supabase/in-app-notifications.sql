-- In-app notifications (the bell). Adds where each notification links to and
-- what kind it is, plus an index for the unread count. Safe to re-run.
-- Only the server (service role) reads or writes this table.
alter table public.notifications
  add column if not exists href text,
  add column if not exists kind text;

create index if not exists notifications_profile_unread_idx
  on public.notifications (profile_id, read_at, created_at desc);

alter table public.notifications enable row level security;
