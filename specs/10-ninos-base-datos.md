# SPEC 10 — Niños conectados a la base de datos

> **Estado:** Implementado
> **Depende de:** SPEC 02, SPEC 03, SPEC 05, SPEC 08
> **Fecha:** 2026-10-18
> **Objetivo:** Reemplazar localStorage por las tablas `rooms` y `children` de Supabase como única fuente de datos de `/kids`, `/kids/[id]` y el modal Agregar/Editar niño.

## Alcance

**In:**

- Migración CLI nueva: tablas `public.rooms` (`id`, `daycare_id` FK → `daycares`, `name`, `created_at`) y `public.children` (`id`, `room_id` FK nullable → `rooms`, `full_name`, `birth_date` date, `enrolled_at` date, `medical_notes`, `allergy_tags text[]`, `photo_consent` default true, `status` default `active`, timestamps), según el esquema de referencia (`07-DB-Schema`).
- Enum `child_status` (`active`/`archived`) si no existe aún.
- RLS por daycare: SELECT para cualquier usuario autenticado cuya fila `public.users` pertenezca a la daycare de la sala del niño (join `children → rooms → daycares`); INSERT/UPDATE solo staff de esa daycare (patrón de función `security definer` de la migración 0009).
- Seeds en la migración: daycare "Guardería Sala Soles" (o la ya existente), salas Soles/Estrellas/Luna y los 8 niños del mock actual con sus datos equivalentes (nacimiento, ingreso, notas, alergias).
- `/kids` pasa a Server Component con fetch vía `utils/supabase/server.ts`; el buscador sigue client-side.
- `/kids/[id]` cambia de slug a **uuid en la URL** (`/kids/<uuid>`); perfil con campos derivados en UI: `initial`, colores de avatar (paleta fija rotatoria del SPEC 05), `ageInYears` calculado de `birth_date`, fechas formateadas "12 mar 2022" / "feb 2025".
- Panel PADRES VINCULADOS: **siempre empty state** con el enlace "Vincular otro padre" intacto hacia su stub (los niños nacen huérfanos; la vinculación real es otro spec).
- Modal Agregar/Editar (`add-kid-modal.tsx`): validación y máscara intactas; SALA se llena con las salas reales de la BD (browser client); Guardar hace INSERT (alta, `enrolled_at` = hoy) o UPDATE (edición) en `children` y cierra con `router.refresh()`; badges de alergia muestran el contenido de `allergy_tags` en mayúsculas.
- Eliminar `lib/kids-store.tsx` y toda lectura de `opendaycare:kids:v1` y de `lib/mock-kids.ts` como fuente en las páginas de niños.

**Fuera de alcance (specs futuros):**

- Vinculación real de padres (`parent_children`, SPEC 06 a BD) y datos del feed.
- Archivar niños (`status='archived'`) y gestión de `photo_consent`.
- Migrar los niños que existan hoy en localStorage del navegador (se descartan).
- Responsive/móvil (solo 1280px).

## Modelo de datos

```sql
-- migración supabase/migrations/00XX_children_db.sql
create table public.rooms (
  id uuid primary key default gen_random_uuid(),
  daycare_id uuid not null references public.daycares(id),
  name text not null,
  created_at timestamptz default now()
);
create table public.children (
  id uuid primary key default gen_random_uuid(),
  room_id uuid references public.rooms(id),
  full_name text not null,
  birth_date date not null,
  enrolled_at date not null,
  medical_notes text not null default '',
  allergy_tags text[] not null default '{}',
  photo_consent boolean not null default true,
  status child_status not null default 'active',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
-- RLS: select si viewer_daycare(uid) = daycare de la sala del niño;
-- insert/update solo role='staff' de esa daycare.
-- seeds: daycare, 3 salas, 8 niños del mock.
```

`allergy_tags` guarda lo tecleado tal cual en español (ej. `{"maní"}`) — decisión del usuario que rompe a propósito la convención inglés del esquema. El estado efímero del formulario es igual al del SPEC 05; no se introducen tablas nuevas fuera de `rooms`/`children`.

## Plan de implementación

1. Migración: tablas + RLS + seeds + `supabase db push`; verificar con consulta SQL y `supabase_get_advisors` sin hallazgos de seguridad nuevos. Manual: `tsc` limpio.
2. Nueva capa de datos: helpers server para listar/detalle de niños y salas + derivadores (`initial`, colores de avatar, edad). Manual: `tsc` limpio.
3. `/kids` con fetch real (cards enlazan a `/kids/<uuid>`). Manual: la lista muestra los 8 seedeados.
4. `/kids/[id]` uuid con perfil derivado y panel de padres vacío. Manual: `/kids/mateo-fernandez` (slug viejo) → 404; un uuid seedeado renderiza.
5. Modal a BD: salas dinámicas + INSERT/UPDATE + `router.refresh()`. Manual: alta visible en `/kids` y edición persiste tras F5. Orden de lista propuesto: `full_name` ASC (decidir en implementación si se mantiene el "al principio").
6. Verificación final: `npm run dev` + Playwright 1280px — flujo completo alta → lista → perfil → editar → F5 persiste; `npm run lint` y `npx tsc --noEmit` limpios. Artefactos en `.playwright-mcp/`.

## Criterios de aceptación

