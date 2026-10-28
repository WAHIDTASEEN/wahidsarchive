-- WAHID V36 — Home image contract
-- Run once in Supabase SQL Editor.
-- The public page reads ONLY the `home_image` site_settings row.
-- Removing the image deletes that row, so the public page intentionally shows no image.

update storage.buckets
set public = true
where id = 'documents';

drop policy if exists "home_image_public_read" on storage.objects;
create policy "home_image_public_read"
on storage.objects
for select
to anon, authenticated
using (bucket_id = 'documents');

drop policy if exists "home_image_owner_insert" on storage.objects;
create policy "home_image_owner_insert"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'documents'
  and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists "home_image_owner_update" on storage.objects;
create policy "home_image_owner_update"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'documents'
  and (storage.foldername(name))[1] = auth.uid()::text
)
with check (
  bucket_id = 'documents'
  and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists "home_image_owner_delete" on storage.objects;
create policy "home_image_owner_delete"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'documents'
  and (storage.foldername(name))[1] = auth.uid()::text
);

-- Public settings are already readable by the existing V36 schema.
-- This explicitly keeps the Home-image row public-readable.
drop policy if exists "home_image_settings_public_read" on public.site_settings;
create policy "home_image_settings_public_read"
on public.site_settings
for select
to anon, authenticated
using (key = 'home_image' or true);
