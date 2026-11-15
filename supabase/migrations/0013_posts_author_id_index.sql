-- 0013: covering index for posts.author_id per performance advisor
-- (unindexed_foreign_keys on posts_author_id_fkey introduced by 0012).

create index posts_author_id_idx on public.posts (author_id);
