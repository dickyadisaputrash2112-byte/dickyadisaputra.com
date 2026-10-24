-- Additive migration: existing blog / Ruang Ayat tables are untouched.
create table public.ruang_learning_state (
 owner_id uuid primary key references auth.users(id) on delete cascade,
 payload jsonb not null check(jsonb_typeof(payload)='object'),
 revision bigint not null default 1,
 updated_at timestamptz not null default now()
);
create table public.ruang_catalog_cache (
 key text primary key,
 payload jsonb not null,
 updated_at timestamptz not null default now()
);
create table public.ruang_runtime (
 id text primary key check(id='owner'),
 owner_id uuid not null references auth.users(id),
 refresh_hash text not null
);
alter table public.ruang_learning_state enable row level security;
alter table public.ruang_catalog_cache enable row level security;
alter table public.ruang_runtime enable row level security;
revoke all on public.ruang_learning_state, public.ruang_catalog_cache, public.ruang_runtime from anon, authenticated;
grant select, insert, update on public.ruang_learning_state to authenticated;
grant all on public.ruang_learning_state, public.ruang_catalog_cache, public.ruang_runtime to service_role;
create policy ruang_owner_select on public.ruang_learning_state for select to authenticated using ((select auth.uid())=owner_id and (select auth.jwt()->>'email')='adisaputra.dicky.21@gmail.com');
create policy ruang_owner_insert on public.ruang_learning_state for insert to authenticated with check ((select auth.uid())=owner_id and (select auth.jwt()->>'email')='adisaputra.dicky.21@gmail.com');
create policy ruang_owner_update on public.ruang_learning_state for update to authenticated using ((select auth.uid())=owner_id and (select auth.jwt()->>'email')='adisaputra.dicky.21@gmail.com') with check ((select auth.uid())=owner_id and (select auth.jwt()->>'email')='adisaputra.dicky.21@gmail.com');
create extension if not exists pg_cron;
create extension if not exists pg_net;
create schema if not exists ruang_private;
revoke all on schema ruang_private from public, anon, authenticated;
-- A service-only scheduler credential is generated inside the database. Never output its value.
do $setup$
declare secret text := encode(extensions.gen_random_bytes(32),'hex');
begin
 perform vault.create_secret(secret,'ruang_refresh_token','Daily Ruang Tumbuh scheduler');
 insert into public.ruang_runtime(id,owner_id,refresh_hash)
 select 'owner',id,encode(extensions.digest(secret,'sha256'),'hex') from auth.users where lower(email)='adisaputra.dicky.21@gmail.com';
 if not found then raise exception 'Website owner account missing'; end if;
end $setup$;
