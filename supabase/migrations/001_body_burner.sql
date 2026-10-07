-- Run once in a NEW Supabase project. Verified email signups receive membership automatically.
begin;
create schema if not exists private;
revoke all on schema private from public, anon;
grant usage on schema private to authenticated;
create table public.members(user_id uuid primary key references auth.users(id) on delete cascade);
alter table public.members enable row level security;
create policy own_membership_read on public.members for select to authenticated using(user_id=(select auth.uid()));
revoke all on public.members from public,anon,authenticated;
grant select on public.members to authenticated;
create or replace function public.is_member() returns boolean language sql stable security invoker set search_path='' as $$
 select exists(select 1 from public.members where user_id=(select auth.uid()));
$$;
revoke all on function public.is_member() from public,anon;
grant execute on function public.is_member() to authenticated;
create function private.add_new_user_membership() returns trigger language plpgsql security definer set search_path='' as $$
begin
 insert into public.members(user_id) values(new.id) on conflict do nothing;
 return new;
end $$;
revoke all on function private.add_new_user_membership() from public,anon,authenticated;
create trigger add_new_user_membership after insert on auth.users for each row execute function private.add_new_user_membership();
create table public.app_state (
 user_id uuid primary key references auth.users(id) on delete cascade,
 payload jsonb not null check (jsonb_typeof(payload)='object' and octet_length(payload::text)<=2000000),
 version bigint not null default 1,
 updated_at timestamptz not null default now()
);
alter table public.app_state enable row level security;
create policy own_state_read on public.app_state for select to authenticated using(user_id=(select auth.uid()) and (select public.is_member()));
revoke all on public.app_state from anon,authenticated;
grant select on public.app_state to authenticated;
-- Compare-and-swap protects against simultaneous edits on different devices.
create function private.save_state(new_payload jsonb, expected_version bigint) returns bigint language plpgsql security definer set search_path='' as $$
declare result bigint;
begin
 if auth.uid() is null or not public.is_member() then raise exception 'Not a member'; end if;
 if jsonb_typeof(new_payload) is distinct from 'object' or new_payload->>'version' is distinct from '1' or octet_length(new_payload::text)>2000000 then raise exception 'Invalid payload'; end if;
 if expected_version=0 then
  insert into public.app_state(user_id,payload,version) values(auth.uid(),new_payload,1) on conflict do nothing returning version into result;
 else
  update public.app_state set payload=new_payload,version=version+1,updated_at=now() where user_id=auth.uid() and version=expected_version returning version into result;
 end if;
 if result is null then raise exception 'SYNC_CONFLICT'; end if;
 return result;
end $$;
revoke all on function private.save_state(jsonb,bigint) from public,anon;
grant execute on function private.save_state(jsonb,bigint) to authenticated;
create function private.erase_state() returns void language plpgsql security definer set search_path='' as $$
begin
 if auth.uid() is null or not public.is_member() then raise exception 'Not a member'; end if;
 delete from public.app_state where user_id=auth.uid();
end $$;
revoke all on function private.erase_state() from public,anon;
grant execute on function private.erase_state() to authenticated;
create table public.request_usage(bucket text primary key, count integer not null default 0, expires_at timestamptz not null);
alter table public.request_usage enable row level security;
revoke all on public.request_usage from anon,authenticated;
create function private.consume_request(request_kind text) returns boolean language plpgsql security definer set search_path='' as $$
declare minute_key text; day_key text; global_key text; n integer; max_user integer; max_global integer;
begin
 if auth.uid() is null or not public.is_member() or request_kind is null or request_kind not in ('food','ai') then return false; end if;
 -- Shared lock serializes counters across serverless instances.
 perform pg_advisory_xact_lock(71823051);
 delete from public.request_usage where expires_at<now();
 minute_key := request_kind||':user:'||auth.uid()::text||':'||to_char(now() at time zone 'UTC','YYYY-MM-DD-HH24-MI');
 day_key := request_kind||':day:'||auth.uid()::text||':'||to_char(now() at time zone 'UTC','YYYY-MM-DD');
 global_key := request_kind||':global:'||case when request_kind='food' then to_char(now() at time zone 'UTC','YYYY-MM-DD-HH24-MI') else to_char(now() at time zone 'UTC','YYYY-MM-DD') end;
 max_user := case when request_kind='ai' then 20 else 100 end;
 max_global := case when request_kind='ai' then 200 else 8 end;
 if coalesce((select count from public.request_usage where bucket=minute_key),0)>=6 or coalesce((select count from public.request_usage where bucket=day_key),0)>=max_user or coalesce((select count from public.request_usage where bucket=global_key),0)>=max_global then return false; end if;
 insert into public.request_usage values(minute_key,1,now()+interval '2 minutes'),(day_key,1,now()+interval '2 days'),(global_key,1,now()+interval '2 days') on conflict(bucket) do update set count=public.request_usage.count+1;
 return true;
end $$;
revoke all on function private.consume_request(text) from public,anon;
grant execute on function private.consume_request(text) to authenticated;
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types) values('progress','progress',false,2000000,array['image/jpeg','image/png','image/webp']) on conflict(id) do nothing;
create policy private_photo_read on storage.objects for select to authenticated using(bucket_id='progress' and (storage.foldername(name))[1]=(select auth.uid())::text and (select public.is_member()));
create policy private_photo_insert on storage.objects for insert to authenticated with check(bucket_id='progress' and (storage.foldername(name))[1]=(select auth.uid())::text and (select public.is_member()));
create policy private_photo_delete on storage.objects for delete to authenticated using(bucket_id='progress' and (storage.foldername(name))[1]=(select auth.uid())::text and (select public.is_member()));

create function public.save_state(new_payload jsonb,expected_version bigint) returns bigint language sql security invoker set search_path='' as $$ select private.save_state(new_payload,expected_version); $$;
create function public.erase_state() returns void language sql security invoker set search_path='' as $$ select private.erase_state(); $$;
create function public.consume_request(request_kind text) returns boolean language sql security invoker set search_path='' as $$ select private.consume_request(request_kind); $$;
revoke all on function public.save_state(jsonb,bigint), public.erase_state(), public.consume_request(text) from public,anon;
grant execute on function public.save_state(jsonb,bigint), public.erase_state(), public.consume_request(text) to authenticated;
-- Licensed exercise files: signed-in members may read; no client writes.
create policy member_exercise_media_read on storage.objects for select to authenticated using(bucket_id='exercise-media' and (select public.is_member()));

commit;
