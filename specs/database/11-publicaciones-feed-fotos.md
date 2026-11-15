# SPEC 11 — Publicaciones reales en Supabase: tabla `posts`, fotos en Storage y feed filtrado por rol

> **Estado:** Aprobado
> **Depende de:** SPEC 07, SPEC 08, SPEC 09, SPEC 10, database/09 (users table)
> **Fecha:** 2026-11-15
> **Objetivo:** Reemplazar el feed de localStorage por publicaciones reales en Supabase (tabla `posts` + bucket privado `post-images`), publicables solo por staff, con fotos opcionales (máx 4, 5MB c/u) y un feed cuya visibilidad para padres se filtra por los hijos vinculados.

## Alcance

**In:**

- **Migración `0011_parent_children.sql`:** tabla `public.parent_children` (`parent_user_id` FK→users, `child_id` FK→children, PK compuesta, timestamps) con RLS; cierra la deuda del SPEC 10 ("niños nacen huérfanos"). Seed idempotente: Lucía Fernández (usuario auth con email `lucia.fernandez@gmail.com`) vinculada a **Mateo Fernández** y **Sofía Méndez** (niños del seed de `children` por nombre).
- **Migración `0012_posts_feed.sql`:** enum `public.post_type` con los 7 valores (`meal`, `nap`, `activity`, `achievement`, `mood`, `photo`, `announcement`); tabla `public.posts` (`id` uuid, `daycare_id` FK→daycares not null, `author_id` FK→users not null, `type post_type` not null, `description` text not null, `whole_room` boolean not null default false, `photos text[]` not null default `{}`, `created_at` timestamptz not null default now()); tabla `public.post_recipients` (`post_id` FK cascade, `child_id` FK→children, PK compuesta). RLS + índices (`posts(daycare_id, created_at desc)`, `post_recipients(child_id)`, `parent_children(child_id)`).
- **Función helper `public.can_read_post(p_post_id uuid)`** `security definer`, `stable`, `search_path` fijado y `EXECUTE` solo para `authenticated`: encapsula la visibilidad (staff del daycare / autor / `whole_room` del mismo daycare / padre con hijo en `post_recipients`) para evitar recursión RLS entre `posts` ↔ `post_recipients` (mismo patrón que `user_daycare_id()` en database/09).
- **Políticas RLS de `posts`:** SELECT para miembros del daycare con visibilidad por rol (staff: todo; padre: `whole_room` del daycare, posts propios, o posts con algún destinatario entre sus hijos vía `parent_children`); INSERT solo staff del daycare con `author_id = auth.uid()`; UPDATE solo el autor staff (para setear `photos` tras subir archivos).
- **RLS de `post_recipients` y `parent_children`:** SELECT con `can_read_post` / titularidad propia; INSERT de recipients solo staff del daycare y solo sobre el post que él mismo creó, con hijos de su daycare.
- **Bucket privado `post-images`** (no público) en Storage: objetos con path `{post_id}/{uuid}.{ext}`. Policies: SELECT del objeto si `can_read_post(primer segmento del path)`; INSERT/UPDATE solo si el post del primer segmento fue creado por el usuario (staff, `author_id = auth.uid()`). DELETE fuera de alcance.
- **Seed SQL de los 3 posts del mock de SPEC 01** (logro de Mateo, actividad de Mateo, anuncio "toda la sala"), autor Caro (`…000a`), sin fotos, `created_at` escalonado con `now() - interval`, idempotente.
- **Capa de datos server `lib/posts-db.ts`:** `fetchFeedPosts()` con el cliente server de `utils/supabase/server`: posts del feed ordenados por `created_at desc` con autor (join `users`), destinatarios (join `post_recipients`→`children`), derivación de `addressedTo` con las reglas de SPEC 07 (`toda la sala` / `familia de X` / `familias de X, Y`), y **signed URLs (60 min)** para cada objeto de `photos` vía `createSignedUrl`.
- **Feed:** `app/page.tsx` fetch server-side y pasa los posts serializados a `feed-posts.tsx` (client) como prop `initialPosts`; estado local para el post optimista.
- **Publicación real en `create-post-provider.tsx`:** genera `id` (crypto.randomUUID), INSERT del post, INSERT de recipients, upload secuencial de fotos a `post-images/{postId}/…`, UPDATE de `posts.photos` con los paths; al éxito, prepend optimista (object URLs para la sesión) y cierre del modal. Botón "Publicar" deshabilitado con texto **"Subiendo…"** durante el flujo; en error, mensaje **"No se pudo publicar. Intentá de nuevo."** dentro del modal, datos intactos y reintento posible (el INSERT previo no se repite: si falla el upload, cleanup best-effort del post creado y de los objetos subidos).
- **Gating por rol en UI:** botón "Nueva publicación" de la sidebar y card compositora "Compartí un momento…" **solo se renderizan si `role = 'staff'`** (o `admin`) vía `useCurrentUser()`; padres no ven ninguno de los dos disparadores.
- **Modal de SPEC 07 visualmente intacto** (PARA/TIPO/DESCRIPCIÓN/FOTOS, validación bloqueante, máx 4 fotos): solo cambia la plomería de publicación (async + error).
- **Limpieza:** eliminar `lib/posts-store.tsx` (localStorage `opendaycare:posts:v1` muere), `PostsStoreProvider` del layout, `FEED_POSTS` de `lib/mock-feed.ts` (los tipos/labels/colores siguen) y el campo `photoPlaceholder`; escripts del mock ahora viven en el seed SQL.
- **Copy de la card del feed:** la línea de metadatos pasa a ser solo `{hora}` (se quita "· publicado por vos", que mentía con múltiples autores).

