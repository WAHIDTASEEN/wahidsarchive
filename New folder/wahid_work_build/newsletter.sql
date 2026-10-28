-- Newsletter subscribers for new-material email notifications.
-- Run this in Supabase SQL Editor once.
create table if not exists public.newsletter_subscribers (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  active boolean not null default true,
  unsubscribe_token uuid not null default gen_random_uuid() unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists newsletter_subscribers_active_idx on public.newsletter_subscribers(active) where active = true;
alter table public.newsletter_subscribers enable row level security;
revoke all on public.newsletter_subscribers from anon, authenticated;
-- Access is intentionally server-side only through Netlify Functions using the Supabase service-role key.
