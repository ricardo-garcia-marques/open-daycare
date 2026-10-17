# SPEC 05 — Modal Agregar/Editar niño

> **Estado:** Aprobado
> **Depende de:** SPEC 02, SPEC 03
> **Fecha:** 2026-10-17
> **Objetivo:** Modal superpuesto "Agregar niño" (mockup `references/pantallas/agregar-nino.dc.html`) lanzado desde los botones de agregar niño de las pantallas implementadas, con máscara que exija una fecha de nacimiento válida y alta persistente en localStorage.

## Alcance

**In:**

- Modal cliente `app/(components)/add-kid-modal.tsx` replicando el card del mockup (ancho máx 520px, fondo `#FBF4EC`, borde `#ECE0D0`, radio 24px, sombra suave): cabecera con "Cancelar" (`#94887B`), título "Agregar niño" (Fredoka 600) y "Guardar" (`#D9583C`); campos NOMBRE COMPLETO, FECHA DE NACIMIENTO + SALA en fila de dos columnas, ALERGIAS (ETIQUETAS) y NOTAS MÉDICAS (textarea).
- Overlay modal: backdrop oscuro semitransparente; cierre con Escape y click en el backdrop.
- **Modo edición**: el botón "Editar" de `/kids/[id]` (que hoy apunta al stub `/kids/agregar`) abre el mismo modal precargado con los datos del niño; Guardar actualiza; el título de cabecera pasa a "Editar niño".
- **Máscara de fecha** `dd/mm/aaaa`: auto-inserta `/`, acepta solo dígitos, día 01–31 válido para el mes (incluye año bisiesto), mes 01–12, año de 4 dígitos. **La fecha debe ser una fecha real y válida** (p. ej. `31/02/2023` y `05/13/2025` son inválidas) y **pasada** (no futura).
- Con fecha incompleta, inválida o futura: mensaje de error visible bajo el campo y **Guardar deshabilitado** — el modal queda abierto para corregir.
- SALA como **select nativo estilizado** con las opciones Soles/Estrellas/Luna y "Soles" por defecto (chevron como en el mockup, campo semibold).
- ALERGIAS como texto libre ("Ej. Maní, Lactosa") → parseo por coma (trim, vacíos eliminados) → `allergies: string[]`.
- Al guardar, derivación automática de los campos que el formulario no pide: `id` (slug del nombre), `initial` (primera letra), colores de avatar (paleta fija rotatoria), `birthDate` convertido al formato "12 mar 2022", `enrolledAt` = mes/año actuales en formato "oct 2026", `linkedParents: []`, `allergyNote` = texto de notas médicas.
- Fuente de datos compartida `lib/kids-store.ts`: hook/contexto cliente con override de localStorage (clave `opendaycare:kids:v1`) sobre `KIDS` de `lib/mock-kids.ts`; **localStorage manda** sobre el mock al hidratar; escritura inmediata (write-through) en cada alta/edición.
- Consumo del store en `/kids` y `/kids/[id]`: el nuevo niño aparece **al principio** de la lista y su perfil `/kids/[id]` funciona con los datos derivados.
- Eliminar el stub `app/kids/agregar/page.tsx` (la ruta deja de existir → 404); los botones "Agregar niño" de `/kids` y `/kids/[id]` abren el modal en vez de navegar.
- Cancelar, Escape y click en backdrop cierran el modal sin guardar y sin confirmación, descartando lo escrito.

**Fuera de alcance (specs futuros):**

- Vinculación de padres desde el alta (el niño nuevo nace con 0 padres; el enlace "Vincular otro padre" ya existe).
- Backend/BD real y multi-sala por guardería.
- Eliminar niños desde la lista `/kids` (solo alta/edición vía modal).
- Responsive/móvil (solo desktop, referencia 1280px).

## Modelo de datos

```ts
// lib/kids-store.ts (nuevo)
const STORAGE_KEY = "opendaycare:kids:v1";

// Estado compartido: Kid[] (reutiliza el Kid de lib/mock-kids.ts, sin cambios de shape).
// Orden: primero agregados/actualizados, luego el resto según el mock.
// Write-through: cada alta/edición hace localStorage.setItem en el mismo tick.
// Al hidratar: si existe la clave en localStorage, reemplaza por completo al mock;
// si no existe, se usa KIDS tal cual.
```

Estado local efímero del formulario (client component, no persiste):

```ts
{ fullName: "", birthDate: "", room: "Soles", allergiesRaw: "", medicalNotes: "" }
// birthDate es el string enmascarado "dd/mm/aaaa" (vacío al abrir en modo agregar)
```