**Fuera de alcance (specs futuros):**

- Bloqueo real de usuarios `pending` (deuda de SPEC 08).
- Notificaciones `notify_on_post` (email/push).
- Editar/eliminar posts propios (el DELETE de storage también queda fuera).
- Página `/mi-cuenta`, avatar_url de perfil.
- Realtime (posts de otros usuarios se ven al recargar).
- `photo_consent` de `children` como condición para publicar fotos del niño (anotado como deuda).
- Responsive/móvil.

## Modelo de datos

```sql
-- 0011
create table public.parent_children (
  parent_user_id uuid not null references public.users(id) on delete cascade,
  child_id       uuid not null references public.children(id) on delete cascade,
  created_at     timestamptz not null default now(),
  primary key (parent_user_id, child_id)
);

-- 0012
create type public.post_type as enum
  ('meal','nap','activity','achievement','mood','photo','announcement');

create table public.posts (
  id          uuid primary key default gen_random_uuid(),
  daycare_id  uuid not null references public.daycares(id),
  author_id   uuid not null references public.users(id),
  type        public.post_type not null,
  description text not null,
  whole_room  boolean not null default false,
  photos      text[] not null default '{}',
  created_at  timestamptz not null default now()
);

create table public.post_recipients (
  post_id  uuid not null references public.posts(id) on delete cascade,
  child_id uuid not null references public.children(id),
  primary key (post_id, child_id)
);
```

Convenios:

- `posts.photos` guarda **paths de Storage**, no URLs: `{'{post_id}/{uuid}.jpg', …}`. Las signed URLs son efímeras (60 min) y se generan solo en el render del feed.
- El path en el bucket siempre empieza con el `post_id`: las policies de Storage lo parsean con `split_part(name, '/', 1)`.
- `whole_room = true` ⇒ no debe haber filas en `post_recipients` (el INSERT client no las crea; no se agrega constraint en 0012, decisión documentada).

Políticas clave (esbozo):

```sql
-- visibilidad central, security definer para evitar recursión posts↔recipients
create function public.can_read_post(p_post_id uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.posts p
    where p.id = p_post_id
      and p.daycare_id = public.user_daycare_id()
      and (
        public.viewer_is_staff_same_daycare(p.daycare_id)
        or p.author_id = auth.uid()
        or p.whole_room
        or exists (
          select 1
          from public.post_recipients pr
          join public.parent_children pc on pc.child_id = pr.child_id
          where pr.post_id = p.id and pc.parent_user_id = auth.uid()
        )
      )
  );
$$;
```

