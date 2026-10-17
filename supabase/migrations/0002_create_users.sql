-- 0002: users table, role/status enums, daycare membership helper, RLS.
-- Closes the RLS debt from spec 08 (daycares policies now scoped by membership).

create type public.user_role as enum ('staff', 'parent', 'admin');
create type public.user_status as enum ('pending', 'active');

create table public.users (
  id                    uuid primary key references auth.users(id) on delete cascade,
  daycare_id            uuid not null references public.daycares(id),
  role                  public.user_role not null default 'parent',
  status                public.user_status not null default 'active',
  full_name             text not null,
  avatar_url            text,
  notify_on_post        boolean not null default true,
  daily_summary_enabled boolean not null default true,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now()
);

alter table public.users enable row level security;

create index users_daycare_id_idx on public.users (daycare_id);

-- SECURITY DEFINER helper: daycare id of the calling user (auth.uid()).
create or replace function public.user_daycare_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select daycare_id from public.users where id = auth.uid()
$$;

-- users RLS
create policy "users_select_own"
  on public.users for select
  to authenticated
  using (id = auth.uid());

create policy "users_select_staff_same_daycare"
  on public.users for select
  to authenticated
  using (
    exists (
      select 1 from public.users u
      where u.id = auth.uid()
        and u.role = 'staff'
        and u.daycare_id = users.daycare_id
    )
  );

create policy "users_update_own"
  on public.users for update
  to authenticated
  using (id = auth.uid())
  with check (id = auth.uid());

-- daycares RLS: replace blanket "authenticated can read daycares" (USING (true))
drop policy if exists "authenticated can read daycares" on public.daycares;

create policy "member can read own daycare"
  on public.daycares for select
  to authenticated
  using (id = public.user_daycare_id());
