-- 0005: RLS policy performance fixes per performance advisors (lint 0003/0006).
-- Wrap auth.uid() in (select ...) so it is evaluated once per statement
-- (auth_rls_initplan) and merge the two permissive SELECT policies into one
-- (multiple_permissive_policies).

drop policy if exists "users_select_own" on public.users;
drop policy if exists "users_select_staff_same_daycare" on public.users;
drop policy if exists "users_update_own" on public.users;

create policy "users_select_own_or_staff_same_daycare"
  on public.users for select
  to authenticated
  using (
    id = (select auth.uid())
    or exists (
      select 1 from public.users u
      where u.id = (select auth.uid())
        and u.role = 'staff'
        and u.daycare_id = users.daycare_id
    )
  );

create policy "users_update_own"
  on public.users for update
  to authenticated
  using (id = (select auth.uid()))
  with check (id = (select auth.uid()));
