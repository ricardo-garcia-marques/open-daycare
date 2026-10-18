-- 0007: covering index for invitations.daycare_id per performance advisors.
create index if not exists invitations_daycare_id_idx on public.invitations (daycare_id);
