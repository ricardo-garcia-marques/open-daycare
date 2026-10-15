# SPEC 03 — Pantalla Perfil del Niño (/kids/[id])

> **Estado:** Aprobado
> **Depende de:** SPEC 02
> **Fecha:** 2026-10-15
> **Objetivo:** Portar el mockup `references/pantallas/perfil-nino.dc.html` como la ruta `/kids/[id]` con datos dinámicos para los 8 niños, padres vinculados detallados y navegación completa vía stubs.

## Alcance

**In:**

- Reemplazo del stub `app/kids/[id]/page.tsx` por la pantalla real del mockup: avatar circular grande (84px), nombre + edad + sala, card de "Alergias y notas" (`#FBDAD6`), card de datos (fecha de nacimiento, sala, ingreso), botón oscuro "Resumen del día" y panel "PADRES VINCULADOS" con badges ACTIVA/PENDIENTE.
- Botón "Editar" arriba a la derecha, "Volver a Niños" arriba del contenido (enlaza a `/kids`).
- Extensión del mock `lib/mock-kids.ts`: campos nuevos en `Kid` (`birthDate`, `enrolledAt`, `allergyNote`, `linkedParents` como lista detallada).
- Datos coherentes generados para los 8 niños (Mateo replica exactamente el mockup).
- Enlaces "Editar", "Vincular otro padre" y "Resumen del día" → stubs "pantalla pendiente".
- Reutilización de `app/(components)/sidebar.tsx` (Niños activo por `usePathname`).

**Fuera de alcance (specs futuros):**

- Formulario real de editar niño (la pantalla a la que apunta "Editar").
- Vinculación real de padres (pantalla `vincular-padre`).
- Pantalla real "Resumen del día".
- BD/persistencia y responsive/móvil (solo desktop, 1280px).

## Modelo de datos

```ts
// lib/mock-kids.ts (extendido)
export type ParentLinkStatus = "active" | "pending";

export interface LinkedParent {
  name: string;           // "Lucía Fernández"
  role: string;           // "Mamá" | "Papá"
  status: ParentLinkStatus;
  initial: string;        // "L"
  avatarBgColor: string;  // "#C9B6E8"
}

export interface Kid {
  id: string;
  name: string;
  ageInYears: number;
  allergies: string[];
  initial: string;
  avatarBgColor: string;
  avatarTextColor: string;
  birthDate: string;      // "12 mar 2022"
  enrolledAt: string;     // "feb 2025"
  room: string;           // "Soles"
  allergyNote: string;    // "Alergia al maní. Evitar frutos secos. Lleva inhalador en la mochila." | ""
  linkedParents: LinkedParent[]; // reemplaza al contador: derivado de .length en /kids
}
```

Texto de estado del padre ("activa", "invitación enviada") derivado de `status` con mapa de presentación; badges ACTIVA/PENDIENTE con colores `#CFEBD8`/`#3E9B6C` y `#F7E7A6`/`#9A7B1E`. `/kids` sigue mostrando el contador derivado de `linkedParents.length`, sin duplicar datos. Sin persistencia: Server Component que renderiza el mock por `params.id`.

Todo el código (tipos, campos, componentes, variables) va en inglés según las reglas del proyecto. Los textos visuales quedan en español en la UI.

## Plan de implementación

1. Extender `lib/mock-kids.ts`: tipos `LinkedParent`/`ParentLinkStatus`, campos nuevos, datos para Mateo (del mockup) y los otros 7. Ajustar `app/kids/page.tsx` para derivar el contador de `.length`. Manual: `/kids` sigue idéntica, `tsc` limpio.
2. `app/kids/[id]/page.tsx`: layout de dos columnas (izquierda flexible min 300px, derecha fija 300px), "Volver a Niños", cabecera con avatar/nombre/edad/sala y botón "Editar". Manual: `/kids/mateo-fernandez` coincide con el mockup.
3. Card "Alergias y notas" (solo si hay nota) y card de datos (nacimiento, sala, ingreso). Manual: Mateo muestra la card roja; un niño sin alergia no.
4. Columna derecha: botón "Resumen del día" y panel PADRES VINCULADOS con badges y enlace "Vincular otro padre". Manual: badges y estados correctos para cada niño.
5. Navegación: "Editar" → `/kids/agregar` (stub existente), "Resumen del día" → `/day-summary`, "Vincular otro padre" → `/kids/[id]/vincular-padre`, ambos stubs "pantalla pendiente". Manual: los 3 enlaces navegan.
6. Caso `id` inexistente → `notFound()` de Next. Manual: `/kids/xxx` muestra 404.

## Criterios de aceptación

- [ ] `/kids/mateo-fernandez` renderiza sin errores de consola y coincide con el mockup (colores, tipografía, layout 2 columnas).
- [ ] "Volver a Niños" navega a `/kids` y el sidebar resalta Niños.
- [ ] Mateo muestra la card de alergias con el texto exacto "Alergia al maní. Evitar frutos secos. Lleva inhalador en la mochila.".
- [ ] Mateo muestra 2 padres: Lucía (badge ACTIVA) y Diego (badge PENDIENTE, "invitación enviada").
- [ ] Los 8 niños tienen perfil funcional con sus propios datos (nombre, edad, sala, ingreso, padres).
- [ ] Un niño sin alergias ni notas no muestra la card roja.
- [ ] "Editar", "Vincular otro padre" y "Resumen del día" navegan a sus stubs "pantalla pendiente".
- [ ] `/kids/xxx` (id inexistente) muestra 404 en vez de romper.
- [ ] `/kids` sigue mostrando el contador correcto de padres vinculados por niño (derivado de la nueva estructura).
- [ ] `npm run lint` y `npx tsc --noEmit` pasan sin errores.

## Decisiones

- **Sí:** reemplazar el contador `linkedParents: number` por `LinkedParent[]` con `status`. El perfil necesita nombre/rol/estado; el contador se deriva de `.length` para no duplicar.
- **Sí:** reutilizar el sidebar existente. Regla del proyecto: siempre reutilizar componentes.
- **Sí:** datos inventados coherentes para los otros 7 niños; Mateo replica el mockup al pie de la letra para la comparación visual.
- **Sí:** stubs para Editar/Resumen del día/Vincular padre, igual que SPEC 01/02. La navegación queda completa sin construir pantallas fuera de alcance.
- **Sí:** mantener el patrón SPEC 01/02 de código interno en inglés con textos de UI en español vía mapas de presentación.
- **No:** BD, edición real, vinculación real, responsive: fuera de alcance según el usuario.

## Qué **no** entra en este spec

- Formulario de editar/agregar niño real.
- Pantalla de vinculación de padres real.
- Pantalla real "Resumen del día".
- Responsive/móvil.

Cada uno, si aterriza, va en su propio spec.