Payload client que produce el modal (ya existe, `CreatePostPayload`) y shape que consume `FeedPosts`:

```ts
// lib/posts-db.ts — post serializado server→client
export interface FeedPostRow {
  id: string;
  authorName: string;
  authorInitial: string;
  type: PostType;
  addressedTo: string;
  text: string;
  createdAt: string;       // ISO
  time: string;            // "HH:MM" formateado server-side
  photoUrls: string[];     // signed URLs ya resueltas
  likes: number;           // 0 (los likes siguen estáticos)
  comments: number;        // 0 (idem)
}
```

## Plan de implementación

1. **Migración `0011_parent_children.sql`** (vía agente db-migrator): tabla + índice `child_id` + RLS (SELECT propio para el padre; SELECT/INSERT/DELETE para staff del daycare del niño) + seed idempotente Lucía→Mateo y Lucía→Sofía (lookup por email en `auth.users` join `users`, y niños por `full_name`; si Lucía no existe, el seed no inserta nada y no falla). Verificar con SQL y `supabase_get_advisors` sin hallazgos nuevos.
2. **Migración `0012_posts_feed.sql`:** enum `post_type`, tablas `posts`/`post_recipients` con RLS e índices, helper `can_read_post()` (con revoke a `anon`/`public`), bucket privado `post-images` + policies de select/insert/update, y seed de los 3 posts del mock (autor `…000a`, recipients por `full_name` del niño, `whole_room` solo en el anuncio). Verificar con SQL + advisors; probar manualmente con SQL que un INSERT simulando padre sin sesiones de staff falla.
3. **`lib/posts-db.ts`:** `fetchFeedPosts()` (posts + autor + recipients + signed URLs 60 min + derivación de `addressedTo` + `time` "HH:MM" formateado server-side). La firma usa el client server; errores → throw con mensaje. Manual: `npx tsc --noEmit` limpio.
4. **Feed a datos reales:** `app/page.tsx` obtiene el perfil (`users`) y `fetchFeedPosts()` en server; pasa `initialPosts` a `app/(components)/feed-posts.tsx` que pasa a ser client con prop + estado local (misma card visual, fotos reales `<img>`, copy de metadatos "HH:MM" sin "publicado por vos"). Eliminar `lib/posts-store.tsx`, `PostsStoreProvider` del layout y `FEED_POSTS`/`photoPlaceholder` de `lib/mock-feed.ts`. Manual: F5 con dev server muestra los 3 posts del seed; `npx tsc --noEmit` y `npm run lint` limpios.
5. **Publicación real:** `create-post-provider.tsx` ejecuta el flujo INSERT post → INSERT recipients → upload fotos → UPDATE photos → prepend optimista → cerrar modal, con estado `submitting` ("Subiendo…") y `error` (mensaje en el modal, cleanup best-effort del post/objetos si el flujo se corta a medias). `create-post-modal.tsx` solo agrega props `submitting`/`error` (visual intacto). Manual: publicar sin fotos persiste tras F5.
6. **Gating staff:** `sidebar.tsx` y `composer-card.tsx` renderizan sus disparadores solo para `staff`/`admin` según `useCurrentUser()`. Manual: como Lucía no ve ni el botón lateral ni la card compositora.
7. **Verificación final:** `npm run dev` + Playwright a 1280px — login Caro → publicar post **con** 2 fotos y otro **sin** fotos → aparecen arriba con badge/destinatarios correctos, F5 persiste y las fotos se ven (signed URLs reales, no placeholder); login Lucía → feed solo con "toda la sala" + posts de Mateo/Sofía, sin botón "Nueva publicación" ni card compositora, y un `fetch` directo a `/rest/v1/posts` con su JWT solo devuelve las filas permitidas; `npm run lint`, `npx tsc --noEmit` y `supabase_get_advisors` (security + performance) limpios. Artefactos en `.playwright-mcp/`.

## Criterios de aceptación

