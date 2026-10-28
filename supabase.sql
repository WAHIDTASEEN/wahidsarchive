-- V15 storage repair compatibility: the documents bucket is created below.
-- WAHID ACADEMIC ATELIER — CLEAN DATABASE SETUP / MIGRATION
-- Safe to run on an existing project. It does NOT delete existing works or files.
create extension if not exists pgcrypto;

-- =========================
-- WORKS
-- =========================
create table if not exists public.works (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  course text not null default '',
  category text not null default 'Other',
  description text default '',
  work_date date,
  file_url text not null default '',
  storage_path text not null default '',
  published boolean not null default true,
  owner_id uuid references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

-- Add missing columns to older installations without touching data.
alter table public.works add column if not exists course text;
alter table public.works add column if not exists course_code text;
alter table public.works add column if not exists course_name text;
alter table public.works add column if not exists category text;
alter table public.works add column if not exists description text;
alter table public.works add column if not exists work_date date;
alter table public.works add column if not exists file_url text;
alter table public.works add column if not exists storage_path text;
alter table public.works add column if not exists cover_url text;
alter table public.works add column if not exists cover_storage_path text;
alter table public.works add column if not exists published boolean;
alter table public.works add column if not exists owner_id uuid;
alter table public.works add column if not exists created_at timestamptz;

update public.works set course='' where course is null;
update public.works set course_name=course where course_name is null or trim(course_name)='';
update public.works set course=course_name where (course is null or trim(course)='') and course_name is not null;
update public.works set category='Other' where category is null or trim(category)='';
update public.works set description='' where description is null;
update public.works set file_url='' where file_url is null;
update public.works set storage_path='' where storage_path is null;
update public.works set published=true where published is null;
update public.works set created_at=now() where created_at is null;

-- Existing work records from your old site should remain public.
-- Change these to false later from the dashboard if you ever add private drafts.
update public.works set published=true where published is not true;
update public.works set owner_id=(select id from auth.users order by created_at asc limit 1) where owner_id is null;
update public.works set file_url='https://clwowsxbiqtuqjntmwlc.supabase.co/storage/v1/object/public/documents/' || storage_path where (file_url is null or file_url='') and storage_path is not null and storage_path<>'';

alter table public.works drop constraint if exists works_category_check;
alter table public.works drop constraint if exists works_category_check_v2;
alter table public.works add constraint works_category_check_v2 check(category in ('Lab Report','Assignment','Project','Other','Notes','Past Paper','Question Bank','Formula Sheet','Presentation'));

create index if not exists works_public_order_idx on public.works (published, work_date desc, created_at desc);
create index if not exists works_course_idx on public.works (course_code, course_name);

alter table public.works enable row level security;
drop policy if exists "works_public_read" on public.works;
drop policy if exists "Public can read published works" on public.works;
create policy "works_public_read" on public.works for select to anon, authenticated using (published = true);
drop policy if exists "works_owner_read" on public.works;
drop policy if exists "Admins can read all own works" on public.works;
create policy "works_owner_read" on public.works for select to authenticated using (owner_id = auth.uid());
drop policy if exists "works_owner_insert" on public.works;
drop policy if exists "Admins can insert own works" on public.works;
create policy "works_owner_insert" on public.works for insert to authenticated with check (owner_id = auth.uid());
drop policy if exists "works_owner_update" on public.works;
create policy "works_owner_update" on public.works for update to authenticated using (owner_id = auth.uid()) with check (owner_id = auth.uid());
drop policy if exists "works_owner_delete" on public.works;
drop policy if exists "Admins can delete own works" on public.works;
create policy "works_owner_delete" on public.works for delete to authenticated using (owner_id = auth.uid());

-- =========================
-- SITE SETTINGS
-- =========================
create table if not exists public.site_settings (
  key text primary key,
  value text not null default '',
  owner_id uuid references auth.users(id) on delete cascade,
  updated_at timestamptz not null default now()
);
update public.site_settings set owner_id=(select id from auth.users order by created_at asc limit 1) where owner_id is null;
alter table public.site_settings enable row level security;
drop policy if exists "settings_public_read" on public.site_settings;
drop policy if exists "Public can read settings" on public.site_settings;
create policy "settings_public_read" on public.site_settings for select to anon, authenticated using (true);
drop policy if exists "settings_owner_insert" on public.site_settings;
drop policy if exists "Owner can manage settings" on public.site_settings;
create policy "settings_owner_insert" on public.site_settings for insert to authenticated with check (owner_id = auth.uid());
drop policy if exists "settings_owner_update" on public.site_settings;
create policy "settings_owner_update" on public.site_settings for update to authenticated using (owner_id = auth.uid()) with check (owner_id = auth.uid());
drop policy if exists "settings_owner_delete" on public.site_settings;
create policy "settings_owner_delete" on public.site_settings for delete to authenticated using (owner_id = auth.uid());

-- =========================
-- NOTIFICATIONS
-- =========================
create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  message text not null,
  work_id uuid references public.works(id) on delete set null,
  owner_id uuid references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);
