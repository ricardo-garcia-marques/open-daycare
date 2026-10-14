# SPEC 01 — Home feed maestra

> **Estado:** Aprobado
> **Depende de:** —
> **Fecha:** 2026-10-14
> **Objetivo:** Portar el mockup `references/pantallas/feed.dc.html` como la ruta `/` de la app con estilos idénticos, sin autenticación ni base de datos, usando datos mock en TypeScript.

## Alcance

**In:**

- Reemplazo del scaffolding de create-next-app en `app/page.tsx` por el feed del mockup: sidebar fija de 248px, encabezado de saludo, compositor "Compartí un momento…" y las 3 tarjetas de post exactas del mockup (logro, actividad con foto placeholder, anuncio).
- Tokens de diseño en `app/globals.css`: colores exactos del mockup (`#F6ECDF`, `#FFFDF9`, `#ECE0D0`, `#D9583C`, `#F2937A`, `#3F362E`, etc.).
- Tipografías Fredoka (600) y Nunito (400–800) vía `next/font/google`, como variables CSS.
- `lang="es"` y metadatos "OpenDayCare" en `app/layout.tsx`.
- Mock de datos en TypeScript, en archivo propio `lib/mock-feed.ts`, tipado.
- 5 rutas stub mínimas: `/ninos`, `/avisos`, `/mi-cuenta` (sidebar), `/crear-publicacion`, `/login` (botones del feed), cada una con encabezado + texto "pantalla pendiente".

**Fuera de alcance (specs futuros):**

- Autenticación (login real, sesiones).
- Base de datos y persistencia de publicaciones.
- Interactividad: likes, editar, comentarios y publicar quedan estáticos (solo visual).
- Diseño responsive (solo desktop, ancho de referencia 1280px).
- Las pantallas reales de Niños, Avisos, Mi cuenta, Crear publicación, Login y Detalle de publicación.

## Modelo de datos

Mock tipado en `lib/mock-feed.ts`:

```ts
export type PostType = "achievement" | "activity" | "announcement";

export type NavIcon = "home" | "kids" | "bell" | "user";

export interface FeedPost {
  id: string;
  authorInitial: string;        // letra del avatar circular
  avatarBgColor: string;        // ej. "#A9D9E8"
  avatarTextColor: string;      // ej. "#1F7A93"
  authorName: string;           // "Mateo" | "Anuncio general"
  time: string;                 // "14:20"
  type: PostType;
  addressedTo: string;          // "familia de Mateo" | "toda la sala"
  text: string;
  likes: number;
  comments: number;
  photoPlaceholder?: { alt: string }; // solo el post de actividad
}
```

Todo el código (tipos, campos, componentes, variables) va en inglés según las reglas de código limpio. Los textos visuales quedan en español en la UI. Los badges mostrados provienen de un mapa de presentación, no del tipo:

```ts
const POST_TYPE_LABELS: Record<PostType, string> = {
  achievement: "LOGRO",
  activity: "ACTIVIDAD",
  announcement: "ANUNCIO",
};
```

Contenido: exactamente los 3 posts del mockup — Mateo logro 14:20 (3 likes, 1 comentario), Mateo actividad 09:40 con foto placeholder (5 likes, 2 comentarios), Anuncio general 07:50 (8 likes, 0 comentarios).

Sin estructura nueva persistida: es solo visual, `/` es un Server Component que renderiza el mock.

## Plan de implementación

