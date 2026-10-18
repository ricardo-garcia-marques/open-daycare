# SPEC 09 — Usuario logueado en la UI

> **Estado:** Implementado
> **Depende de:** SPEC 01, SPEC 07, SPEC 08
> **Fecha:** 2026-10-18
> **Objetivo:** Mostrar los datos del usuario autenticado (nombre e inicial de avatar) en la sidebar, el saludo del feed, la card compositora y los posts nuevos, reemplazando los valores hardcodeados de "Caro Giménez".

## Alcance

**In:**

- **Store de usuario nuevo `lib/user-store.tsx`** (patrón kids-store/posts-store): provider client `UserProvider` montado en `app/layout.tsx`. Al montar, con `utils/supabase/client.ts`: `supabase.auth.getUser()` → si hay usuario, consulta `public.users` (`full_name`, `role`) con `.eq('id', user.id).single()` (RLS `users_select_own` ya lo permite). Expone `useCurrentUser()` con:
  ```ts
  { status: "loading" } | { status: "anonymous" } | { status: "ready"; userId: string; fullName: string; initial: string; role: "staff" | "parent" | "admin" }
  ```
  `initial` = primera letra de `full_name` (trim + mayúscula). Si no hay sesión o falla la consulta → `anonymous` (la UI hardcodeada se reemplaza por fallbacks genéricos, ver abajo).

- **Sidebar** (`app/(components)/sidebar.tsx`): bloque inferior consume `useCurrentUser()` — avatar = `initial`, nombre = `fullName`, subtítulo según rol: `staff → "Maestra · Soles"`, `parent → "Familia · Soles"`, `admin → "Administración · Soles"`. Estados `loading`/`anonymous`: avatar "?" y nombre "—" (transitorio; el proxy garantiza sesión, solo se ve un instante).

- **Saludo del feed** (`app/page.tsx`): el encabezado pasa a un client component nuevo `app/(components)/feed-greeting.tsx` que muestra `Buenas, {primerNombre}` con `useCurrentUser()`. Loading: "Buenas…". El subtítulo "12 niños · martes 17 jun" queda intacto.

- **Card compositora** (`app/(components)/composer-trigger.tsx`): avatar = `initial` del usuario real (pasa a client component para leer el store).

- **Autor de posts nuevos** (`app/(components)/create-post-provider.tsx`): `authorInitial` = `initial` real, `authorName` = `fullName` real. Colores de avatar sin cambio (`#F2937A`/blanco). Sin sesión no obstante imposible (proxy redirige).

**Fuera de alcance (specs futuros):**

- Página `/mi-cuenta` (sigue stub).
- `avatar_url` / fotos de perfil.
- Restricción para usuarios `pending` (bloqueo real de cuentas sin activar).
- Rol `admin` con destinos o permisos distintos.

## Modelo de datos

Esta feature no introduce nuevas tablas ni columnas. Reutiliza `public.users` de SPEC 08 (RLS `users_select_own`) y agrega solo estado en memoria:

```ts
// lib/user-store.tsx — estado nuevo (client, no persiste)
type CurrentUser =
  | { status: "loading" }
  | { status: "anonymous" }
  | { status: "ready"; userId: string; fullName: string; initial: string;
      role: "staff" | "parent" | "admin" };
```

## Plan de implementación

1. Crear `lib/user-store.tsx` con `UserProvider` + `useCurrentUser()` (fetch de auth + perfil, derivación de `initial`). Manual: `npx tsc --noEmit` limpio.
2. Montar `UserProvider` en `app/layout.tsx` dentro de los providers existentes. Manual: la app compila y no rompe el hidratado.
3. Sidebar con datos reales + subtítulo por rol (`familia` para padres, decisión del usuario). Manual: logueado como Caro muestra "Caro Giménez · Maestra · Soles".
4. `feed-greeting.tsx` con nombre real; conectar en `app/page.tsx`. Manual: "Buenas, Caro" para staff, "Buenas, Lucía" para el padre.
5. `composer-trigger.tsx` con avatar real y `create-post-provider.tsx` con autor real. Manual: post publicado como Lucía aparece con "Lucía Fernández" y su inicial.
6. Verificación final: `npm run dev` + Playwright 1280px — login Caro → sidebar/saludo correctos; logout → login Lucía → sidebar "Lucía Fernández · Familia · Soles", saludo "Buenas, Lucía", publicar post con su nombre; `npm run lint` y `npx tsc --noEmit` limpios. Artefactos en `.playwright-mcp/`.

## Criterios de aceptación

- [x] Logueado como Caro, la sidebar muestra "Caro Giménez" y "Maestra · Soles" con avatar "C". <!-- PASS: Playwright DOM tras login caro@opendaycare.com: sidebar "C / Caro Giménez / Maestra · Soles" (.playwright-mcp/spec-09-caro-feed.png) -->
- [x] Logueado como Lucía, la sidebar muestra "Lucía Fernández" y "Familia · Soles" con avatar "L". <!-- PASS: Playwright DOM tras logout + login lucia.fernandez@gmail.com: "L / Lucía Fernández / Familia · Soles" -->
- [x] El saludo del feed muestra "Buenas, Caro" / "Buenas, Lucía" según el usuario logueado. <!-- PASS: h1 feed = "Buenas, Caro" con Caro y "Buenas, Lucía" con Lucía -->
- [x] La card compositora muestra la inicial del usuario real. <!-- PASS: trigger compositora muestra "L" logueada Lucía y "C" logueada Caro -->
- [x] Un post publicado como Lucía aparece con autor "Lucía Fernández" e inicial "L". <!-- PASS: post publicado como Lucía aparece en el feed con "L / Lucía Fernández"; storage de prueba restaurado después -->
- [x] Los datos salen de `public.users`, no de valores hardcodeados (verificable cambiando de usuario). <!-- PASS: cambio de usuario cambia nombre/inicial/subtítulo en sidebar, saludo, compositora y autor de posts -->
- [x] `npm run lint` y `npx tsc --noEmit` pasan sin errores. <!-- PASS: ambos limpios tras todos los pasos -->

Nota de verificación: la primera pasada falló con HTTP 500 en `rest/v1/users` — la política `users_select_own_or_staff_same_daycare` (migración 0005) se auto-referenciaba (recursión infinita RLS, SQLSTATE 42P17). Corregido en `supabase/migrations/0009_users_rls_no_recursion.sql` (función `security definer` `viewer_is_staff_same_daycare`), aplicada al remoto vía `db push`. Advisors security: solo hallazgos preexistentes + WARN esperado por el patrón anti-recursión.

## Decisiones

- **Sí:** fetch client-side al montar en vez de servidor. El store pattern ya es client; evita pasar el perfil por props por cada layout y refleja login/logout sin refresh completo.
- **Sí:** subtítulo "Familia · Soles" para padres (decisión del usuario) y variantes por rol.
- **Sí:** saludo igual para ambos roles ("Buenas, {nombre}") — decisión del usuario 2.
- **No:** leer el perfil en el proxy o en server components; el store centraliza y simplifica.
- **No:** `/mi-cuenta`, avatares con foto, bloqueo de `pending`: fuera de alcance.

## Qué **no** entra en este spec

- Página Mi cuenta real.
- Fotos de perfil / avatar_url.
- Bloqueo de cuentas pending.

Cada uno, si aterriza, va en su propio spec.
