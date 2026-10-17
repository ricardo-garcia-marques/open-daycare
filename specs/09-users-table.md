# SPEC 09 — Tabla `users`, enums y perfil vía trigger

> **Estado:** Implementado
> **Depende de:** SPEC 08 (tabla `daycares` + patrón de migraciones)
> **Fecha:** 2026-10-17
> **Objetivo:** Crear la tabla `users` con sus enums `user_role`/`user_status`, cerrar la deuda RLS del spec 08 (pertenencia por `daycare_id` en `daycares` y `users`), añadir el trigger de perfil desde `auth.users` y sembrar un usuario staff de prueba — todo en migraciones `0002`/`0003` aplicadas al remoto.

## Alcance

**In:**

- `supabase/migrations/0002_create_users.sql`:
  - Enums `user_role` (`staff`/`parent`/`admin`) y `user_status` (`pending`/`active`).
  - Tabla `public.users` según el diccionario (tabla 2): `id uuid PK FK→auth.users(id) ON DELETE CASCADE`, `daycare_id uuid FK→daycares not null`, `role user_role not null default 'parent'`, `status user_status not null default 'active'`, `full_name text not null`, `avatar_url text`, `notify_on_post boolean default true`, `daily_summary_enabled boolean default true`, timestamps.
  - Función helper `public.user_daycare_id()` (SECURITY DEFINER, `set search_path = public`) que consulta la fila de `users` del `auth.uid()` llamante.
  - RLS en `users` con políticas: SELECT/UPDATE de la propia fila; SELECT del staff sobre usuarios de su daycare; sin INSERT/DELETE públicos (lo gestiona el trigger).
  - Cierre de deuda del spec 08: reemplazar la política `USING (true)` de `daycares` por `id = public.user_daycare_id()` (SELECT); UPDATE/INSERT solo para admin del daycare.
- `supabase/migrations/0003_auth_trigger_and_seed.sql`:
  - Trigger `AFTER INSERT ON auth.users` → función `SECURITY DEFINER` que inserta en `public.users` leyendo `daycare_id`, `role`, `full_name` de `raw_user_meta_data` (fallback `status='active'`).
  - Seed del staff: INSERT en `auth.users` (id fijo `00000000-0000-0000-0000-00000000000a`, `email_confirmed_at = now()`, password con `crypt(..., gen_salt('bf'))`, email `staff@opendaycare.test`, password `Staff1234!`) que dispara el trigger y crea el perfil con `role='staff'`, `daycare_id` = id fijo de la guardería seed (`…0001`).
- Aplicación al remoto vía `npx supabase db push --db-url <pooler>` (patrón del spec 08) y verificación con `supabase_list_tables`, consultas SQL y `supabase_get_advisors` (security + performance).

**Fuera de alcance:**

- Signup desde la app (Edge Function / endpoint / UI) — solo existe el trigger.
- Tablas `rooms`, `children`, `invitations`, etc. (una por spec).
- Enum `relationship_type` — entra con `parent_children`/`invitations`.
- Cliente Supabase en la app (`@supabase/ssr`) — la UI sigue en localStorage.
- Flujo real de `status='pending'` (se usa default `active`; el estado pre-signup queda modelado en `invitations` a futuro).

## Modelo de datos

```sql
-- 0002
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

create or replace function public.user_daycare_id()
returns uuid language sql stable security definer set search_path = public as $$
  select daycare_id from public.users where id = auth.uid()
$$;
```

Políticas: `users_select_own`, `users_select_staff_same_daycare` (`exists (select 1 from users u where u.id = auth.uid() and u.role = 'staff')` y mismo `daycare_id`), `users_update_own`. En `daycares`: drop de `"authenticated can read daycares"` y `create policy "member can read own daycare" using (id = public.user_daycare_id())`.

```sql
-- 0003 (resumen)
create function public.handle_new_user() ... security definer
  insert into public.users (id, daycare_id, role, full_name)
  values (new.id,
          (new.raw_user_meta_data->>'daycare_id')::uuid,
          coalesce((new.raw_user_meta_data->>'role')::public.user_role, 'parent'),
          coalesce(new.raw_user_meta_data->>'full_name', new.email));
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

insert into auth.users (id, email, encrypted_password, email_confirmed_at, raw_user_meta_data, ...)
values ('00000000-0000-0000-0000-00000000000a', 'staff@opendaycare.test',
        crypt('Staff1234!', gen_salt('bf')), now(),
        jsonb_build_object('daycare_id','00000000-0000-0000-0000-000000000001',
                           'role','staff','full_name','Staff Demo'));
```

