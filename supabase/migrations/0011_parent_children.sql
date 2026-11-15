-- 0011: spec 11 (step 1) — parent_children linking table, closing the SPEC 10
-- debt ("kids are born orphan"). Parents see only their own links; staff of the
-- child's daycare can read/insert/delete links. Seed links the demo parent
-- Lucía Fernández (lucia.fernandez@gmail.com) to Mateo Fernández and
-- Sofía Méndez; idempotent and a silent no-op if the parent is missing.

create table public.parent_children (
  parent_user_id uuid not null references public.users(id) on delete cascade,
  child_id       uuid not null references public.children(id) on delete cascade,
  created_at     timestamptz not null default now(),
  primary key (parent_user_id, child_id)
);

-- children has no direct daycare_id: it is reached through rooms (same as 0010).
create index parent_children_child_id_idx on public.parent_children (child_id);

alter table public.parent_children enable row level security;

-- Single permissive SELECT policy (merged to avoid multiple_permissive_policies).
create policy "parents read own links, staff read links of own daycare children"
  on public.parent_children for select
  to authenticated
  using (
    (select auth.uid()) = parent_user_id
    or exists (
      select 1
      from public.children c
      join public.rooms r
        on r.id = c.room_id
      where c.id = parent_children.child_id
        and r.daycare_id = public.user_daycare_id()
        and public.viewer_is_staff_same_daycare(r.daycare_id)
    )
  );

-- Staff governs which parent-child links exist for children of their daycare.
create policy "staff can insert links of own daycare children"
  on public.parent_children for insert
  to authenticated
  with check (
    exists (
      select 1
      from public.children c
      join public.rooms r
        on r.id = c.room_id
      where c.id = parent_children.child_id
        and r.daycare_id = public.user_daycare_id()
        and public.viewer_is_staff_same_daycare(r.daycare_id)
    )
  );

create policy "staff can delete links of own daycare children"
  on public.parent_children for delete
  to authenticated
  using (
    exists (
      select 1
      from public.children c
      join public.rooms r
        on r.id = c.room_id
      where c.id = parent_children.child_id
        and r.daycare_id = public.user_daycare_id()
        and public.viewer_is_staff_same_daycare(r.daycare_id)
    )
  );

-- Seed: Lucía Fernández (auth user by email) linked to Mateo Fernández and
-- Sofía Méndez (children by full_name). Cross join silently inserts nothing
-- if either side is missing; ON CONFLICT keeps it idempotent.
with parent as (
  select pu.id
  from auth.users au
  join public.users pu on pu.id = au.id
  where au.email = 'lucia.fernandez@gmail.com'
),
kids as (
  select c.id
  from public.children c
  where c.full_name in ('Mateo Fernández', 'Sofía Méndez')
)
insert into public.parent_children (parent_user_id, child_id)
select p.id, k.id
from parent p
cross join kids k
on conflict (parent_user_id, child_id) do nothing;
