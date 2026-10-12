-- Friends, realtime chat, private groups, posts, comments and reactions.
-- All social tables are private to authenticated Resilience Buddy members.
begin;

create table public.social_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  username text not null unique check (username = lower(username) and username ~ '^[a-z0-9][a-z0-9_.-]{2,29}$'),
  display_name text not null check (char_length(display_name) between 1 and 60),
  bio text not null default '' check (char_length(bio) <= 240),
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.friendships (
  id uuid primary key default gen_random_uuid(),
  requester_id uuid not null references public.social_profiles(user_id) on delete cascade,
  addressee_id uuid not null references public.social_profiles(user_id) on delete cascade,
  status text not null default 'pending' check (status in ('pending','accepted')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (requester_id <> addressee_id)
);
create unique index friendships_unique_pair on public.friendships (
  least(requester_id::text, addressee_id::text),
  greatest(requester_id::text, addressee_id::text)
);
create index friendships_requester_idx on public.friendships(requester_id, status);
create index friendships_addressee_idx on public.friendships(addressee_id, status);

create table public.social_blocks (
  blocker_id uuid not null references public.social_profiles(user_id) on delete cascade,
  blocked_id uuid not null references public.social_profiles(user_id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (blocker_id, blocked_id),
  check (blocker_id <> blocked_id)
);

create table public.social_groups (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.social_profiles(user_id) on delete cascade,
  name text not null check (char_length(name) between 2 and 60),
  description text not null default '' check (char_length(description) <= 500),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.social_group_members (
  group_id uuid not null references public.social_groups(id) on delete cascade,
  user_id uuid not null references public.social_profiles(user_id) on delete cascade,
  role text not null default 'member' check (role in ('owner','member')),
  joined_at timestamptz not null default now(),
  primary key (group_id, user_id)
);
create index social_group_members_user_idx on public.social_group_members(user_id);

create table public.social_messages (
  id uuid primary key default gen_random_uuid(),
  sender_id uuid not null references public.social_profiles(user_id) on delete cascade,
  recipient_id uuid not null references public.social_profiles(user_id) on delete cascade,
  body text not null check (char_length(btrim(body)) between 1 and 2000),
  created_at timestamptz not null default now(),
  check (sender_id <> recipient_id)
);
create index social_messages_pair_idx on public.social_messages(sender_id, recipient_id, created_at desc);
create index social_messages_recipient_idx on public.social_messages(recipient_id, created_at desc);

create table public.social_posts (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references public.social_profiles(user_id) on delete cascade,
  group_id uuid references public.social_groups(id) on delete cascade,
  shared_post_id uuid references public.social_posts(id) on delete set null,
  body text not null default '' check (char_length(body) <= 5000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (char_length(btrim(body)) > 0 or shared_post_id is not null)
);
create index social_posts_author_idx on public.social_posts(author_id, created_at desc);
create index social_posts_group_idx on public.social_posts(group_id, created_at desc);

create table public.social_comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.social_posts(id) on delete cascade,
  author_id uuid not null references public.social_profiles(user_id) on delete cascade,
  body text not null check (char_length(btrim(body)) between 1 and 2000),
  created_at timestamptz not null default now()
);
create index social_comments_post_idx on public.social_comments(post_id, created_at);

create table public.social_reactions (
  post_id uuid not null references public.social_posts(id) on delete cascade,
  user_id uuid not null references public.social_profiles(user_id) on delete cascade,
  kind text not null check (kind in ('like','love','strong','support')),
  created_at timestamptz not null default now(),
  primary key (post_id, user_id)
);

create table public.social_reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid not null references public.social_profiles(user_id) on delete cascade,
  post_id uuid references public.social_posts(id) on delete cascade,
  reported_user_id uuid references public.social_profiles(user_id) on delete cascade,
  reason text not null check (reason in ('spam','harassment','unsafe','other')),
  details text not null default '' check (char_length(details) <= 1000),
  created_at timestamptz not null default now(),
  check (post_id is not null or reported_user_id is not null)
);

alter table public.social_profiles enable row level security;
alter table public.friendships enable row level security;
alter table public.social_blocks enable row level security;
alter table public.social_groups enable row level security;
alter table public.social_group_members enable row level security;
alter table public.social_messages enable row level security;
alter table public.social_posts enable row level security;
alter table public.social_comments enable row level security;
alter table public.social_reactions enable row level security;
alter table public.social_reports enable row level security;

revoke all on public.social_profiles, public.friendships, public.social_blocks,
  public.social_groups, public.social_group_members, public.social_messages,
  public.social_posts, public.social_comments, public.social_reactions,
  public.social_reports from public, anon, authenticated;
grant select, insert, update on public.social_profiles to authenticated;
grant select, insert, update, delete on public.friendships to authenticated;
grant select, insert, delete on public.social_blocks to authenticated;
grant select, insert, update, delete on public.social_groups to authenticated;
grant select, insert, delete on public.social_group_members to authenticated;
grant select, insert, delete on public.social_messages to authenticated;
grant select, insert, update, delete on public.social_posts to authenticated;
grant select, insert, delete on public.social_comments to authenticated;
grant select, insert, update, delete on public.social_reactions to authenticated;
grant select, insert on public.social_reports to authenticated;

create or replace function private.is_social_friend(other_id uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select (select auth.uid()) is not null and exists (
    select 1 from public.friendships f
    where f.status = 'accepted'
      and ((f.requester_id = (select auth.uid()) and f.addressee_id = other_id)
        or (f.addressee_id = (select auth.uid()) and f.requester_id = other_id))
  );
$$;
create or replace function private.is_social_group_member(target_group uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select (select auth.uid()) is not null and exists (
    select 1 from public.social_group_members gm
    where gm.group_id = target_group and gm.user_id = (select auth.uid())
  );
$$;
create or replace function private.can_view_social_post(target_post uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select (select auth.uid()) is not null and exists (
    select 1 from public.social_posts p
    where p.id = target_post and (
      p.author_id = (select auth.uid())
      or (p.group_id is null and private.is_social_friend(p.author_id))
      or (p.group_id is not null and private.is_social_group_member(p.group_id))
    )
  );
$$;
revoke all on function private.is_social_friend(uuid), private.is_social_group_member(uuid),
  private.can_view_social_post(uuid) from public, anon;
grant execute on function private.is_social_friend(uuid), private.is_social_group_member(uuid),
  private.can_view_social_post(uuid) to authenticated;

create policy social_profiles_read on public.social_profiles for select to authenticated using (
  (select public.is_member()) and not exists (
    select 1 from public.social_blocks b
    where (b.blocker_id = (select auth.uid()) and b.blocked_id = user_id)
       or (b.blocked_id = (select auth.uid()) and b.blocker_id = user_id)
  )
);
create policy social_profiles_insert_own on public.social_profiles for insert to authenticated
  with check (user_id = (select auth.uid()) and (select public.is_member()));
create policy social_profiles_update_own on public.social_profiles for update to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

create policy friendships_read_own on public.friendships for select to authenticated
  using (requester_id = (select auth.uid()) or addressee_id = (select auth.uid()));
create policy friendships_request on public.friendships for insert to authenticated with check (
  requester_id = (select auth.uid()) and status = 'pending'
  and not exists (select 1 from public.social_blocks b where
    (b.blocker_id = requester_id and b.blocked_id = addressee_id)
    or (b.blocker_id = addressee_id and b.blocked_id = requester_id))
);
create policy friendships_accept on public.friendships for update to authenticated
  using (addressee_id = (select auth.uid()) and status = 'pending')
  with check (addressee_id = (select auth.uid()) and status = 'accepted');
create policy friendships_remove on public.friendships for delete to authenticated
  using (requester_id = (select auth.uid()) or addressee_id = (select auth.uid()));

create policy blocks_read_own on public.social_blocks for select to authenticated using (blocker_id = (select auth.uid()));
create policy blocks_insert_own on public.social_blocks for insert to authenticated with check (blocker_id = (select auth.uid()));
create policy blocks_delete_own on public.social_blocks for delete to authenticated using (blocker_id = (select auth.uid()));

create policy groups_read_members on public.social_groups for select to authenticated
  using (owner_id = (select auth.uid()) or private.is_social_group_member(id));
create policy groups_create on public.social_groups for insert to authenticated with check (owner_id = (select auth.uid()));
create policy groups_update_owner on public.social_groups for update to authenticated
  using (owner_id = (select auth.uid())) with check (owner_id = (select auth.uid()));
create policy groups_delete_owner on public.social_groups for delete to authenticated using (owner_id = (select auth.uid()));

create policy group_members_read on public.social_group_members for select to authenticated
  using (private.is_social_group_member(group_id) or user_id = (select auth.uid()));
create policy group_members_add on public.social_group_members for insert to authenticated with check (
  exists (select 1 from public.social_groups g where g.id = group_id and g.owner_id = (select auth.uid()))
  and (user_id = (select auth.uid()) or private.is_social_friend(user_id))
);
create policy group_members_remove on public.social_group_members for delete to authenticated using (
  user_id = (select auth.uid()) or exists (
    select 1 from public.social_groups g where g.id = group_id and g.owner_id = (select auth.uid())
  )
);

create policy messages_read_participants on public.social_messages for select to authenticated using (
  sender_id = (select auth.uid()) or recipient_id = (select auth.uid())
);
create policy messages_send_friends on public.social_messages for insert to authenticated with check (
  sender_id = (select auth.uid()) and private.is_social_friend(recipient_id)
  and not exists (select 1 from public.social_blocks b where
    (b.blocker_id = sender_id and b.blocked_id = recipient_id)
    or (b.blocker_id = recipient_id and b.blocked_id = sender_id))
);
create policy messages_delete_own on public.social_messages for delete to authenticated using (sender_id = (select auth.uid()));

create policy posts_read_network on public.social_posts for select to authenticated using (
  author_id = (select auth.uid())
  or (group_id is null and private.is_social_friend(author_id))
  or (group_id is not null and private.is_social_group_member(group_id))
);
create policy posts_create on public.social_posts for insert to authenticated with check (
  author_id = (select auth.uid()) and (group_id is null or private.is_social_group_member(group_id))
  and (shared_post_id is null or private.can_view_social_post(shared_post_id))
);
create policy posts_update_own on public.social_posts for update to authenticated
  using (author_id = (select auth.uid())) with check (author_id = (select auth.uid()));
create policy posts_delete_own on public.social_posts for delete to authenticated using (author_id = (select auth.uid()));

create policy comments_read_visible_post on public.social_comments for select to authenticated using (
  private.can_view_social_post(post_id)
);
create policy comments_create on public.social_comments for insert to authenticated with check (
  author_id = (select auth.uid()) and private.can_view_social_post(post_id)
);
create policy comments_delete on public.social_comments for delete to authenticated using (
  author_id = (select auth.uid()) or exists (
    select 1 from public.social_posts p where p.id = post_id and p.author_id = (select auth.uid())
  )
);

create policy reactions_read_visible_post on public.social_reactions for select to authenticated using (
  private.can_view_social_post(post_id)
);
create policy reactions_create on public.social_reactions for insert to authenticated with check (
  user_id = (select auth.uid()) and private.can_view_social_post(post_id)
);
create policy reactions_update_own on public.social_reactions for update to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy reactions_delete_own on public.social_reactions for delete to authenticated using (user_id = (select auth.uid()));

create policy reports_create on public.social_reports for insert to authenticated with check (reporter_id = (select auth.uid()));
create policy reports_read_own on public.social_reports for select to authenticated using (reporter_id = (select auth.uid()));

create or replace function private.add_social_profile() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  insert into public.social_profiles(user_id, username, display_name)
  values (
    new.id,
    'member-' || left(new.id::text, 8),
    left(coalesce(nullif(new.raw_user_meta_data->>'name',''), split_part(new.email,'@',1), 'Member'), 60)
  ) on conflict (user_id) do nothing;
  return new;
end $$;
revoke all on function private.add_social_profile() from public, anon, authenticated;
create trigger add_social_profile after insert on auth.users for each row execute function private.add_social_profile();

insert into public.social_profiles(user_id, username, display_name)
select u.id, 'member-' || left(u.id::text, 8),
  left(coalesce(nullif(u.raw_user_meta_data->>'name',''), split_part(u.email,'@',1), 'Member'), 60)
from auth.users u on conflict (user_id) do nothing;

-- Group creators automatically become owners.
create or replace function private.add_group_owner() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  insert into public.social_group_members(group_id, user_id, role) values(new.id, new.owner_id, 'owner');
  return new;
end $$;
revoke all on function private.add_group_owner() from public, anon, authenticated;
create trigger add_group_owner after insert on public.social_groups for each row execute function private.add_group_owner();

-- Small private beta: Postgres Changes is sufficient and RLS filters every row.
do $$ begin
  alter publication supabase_realtime add table public.social_messages;
exception when duplicate_object then null; end $$;

commit;
