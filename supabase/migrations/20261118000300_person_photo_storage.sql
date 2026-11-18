insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'person-photos',
  'person-photos',
  false,
  10485760,
  array['image/jpeg']::text[]
)
on conflict (id) do update
set
  public = false,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

create table public.person_photos (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users (id) on delete cascade,
  object_path text not null unique,
  content_type text not null check (content_type = 'image/jpeg'),
  byte_size integer not null check (byte_size between 1 and 10485760),
  width integer not null check (width between 256 and 2048),
  height integer not null check (height between 256 and 2048),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (split_part(object_path, '/', 1) = user_id::text)
);

alter table public.person_photos enable row level security;

revoke all on public.person_photos from public, anon, authenticated;
grant select, insert, update, delete on public.person_photos to service_role;

create trigger person_photos_set_updated_at
  before update on public.person_photos
  for each row execute function public.set_updated_at();
