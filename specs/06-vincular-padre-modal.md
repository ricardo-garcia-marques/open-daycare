# SPEC 06 — Modal Vincular padre

> **Estado:** Implementado
> **Depende de:** SPEC 03, SPEC 05
> **Fecha:** 2026-10-17
> **Objetivo:** Modal superpuesto "Vincular padre" (mockup `references/pantallas/vincular-padre.dc.html`) lanzado desde el enlace "Vincular otro padre" de `/kids/[id]`, con validación bloqueante y alta persistente del padre como invitación pendiente en el store.

## Alcance

**In:**

- Modal cliente `app/(components)/link-parent-modal.tsx` replicando la card del mockup (ancho máx 480px, fondo `#FBF4EC`, borde `#ECE0D0`, radio 24px): cabecera con título "Vincular padre" (Fredoka 600, 18px), subtítulo "a {nombre del niño}" y botón de cierre ✕ (34px, `#F0E6D8`); banner informativo azul (`#E3ECFB`, texto `#3F5694`); campos NOMBRE DEL PADRE/MADRE y EMAIL; chips de PARENTESCO Mamá/Papá/Tutor/a (pill redondeado, seleccionado con borde `#9FB8EC` y fondo `#CCD8F4`); box del código de invitación (`#FBF1D6`, borde dashed `#E6D08A`, código "7K4P9" en Fredoka 34px con letter-spacing, "Vence en 7 días") y botón "Enviar invitación" con gradiente `#F4977E → #EE8164`.
- **Código de invitación fijo**: "7K4P9" siempre, decisión explícita — no se genera aleatorio.
- **Sin selección inicial de parentesco**: los tres chips arrancan deseleccionados.
- Overlay modal: backdrop oscuro semitransparente; cierre con Escape, click en backdrop y botón ✕.
- **Validación bloqueante** (patrón SPEC 05): "Enviar invitación" deshabilitado hasta tener nombre no vacío, email con formato válido y parentesco elegido; mensajes de error visibles bajo el campo.
- **Bloqueo de duplicados**: si el nombre (comparado case-insensitive, sin espacios sobrantes) ya existe en `linkedParents` del niño, mensaje de error y botón deshabilitado.
- Al enviar: alta en el store vía nueva acción `addLinkedParent(kidId, parent)` de `lib/kids-store.tsx` con `status: "pending"`, derivando `role` del parentesco, `initial` (primera letra) y colores de avatar de la paleta fija rotatoria (`AVATAR_PALETTE`) igual que SPEC 05. El email se valida al escribir pero **no se persiste** (ver Decisiones).
- El modal se cierra, navega de vuelta a `/kids/[id]` y el nuevo padre aparece en "PADRES VINCULADOS" con badge **PENDIENTE** (el perfil ya soporta ese estado); persiste tras recargar por write-through en localStorage `opendaycare:kids:v1`.
- El enlace "Vincular otro padre" de `app/(components)/kid-profile.tsx` deja de ser `<Link>` a la ruta y pasa a abrir el modal.
- Eliminar el stub `app/kids/[id]/vincular-padre/page.tsx` (la ruta `vincular-padre` deja de existir → 404).

**Fuera de alcance (specs futuros):**

- Envío real de correo y generación de códigos por invitación.
- Cuentas de familia reales / activación con código real (el flujo `/activate-account` del SPEC 04 sigue demo).
- Reenviar, revocar o cambiar estado de una invitación (pending → active).
- Responsive/móvil (solo desktop, referencia 1280px).

## Modelo de datos

```ts
// lib/kids-store.tsx — acción nueva (reutiliza LinkedParent de lib/mock-kids.ts, sin cambios de shape)
addLinkedParent(kidId: string): void
// crea { name, role, status: "pending", initial, avatarBgColor } y lo agrega
// al final de kid.linkedParents, con write-through en localStorage opendaycare:kids:v1
```

Estado local efímero del formulario (client component, no persiste):

```ts
{ name: "", email: "", relationship: null as "Mamá" | "Papá" | "Tutor/a" | null }
```

