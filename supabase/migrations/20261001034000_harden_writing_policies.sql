revoke execute on function public.blog_set_post_password(uuid, text) from anon;

drop policy if exists "writing owner can read posts" on public.blog_posts;
create policy "writing owner can read posts"
on public.blog_posts for select to authenticated
using (
  (select auth.uid()) = author_id
  and lower(coalesce((select auth.jwt()) ->> 'email', '')) = 'adisaputra.dicky.21@gmail.com'
);

drop policy if exists "writing owner can create posts" on public.blog_posts;
create policy "writing owner can create posts"
on public.blog_posts for insert to authenticated
with check (
  (select auth.uid()) = author_id
  and lower(coalesce((select auth.jwt()) ->> 'email', '')) = 'adisaputra.dicky.21@gmail.com'
);

drop policy if exists "writing owner can update posts" on public.blog_posts;
create policy "writing owner can update posts"
on public.blog_posts for update to authenticated
using (
  (select auth.uid()) = author_id
  and lower(coalesce((select auth.jwt()) ->> 'email', '')) = 'adisaputra.dicky.21@gmail.com'
)
with check (
  (select auth.uid()) = author_id
  and lower(coalesce((select auth.jwt()) ->> 'email', '')) = 'adisaputra.dicky.21@gmail.com'
);

drop policy if exists "writing owner can delete posts" on public.blog_posts;
create policy "writing owner can delete posts"
on public.blog_posts for delete to authenticated
using (
  (select auth.uid()) = author_id
  and lower(coalesce((select auth.jwt()) ->> 'email', '')) = 'adisaputra.dicky.21@gmail.com'
);