## Plan de implementación

1. Crear `lib/kids-store.ts`: hook/contexto cliente con override localStorage sobre `KIDS` (clave `opendaycare:kids:v1`), expone la lista, `saveKid()` (alta + edición) y `getKidById()`. Manual: `tsc` limpio.
2. Crear `app/(components)/add-kid-modal.tsx` con el card fiel al mockup. Manual: se puede montar temporalmente en `/kids` y el card coincide visualmente; Cancelar/Escape/backdrop lo cierran.
3. Implementar la máscara de fecha con validación (fecha real, pasada) y mensaje de error visible. Manual: escribir `12032` produce `12/03/2…`; `31/02/2023` y una fecha futura marcan error y deshabilitan Guardar.
4. Sustituir la lista de `/kids` para consumir el store: el botón "Agregar niño" abre el modal, el alta aparece al principio y persiste tras recargar. Eliminar `app/kids/agregar/page.tsx`. Manual: alta demo persiste tras F5 y `/kids/agregar` devuelve 404.
5. `/kids/[id]`: el cuerpo pasa a un componente cliente que lee el store; "Editar" abre el modal precargado y Guardar actualiza y persiste. Manual: editar la fecha de Mateo se refleja tras recarga; el niño nuevo tiene perfil funcional vía slug.
6. Verificación final: `npm run dev` + Playwright a 1280px — flujo completo `agregar desde /kids → modal → guardar → aparece al principio → perfil OK → editar → persiste tras F5` sin errores de consola; `npm run lint` y `npx tsc --noEmit` limpios. Artefactos en `.playwright-mcp/`.

## Criterios de aceptación