## Plan de implementación

1. Verificar con `supabase_execute_sql` que el rol de la conexión puede `insert into auth.users` (INSERT de prueba en transacción con rollback) — si falla, replantear seed (decisión registrada).
2. Crear y aplicar `0002` (`db push --db-url`); verificar enums, tabla, columnas, RLS y políticas; confirmar que `daycares` ya no tiene `USING (true)`.
3. Crear y aplicar `0003`; verificar trigger (insert de prueba + rollback) y fila de perfil del staff.
4. Verificación final: `supabase_list_tables` (users con RLS), advisors sin hallazgos nuevos, y comprobación del perfil del staff (`select role, daycare_id from public.users where id = '…000a'`).

## Criterios de aceptación

- [x] `public.user_role` y `public.user_status` existen con los valores del diccionario.
- [x] `public.users` existe con todas las columnas del diccionario, FK a `auth.users(id)` on delete cascade y FK a `daycares`.
- [x] RLS habilitado en `users` con políticas: propia fila (select/update), staff lee usuarios de su daycare, sin política pública de insert/delete. (Nota: las dos políticas SELECT se fusionaron en `users_select_own_or_staff_same_daycare` en `0005` tras el hallazgo `multiple_permissive_policies`.)
- [x] `daycares` ya no tiene la política `USING (true)`; su select filtra por `user_daycare_id()`.
- [x] El helper `public.user_daycare_id()` existe, es `security definer`, `stable` y con `search_path` fijado. (`0004` revocó EXECUTE a `anon`/`public` tras el hallazgo del advisor.)
- [x] Trigger `on_auth_user_created` existe y un insert de prueba en `auth.users` crea la fila de perfil correspondiente (verificado con transacción abortada a propósito; 0 filas restantes).
- [x] Existe el usuario staff `staff@opendaycare.test` (id `…000a`) con perfil `role='staff'`, `daycare_id = …0001`, `status='active'`, y su password autentica (login GoReal verificado vía `/auth/v1/token`).
- [x] Migraciones `0002` y `0003` registradas en el historial remoto; `db push` idempotente ("Remote database is up to date").
- [x] Advisors security/performance sin hallazgos nuevos atribuibles a estas migraciones (hardening en `0004`, perf de políticas en `0005`; quedan solo hallazgos preexistentes: `rls_auto_enable`, leaked-password protection, y el INFO `unused_index` esperado).

## Decisiones

- **Sí:** enums solo de `users` (`user_role`, `user_status`); `relationship_type` se pospone a su tabla consumidora.
- **Sí:** trigger de perfil en este spec — sin él el signup no puede crear perfiles y el seed staff no funciona.
- **Sí:** cerrar la deuda RLS de `daycares` ahora que existe `users` (el spec 08 la dejó explícita).
- **Sí:** pertenencia por query a `users` vía función `SECURITY DEFINER` — sin custom claims JWT (movería el problema al auth hook).
- **Sí:** seed staff en migración SQL con id/email fijo e idempotencia por `ON CONFLICT DO NOTHING` — determinístico y versionado.
- **Sí:** todo en un único spec (`0002` + `0003`), no dividido — verificable end-to-end sin agrandar demasiado cada paso.
- **No:** INSERT/DELETE públicos en `users` — la creación la maneja el trigger y el borrado es cascade de `auth.users`.
- **No:** signup desde la app ni cliente `@supabase/ssr` — specs futuros.
- **Riesgo conocido:** si el rol de migración no puede escribir en `auth.users`, fallback: crear el staff una vez fuera de la migración y dejar la 0003 solo con el trigger (se registraría como decisión).

## Riesgos

- Permisos sobre `auth.users` desde migración (se valida en el paso 1 con rollback antes de versionar la 0003).
- Duplicado de trigger si Supabase ya define otro hook en `auth.users` — comprobar `pg_trigger` antes de crear.
- Las funciones `SECURITY DEFINER` deben fijar `search_path` (hallazgo típico de advisors) — se incluye desde el diseño.
- La contraseña del staff en la migración queda versionada en el repo (cuenta demo, bajo riesgo; alternativa `.env` documentada).