1. `app/globals.css`: definir tokens de color del mockup y variables de fuentes; quitar dark-mode de create-next-app. `app/layout.tsx`: cargar Fredoka y Nunito con `next/font`, `lang="es"`, metadata `title: "OpenDayCare"`.
2. Componente `app/(components)/sidebar.tsx`: logo, botón "Nueva publicación", nav (Feed activo, Niños, Avisos, Mi cuenta), usuario "Caro Giménez · Maestra" con botón de logout.
3. `app/page.tsx`: encabezado ("GUARDERÍA · SALA SOLES", "Buenas, Caro", "12 niños · martes 17 jun"), compositor y tarjetas de post renderizadas desde el mock.
4. `lib/mock-feed.ts` con los tipos `PostType`, `NavIcon` y `FeedPost` en inglés, más el mapa `POST_TYPE_LABELS` y los 3 posts. Manual: `npm run dev` y verificar que `/` muestra las 3 tarjetas con sus datos.
5. Rutas stub: `app/ninos/page.tsx`, `app/avisos/page.tsx`, `app/mi-cuenta/page.tsx`, `app/crear-publicacion/page.tsx`, `app/login/page.tsx`, cada una con placeholder "pantalla pendiente". Manual: clicar cada enlace de la sidebar/feed navega al stub.
6. Verificación visual final: `npm run dev` + Playwright captura de `/` a 1280px de ancho, comparar contra `references/screenshots/feed.png`. Artefactos en `.playwright-mcp/`. Además `npm run lint` y `npx tsc --noEmit` limpios.

## Criterios de aceptación

- [x] `/` renderiza sin errores de consola.
- [x] La página usa fondo `#F6ECDF`, tarjetas `#FFFDF9` y las fuentes Fredoka/Nunito (coincide visualmente con el mockup).
- [x] Aparecen exactamente los 3 posts del mockup con sus badges LOGRO/ACTIVIDAD/ANUNCIO, horas, likes y comentarios idénticos.
- [x] El sidebar muestra Feed activo (fondo `#FBE3D8`), Niños, Avisos, Mi cuenta y el usuario Caro Giménez.
- [x] Los 5 enlaces (Niños, Avisos, Mi cuenta, Nueva publicación, logout) navegan a sus rutas stub.
- [x] Cada stub muestra placeholder "pantalla pendiente".
- [x] El título del documento es "OpenDayCare" y `<html lang="es">`.
- [x] `npm run lint` y `npx tsc --noEmit` pasan sin errores.

## Decisiones

- **Sí:** Tailwind + tokens en `globals.css` (colores exactos del mockup como variables). Mantenible para las próximas pantallas.
- **No:** copiar inline styles casi literales del mockup a JSX. Fidelidad 1:1 pero duplicada en cada pantalla futura.
- **Sí:** solo desktop, fiel al mockup. Responsive va en otro spec.
- **Sí:** replicar exactamente los 3 posts del mockup. Facilita comparar visual contra el diseño.
- **Sí:** stubs mínimos "pantalla pendiente" para que la navegación funciones sin construir pantallas fuera de alcance.
- **Sí:** mock en TS en archivo propio (`lib/mock-feed.ts`) tipado, fácil de reemplazar por la BD futura. Descartado: JSON en `/public` y mock inline en el componente.
- **No:** Base de datos, auth ni interactividad: explícitamente fuera de alcance según el usuario.
- **Sí:** código interno 100% en inglés (tipos `PostType = "achievement" | "activity" | "announcement"`, `NavIcon = "home" | "kids" | "bell" | "user"`, campos y componentes). Los textos visuales (badges LOGRO/ACTIVIDAD/ANUNCIO) quedan en español en la UI mediante un mapa de presentación `POST_TYPE_LABELS`, no en los tipos.

## Riesgos

| Riesgo | Mitigación |
| --- | --- |
| `next/font/google` requiere red al compilar para descargar Fredoka/Nunito | Next las descarga y cachea en build; el mockup ya define fallback `system-ui`. Si no hay red, la build falla avisando, no degrada en silencio. |

## Qué **no** entra en este spec

- Autenticación y sesiones.
- Base de datos / persistencia.
- Interactividad (likes, editar, publicar).
- Responsive / móvil.
- Detalle de publicación, creación real de posts, y las pantallas de Niños/Avisos/Cuenta.

Cada uno, si aterrizan, va en su propio spec.
