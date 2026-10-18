# SPEC 08 — Tabla `daycares` y patrón de migraciones

> **Estado:** Implementado
> **Depende de:** — (primer spec de backend; los specs 01–07 son UI con localStorage)
> **Fecha:** 2026-10-17
> **Objetivo:** Crear la primera tabla del esquema (`daycares`, según el diccionario en `../07-DB-Schema/opendaycare-database-schema.md`) en Supabase aplicando el patrón de migraciones versionadas, con RLS habilitado, política básica y seed de guardería demo.

## Alcance

**In:**

- Inicializar `supabase/` en el repo (estilo migraciones): `supabase/config.toml` mínimo + `supabase/migrations/0001_create_daycares.sql`. Sin proyecto linkeado (`db push` con `--db-url` explícito).
- Migración `0001` con:
  - `create table public.daycares (id uuid primary key default gen_random_uuid(), name text not null, created_at timestamptz not null default now())`.
  - `alter table public.daycares enable row level security`.
  - Política: `TO authenticated USING (true)` — autenticación sin filtro por fila (deuda conocida, se cierra con la tabla `users` en un spec futuro).
  - Seed: insert con `ON CONFLICT DO NOTHING` de "Guardería Sala Soles" con id fijo determinístico `00000000-0000-0000-0000-000000000001`.
- Aplicación al proyecto remoto `hfuojrjqvzvpvtiarzfg` vía `npx supabase db push --db-url <pooler aws-0-eu-west-1:6543>` con la contraseña de `SUPABASE_DB_PASSWORD` (`.env`), que registra el historial en `supabase_migrations`.
- Verificación: tabla + fila seed visibles, advisors de seguridad y performance sin errores nuevos (RLS cubierto).

**Fuera de alcance (specs futuros):**

- Tablas `users`, `rooms`, `children` y el resto del diccionario (una tabla por spec, empezando por la raíz).
- Políticas RLS con filtro real por `daycare_id` (requiere `users`).
- Trigger de creación de perfil en `auth.users`.
- Cliente de Supabase en la app (`@supabase/ssr`); la UI sigue en localStorage.
- Login CLI / access token (no hace falta: pooler + password).

## Modelo de datos

```sql
-- supabase/migrations/0001_create_daycares.sql
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
```

Referencia de dominio: diccionario externo `07-DB-Schema/opendaycare-database-schema.md`, tabla 1 (no se copia al repo, decisión del usuario).

## Plan de implementación

1. Crear `supabase/config.toml` (project_id local, mínimo) y `supabase/migrations/0001_create_daycares.sql` con el DDL, la política y el seed. Manual: revisión del SQL.
2. Verificar conectividad: `npx supabase db query --db-url <pooler> "select 1"` con la password de `.env` (URL del pooler `aws-0-eu-west-1.pooler.supabase.com:6543`, usuario `postgres.<ref>`; los statement multi-comando deben ir separados).
3. Aplicar: `npx supabase db push --db-url <pooler>` y confirmar con `supabase migration list --db-url <pooler>` (o `select * from supabase_migrations.schema_migrations`) que `0001` quedó registrada.
4. Verificar resultado: `supabase_list_tables` muestra `public.daycares` con RLS habilitado; `select name from public.daycares` retorna "Guardería Sala Soles"; `supabase_get_advisors` (security + performance) sin hallazgos atribuibles a esta migración.

## Criterios de aceptación

- [x] Existe `supabase/migrations/0001_create_daycares.sql` versionado en el repo con DDL + política RLS + seed.
- [x] `public.daycares` existe en el proyecto remoto con `id` uuid PK default `gen_random_uuid()`, `name` text not null y `created_at` timestamptz.
- [x] RLS habilitado en `daycares` y política `TO authenticated USING (true)` presente.
- [x] Existe la fila "Guardería Sala Soles" con el id fijo `…0001`.
- [x] La migración figura en el historial de migraciones remoto (`supabase_migrations`) — `supabase migration list` muestra `0001` local y remoto.
- [x] `npx supabase db push` es idempotente — segunda corrida: "Remote database is up to date".
- [x] Advisors de security y performance sin hallazgos nuevos por esta migración — performance: 0 hallazgos; security: 2 WARN por `public.rls_auto_enable()`, función `SECURITY DEFINER` built-in de la plataforma Supabase (event trigger `ensure_rls`, con ACCESO revocable aparte), no creada por esta migración.

## Decisiones

- **Sí:** tabla + RLS + política básica + seed en este spec. Deja la tabla verificable de punta a punta sin agrandar el paso.
- **No:** política con filtro por `daycare_id` — requiere `users`; se registró la deuda BOLA de `USING (true)` y se resolverá al crear `users`.
- **Sí:** `db push` vía pooler con password de `.env` (evita login/token; IPv4 requerido porque la conexión directa solo expone IPv6).
- **Sí:** carpeta `supabase/` completa con `config.toml`, no solo el archivo SQL — patrón reproducible para las migraciones 0002+.
- **Sí:** seed en la misma migración con id fijo + `ON CONFLICT DO NOTHING` — determinístico e idempotente (seed.sql local no aplica en remoto).
- **No:** copiar el diccionario de esquema a `docs/` — el usuario prefiere la referencia externa `07-DB-Schema/`.
- **No:** integrar el cliente de la app con Supabase — fuera de alcance.

## Riesgos

- `db push` con `--db-url` podría no registrar historial si la CLI lo exige vía Management API — se valida en el paso 3; fallback: registrar con `supabase migration up --db-url` o documento manual.
- La contraseña en `.env` no debe imprimirse en logs ni artefactos.
- Política `USING (true)` expone todas las guarderías a cualquier usuario autenticado — deuda aceptada explícitamente en Decisiones.
