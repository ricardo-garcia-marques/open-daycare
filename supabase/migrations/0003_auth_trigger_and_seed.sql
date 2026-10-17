-- 0003: profile trigger on auth.users + demo staff seed.
-- The trigger creates a public.users row for every new auth user, reading
-- daycare_id / role / full_name from raw_user_meta_data.

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.users (id, daycare_id, role, full_name)
  values (
    new.id,
    (new.raw_user_meta_data->>'daycare_id')::uuid,
    coalesce((new.raw_user_meta_data->>'role')::public.user_role, 'parent'),
    coalesce(new.raw_user_meta_data->>'full_name', new.email)
  );
  return new;
end
$$;

drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Demo staff account (id/email fixed, deterministic seed; ON CONFLICT makes it idempotent).
insert into auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  raw_user_meta_data,
  created_at,
  updated_at,
  confirmation_token,
  recovery_token,
  email_change_token_new,
  email_change
)
values (
  '00000000-0000-0000-0000-000000000000',
  '00000000-0000-0000-0000-00000000000a',
  'authenticated',
  'authenticated',
  'staff@opendaycare.test',
  crypt('Staff1234!', gen_salt('bf')),
  now(),
  jsonb_build_object(
    'daycare_id', '00000000-0000-0000-0000-000000000001',
    'role', 'staff',
    'full_name', 'Staff Demo'
  ),
  now(),
  now(),
  '',
  '',
  '',
  ''
)
on conflict (id) do nothing;
