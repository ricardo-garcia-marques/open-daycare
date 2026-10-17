create table public.daycares (
  id         uuid primary key default gen_random_uuid(),
  name       text not null,
  created_at timestamptz not null default now()
);

alter table public.daycares enable row level security;

create policy "authenticated can read daycares"
  on public.daycares for select
  to authenticated
  using (true);

insert into public.daycares (id, name)
values ('00000000-0000-0000-0000-000000000001', 'Guardería Sala Soles')
on conflict (id) do nothing;
