-- HAUS-009 | Metadata archival for portfolio assets. Existing photos remain visible and intact.
alter table public.haus_gallery add column if not exists archived_at timestamptz;
alter table public.haus_gallery drop constraint if exists haus_gallery_archive_visibility;
alter table public.haus_gallery add constraint haus_gallery_archive_visibility
  check(archived_at is null or active=false);
create index if not exists haus_gallery_archive_sort
 on public.haus_gallery(archived_at,sort_order);
-- Existing RLS and storage policies remain in force.
