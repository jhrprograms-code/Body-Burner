-- Cover foreign-key joins used by the social feed, moderation and cleanup.
create index social_blocks_blocked_idx on public.social_blocks(blocked_id);
create index social_comments_author_idx on public.social_comments(author_id);
create index social_groups_owner_idx on public.social_groups(owner_id);
create index social_posts_shared_idx on public.social_posts(shared_post_id) where shared_post_id is not null;
create index social_reactions_user_idx on public.social_reactions(user_id);
create index social_reports_reporter_idx on public.social_reports(reporter_id);
create index social_reports_post_idx on public.social_reports(post_id) where post_id is not null;
create index social_reports_user_idx on public.social_reports(reported_user_id) where reported_user_id is not null;
