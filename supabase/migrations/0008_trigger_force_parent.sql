-- 0008: SPEC 08 acceptance fix — the trigger must ALWAYS create the profile
-- row as (role 'parent', status 'pending'), ignoring client-supplied metadata.
-- The server-side activation flow (service role) promotes the row afterwards.
--
-- Why 0008: 0006 shipped a `request.jwt.claims` branch that can never fire —
-- GoTrue inserts into auth.users as supabase_auth_admin, without JWT claims,
-- for both client signups and admin.createUser. Future staff accounts get
-- seeded via migrations and must update public.users explicitly (see 0003/0006
-- seed pattern), never via signup metadata.

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.users (id, daycare_id, role, status, full_name)
  values (
    new.id,
    '00000000-0000-0000-0000-000000000001',
    'parent',
    'pending',
    coalesce(new.raw_user_meta_data->>'full_name', new.email)
  );
  return new;
end
$$;
