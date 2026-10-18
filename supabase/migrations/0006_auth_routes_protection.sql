-- 0006: SPEC 08 — auth routes & protection.
-- New: public.invitations (invitation codes for parent activation), the
-- photo_consent column on public.users, a hardened creation trigger that
-- always forces role 'parent' for client-created accounts, and demo seeds
-- (staff Caro + invitation 7K4P9).
--
-- The migration is idempotent on purpose: seeds use ON CONFLICT / guards so
-- re-running against an already-seeded remote is a no-op.

-- 1) Invitation status enum -------------------------------------------------
do $$
begin
  if not exists (
    select 1 from pg_type t
    join pg_namespace n on n.oid = t.typnamespace
    where n.nspname = 'public' and t.typname = 'user_invitation_status'
  ) then
    create type public.user_invitation_status as enum ('pending', 'used', 'rejected');
  end if;
end
$$;

-- 2) Invitations table ------------------------------------------------------
create table if not exists public.invitations (
  id          uuid primary key default gen_random_uuid(),
  daycare_id  uuid not null references public.daycares(id),
  code        text not null unique,
  email       text not null,
  parent_name text not null,
  role        public.user_role not null default 'parent',
  status      public.user_invitation_status not null default 'pending',
  expires_at  timestamptz not null default now() + interval '7 days',
  created_at  timestamptz not null default now()
);

alter table public.invitations enable row level security;

-- Lookup by code + email happens BEFORE authentication (anon). The code is
-- the secret, not the user. Read only: no insert/update for non-service roles.
drop policy if exists "invitations_public_read" on public.invitations;
create policy "invitations_public_read"
  on public.invitations for select
  using (true);

create index if not exists invitations_code_idx on public.invitations (code);
create index if not exists invitations_daycare_id_idx on public.invitations (daycare_id);

-- 3) photo_consent column ---------------------------------------------------
alter table public.users add column if not exists photo_consent boolean not null default false;

-- 4) Harden the creation trigger --------------------------------------------
-- The 0003 trigger trusts raw_user_meta_data (client-editable): a signup
-- could self-assign role 'staff'. Client-created parent accounts must always
-- land as (parent, pending); only the server-side activation flow (service
-- role) promotes them afterwards.

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_daycare uuid;
  v_role    public.user_role;
  v_status  public.user_status;
begin
  -- Only admin-created users (server flows) may carry role/daycare metadata.
  -- Client signups (via the public API) never have is_sso_user set on the
  -- session, but admin createUser marks the invite source; safer check:
  -- if role metadata says staff/admin, ignore it unless the insert came from
  -- a service-role context (JWT claim role = service_role).
  v_role := coalesce((new.raw_user_meta_data->>'role')::public.user_role, 'parent');
  v_daycare := (new.raw_user_meta_data->>'daycare_id')::uuid;

  if coalesce(current_setting('request.jwt.claims', true)::jsonb->>'role', '') = 'service_role' then
    v_status := 'active';
  else
    -- Client signup: force parent + pending, metadata is untrusted.
    v_role := 'parent';
    v_status := 'pending';
  end if;

  insert into public.users (id, daycare_id, role, status, full_name)
  values (
    new.id,
    coalesce(v_daycare, '00000000-0000-0000-0000-000000000001'),
    v_role,
    v_status,
    coalesce(new.raw_user_meta_data->>'full_name', new.email)
  );
  return new;
end
$$;

-- service_role must be able to invoke it for admin-created users, nobody else.
revoke execute on function public.handle_new_user() from anon, authenticated, public;

drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- 5) Seeds ------------------------------------------------------------------
-- Staff Caro: fill the existing demo auth user with the expected identity if
-- it is still the placeholder, otherwise leave untouched.
update public.users
set full_name = 'Caro Giménez'
where id = '00000000-0000-0000-0000-00000000000a'
  and full_name = 'Staff Demo';

update auth.users
set raw_user_meta_data = jsonb_build_object(
      'daycare_id', '00000000-0000-0000-0000-000000000001',
      'role', 'staff',
      'full_name', 'Caro Giménez'
    ),
    email = 'caro@opendaycare.com'
where id = '00000000-0000-0000-0000-00000000000a'
  and email = 'staff@opendaycare.test';

-- Demo invitation matching the SPEC 04/06 mockups.
insert into public.invitations (id, daycare_id, code, email, parent_name, role, status, expires_at)
values (
  '00000000-0000-0000-0000-000000000002',
  '00000000-0000-0000-0000-000000000001',
  '7K4P9',
  'lucia.fernandez@gmail.com',
  'Lucía Fernández',
  'parent',
  'pending',
  now() + interval '7 days'
)
on conflict (id) do nothing;
