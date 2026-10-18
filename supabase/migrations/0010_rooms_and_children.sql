-- 0010: specs 10 — rooms and children tables, per-daycare RLS, seeds.
-- Reference: 07-DB-Schema/opendaycare-database-schema.md (tables 3 and 4).
-- Kids are orphan by default (parent_children linking lands on a future spec).
-- allergy_tags are stored as typed by the user (Spanish), an explicit
-- exception to the English-in-DB convention documented in SPEC 10.

create type public.child_status as enum ('active', 'archived');

create table public.rooms (
  id uuid primary key default gen_random_uuid(),
  daycare_id uuid not null references public.daycares(id),
  name text not null,
  created_at timestamptz not null default now()
);

create table public.children (
  id uuid primary key default gen_random_uuid(),
  room_id uuid references public.rooms(id),
  full_name text not null,
  birth_date date not null,
  enrolled_at date not null default current_date,
  medical_notes text not null default '',
  allergy_tags text[] not null default '{}',
  photo_consent boolean not null default true,
  status public.child_status not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index rooms_daycare_id_idx on public.rooms (daycare_id);
create index children_room_id_idx on public.children (room_id);

alter table public.rooms enable row level security;
alter table public.children enable row level security;

create policy "member can read rooms"
  on public.rooms for select
  to authenticated
  using (daycare_id = public.user_daycare_id());

create policy "staff can insert rooms"
  on public.rooms for insert
  to authenticated
  with check (public.viewer_is_staff_same_daycare(daycare_id));

create policy "staff can update rooms"
  on public.rooms for update
  to authenticated
  using (public.viewer_is_staff_same_daycare(daycare_id))
  with check (public.viewer_is_staff_same_daycare(daycare_id));

create policy "staff can delete rooms"
  on public.rooms for delete
  to authenticated
  using (public.viewer_is_staff_same_daycare(daycare_id));

-- children has no direct daycare_id: it is reached through rooms.
create policy "member can read children of own daycare"
  on public.children for select
  to authenticated
  using (
    exists (
      select 1
      from public.rooms r
      where r.id = children.room_id
        and r.daycare_id = public.user_daycare_id()
    )
  );

create policy "staff can insert children of own daycare"
  on public.children for insert
  to authenticated
  with check (
    exists (
      select 1
      from public.rooms r
      where r.id = children.room_id
        and r.daycare_id = public.user_daycare_id()
        and public.viewer_is_staff_same_daycare(r.daycare_id)
    )
  );

create policy "staff can update children of own daycare"
  on public.children for update
  to authenticated
  using (
    exists (
      select 1
      from public.rooms r
      where r.id = children.room_id
        and r.daycare_id = public.user_daycare_id()
        and public.viewer_is_staff_same_daycare(r.daycare_id)
    )
  )
  with check (
    exists (
      select 1
      from public.rooms r
      where r.id = children.room_id
        and r.daycare_id = public.user_daycare_id()
        and public.viewer_is_staff_same_daycare(r.daycare_id)
    )
  );

-- Seeds: daycare already exists (0001, fixed id …0001). Rooms next, then the
-- 8 mock children bound to the "Soles" room. Idempotent via lookups in CTEs.
with soles_room as (
  insert into public.rooms (id, daycare_id, name)
  values ('00000000-0000-0000-0000-000000000101', '00000000-0000-0000-0000-000000000001', 'Soles'),
         ('00000000-0000-0000-0000-000000000102', '00000000-0000-0000-0000-000000000001', 'Estrellas'),
         ('00000000-0000-0000-0000-000000000103', '00000000-0000-0000-0000-000000000001', 'Luna')
  on conflict (id) do nothing
  returning id, name
)
insert into public.children (room_id, full_name, birth_date, enrolled_at, medical_notes, allergy_tags)
select r.id, c.full_name, c.birth_date, c.enrolled_at, c.medical_notes, c.allergies
from (values
  ('Soles', 'Mateo Fernández',  date '2022-03-12', date '2025-02-01', 'Alergia al maní. Evitar frutos secos. Lleva inhalador en la mochila.', array['maní']),
  ('Soles', 'Sofía Méndez',     date '2023-09-03', date '2024-08-01', '', array[]::text[]),
  ('Soles', 'Benjamín Ruiz',    date '2022-05-25', date '2024-03-01', '', array[]::text[]),
  ('Soles', 'Valentina Soto',   date '2023-12-08', date '2025-01-01', '', array[]::text[]),
  ('Soles', 'Tomás Díaz',       date '2022-07-19', date '2024-06-01', 'Intolerancia a la lactosa. Tomar leche vegetal del armario azul.', array['lactosa']),
  ('Soles', 'Emma Castro',      date '2023-04-30', date '2024-09-01', '', array[]::text[]),
  ('Soles', 'Lucas Romero',     date '2022-02-02', date '2023-08-01', '', array[]::text[]),
  ('Soles', 'Olivia Vega',      date '2023-11-14', date '2024-10-01', '', array[]::text[])
) as c(room_name, full_name, birth_date, enrolled_at, medical_notes, allergies)
join soles_room r on r.name = c.room_name
where not exists (
  select 1 from public.children existing where existing.full_name = c.full_name
);
