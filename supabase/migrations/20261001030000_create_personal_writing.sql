create extension if not exists pgcrypto with schema extensions;

create table if not exists public.blog_posts (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references auth.users(id) on delete cascade,
  slug text not null unique check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  title text not null check (char_length(title) between 1 and 180),
  subtitle text not null default '',
  excerpt text not null default '',
  content text not null default '',
  cover_url text,
  category text not null default 'Catatan',
  tags text[] not null default '{}',
  status text not null default 'draft' check (status in ('draft', 'published', 'scheduled')),
  access_level text not null default 'public' check (access_level in ('public', 'password')),
  password_hash text,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint locked_post_has_password check (access_level = 'public' or password_hash is not null)
);

create index if not exists blog_posts_public_feed_idx
  on public.blog_posts (published_at desc)
  where status in ('published', 'scheduled');
create index if not exists blog_posts_author_updated_idx
  on public.blog_posts (author_id, updated_at desc);

alter table public.blog_posts enable row level security;

revoke all on table public.blog_posts from anon, authenticated;
grant select, insert, update, delete on table public.blog_posts to authenticated;

drop policy if exists "writing owner can read posts" on public.blog_posts;
create policy "writing owner can read posts"
on public.blog_posts for select to authenticated
using (
  auth.uid() = author_id
  and lower(coalesce(auth.jwt() ->> 'email', '')) = 'adisaputra.dicky.21@gmail.com'
);

drop policy if exists "writing owner can create posts" on public.blog_posts;
create policy "writing owner can create posts"
on public.blog_posts for insert to authenticated
with check (
  auth.uid() = author_id
  and lower(coalesce(auth.jwt() ->> 'email', '')) = 'adisaputra.dicky.21@gmail.com'
);

drop policy if exists "writing owner can update posts" on public.blog_posts;
create policy "writing owner can update posts"
on public.blog_posts for update to authenticated
using (
  auth.uid() = author_id
  and lower(coalesce(auth.jwt() ->> 'email', '')) = 'adisaputra.dicky.21@gmail.com'
)
with check (
  auth.uid() = author_id
  and lower(coalesce(auth.jwt() ->> 'email', '')) = 'adisaputra.dicky.21@gmail.com'
);

drop policy if exists "writing owner can delete posts" on public.blog_posts;
create policy "writing owner can delete posts"
on public.blog_posts for delete to authenticated
using (
  auth.uid() = author_id
  and lower(coalesce(auth.jwt() ->> 'email', '')) = 'adisaputra.dicky.21@gmail.com'
);

create or replace function public.set_blog_post_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists blog_posts_set_updated_at on public.blog_posts;
create trigger blog_posts_set_updated_at
before update on public.blog_posts
for each row execute function public.set_blog_post_updated_at();

create or replace function public.blog_list_posts()
returns table (
  slug text,
  title text,
  subtitle text,
  excerpt text,
  cover_url text,
  category text,
  tags text[],
  access_level text,
  published_at timestamptz,
  updated_at timestamptz
)
language sql
stable
security definer
set search_path = ''
as $$
  select
    p.slug, p.title, p.subtitle, p.excerpt, p.cover_url, p.category,
    p.tags, p.access_level, p.published_at, p.updated_at
  from public.blog_posts p
  where p.status in ('published', 'scheduled')
    and p.published_at is not null
    and p.published_at <= now()
  order by p.published_at desc;
$$;

create or replace function public.blog_get_post(
  requested_slug text,
  supplied_password text default null
)
returns table (
  slug text,
  title text,
  subtitle text,
  excerpt text,
  content text,
  cover_url text,
  category text,
  tags text[],
  access_level text,
  published_at timestamptz,
  updated_at timestamptz
)
language sql
stable
security definer
set search_path = ''
as $$
  select
    p.slug, p.title, p.subtitle, p.excerpt, p.content, p.cover_url,
    p.category, p.tags, p.access_level, p.published_at, p.updated_at
  from public.blog_posts p
  where p.slug = requested_slug
    and p.status in ('published', 'scheduled')
    and p.published_at is not null
    and p.published_at <= now()
    and (
      p.access_level = 'public'
      or (
        p.access_level = 'password'
        and supplied_password is not null
        and p.password_hash = extensions.crypt(supplied_password, p.password_hash)
      )
    )
  limit 1;
$$;

create or replace function public.blog_set_post_password(
  requested_post_id uuid,
  new_password text
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if auth.uid() is null
     or lower(coalesce(auth.jwt() ->> 'email', '')) <> 'adisaputra.dicky.21@gmail.com' then
    raise exception 'Not authorized';
  end if;

  if char_length(coalesce(new_password, '')) < 8 then
    raise exception 'Password must be at least 8 characters';
  end if;

  update public.blog_posts
  set password_hash = extensions.crypt(new_password, extensions.gen_salt('bf', 10)),
      access_level = 'password'
  where id = requested_post_id and author_id = auth.uid();

  if not found then
    raise exception 'Post not found';
  end if;
end;
$$;

revoke all on function public.blog_list_posts() from public;
revoke all on function public.blog_get_post(text, text) from public;
revoke all on function public.blog_set_post_password(uuid, text) from public;
grant execute on function public.blog_list_posts() to anon, authenticated;
grant execute on function public.blog_get_post(text, text) to anon, authenticated;
grant execute on function public.blog_set_post_password(uuid, text) to authenticated;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'writing-media',
  'writing-media',
  true,
  8388608,
  array['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "writing owner can upload media" on storage.objects;
create policy "writing owner can upload media"
on storage.objects for insert to authenticated
with check (
  bucket_id = 'writing-media'
  and (storage.foldername(name))[1] = auth.uid()::text
  and lower(coalesce(auth.jwt() ->> 'email', '')) = 'adisaputra.dicky.21@gmail.com'
);

drop policy if exists "writing owner can update media" on storage.objects;
create policy "writing owner can update media"
on storage.objects for update to authenticated
using (
  bucket_id = 'writing-media'
  and owner_id = auth.uid()::text
  and lower(coalesce(auth.jwt() ->> 'email', '')) = 'adisaputra.dicky.21@gmail.com'
)
with check (
  bucket_id = 'writing-media'
  and (storage.foldername(name))[1] = auth.uid()::text
  and lower(coalesce(auth.jwt() ->> 'email', '')) = 'adisaputra.dicky.21@gmail.com'
);

drop policy if exists "writing owner can delete media" on storage.objects;
create policy "writing owner can delete media"
on storage.objects for delete to authenticated
using (
  bucket_id = 'writing-media'
  and owner_id = auth.uid()::text
  and lower(coalesce(auth.jwt() ->> 'email', '')) = 'adisaputra.dicky.21@gmail.com'
);