alter table public.notifications enable row level security;
drop policy if exists "notifications_public_read" on public.notifications;
drop policy if exists "Public can read notifications" on public.notifications;
create policy "notifications_public_read" on public.notifications for select to anon, authenticated using (true);
drop policy if exists "notifications_owner_insert" on public.notifications;
drop policy if exists "Owners can create notifications" on public.notifications;
create policy "notifications_owner_insert" on public.notifications for insert to authenticated with check (owner_id = auth.uid());
drop policy if exists "notifications_owner_delete" on public.notifications;
create policy "notifications_owner_delete" on public.notifications for delete to authenticated using (owner_id = auth.uid());
create index if not exists notifications_created_idx on public.notifications(created_at desc);

-- =========================
-- PUBLIC DOCUMENT STORAGE
-- =========================
insert into storage.buckets(id,name,public) values('documents','documents',true)
on conflict(id) do update set public=true;

drop policy if exists "documents_public_read" on storage.objects;
drop policy if exists "Public can view documents" on storage.objects;
create policy "documents_public_read" on storage.objects for select to anon, authenticated using (bucket_id='documents');
drop policy if exists "documents_owner_insert" on storage.objects;
drop policy if exists "Admins can upload documents" on storage.objects;
create policy "documents_owner_insert" on storage.objects for insert to authenticated with check (bucket_id='documents' and (storage.foldername(name))[1] = auth.uid()::text);
drop policy if exists "documents_owner_update" on storage.objects;
create policy "documents_owner_update" on storage.objects for update to authenticated using (bucket_id='documents' and (storage.foldername(name))[1] = auth.uid()::text) with check (bucket_id='documents' and (storage.foldername(name))[1] = auth.uid()::text);
drop policy if exists "documents_owner_delete" on storage.objects;
drop policy if exists "Admins can delete own documents" on storage.objects;
create policy "documents_owner_delete" on storage.objects for delete to authenticated using (bucket_id='documents' and (storage.foldername(name))[1] = auth.uid()::text);

-- =========================
-- AI TEMP STORAGE
-- =========================
-- Private bucket. Aurel uses signed URLs generated server-side only when needed.
insert into storage.buckets(id,name,public) values('ai_materials','ai_materials',false)
on conflict(id) do nothing;
drop policy if exists "ai_owner_insert" on storage.objects;
drop policy if exists "ai_public_upload" on storage.objects;
-- Aurel v1 sends files directly to its serverless function, so no anonymous storage policy is required.

-- =========================
-- OPTIONAL PROFILE DEFAULTS
-- =========================
insert into public.site_settings(key,value,owner_id)
select 'name','Wahid',id from auth.users order by created_at asc limit 1
on conflict(key) do nothing;
insert into public.site_settings(key,value,owner_id)
select 'role','Civil Engineering Student',id from auth.users order by created_at asc limit 1
on conflict(key) do nothing;
insert into public.site_settings(key,value,owner_id)
select 'email','wahidbinalitaseen22@gmail.com',id from auth.users order by created_at asc limit 1
on conflict(key) do nothing;
insert into public.site_settings(key,value,owner_id)
select 'location','Bangladesh',id from auth.users order by created_at asc limit 1
on conflict(key) do nothing;
insert into public.site_settings(key,value,owner_id)
select 'whatsapp','8801784829585',id from auth.users order by created_at asc limit 1
on conflict(key) do nothing;
insert into public.site_settings(key,value,owner_id)
select 'socials','{}',id from auth.users order by created_at asc limit 1
on conflict(key) do nothing;


-- Verification: after running, this should list your existing works.
select id,title,course,course_code,course_name,category,published,file_url,created_at
from public.works
order by created_at desc;

-- V27 feature migration: privacy-friendly anonymous page/tool analytics + contact messages.
create table if not exists public.site_events (
  id uuid primary key default gen_random_uuid(),
  event_type text not null,
  path text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
alter table public.site_events enable row level security;
drop policy if exists "events_anon_insert" on public.site_events;
create policy "events_anon_insert" on public.site_events for insert to anon, authenticated with check (char_length(event_type) <= 80);
drop policy if exists "events_owner_read" on public.site_events;
create policy "events_owner_read" on public.site_events for select to authenticated using (true);


create table if not exists public.contact_messages (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null,
  subject text,
  message text not null,
  created_at timestamptz not null default now()
);
alter table public.contact_messages enable row level security;
drop policy if exists "messages_anon_insert" on public.contact_messages;
create policy "messages_anon_insert" on public.contact_messages for insert to anon, authenticated with check (char_length(name) <= 120 and char_length(email) <= 254 and char_length(message) <= 5000);
drop policy if exists "messages_owner_read" on public.contact_messages;
create policy "messages_owner_read" on public.contact_messages for select to authenticated using (true);
drop policy if exists "messages_owner_delete" on public.contact_messages;
create policy "messages_owner_delete" on public.contact_messages for delete to authenticated using (true);