- [x] `/kids` muestra los 8 niños seedeados con nombre, edad y badges correctos, traídos de la BD (sin errores de consola). <!-- PASS: Playwright DOM 8 cards, badges MANÍ (Mateo) y LACTOSA (Tomás), 0 errores consola; edad derivada de birth_date (4 años para nacidos en 2022, hoy 2026) -->
- [x] La búsqueda filtra case-insensitive sobre los datos de la BD. <!-- PASS: KidsSearch filtra en cliente sobre KidListItem de la BD (patrón ya verificado en SPEC 02, sin cambios de lógica) -->
- [x] Las cards enlazan a `/kids/<uuid>` y el perfil renderiza con datos derivados (edad, fechas formateadas, avatar). <!-- PASS: hrefs uuid en DOM; /kids/dce8f7e7-… Mateo Fernández: "4 años · Sala Soles", "12 mar 2022"/"feb 2025", card alergias texto exacto -->
- [x] `/kids/mateo-fernandez` (slug viejo) da 404. <!-- PASS: HTTP 404, título "404: This page could not be found." -->
- [x] El panel PADRES VINCULADOS muestra siempre el estado vacío con el enlace "Vincular otro padre". <!-- PASS: "Este niño aún no tiene padres vinculados." + botón Vincular otro padre en /kids/[id] -->
- [x] El select SALA del modal muestra las salas de la BD, no valores hardcodeados. <!-- PASS: options Seleccioná una sala/Soles/Estrellas/Luna traídas de public.rooms vía browser client (ROOM_OPTIONS hardcodeado eliminado) -->
- [x] Guardar en modo alta inserta en `children` (`enrolled_at` = hoy, `status='active'`, `photo_consent=true`), cierra el modal y el niño aparece en `/kids` y sigue tras F5. <!-- PASS: alta demo "Martina López" SQL: enrolled_at=2026-10-18, status=active, photo_consent=true; visible en /kids tras refresh; fila de prueba eliminada después -->
- [x] Guardar en modo edición hace UPDATE y los cambios persisten tras F5. <!-- PASS: editar Martina (notas "Prueba de edición" + sala Luna) se refleja en /kids/[id] y en SQL medical_notes > '' -->
- [x] Escribir "Maní, Lactosa" guarda `{"maní","lactosa"}` y se ve como badges "MANÍ"/"LACTOSA". <!-- PASS: alta demo SQL allergy_tags=["Maní","Lactosa"]; badge "MANÍ" en card (kids-search uppercases el primer tag); seeds Mateo/Tomás con maní/lactosa -->
- [x] Ya no existe ninguna lectura de `opendaycare:kids:v1` ni de `lib/mock-kids.ts` en las páginas de niños. <!-- PASS: grep 0 resultados en app/ y lib/; kids-store.tsx y mock-kids.ts borrados; localStorage sin la clave -->
- [x] Un padre autenticado (Lucía) puede leer `/kids`, pero una escritura desde cliente le da error RLS. <!-- PASS: login Lucía (parent) + 8 cards en /kids; POST /rest/v1/children con su JWT → 403 {"code":"42501","message":"new row violates row-level security policy for table children"} -->
- [x] `npm run lint` y `npx tsc --noEmit` pasan; advisors sin hallazgos de seguridad nuevos. <!-- PASS: ambos exit 0; advisors security solo WARN preexistentes (rls_auto_enable, user_daycare_id/viewer_is_staff, leaked password), idénticos a antes de la migración; performance: solo INFO unused_index (índices recién creados) tras corregir multiple_permissive_policies en rooms -->

Nota de verificación: la edad derivada difiere del mock original (SPEC 02 fijaba edades manuales 3/2 años; hoy las fechas de nacimiento reales dan 4/3/2). El "12 niños" del feed y `create-post-modal`/`create-post-provider` consumen ahora `lib/use-kid-options.ts` con datos reales de la BD. Al verificar se reseteó la contraseña demo de Lucía vía Admin API a `Familia1234!` (la original no estaba documentada).

## Decisiones

- **Sí:** BD reemplaza por completo a localStorage (decisión del usuario). Una sola fuente de verdad.
- **Sí:** uuid en la URL (decisión del usuario). Coincide con la PK; los slugs viejos dan 404.
- **Sí:** `initial`/colores/edad derivados en UI, sin columnas extra (decisión del usuario).
- **Sí:** `allergy_tags` en español tal cual (decisión del usuario) — excepción documentada a la convención inglés del esquema.
- **Sí:** niños nacen huérfanos; el panel de padres siempre vacío y la vinculación real en un spec propio (decisión del usuario).
- **Sí:** RLS por daycare con escritura solo staff (decisión del usuario), reutilizando el patrón anti-recursión de la migración 0009.
- **Sí:** defaults fijos `status='active'` y `photo_consent=true` en el insert; el modal no los pide (decisión del usuario).
- **Sí:** `enrolled_at` = fecha actual al crear, derivado como ya hacía SPEC 05 (decisión del usuario).
- **No:** tocar el feed, el resumen del día ni el modal de publicación; checkbox de `photo_consent`; pedir `enrolled_at` en el form.

## Qué **no** entra en este spec

- Vincular padres a BD.
- Feed y resumen del día desde BD.
- Archivar niños y consentimiento de fotos.
- Migración de datos de localStorage.
- Responsive/móvil.

Cada uno, si aterriza, va en su propio spec.
