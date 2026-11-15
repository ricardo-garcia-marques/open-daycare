-- 0012: SPEC 11 (step 2) — real feed posts: post_type enum, posts and
-- post_recipients tables with per-role RLS, the can_read_post() visibility
-- helper (SECURITY DEFINER, breaks the posts<->post_recipients RLS recursion,
-- same pattern as user_daycare_id() in 0002), a private post-images storage
-- bucket with author-scoped policies, and an idempotent seed of the 3 mock
-- feed posts (author = staff Caro Giménez, id …000a).
--
-- Out of scope by decision: DELETE policies on posts/post_recipients/objects
-- (editing/deleting posts is a future spec; RLS denies by default).

-- 1) post_type enum ----------------------------------------------------------
do $$
begin
  if not exists (
    select 1 from pg_type t
    join pg_namespace n on n.oid = t.typnamespace
    where n.nspname = 'public' and t.typname = 'post_type'
  ) then
    create type public.post_type as enum
      ('meal', 'nap', 'activity', 'achievement', 'mood', 'photo', 'announcement');
  end if;
end
$$;

-- 2) Tables -------------------------------------------------------------------
create table public.posts (
  id          uuid primary key default gen_random_uuid(),
  daycare_id  uuid not null references public.daycares(id),
  author_id   uuid not null references public.users(id),
  type        public.post_type not null,
  description text not null,
  whole_room  boolean not null default false,
  photos      text[] not null default '{}',
  created_at  timestamptz not null default now()
);

create table public.post_recipients (
  post_id  uuid not null references public.posts(id) on delete cascade,
  child_id uuid not null references public.children(id),
  primary key (post_id, child_id)
);

-- Feed is always queried per-daycare, newest first.
create index posts_daycare_id_created_at_idx on public.posts (daycare_id, created_at desc);
create index post_recipients_child_id_idx on public.post_recipients (child_id);

-- 3) Visibility helper --------------------------------------------------------
-- SECURITY DEFINER so policies on posts/post_recipients do not recurse into
-- each other (42P17). Returns false for users without a daycare profile or
-- outside the post's daycare: the EXISTS makes NULL comparisons fail closed.
create function public.can_read_post(p_post_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.posts p
    where p.id = p_post_id
      and p.daycare_id = public.user_daycare_id()
      and (
        public.viewer_is_staff_same_daycare(p.daycare_id)
        or p.author_id = (select auth.uid())
        or p.whole_room
        or exists (
          select 1
          from public.post_recipients pr
          join public.parent_children pc on pc.child_id = pr.child_id
          where pr.post_id = p.id
            and pc.parent_user_id = (select auth.uid())
        )
      )
  );
$$;

revoke execute on function public.can_read_post(uuid)
  from anon, authenticated, public;
grant execute on function public.can_read_post(uuid)
  to authenticated;

-- 4) posts RLS ----------------------------------------------------------------
alter table public.posts enable row level security;

-- Single visibility entry point: staff read everything of their daycare;
-- parents read whole-room posts, their own posts, or posts addressed to one
-- of their linked children.
create policy "members read visible posts"
  on public.posts for select
  to authenticated
  using (public.can_read_post(id));

-- Only staff may publish, only as themselves, only inside their daycare.
create policy "staff can post in own daycare"
  on public.posts for insert
  to authenticated
  with check (
    author_id = (select auth.uid())
    and public.viewer_is_staff_same_daycare(daycare_id)
  );

-- Update exists to attach photos after upload; only the author may do it.
-- (The author passing the SELECT policy is guaranteed: staff of the daycare.)
create policy "author staff can update own posts"
  on public.posts for update
  to authenticated
  using (
    author_id = (select auth.uid())
    and public.viewer_is_staff_same_daycare(daycare_id)
  )
  with check (
    author_id = (select auth.uid())
    and public.viewer_is_staff_same_daycare(daycare_id)
  );

-- No DELETE policy (out of scope): RLS denies by default.

-- 5) post_recipients RLS --------------------------------------------------------
alter table public.post_recipients enable row level security;

create policy "members read recipients of visible posts"
  on public.post_recipients for select
  to authenticated
  using (public.can_read_post(post_id));

