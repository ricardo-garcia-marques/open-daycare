# SPEC 07 — Modal Nueva publicación

> **Estado:** Implementado
> **Depende de:** SPEC 01, SPEC 02, SPEC 06
> **Fecha:** 2026-10-17
> **Objetivo:** Modal "Nueva publicación" (mockup `references/pantallas/crear-publicacion.dc.html`) que crea una publicación real, persistida en localStorage, que aparece arriba del feed `/` al publicar.

## Alcance

**In:**

- Modal cliente `app/(components)/create-post-modal.tsx` replicando la card del mockup (ancho máx 580px, fondo `#FBF4EC`, borde `#ECE0D0`, radio 24px, sombra suave): cabecera con **Cancelar** (izq, `#94887B` 700 15px), título **"Nueva publicación"** (Fredoka 600, 18px) y **Publicar** (der, `#D9583C` 800 15px); secciones **PARA**, **TIPO**, **DESCRIPCIÓN**, **FOTOS** con labels 12px/800/`#94887B`.
- **PARA:** multi-selección de chips pill con avatar circular de cada niño del `KidsStoreProvider` (colores del mockup: Mateo/Sofía/Benjamín + los que existan en el store). Chip activo: fondo `#3F362E`, texto blanco, borde 1.5px `#3F362E`; inactivo: fondo `#FFFDF9`, texto `#6E6359`, borde `#ECE0D0`. Chip **"Toda la sala"**: al activarlo limpia la selección individual; al tocar un niño se desmarca "Toda la sala".
- **TIPO:** 7 pills exactas del mockup — Comida, Siesta, Actividad, Logro, Ánimo, Foto, Anuncio — con colores del mockup; selección única, **sin selección inicial** (patrón SPEC 06). Pill seleccionada = colores llenos del mockup; deseleccionada = estilo outline (fondo `#FFFDF9`, texto `#6E6359`, borde `#ECE0D0`).
- **DESCRIPCIÓN:** textarea (mín 120px, radio 14px, borde `#EADFD0`, placeholder "Contá cómo le fue hoy…").
- **FOTOS:** tile de preview 96px (muestra la primera foto agregada vía object URL; clic la elimina) + tile dashed **"Agregar"** con ícono +, que abre un `input file` (accept `image/*`, selección múltiple). Cada foto extra se agrega como tile 96px extra; clic en cualquier miniatura la elimina. Máximo 4 fotos.
- **Validación bloqueante** (patrón SPEC 05/06): "Publicar" deshabilitado hasta tener tipo elegido + descripción no vacía (trim) + al menos un destinatario (niño(s) o "Toda la sala"). Sin mensajes de error: el botón deshabilitado es la señal.
- **Al publicar:** alta en `lib/posts-store.tsx` → el modal se cierra y el post nuevo aparece **arriba** del feed al instante, sin toast. Autor siempre **Caro Giménez** (avatar "C" con `bg-accent`/blanco, como el compositor del feed), hora actual `HH:MM`.
- **Feed `/`** pasa a leer del store de posts (seed = los 3 posts del mock del SPEC 01; F5 los restaura si el localStorage está vacío). Los posts nuevos: aparecen primero, mantienen el diseño exacto de card; muestran `Para: …` derivado, badge del tipo y fotos.
- **Destinatarios en la card:** "toda la sala" → `toda la sala`; 1 niño → `familia de {primerNombre}`; varios → `familias de {nombres separados por coma}`.
- **Fotos en la card del feed:** durante la sesión, la primera foto como tile real (`<img>`); tras recargar, placeholder dashed con "{N} foto(s)" (solo cuenta, sin base64).
- **Provider de apertura** `app/(components)/create-post-provider.tsx` montado en el layout raíz: expone `openCreatePost()` y renderiza el modal una única vez. Disparadores: botón **"Nueva publicación"** de la sidebar y card compositora **"Compartí un momento…"** del feed.
- Overlay: backdrop oscuro semitransparente; cierre con Escape, click en backdrop y "Cancelar" — sin guardar ni confirmar (patrón SPEC 06).
- Los enlaces **"Editar"** se quitan de las cards del feed; se elimina el stub `app/crear-publicacion/page.tsx` (la ruta deja de existir → 404).

**Fuera de alcance (specs futuros):**

- Edición de publicaciones existentes.
- Likes y comentarios interactivos (siguen estáticos).
- Persistencia real de archivos de imagen (base64/uploads).
- Visibilidad por rol de padre (los padres ven solo sus hijos).
- Responsive/móvil (solo desktop, referencia 1280px).

## Modelo de datos

```ts
// lib/mock-feed.ts — PostType extendido (cambio de tipo existente)
export type PostType =
  | "meal" | "nap" | "activity"
  | "achievement" | "mood" | "photo" | "announcement";

export const POST_TYPE_LABELS: Record<PostType, string> = {
  meal: "COMIDA", nap: "SIESTA", activity: "ACTIVIDAD",
  achievement: "LOGRO", mood: "ÁNIMO", photo: "FOTO", announcement: "ANUNCIO",
};
// mapa nuevo con los colores de pill del mockup, reutilizado para badges del feed
export const POST_TYPE_BADGE_COLORS: Record<PostType, { bg: string; text: string }>;
```

```ts
// lib/posts-store.tsx — store nuevo (patrón kids-store: useSyncExternalStore + contexto)
const STORAGE_KEY = "opendaycare:posts:v1";

interface StoredPost extends FeedPost {
  photoUrls?: string[];  // solo sesión (object URLs, no serializable)
  photoCount?: number;   // persistido; repone placeholder dashed tras F5
}

addPost(post: Omit<StoredPost, "id">): void  // prepend + write-through localStorage
```

