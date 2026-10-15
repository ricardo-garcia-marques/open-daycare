# SPEC 02 — Pantalla Niños (/kids)

> **Estado:** Implementado
> **Depende de:** SPEC 01
> **Fecha:** 2026-10-15
> **Objetivo:** Portar el mockup `references/pantallas/ninos.dc.html` como la ruta `/kids` con estilos idénticos, buscador funcional en cliente y navegación conectada al resto de la app.

## Alcance

**In:**

- Reemplazo del stub `app/ninos/page.tsx` por la pantalla real del mockup en `app/kids/page.tsx`: encabezado (GESTIÓN / Niños), buscador, grid de 2 columnas con los 8 niños exactos.
- Renombrado de la ruta: `app/ninos/` → `app/kids/` y actualización del href del sidebar (`/kids`).
- Sidebar con estado activo real mediante `usePathname` (Niños resaltado en `/kids`, Feed en `/`); se elimina el `active` hardcodeado.
- Mock de datos tipado en `lib/mock-kids.ts` con los 8 niños del mockup.
- Buscador funcional: client component que filtra por nombre, sin distinguir mayúsculas/minúsculas.
- Badges derivados de datos: alergia (MANÍ, LACTOSA), VINCULAR cuando `linkedParents === 0`, chevron cuando no aplica.
- Stubs "pantalla pendiente": `app/kids/agregar/page.tsx` y `app/kids/[id]/page.tsx`.

**Fuera de alcance (specs futuros):**

- Pantalla real de perfil del niño (`/kids/[id]`) y formulario real de agregar niño.
- Base de datos, persistencia, CRUD real de niños.
- Vincular padres (interacción del badge VINCULAR).
- Responsive/móvil (solo desktop, referencia 1280px).

## Modelo de datos

```ts
// lib/mock-kids.ts
export interface Kid {
  id: string;
  name: string;          // "Mateo Fernández"
  ageInYears: number;    // 3
  linkedParents: number; // 2
  allergies: string[];   // ["maní"] | ["lactosa"] | []
  initial: string;       // "M"
  avatarBgColor: string;    // "#A9D9E8"
  avatarTextColor: string;  // "#1F7A93"
}
```

El texto "N años · N padres vinculados / sin padres vinculados" se deriva de los datos. El badge de alergia sale de `allergies` en mayúsculas; `VINCULAR` se muestra solo si `linkedParents === 0`; si no hay nada, chevron. Sin nueva persistencia: Server Component que renderiza el mock.

## Plan de implementación

1. `app/ninos/` → `app/kids/`; actualizar el href de Niños en `app/(components)/sidebar.tsx`. Manual: el enlace del sidebar navega a `/kids`.
2. Convertir `sidebar.tsx` en client component con `usePathname` para el item activo. Manual: `/` resalta Feed, `/kids` resalta Niños (y el resto de páginas sigue degradando sin romper).
3. Tokens nuevos en `app/globals.css` + `@theme inline`: `--chip-allergy-bg: #fbd8cc`, `--chip-allergy: #d9684a`, `--chip-link-bg: #f9d2de`, `--chip-link: #c56486`.
4. `lib/mock-kids.ts` con `Kid` y los 8 niños del mockup. Manual: `tsc` limpio.
5. Componente `KidCard` + `app/kids/page.tsx` (layout `max-w-[880px]`, buscador, grid `2×14px`, hover de tarjeta). Cards enlazan a `/kids/{id}`. Manual: la página coincide con el mockup.
6. Client component de búsqueda (`app/(components)/kids-search.tsx`) que filtra el grid por nombre y muestra el contador "N niños" actualizado. Manual: escribir "so" deja solo Sofía.
7. Stubs: `app/kids/agregar/page.tsx` y `app/kids/[id]/page.tsx` con placeholder "pantalla pendiente". Manual: clic en "Agregar niño" y en una tarjeta navega a su stub.
8. Verificación final: `npm run dev` + Playwright a 1280px comparando contra `references/screenshots/ninos.png`; `npm run lint` y `npx tsc --noEmit` limpios. Artefactos en `.playwright-mcp/`.

## Criterios de aceptación

- [x] `/kids` renderiza sin errores de consola.
- [x] `/ninos` ya no existe (404) y el sidebar enlaza a `/kids`.
- [x] En `/kids` el item "Niños" del sidebar está resaltado (fondo `#FBE3D8`) y Feed no.
- [x] Aparecen exactamente los 8 niños del mockup con nombre, edad y padres vinculados idénticos.
- [x] Los badges correctos: MANÍ en Mateo, LACTOSA en Tomás, VINCULAR en Valentina, chevron en el resto.
- [x] Escribir en el buscador filtra la lista según el texto (case-insensitive); limpiar el input restaura los 8.
- [x] Las tarjetas enlazan a `/kids/{id}` y "Agregar niño" a `/kids/agregar`; ambos muestran "pantalla pendiente".
- [x] `npm run lint` y `npx tsc --noEmit` pasan sin errores.

## Decisiones

- **Sí:** mover el stub a `/kids` en vez de mantener `/ninos`. Una sola ruta, sin duplicados; el sidebar se actualiza en el mismo paso.
- **Sí:** buscador funcional con filtro en cliente. Es poco código (un client component con `useState`) y da valor real frente al input muerto.
- **Sí:** badges derivados de datos reales (`allergies: string[]`, `linkedParents: number`). Flexible para los specs de perfil/CRUD futuros. Descartado: campo `badge` como texto plano.
- **Sí:** sidebar con `usePathname`. Elimina el hack del `active: true` fijo y sirve para todas las pantallas futuras (SPEC 01 ya lo necesitaba implícitamente).
- **Sí:** stubs `/kids/agregar` y `/kids/[id]` siguiendo el patrón del SPEC 01. La navegación queda completa sin construir pantallas fuera de alcance.
- **No:** CRUD, BD, vinculación de padres, responsive: fuera de alcance según el usuario.

## Riesgos

| Riesgo | Mitigación |
| --- | --- |
| Convertir el sidebar a client component puede afectar `/` y el resto de rutas | Regla de aceptación explícita: `/` sigue mostrando Feed activo y sin errores de consola. |
| El contador "8 niños" vive en el Server Component pero el filtro es cliente | El contador se calcula dentro del client component sobre la lista filtrada, así siempre es coherente. |

## Qué **no** entra en este spec

- Perfil real del niño y formulario de alta.
- BD/persistencia y vinculación de padres.
- Responsive/móvil.

Cada uno, si aterriza, va en su propio spec.
