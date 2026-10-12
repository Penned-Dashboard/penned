-- Writer specialist tier + ensure avatar_url exists for profile photos.
-- Safe to re-run.

alter table public.profiles
  add column if not exists writer_tier text not null default 'standard';

alter table public.profiles
  add column if not exists avatar_url text;

-- Optional: mark a specialist writer manually
-- update public.profiles set writer_tier = 'specialist' where email = 'writer@example.com';
