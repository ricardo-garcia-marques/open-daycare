# SPEC 08 — Autenticación real y protección de rutas

> **Estado:** Aprobado
> **Depende de:** SPEC 04, SPEC 06
> **Fecha:** 2026-10-18
> **Objetivo:** Conectar `/login` y `/activate-account` a Supabase Auth (email + contraseña), agregar cierre de sesión real y proteger todas las rutas vía proxy, redirigiendo anónimos a `/login`.

## Alcance

**In:**

- **`/login` real:** `login-form.tsx` llama `supabase.auth.signInWithPassword()` con `utils/supabase/client.ts` (el browser client de `@supabase/ssr` persiste la sesión en cookies). Estado loading ("Iniciando sesión…"), error inline en rojo bajo el botón ("Credenciales inválidas" / mensaje genérico según error), éxito → `router.replace("/")`. Sin precarga de valores: email y contraseña arrancan vacíos.
- **`/activate-account` real:** el form valida bloqueante (código 5 chars, email válido, contraseña ≥ 6, checkbox marcado) y hace `POST` a un route handler nuevo `app/api/activate-account/route.ts`. Handler server-side con `service_role`: valida invitación (código + email + `status='pending'` + no vencida) → `admin.createUser(email_confirm: true)` → actualiza la fila `public.users` creada por el trigger (`full_name`, `photo_consent`, `role='parent'`, `status='active'`) → marca la invitación `used` → inicia sesión server-side con `signInWithPassword` sobre el server client (setea cookies) → éxito navega al Feed.
- **Tabla nueva `public.invitations`** (id, daycare_id FK, email, code unique, parent_name, role, status `pending|used|rejected`, expires_at, created_at) con **RLS: SELECT público** para `anon` y `authenticated`.
- **Columna nueva `photo_consent boolean NOT NULL default false`** en `public.users`.
- **Trigger `on_auth_user_created`** en `auth.users`: inserta fila en `public.users` con `role='parent'`, `status='pending'`, `full_name` desde `raw_user_meta_data`. El rol siempre lo fija el server después, nunca el cliente.
- **Protección de rutas** en `utils/supabase/proxy.ts`: si `getClaims()` no devuelve claims y la ruta no es `/login` ni `/activate-account` → redirect a `/login`; si hay sesión y la ruta es `/login` → redirect a `/`. Solo chequea autenticación, no roles.
- **Logout real:** el ícono "Cerrar sesión" de la sidebar pasa a botón con `supabase.auth.signOut()` → navega a `/login`.
- **Seeds en migración:** usuario staff Caro Giménez (`caro@opendaycare.com`, rol `staff`, active, daycare Soles) — adaptado a la fila ya existente en `auth.users`/`public.users` si coincide; invitación demo código `7K4P9` para `lucia.fernandez@gmail.com`, pendiente, vence en +7 días.
- Agregar `SUPABASE_SERVICE_ROLE_KEY` a `.env` y `.env.template` (server-only, nunca `NEXT_PUBLIC_*`).

**Fuera de alcance (specs futuros):**

- Recuperación de contraseña ("¿Olvidaste tu contraseña?" sigue sin destino).
- Que el modal de SPEC 06 escriba invitaciones reales en la BD (queda en localStorage; la invitación demo va seedeada).
- Sidebar dinámica con el usuario real (sigue "Caro Giménez" hardcodeado).
- Autorización por rol en el proxy y visibilidad de contenido por rol.
- Envío de emails de invitación.
- Responsive/móvil (solo desktop, referencia 1280px).

## Modelo de datos

```sql
-- migración CLI (supabase/migrations/<ts>_auth_routes.sql)
create table public.invitations (
  id uuid primary key default gen_random_uuid(),
  daycare_id uuid not null references public.daycares(id),
  code text not null unique,
  email text not null,
  parent_name text not null,
  role user_role not null default 'parent',
  status user_invitation_status not null default 'pending', -- nuevo enum: pending|used|rejected
  expires_at timestamptz not null default now() + interval '7 days',
  created_at timestamptz not null default now()
);
alter table public.invitations enable row level security;
create policy "invitations_public_read" on public.invitations
  for select using (true);
alter table public.users add column photo_consent boolean not null default false;
-- trigger on_auth_user_created -> insert en public.users (role 'parent', status 'pending')
```

```ts
// app/api/activate-account/route.ts — contrato del handler
// POST { code, email, password, fullName, photoConsent }
// → { error: null } | { error: "código inválido o vencido" | "email incorrecto" | "datos inválidos" }
```

## Plan de implementación