Seed: `FEED_POSTS` de `lib/mock-feed.ts` cuando no hay nada en localStorage (el mock queda como datos iniciales, no pantalla separada).

## Plan de implementación

1. Extender `PostType` a los 7 valores en `lib/mock-feed.ts`, completar `POST_TYPE_LABELS` y agregar `POST_TYPE_BADGE_COLORS` con los colores de pill del mockup. Limpiar `app/page.tsx` de `BADGE_STYLES` (pasa a usar el mapa). Manual: `npx tsc --noEmit` limpio.
2. Crear `lib/posts-store.tsx` con el patrón de `kids-store.tsx` (snapshot/subscribe/hydrate, seed del mock, write-through `opendaycare:posts:v1`) y la acción `addPost` que antepone el post. Manual: smoke por consola/`tsc`.
3. Crear `app/(components)/create-post-modal.tsx` con la card fiel al mockup (PARA multiselección desde `useKidsStore`, TIPO sin selección inicial, DESCRIPCIÓN, FOTOS con input file + object URLs y eliminación por clic) y cierre por Cancelar/Escape/backdrop, **sin persistir todavía**. Manual: visual a 1280px y los tres cierres.
4. Crear `app/(components)/create-post-provider.tsx` (estado abierto + modal único), conectar botón "Nueva publicación" de `sidebar.tsx` y card "Compartí un momento…" de `app/page.tsx`; implementar validación bloqueante y `addPost` al publicar (derivación de autor "Caro Giménez", hora `HH:MM`, `addressedTo`, `photoCount`); convertir el listado del feed a client (componente `app/(components)/feed-posts.tsx`) leyendo del store; quitar "Editar" de las cards; eliminar `app/crear-publicacion/page.tsx`. Manual: flujo completo feed → modal → publicar → post arriba → F5 persiste.
5. Verificación final: `npm run dev` + Playwright a 1280px — flujo `feed → Compartí un momento → modal → elegir Sofía + tipo Siesta + descripción → Publicar → post arriba del feed → F5 → post sigue (foto como placeholder "1 foto")`; verificar también "Toda la sala" y deshabilitado de Publicar sin completar; `npm run lint` y `npx tsc --noEmit` limpios; artefactos en `.playwright-mcp/`.

## Criterios de aceptación

- [x] El modal abre desde el botón "Nueva publicación" de la sidebar y desde la card "Compartí un momento…"; la ruta `/crear-publicacion` ya no existe (404).
- [x] El modal coincide con el mockup (card 580px `#FBF4EC` radio 24px, cabecera Cancelar/título/Publicar en `#D9583C`, secciones PARA/TIPO/DESCRIPCIÓN/FOTOS).
- [x] PARA permite multi-selección de niños con avatares y "Toda la sala" limpia la selección individual (y viceversa).
- [x] Los 7 tipos del mockup están con sus colores exactos y arrancan deseleccionados; la selección es única.
- [x] "Publicar" está deshabilitado sin tipo, sin descripción o sin destinatario, y se habilita al completar los tres.
- [x] Agregar foto(s) muestra miniaturas de 96px; clic sobre una miniatura la elimina; máximo 4.
- [x] Publicar cierra el modal, el post nuevo aparece primero en el feed con autor "Caro Giménez", hora actual, badge del tipo y destinatarios correctos (`toda la sala` / `familia de X` / `familias de X, Y`).
- [x] Tras F5 el post persiste (localStorage `opendaycare:posts:v1`) y sus fotos se muestran como placeholder dashed "{N} foto(s)".
- [x] Los 3 posts del mock siguen visibles como seed cuando no hay localStorage.
- [x] Los enlaces "Editar" ya no aparecen en las cards del feed.
- [x] Cancelar, Escape y click en backdrop cierran el modal sin guardar ni pedir confirmación.
- [x] `npm run lint` y `npx tsc --noEmit` pasan sin errores.

## Decisiones

- **Sí:** modal superpuesto en vez de página dedicada. Decisión del usuario; el stub de ruta se elimina para no dejar rutas muertas.
- **Sí:** guardado real con store nuevo + localStorage (`opendaycare:posts:v1`), mock como seed. Reproduce el patrón exitoso de kids-store (SPEC 02/06) y el feed queda vivo.
- **Sí:** PostType extendido a 7 valores + mapa de colores por tipo, en vez de mapear tipos nuevos a los 3 viejos. El badge muestra la etiqueta real del momento reportado.
- **Sí:** multi-selección de destinatarios con "Toda la sala" como atajo exclusivo. Actividades grupales lo necesitan.
- **Sí:** fotos con object URL solo de sesión + `photoCount` persistido. Persistir base64 arriesga la cuota de localStorage sin beneficio demo; el placeholder mantiene la info.
- **Sí:** `addressedTo` derivado como texto legible ("familia de/familias de/toda la sala") para no cambiar el shape que la card ya renderiza.
- **Sí:** sin selección inicial de tipo ni destinatario (coherente con SPEC 06) y validación por botón deshabilitado, sin mensajes de error.
- **No:** edición de posts, likes/comentarios interactivos, persistencia de archivos, visibilidad por rol: descartados por fuera del alcance demo.

## Qué **no** entra en este spec

- Edición de publicaciones.
- Likes y comentarios interactivos.
- Persistencia real de imágenes.
- Responsive/móvil.

Cada uno, si aterriza, va en su propio spec.
