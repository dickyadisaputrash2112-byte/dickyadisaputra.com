create table public.personal_collections (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null default auth.uid() references auth.users(id),
  kind text not null check (kind in ('photos','books')),
  status text not null default 'draft' check (status in ('draft','published','archived')),
  data jsonb not null check (jsonb_typeof(data)='object' and octet_length(data::text)<=8192),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.personal_collections enable row level security;
revoke all on public.personal_collections from anon, authenticated;
grant select on public.personal_collections to anon;
grant select,insert,update on public.personal_collections to authenticated;
create policy collections_public_read on public.personal_collections for select to anon, authenticated using (status='published');
create policy collections_owner_read on public.personal_collections for select to authenticated using (
  author_id=(select auth.uid()) and lower(coalesce((select auth.jwt())->>'email',''))='adisaputra.dicky.21@gmail.com'
);
create policy collections_owner_insert on public.personal_collections for insert to authenticated with check (
  author_id=(select auth.uid()) and lower(coalesce((select auth.jwt())->>'email',''))='adisaputra.dicky.21@gmail.com'
);
create policy collections_owner_update on public.personal_collections for update to authenticated using (
  author_id=(select auth.uid()) and lower(coalesce((select auth.jwt())->>'email',''))='adisaputra.dicky.21@gmail.com'
) with check (
  author_id=(select auth.uid()) and lower(coalesce((select auth.jwt())->>'email',''))='adisaputra.dicky.21@gmail.com'
);
create index collections_owner_created_idx on public.personal_collections(author_id,created_at desc);
create index collections_published_created_idx on public.personal_collections(created_at desc) where status='published';
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values ('portfolio-media','portfolio-media',true,8388608,array['image/jpeg','image/png','image/webp']);
create policy portfolio_owner_upload on storage.objects for insert to authenticated with check (
  bucket_id='portfolio-media' and (storage.foldername(name))[1]=(select auth.uid())::text
  and lower(coalesce((select auth.jwt())->>'email',''))='adisaputra.dicky.21@gmail.com'
);