## Plan de implementación

1. Agregar `addLinkedParent(kidId)` a `lib/kids-store.tsx` con la derivación de `role`/`initial`/avatar y write-through. Manual: `npx tsc --noEmit` limpio.
2. Crear `app/(components)/link-parent-modal.tsx` con la card fiel al mockup y cierre por ✕/Escape/backdrop, montado temporalmente al abrir el enlace de `/kids/[id]` (sin persistir todavía). Manual: la card coincide visualmente a 1280px y los tres cierres funcionan.
3. Implementar la validación bloqueante (nombre, formato de email, parentesco) con mensajes de error y el botón deshabilitado; agregar el chequeo de duplicados por nombre. Manual: "Diego Fernández" contra Mateo marca duplicado y deshabilita; un nombre nuevo habilita al completar todo.
4. Conectar "Enviar invitación" a `addLinkedParent`, cerrar el modal y volver a `/kids/[id]`; el nuevo padre aparece con badge PENDIENTE. Reemplazar el enlace de `kid-profile.tsx` por el disparador del modal y eliminar `app/kids/[id]/vincular-padre/page.tsx`. Manual: flujo completo desde el perfil y persistencia tras F5.
5. Verificación final: `npm run dev` + Playwright a 1280px — flujo completo `perfil → Vincular otro padre → modal → validar → duplicado de "Lucía Fernández" rechazado → invitar "María López" → PENDIENTE en el perfil → persiste tras F5` sin errores de consola; `npm run lint` y `npx tsc --noEmit` limpios. Artefactos en `.playwright-mcp/`.

## Criterios de aceptación

- [x] "Vincular otro padre" abre el modal sobre `/kids/[id]` y la ruta `/kids/[id]/vincular-padre` ya no existe (404).
- [x] El modal coincide con el mockup (card `#FBF4EC` radio 24px, banner azul, código "7K4P9" con box amarillo dashed, botón con gradiente).
- [x] "Mamá", "Papá" y "Tutor/a" arrancan deseleccionados y la selección es exclusiva.
- [x] "Enviar invitación" está deshabilitado sin nombre, con email inválido o sin parentesco, y se habilita al completar los tres con datos válidos.
- [x] Vincular "Lucía Fernández" a Mateo (ya existente) muestra error de duplicado y mantiene el botón deshabilitado.
- [x] Enviar cierra el modal, vuelve a `/kids/[id]`, el padre nuevo aparece con badge PENDIENTE y persiste tras recargar (localStorage `opendaycare:kids:v1`).
- [x] ✕, Escape y click en backdrop cierran el modal sin guardar ni pedir confirmación.
- [x] `npm run lint` y `npx tsc --noEmit` pasan sin errores.

## Decisiones

- **Sí:** modal superpuesto en vez de pantalla dedicada. Decisión del usuario; el stub de ruta se elimina para no dejar rutas muertas.
- **Sí:** alta persistente con `status: "pending"`. El perfil ya renderiza el badge PENDIENTE, así que el flujo queda completo con costo mínimo.
- **Sí:** código fijo "7K4P9". Decisión del usuario; coincide con SPEC 04 y ninguna pieza consume ese código en el flujo demo.
- **Sí:** validación bloqueante y duplicados por nombre. Mantiene el patrón del SPEC 05 y evita filas duplicadas en "PADRES VINCULADOS".
- **Sí:** el email no se persiste. `LinkedParent` no tiene campo email y agregarlo solo para completar el modelo inventaría datos que ninguna pantalla muestra; la dedupe se hace por nombre.
- **Sí:** derivar `role`/`initial`/avatar con la misma paleta del SPEC 05 para consistencia visual.
- **No:** generación aleatoria de códigos, estado de éxito en la card, email real: descartados por costo innecesario en el flujo demo.

## Qué **no** entra en este spec

- Envío real de correos y códigos dinámicos.
- Cuentas de familia y activación real.
- Gestión de invitaciones (reenviar/revocar/activar).
- Responsive/móvil.

Cada uno, si aterriza, va en su propio spec.