- [x] La migración `0011` crea `parent_children` con RLS y el seed deja a Lucía vinculada con Mateo Fernández y Sofía Méndez (verificable por SQL). <!-- PASS: tabla public.parent_children con RLS activo (relrowsecurity=true); query SQL confirma Lucía vinculada a Mateo Fernández y Sofía Méndez con timestamps de inserción -->
- [x] La migración `0012` crea el enum, `posts`, `post_recipients`, el bucket privado `post-images` con sus policies y el seed de los 3 posts del mock sin fotos. <!-- PASS: enum post_type (7 valores), tablas posts y post_recipients con RLS; bucket post-images (public=false) con 3 policies; 3 posts seedeados (id …301, …302, …303, autor Caro …000a, photos=[], whole_room=true solo en anuncio) -->
- [x] Logueado como Caro (staff), publicar un post sin fotos lo inserta en `posts` y aparece primero en el feed; tras F5 sigue visible desde la BD. <!-- PASS: Playwright 1280px como Caro; post "Verificación spec 11 post sin fotos por Caro" insertado en posts, aparece al tope del feed y tras F5 se renderiza desde la BD vía Server Component fetchFeedPosts() -->
- [x] Logueado como Caro, publicar con 2 fotos sube los objetos a `post-images/{post_id}/…`, persiste los paths en `posts.photos` y tras F5 las fotos se muestran como `<img>` con signed URLs (no placeholder dashed). <!-- PASS: post con 2 fotos subió objetos a post-images/{post_id}/..., posts.photos guarda paths de storage; tras F5 se renderizan <img> con signed URLs válidas (200x150, complete=true, TTL 60 min) -->
- [x] Si el upload falla, el modal muestra "No se pudo publicar. Intentá de nuevo.", conserva los datos y permite reintentar; el botón muestra "Subiendo…" y está deshabilitado durante el flujo. <!-- PASS: abort simulado en ruta de storage; botón muestra "Subiendo…" disabled; alert muestra "No se pudo publicar. Intentá de nuevo."; datos (destinatario, tipo, texto, fotos) preservados intactos; reintento exitoso al restaurar red -->
- [x] El modal mantiene el visual y la validación de SPEC 07 (PARA/TIPO/DESCRIPCIÓN, máx 4 fotos, botón deshabilitado hasta completar). <!-- PASS: layout modal con secciones PARA, TIPO, DESCRIPCIÓN, FOTOS; botón Publicar disabled hasta seleccionar destinatario + tipo + descripción; límite de 4 fotos verificado -->
- [x] El botón "Nueva publicación" de la sidebar y la card "Compartí un momento…" no se renderizan para padres (Lucía) y sí para staff (Caro). <!-- PASS: Playwright snapshot/DOM confirma que como Lucía (parent) ni botón de sidebar ni card compositora se renderizan (null); como Caro (staff) ambos disparadores están presentes y operativos -->
- [x] Un INSERT directo a `posts` con el JWT de Lucía (rol parent) es rechazado por RLS (403 / código 42501). <!-- PASS: POST REST a /rest/v1/posts con Bearer token de Lucía devuelve 403 Forbidden con body code="42501" y mensaje RLS de violación de policy en "posts" -->
- [x] El feed de Caro muestra todos los posts del daycare; el de Lucía solo: posts "toda la sala", posts de Mateo/Sofía (sus vinculados) y posts propios; un fetch REST como Lucía devuelve exactamente ese subconjunto. <!-- PASS: post de prueba para Tomás Díaz visible para Caro (total 6 posts) pero invisible para Lucía (total 5 posts); query REST como Lucía solo devuelve whole_room o destinatarios Mateo/Sofía -->
- [x] `localStorage` ya no participa en el feed: la clave `opendaycare:posts:v1` desaparece del código y los datos persisten solo en Supabase. <!-- PASS: grep 0 ocurrencias de opendaycare:posts:v1 en código (posts-store.tsx eliminado); browser evaluate confirma localStorage sin claves del feed; persistencia 100% en Supabase -->
- [x] "Editar" sigue ausente de las cards y no aparecen nuevas acciones sobre posts existentes. <!-- PASS: DOM de feed contiene solo contadores de likes y comentarios; botón "Editar" ausente en todas las cards y no existen menús de acciones -->
- [x] `npm run lint`, `npx tsc --noEmit` y `supabase_get_advisors` (security + performance) pasan sin hallazgos atribuibles a este spec. <!-- PASS: lint y tsc limpios (exit 0); advisors security solo WARN preexistentes/aceptados (can_read_post callable por authenticated igual que user_daycare_id, rls_auto_enable, leaked password) y performance solo INFO unused_index -->