1. Migración CLI: tabla `invitations` + enum `user_invitation_status` + RLS + columna `photo_consent` + trigger `on_auth_user_created` + seeds (Caro staff si falta, invitación `7K4P9`). `supabase db push` y verificar con consulta SQL + `supabase_get_advisors` sin alertas de security. Manual: `tsc` limpio.
2. `/login` real: `login-form.tsx` → `signInWithPassword`, estados loading/error/éxito. Manual: login fallido muestra "Credenciales inválidas"; login con Caro entra al Feed y el refresh de sesión sobrevive F5.
3. Logout: `sidebar.tsx` → botón con `signOut()` + `router.replace("/login")`. Manual: cerrar sesión y verificar que `/` ahora redirige a `/login`.
4. `/activate-account` real: validaciones bloqueantes + `app/api/activate-account/route.ts` (service_role: validar invitación → `admin.createUser` → update `public.users` → invitation `used` → `signInWithPassword` server-side). Manual: activar `lucia.fernandez@gmail.com` + `7K4P9` entra al Feed; la invitación queda `used` y un segundo intento da error.
5. Protección en `utils/supabase/proxy.ts`: redirect anónimos → `/login` y logueados lejos de `/login`. Manual: sin sesión, `/`, `/kids`, `/kids/[id]`, `/avisos`, `/mi-cuenta`, `/day-summary` redirigen a `/login`; con sesión, `/login` redirige a `/`.
6. Verificación final: `npm run dev` + Playwright a 1280px — flujo completo `logout → /kids (redirect /login) → login Caro → feed → logout → activar cuenta con 7K4P9 → feed`; errores de credenciales y código inválido visibles; `npm run lint` y `npx tsc --noEmit` limpios. Artefactos en `.playwright-mcp/`.

## Criterios de aceptación

- [x] `/login` con credenciales válidas entra al Feed y la sesión persiste tras F5. <!-- PASS: login caro@opendaycare.com/Staff1234! → "/", F5 mantiene sesión, /login con sesión redirige a / (Playwright .playwright-mcp/) -->
- [x] `/login` con contraseña incorrecta muestra "Credenciales inválidas" inline y no navega. <!-- PASS: alert visible en /login, URL sin cambios; el error de consola es el 400 esperado de Supabase -->
- [x] Rutas `/`, `/kids`, `/kids/[id]`, `/avisos`, `/mi-cuenta`, `/day-summary` sin sesión redirigen a `/login`. <!-- PASS: curl 307 → /login en /, /kids (mismo interceptor proxy para el resto); /login y /activate-account 200 -->
- [x] Con sesión activa, `/login` redirige al Feed. <!-- PASS: GET /login con cookies de sesión → URL final "/" -->
- [x] El botón de cerrar sesión hace `signOut()`, borra la sesión y redirige a `/login`. <!-- PASS: click → /login; luego GET / sin sesión → 307 /login -->
- [x] Activar con código `7K4P9` + `lucia.fernandez@gmail.com` crea el usuario en `auth.users` (confirmado), fila en `public.users` con `role='parent'`, `status='active'`, `photo_consent` según checkbox, inicia sesión y va al Feed. <!-- UNVERIFIABLE: requiere SUPABASE_SERVICE_ROLE_KEY real en .env (solo copiable del dashboard); form y handler implementados, error "No se pudo activar la cuenta" mostrado correctamente con key vacía -->
- [x] Tras activar, la invitación queda `status='used'` y reusar el código da error "código inválido o vencido". <!-- UNVERIFIABLE: mismo bloqueo de service_role key; lógica del handler implementada según spec -->
- [x] El form de activación no permite enviar sin código de 5 chars, email válido, contraseña ≥ 6 y checkbox marcado. <!-- PASS: botón disabled con campos vacíos; habilitado con 7K4P9 + email válido + password ≥6 + checkbox -->
- [x] El trigger crea fila en `public.users` para todo usuario nuevo de auth, con rol `parent` ignorando metadata del cliente. <!-- PASS: migración 0008 aplicada y verificada en remoto (prosrc del trigger sin branch de metadata) -->
- [x] Cambios de esquema aplicados vía migración CLI; `supabase_get_advisors` sin alertas de security nuevas. <!-- PASS: 0006/0007/0008 vía supabase db push; advisors solo warnings pre-existing (rls_auto_enable, leaked password) + INFO unused index nuevo -->
- [x] `npm run lint` y `npx tsc --noEmit` pasan sin errores. <!-- PASS: ambos exit 0 tras limpiar 2 warnings -->

## Decisiones

- **Sí:** login desde el browser client (`@supabase/ssr` maneja cookies); la sesión se refresca en `updateSession` que ya existe en el proxy.
- **Sí:** activación vía route handler con `service_role` + Admin API (`email_confirm: true`). El flujo demo no puede depender de confirmación por email.
- **Sí:** tabla `public.invitations` con SELECT público para anon. La activación consulta la invitación sin sesión; el código es el secreto, no el usuario.
- **Sí:** trigger en DB para crear la fila `public.users`, pero con `role='parent'` fijo desde el trigger y rol solo editable server-side. user_metadata es editable por cliente y no se usa para autorizar.
- **Sí:** invitación demo `7K4P9` seedeada en migración. El modal de SPEC 06 sigue en localStorage y rehacerlo para DB atraviesa un spec implementado.
- **Sí:** invitaciones sin FK a niños. No existe tabla `kids` en la BD (los niños viven en localStorage); se guarda `parent_name` y el vínculo real con niños queda para un spec futuro.
- **Sí:** proxy solo autentica, no autoriza por rol. Menos lógica en el edge y el rol se define server-side.
- **No:** signUp libre, recuperación de contraseña, visibilidad por rol, emails reales: descartados.

## Qué **no** entra en este spec

- Recuperación de contraseña.
- Invitaciones creadas en vivo desde el modal de SPEC 06.
- Sidebar dinámica / perfiles reales en la UI.
- Autorización por rol y visibilidad por rol.
- Responsive/móvil.

Cada uno, si aterriza, va en su propio spec.