- [x] <!-- PASS: app/kids/page.tsx:47 y app/(components)/kid-profile.tsx:182 abren AddKidModal; app/kids/agregar/page.tsx eliminado y /kids/agregar renderiza el not-found (KidProfile llama notFound() en app/(components)/kid-profile.tsx:136-138). Nota: en dev Next responde HTTP 200 aun para rutas not-found, pero el DOM es la página 404 (evidencia: .playwright-mcp/spec-05-404-agregar.png) --> El botón "Agregar niño" de `/kids` y el de `/kids/[id]` abren el modal; ya no navegan a `/kids/agregar` y esa ruta devuelve 404.
- [x] <!-- PASS: getComputedStyle en Playwright: card bg rgb(251,244,236)=#FBF4EC, radius 24px, borde #ECE0D0, ancho 520px; Cancelar #94887B w700, título Fredoka w600, Guardar #D9583C w800 (deshabilitado a 0.4 mientras inválido); etiquetas 12px/800/#94887B. Coincide línea a línea con references/pantallas/agregar-nino.dc.html (evidencia: .playwright-mcp/spec-05-modal-empty.png) --> El modal coincide con el mockup (card `#FBF4EC` radio 24px, cabecera Cancelar/Agregar niño/Guardar con los colores del mockup, 4 campos con sus estilos).
- [x] <!-- PASS: maskBirthDateInput (app/(components)/add-kid-modal.tsx:55) al tipear "12032" produce "12/03/2"; letras tipadas (abcXYZ) se descartan y el valor no cambia (evidencia: .playwright-mcp/spec-05-modal-filled.png) --> La fecha auto-inserta `/` y acepta solo dígitos mientras se escribe.
- [x] <!-- PASS: 31/02/2023 → "Esa fecha no existe en el calendario." + Guardar disabled (.playwright-mcp/spec-05-invalid-date-31-02-2023.png); 15/12/2030 → "La fecha de nacimiento no puede ser futura." + Guardar disabled (.playwright-mcp/spec-05-future-date.png); incompleta → "Completá la fecha con el formato dd/mm/aaaa.". Matiz: la máscara autocorrige mes>12 al tipear/pegar (05/13/2025 se convierte en 05/12/2025), por lo que en UI nunca aparece el error de mes; la función validateBirthDate (lib/kids-store.tsx:71-73) sí devuelve "El mes debe estar entre 01 y 12." para ese string --> `31/02/2023`, `05/13/2025` y una fecha futura muestran mensaje de error visible y **Guardar queda deshabilitado** (no cierra ni guarda).
- [x] <!-- PASS: Con nombre "Martina López" y fecha 12/03/2022 (real y pasada) Guardar pasa a habilitado (rgb(217,88,60)=#D9583C) y persiste la entidad (evidencia: .playwright-mcp/spec-05-modal-filled.png) --> Con fecha completa, real y pasada, Guardar se habilita y guarda normalmente.
- [x] <!-- PASS: select nativo en app/(components)/add-kid-modal.tsx:229-244 con opciones Soles/Estrellas/Luna y value="Soles" por defecto --> SALA es un select nativo con Soles/Estrellas/Luna y arranca en "Soles".
- [x] <!-- PASS: Guardar cierra el modal; "Martina López" queda primera en /kids y persiste tras F5 desde opendaycare:kids:v1 (9 entradas, sin duplicar) (evidencia: .playwright-mcp/spec-05-kids-list-persisted.png) --> Guardar cierra el modal, el niño aparece al principio de `/kids` y sigue ahí tras recargar (localStorage `opendaycare:kids:v1`).
- [x] <!-- PASS: "Maní, Lactosa" → allergies ["Maní","Lactosa"] en el store (verificado en localStorage); badge "MANÍ" en la card de /kids (kids-search.tsx:75 pinta allergies[0]) y precargado "Maní, Lactosa" al pulsar Editar (evidencia: .playwright-mcp/spec-05-modal-edit.png). En la ficha /kids/[id] se muestra allergyNote (kid-profile.tsx:199), no el array de etiquetas --> Escribir "Maní, Lactosa" en ALERGIAS produce `allergies: ["Maní", "Lactosa"]`, visible en el perfil del niño.
- [x] <!-- PASS: Derivados id "martina-lopez", initial "M", avatar #F4DC8E/#9A7B1E, birthDate "12 mar 2022", enrolledAt "oct 2026", linkedParents [] ; /kids/martina-lopez renderiza con datos derivados (evidencia: .playwright-mcp/spec-05-profile-new-kid.png) --> El nuevo niño tiene id-slug, initial y avatar derivados, `enrolledAt` del mes actual y 0 padres vinculados; su `/kids/[id]` funciona.
- [x] <!-- PASS: Editar abre el modal con título "Editar niño" y datos precargados; cambiar a sala Luna + notas y Guardar actualiza y persiste tras F5 (evidencia: .playwright-mcp/spec-05-modal-edit.png, .playwright-mcp/spec-05-profile-edited-persisted.png) --> "Editar" en `/kids/[id]` abre el modal precargado con título "Editar niño"; Guardar actualiza y persiste tras recargar.
- [x] <!-- PASS: Cancelar cierra el modal; tecla Escape cierra; click (mousedown) sobre el backdrop cierra. En los tres casos no se guarda (lo escrito se descarta; localStorage queda en 9) ni se pide confirmación --> Cancelar, Escape y click en backdrop cierran el modal sin guardar y sin confirmación.
- [x] <!-- PASS: npm run lint sin errores; npx tsc --noEmit limpio (requiere next-env.d.ts, que es gitignored y se genera al correr npm run dev/build según AGENTS.md) --> `npm run lint` y `npx tsc --noEmit` pasan sin errores.

## Decisiones

- **Sí:** localStorage como fuente única (`opendaycare:kids:v1`) que manda sobre el mock al hidratar. Persistencia coherente sin backend, centralizada en `lib/kids-store.ts`.
- **Sí:** modal superpuesto, no página. Es lo que pide el usuario ("modal") y el mockup es una card flotante, no una pantalla.
- **Sí:** modo edición reutilizando el mismo modal para el botón "Editar" de `/kids/[id]` (que ya apuntaba al stub que se elimina). Bajo costo y no deja el botón roto.
- **Sí:** la fecha debe ser una fecha real y pasada para habilitar Guardar (decisión del usuario en la revisión del spec; reemplaza la propuesta inicial de validación solo visual sin bloqueo). Es un requisito explícito y evita persistir datos inválidos en localStorage.
- **Sí:** derivar id/initial/avatar/enrolledAt/linkedParents automáticamente: el mockup no los pide y así no se añaden campos visuales ajenos al diseño.
- **No:** tocar el Feed. No consume `KIDS` (usa `mock-feed` y el texto "12 niños" es fijo); mostrar el conteo real merece spec propio.
- **No:** chips interactivos de alergias (texto libre → array), dropdown custom de sala (select nativo estilizado alcanza), confirmación al cancelar y eliminación de niños: descartados por costo innecesario en el flujo demo.

## Qué **no** entra en este spec

- Vincular padres desde el alta.
- Backend/BD y auth.
- Eliminar niños desde la lista.
- Responsive/móvil.

Cada uno, si aterriza, va en su propio spec.