-- Only staff may address a post they authored themselves to children of
-- their own daycare. (whole_room posts are expected to have no recipients;
-- not enforced by constraint, documented decision.)
create policy "staff can address own posts to own daycare children"
  on public.post_recipients for insert
  to authenticated
  with check (
    exists (
      select 1
      from public.posts p
      where p.id = post_recipients.post_id
        and p.author_id = (select auth.uid())
        and public.viewer_is_staff_same_daycare(p.daycare_id)
    )
    and exists (
      select 1
      from public.children c
      join public.rooms r on r.id = c.room_id
      where c.id = post_recipients.child_id
        and public.viewer_is_staff_same_daycare(r.daycare_id)
    )
  );

-- No DELETE policy (out of scope).

-- 6) Storage: private post-images bucket ---------------------------------------
-- Objects are keyed {post_id}/{uuid}.{ext}; policies parse the first path
-- segment. The regex guard keeps a non-uuid prefix from raising a cast error
-- instead of simply denying access.
insert into storage.buckets (id, name, public)
values ('post-images', 'post-images', false)
on conflict do nothing;

create policy "post-images: members read photos of visible posts"
  on storage.objects for select
  to authenticated
  using (
    bucket_id = 'post-images'
    and split_part(name, '/', 1) ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
    and public.can_read_post((split_part(name, '/', 1))::uuid)
  );

create policy "post-images: staff can upload to own posts"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'post-images'
    and split_part(name, '/', 1) ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
    and exists (
      select 1
      from public.posts p
      where p.id = (split_part(name, '/', 1))::uuid
        and p.author_id = (select auth.uid())
        and public.viewer_is_staff_same_daycare(p.daycare_id)
    )
  );

create policy "post-images: staff can update own post objects"
  on storage.objects for update
  to authenticated
  using (
    bucket_id = 'post-images'
    and split_part(name, '/', 1) ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
    and exists (
      select 1
      from public.posts p
      where p.id = (split_part(name, '/', 1))::uuid
        and p.author_id = (select auth.uid())
        and public.viewer_is_staff_same_daycare(p.daycare_id)
    )
  )
  with check (
    bucket_id = 'post-images'
    and split_part(name, '/', 1) ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
    and exists (
      select 1
      from public.posts p
      where p.id = (split_part(name, '/', 1))::uuid
        and p.author_id = (select auth.uid())
        and public.viewer_is_staff_same_daycare(p.daycare_id)
    )
  );

-- No DELETE policy (out of scope).

-- 7) Seed: the 3 mock feed posts (SPEC 01), author Caro Giménez, no photos ----
-- Fixed ids + ON CONFLICT keep it idempotent. created_at is staggered in the
-- same order as the mock (announcement oldest, achievement newest).
with new_posts as (
  insert into public.posts (id, daycare_id, author_id, type, description, whole_room, created_at)
  values
    ('00000000-0000-0000-0000-000000000301',
     '00000000-0000-0000-0000-000000000001',
     '00000000-0000-0000-0000-00000000000a',
     'announcement',
     'El viernes salimos al parque por la mañana. Recuerden mandar gorra y una botellita de agua.',
     true,
     now() - interval '5 hours'),
    ('00000000-0000-0000-0000-000000000302',
     '00000000-0000-0000-0000-000000000001',
     '00000000-0000-0000-0000-00000000000a',
     'activity',
     'Pintamos con témperas esta mañana. Mateo eligió el azul para todo y se concentró un montón mezclando colores.',
     false,
     now() - interval '3 hours'),
    ('00000000-0000-0000-0000-000000000303',
     '00000000-0000-0000-0000-000000000001',
     '00000000-0000-0000-0000-00000000000a',
     'achievement',
     '¡Usó el orinal solito por primera vez! Estaba feliz de contárselo a todos. Un gran paso.',
     false,
     now() - interval '90 minutes')
  on conflict (id) do nothing
  returning id, type
)
insert into public.post_recipients (post_id, child_id)
select np.id, c.id
from new_posts np
cross join (select id from public.children where full_name = 'Mateo Fernández') c
where np.type <> 'announcement'
on conflict (post_id, child_id) do nothing;
