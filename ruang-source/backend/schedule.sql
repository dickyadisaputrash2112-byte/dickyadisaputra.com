-- Jobs dispatch inside Supabase, independently of GitHub/laptop. Each topic gets a bounded invocation.
create or replace function ruang_private.dispatch_refresh(retry_only boolean default false)
returns integer language plpgsql security definer set search_path='' as $fn$
declare scheduler_token text; topic text; count_requests integer:=0; latest timestamptz;
begin
 select decrypted_secret into strict scheduler_token from vault.decrypted_secrets where name='ruang_refresh_token';
 for topic in select distinct jsonb_array_elements_text(s.payload->'preferences'->'topics') from public.ruang_learning_state s join public.ruang_runtime r on r.owner_id=s.owner_id loop
  select updated_at into latest from public.ruang_catalog_cache where key='daily-topic:'||lower(trim(topic));
  if not retry_only or latest is null or (latest at time zone 'Asia/Jakarta')::date < (now() at time zone 'Asia/Jakarta')::date then
   perform net.http_post(url:='https://icpirkkojrzoaoyibpiz.supabase.co/functions/v1/ruang-tumbuh/refresh',headers:=jsonb_build_object('Content-Type','application/json','x-ruang-refresh',scheduler_token),body:=jsonb_build_object('topic',topic),timeout_milliseconds:=120000);count_requests:=count_requests+1;
  end if;
 end loop;
 select updated_at into latest from public.ruang_catalog_cache where key='news';
 if not retry_only or latest is null or (latest at time zone 'Asia/Jakarta')::date < (now() at time zone 'Asia/Jakarta')::date then
  perform net.http_post(url:='https://icpirkkojrzoaoyibpiz.supabase.co/functions/v1/ruang-tumbuh/refresh',headers:=jsonb_build_object('Content-Type','application/json','x-ruang-refresh',scheduler_token),body:='{"kind":"news"}'::jsonb,timeout_milliseconds:=120000);count_requests:=count_requests+1;
 end if;
 return count_requests;
end $fn$;
revoke all on function ruang_private.dispatch_refresh(boolean) from public,anon,authenticated;
-- Supabase cron runs in UTC: 23:30 UTC = 06:30 WIB on the next calendar day.
select cron.schedule('ruang-tumbuh-daily','30 23 * * *','select ruang_private.dispatch_refresh(false);');
select cron.schedule('ruang-tumbuh-retry','45 23 * * *','select ruang_private.dispatch_refresh(true);');
