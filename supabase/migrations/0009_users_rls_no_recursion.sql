-- 0009: SPEC 09 fix — remove infinite RLS recursion on public.users.
-- The policy "users_select_own_or_staff_same_daycare" (0005) queried
-- public.users inside its own USING clause, which fails at runtime with
-- SQLSTATE 42P17 ("infinite recursion detected in policy for relation
-- users") whenever PostgREST runs a SELECT as an authenticated user.
--
-- Fix: move the "is the viewer staff of the target's daycare?" check into a
-- SECURITY DEFINER helper function so the policy no longer references the
-- table it protects.

create or replace function public.viewer_is_staff_same_daycare(target_daycare_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.users u
    where u.id = (select auth.uid())
      and u.role = 'staff'
      and u.daycare_id = target_daycare_id
  );
$$;

revoke execute on function public.viewer_is_staff_same_daycare(uuid)
  from anon, authenticated, public;
grant execute on function public.viewer_is_staff_same_daycare(uuid)
  to authenticated;

drop policy if exists "users_select_own_or_staff_same_daycare" on public.users;

create policy "users_select_own_or_staff_same_daycare"
  on public.users for select
  to authenticated
  using (
    id = (select auth.uid())
    or public.viewer_is_staff_same_daycare(users.daycare_id)
  );
