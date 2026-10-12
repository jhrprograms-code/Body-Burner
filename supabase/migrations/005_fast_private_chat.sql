-- Fast chat delivery for phones. A per-account random token protects each
-- public Realtime Broadcast topic; the token itself is visible only to its
-- owner through RLS. The durable message table remains the source of truth.
begin;

create table public.social_inbox_tokens (
  user_id uuid primary key references auth.users(id) on delete cascade,
  token uuid not null unique default gen_random_uuid(),
  created_at timestamptz not null default now()
);

alter table public.social_inbox_tokens enable row level security;
revoke all on public.social_inbox_tokens from public, anon, authenticated;
grant select, insert on public.social_inbox_tokens to authenticated;

create policy inbox_tokens_read_own
on public.social_inbox_tokens for select to authenticated
using (user_id = (select auth.uid()));

create policy inbox_tokens_create_own
on public.social_inbox_tokens for insert to authenticated
with check (user_id = (select auth.uid()));

insert into public.social_inbox_tokens (user_id)
select id from auth.users
on conflict (user_id) do nothing;

create or replace function private.broadcast_social_message()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  inbox_token uuid;
begin
  insert into public.social_inbox_tokens (user_id)
  values (new.recipient_id)
  on conflict (user_id) do nothing;

  select token into inbox_token
  from public.social_inbox_tokens
  where user_id = new.recipient_id;

  perform realtime.send(
    pg_catalog.jsonb_build_object('new', pg_catalog.to_jsonb(new)),
    'INSERT',
    'social:inbox:' || inbox_token::text,
    false
  );
  return null;
end;
$$;

revoke all on function private.broadcast_social_message() from public, anon, authenticated;

drop trigger if exists broadcast_social_message on public.social_messages;
create trigger broadcast_social_message
after insert on public.social_messages
for each row execute function private.broadcast_social_message();

commit;
