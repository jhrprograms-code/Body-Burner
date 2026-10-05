-- Run ONLY against a development Supabase project after migration 001.
-- Runs in a transaction and rolls back all fixtures. This was not run without a live project.
begin;
insert into auth.users(id,email) values
 ('00000000-0000-4000-8000-0000000000a1','bodyburner-test-a@example.invalid'),
 ('00000000-0000-4000-8000-0000000000b2','bodyburner-test-b@example.invalid');
insert into public.members values ('00000000-0000-4000-8000-0000000000a1'),('00000000-0000-4000-8000-0000000000b2');
set local role authenticated;
select set_config('request.jwt.claim.sub','00000000-0000-4000-8000-0000000000a1',true);
select public.save_state('{"version":1,"profile":{"name":"A"}}'::jsonb,0);
select set_config('request.jwt.claim.sub','00000000-0000-4000-8000-0000000000b2',true);
do $$ begin
 if exists(select 1 from public.app_state) then raise exception 'Cross-user state leak'; end if;
end $$;
select public.save_state('{"version":1,"profile":{"name":"B"}}'::jsonb,0);
do $$ begin
 if (select count(*) from public.app_state)<>1 then raise exception 'Expected one owned row'; end if;
 begin
  perform public.save_state('{"version":1}'::jsonb,99);
  raise exception 'Conflict was accepted';
 exception when others then
  if sqlerrm not like '%SYNC_CONFLICT%' then raise; end if;
 end;
end $$;
select public.erase_state();
select set_config('request.jwt.claim.sub','00000000-0000-4000-8000-0000000000a1',true);
do $$ begin
 if (select count(*) from public.app_state)<>1 then raise exception 'Other user deleted our row'; end if;
end $$;
reset role;
rollback;
