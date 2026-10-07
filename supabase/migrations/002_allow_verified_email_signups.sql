-- Apply to existing Body Burner projects created before open email signup.
create or replace function private.add_new_user_membership() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  insert into public.members(user_id) values (new.id) on conflict do nothing;
  return new;
end
$$;

revoke all on function private.add_new_user_membership() from public, anon, authenticated;

drop trigger if exists add_new_user_membership on auth.users;
create trigger add_new_user_membership
after insert on auth.users
for each row execute function private.add_new_user_membership();

insert into public.members(user_id)
select id from auth.users
on conflict do nothing;