## Decisiones

- **Sí:** todo el feed a Supabase (`posts` + `post_recipients`), abandonando localStorage. Los posts pasan a ser datos multiusuario reales; el mock persiste como seed SQL.
- **Sí:** tabla `parent_children` en este spec. Era prerrequisito del filtrado por hijos y cierra la deuda declarada del SPEC 10 (niños huérfanos).
- **Sí:** visibilidad doble capa: UI oculta los disparadores a padres **y** RLS rechaza el INSERT de no-staff (defensa en profundidad).
- **Sí:** bucket privado + signed URLs de 60 min generadas server-side por render. Fotos de menores; la exigencia de privacidad pesa más que la simplicidad de un bucket público.
- **Sí:** enum Postgres `post_type`. Los 7 valores son cerrados por diseño de UI; el enum da integridad y labels ya viven en `POST_TYPE_LABELS`.
- **Sí:** `photos text[]` con paths + policy de Storage que valida el `post_id` del prefix. Evita tabla extra y permite autorizar la subida contra el post ya creado (INSERT del post → upload → UPDATE photos).
- **Sí:** orden de publicación: INSERT post → upload fotos → UPDATE photos (y no upload → INSERT). Permite que la policy de Storage verifique autoría del post; si el upload falla se hace cleanup best-effort del post parcial.
- **Sí:** flujo bloqueante en el modal ("Subiendo…", error con reintento). El post-simple-primero dejó de ser aceptable ahora que el post es real.
- **Sí:** seed de Lucía→Mateo y Sofía. vínculo demo arbitrario pero necesario para probar el filtrado; queda documentado aquí.
- **Sí:** seed de los 3 posts sin fotos. El mock de "actividad" pierde su placeholder visual; recrear imágenes demo agrega deuda para nada.
- **Sí:** helper `can_read_post()` security definer con revoke a `anon`/`public`. Rompe la recursión RLS posts↔post_recipients con el patrón ya usado por `user_daycare_id()` (incluido el revoke por hallazgo previo del advisor).
- **Sí:** copy de metadatos de card pasa a `HH:MM` solo. "publicado por vos" era falso con múltiples autores.
- **No:** Realtime de Supabase. Refresh del propio post + recarga manual alcanza para el alcance demo.
- **No:** edición/borrado de posts, notificaciones, bloqueo de `pending`, `/mi-cuenta`: cada uno en su propio spec si aterriza.

## Riesgos

| Riesgo | Mitigación |
| --- | --- |
| Recursión RLS entre `posts` y `post_recipients` (error 42P17 al consultar) | `can_read_post()` es `security definer` y las que la invocan no consultan tablas con policies que a su vez invoquen prácticas recursivas; se verifica con query como Lucía (SQL) antes de conectar la UI. |
| Signed URL vence si el usuario deja la pestaña abierta > 60 min | Aceptado: F5 regenera URLs. 60 min cubre el uso real demo. |
| Upload parcial deja objetos huérfanos en el bucket | Cleanup best-effort en error (remove de los paths subidos); los huérfanos no son accesibles (no hay post que los referencie). |
| Seed de `parent_children` no encuentra al usuario de Lucía y el filtro de padre devuelve feed vacío | El seed es un no-op silencioso en ese caso; el paso de verificación chequea por SQL que exista el vínculo antes de testear el feed de Lucía. |
| Persistencia de posts contradictoria durante migración (usuarios con localStorage viejo) | La clave localStorage se abandona sin migrate; datos demo solo. Decisión documentada. |

## Qué **no** entra en este spec

- Bloqueo de usuarios `pending`.
- Notificaciones por post.
- Edición/eliminación de posts y de objetos del bucket.
- Realtime, `/mi-cuenta`, avatares con foto, `photo_consent` como gate de fotos.
- Responsive/móvil.

Cada uno, si aterriza, va en su propio spec.
