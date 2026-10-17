# SPEC 04 — Pantallas Login (/login) y Activar cuenta (/activate-account)

> **Estado:** Aprobado
> **Depende de:** SPEC 01
> **Fecha:** 2026-10-17
> **Objetivo:** Portar los mockups `references/pantallas/login.dc.html` (sin el selector Personal/Familia) y `activar-cuenta.dc.html` como rutas `/login` y `/activate-account`, a pantalla completa y sin sidebar.

## Alcance

**In:**

- Reemplazo del stub `app/login/page.tsx` por la pantalla real del mockup: panel izquierdo degradado (`#F6A98E → #EC7E62`) con círculos decorativos, logo OpenDayCare, titular "El día de cada niño, compartido con su familia.", pie "🌿 Guardería Sala Soles"; columna derecha con formulario (EMAIL, CONTRASEÑA, "¿Olvidaste tu contraseña?", botón "Iniciar sesión" con gradiente, y pie "¿Te invitó la guardería? Activá tu cuenta").
- **El selector "INGRESO COMO" (Personal / Familia) NO se implementa**: el login es único.
- Nueva ruta `app/activate-account/page.tsx` con el mockup de activar cuenta: logo cuadrado con gradiente, titular "Bienvenida a OpenDayCare", card de invitación (avatar "M" azul `#A9D9E8`, "Mateo · Sala Soles"), campos CÓDIGO DE INVITACIÓN (5 chars, espaciado, Fredoka), EMAIL y CREAR CONTRASEÑA, checkbox de consentimiento de fotos (fondo `#FBF1D6`) y botón "Activar mi cuenta".
- Ambas páginas **sin sidebar**, a pantalla completa (rutas fuera del layout con sidebar que usan `/` y `/kids`).
- Inputs **escribibles** (client components con `useState`), con valores iniciales del mockup precargados; **sin validación**: el submit solo navega.
- Navegación: "Iniciar sesión" → `/` (Feed); "Activá tu cuenta" → `/activate-account`; "Activar mi cuenta" → `/login`; "¿Ya tenés cuenta? Iniciar sesión" → `/login`.
- "¿Olvidaste tu contraseña?": enlace visual sin destino (como en el mockup, sin interacción).
- Reutilizar fuentes/tokens globales ya configurados en `app/layout.tsx` y `app/globals.css` (Fredoka/Nunito).

**Fuera de alcance (specs futuros):**

- Autenticación real, validación de credenciales, errores de login.
- Selector Personal/Familia y sus destinos (`familia-feed`).
- Recuperación de contraseña real.
- Lógica real de códigos de invitación y persistencia de cuentas.
- Responsive/móvil (solo desktop, referencia 1280px).

## Modelo de datos

Esta feature no introduce nuevas estructuras de datos: no hay mock que extender ni persistencia. Las únicas estructuras son el estado local efímero de los formularios:

```ts
// estado local de cada formulario (client component, no persiste)
// login
{ email: "caro@opendaycare.com", password: "" }
// activate-account
{ code: "7K4P9", email: "lucia.fernandez@gmail.com", password: "contraseña", photoConsent: true }
```

## Plan de implementación

1. Crear `app/activate-account/page.tsx` con el layout de pantalla completa (sin sidebar). Verificación manual: la ruta renderiza y `tsc` pasa limpio.
2. Implementar la columna derecha del formulario de `/login` como client component (inputs `email` y `password` con `useState`) y conectar el botón a `/` con `next/link`. Manual: se puede escribir en los campos y el botón navega al Feed.
3. Implementar el panel izquierdo con gradiente, círculos decorativos y textos del mockup. Manual: `/login` coincide visualmente con el mockup a 1280px, sin el bloque "INGRESO COMO".
4. Enlazar el pie "¿Te invitó la guardería? Activá tu cuenta" a `/activate-account`, y "¿Ya tenés cuenta? Iniciar sesión" de vuelta a `/login`. Manual: ambos enlaces navegan en ambas direcciones.
5. Implementar `app/activate-account/page.tsx`: card de invitación, campos (el de código con espaciado de letras y Fredoka), checkbox del consentimiento (interactivo, inicialmente marcado) y botón "Activar mi cuenta" → `/login`. Manual: la pantalla coincide con el mockup y el botón navega.
6. Verificación final: `npm run dev` + Playwright a 1280px comparando contra `references/screenshots/` (si existen las capturas), navegación completa `login → activate → login → feed` sin errores de consola; `npm run lint` y `npx tsc --noEmit` limpios. Artefactos en `.playwright-mcp/`.

## Criterios de aceptación

- [x] `/login` renderiza sin errores de consola y coincide con el mockup (colores, tipografías Fredoka/Nunito, panel izquierdo con gradiente y círculos). <!-- PASS: 0 errores consola en .playwright-mcp/spec-04-login-console.log; panel con gradiente 155deg rgb(246,169,142)->rgb(236,126,98), 2 círculos bg-white/10, tipografía Fredoka/Nunito, captura en .playwright-mcp/spec-04-login.png -->
- [x] `/login` NO muestra el bloque "INGRESO COMO" (Personal/Familia). <!-- PASS: evaluado en DOM y snapshot .playwright-mcp/spec-04-login-snapshot.yml; no existen elementos ni textos de selector de rol -->
- [x] Los inputs de email y contraseña de `/login` aceptan texto y arrancan con el email `caro@opendaycare.com` precargado. <!-- PASS: input email inicia con "caro@opendaycare.com", password vacío; ambos aceptan texto interactivo vía useState -->
- [x] El botón "Iniciar sesión" navega a `/` (Feed) sin validación. <!-- PASS: click en botón navega a http://localhost:3000/ incluso con contraseña vacía -->
- [x] "¿Te invitó la guardería? Activá tu cuenta" navega a `/activate-account`. <!-- PASS: click en enlace navega a http://localhost:3000/activate-account -->
- [x] `/activate-account` renderiza sin errores de consola y coincide con el mockup (card "Mateo · Sala Soles", código `7K4P9`, checkbox verde marcado). <!-- PASS: 0 errores consola en .playwright-mcp/spec-04-activate-account-console.log; avatar M rgb(169,217,232)/rgb(31,122,147), código Fredoka letter-spacing 3px, checkbox rgb(95,185,126) y label rgb(251,241,214), captura en .playwright-mcp/spec-04-activate-account.png -->
- [x] El checkbox de consentimiento se marca/desmarca al hacer clic. <!-- PASS: inicia en true; click en label pasa a false; segundo click regresa a true -->
- [x] El botón "Activar mi cuenta" navega a `/login` sin validación. <!-- PASS: enlace/botón navega directamente a http://localhost:3000/login -->
- [x] "¿Ya tenés cuenta? Iniciar sesión" navega a `/login`. <!-- PASS: enlace en footer navega a http://localhost:3000/login -->
- [x] Ni `/login` ni `/activate-account` muestran el sidebar. <!-- PASS: document.querySelector('aside') es null en ambas rutas, layout full-screen sin sidebar -->
- [x] "¿Olvidaste tu contraseña?" es visual pero no navega a ninguna página. <!-- PASS: es un <span> sin enlace <a>; al hacer click la URL no cambia -->
- [x] `npm run lint` y `npx tsc --noEmit` pasan sin errores. <!-- PASS: npm run lint y npx tsc --noEmit ejecutados con código 0 y 0 errores -->

## Decisiones

- **Sí:** `app/login` (reemplaza el stub existente) y `app/activate-account` en inglés como rutas, manteniendo la convención de `/kids` del SPEC 02.
- **Sí:** omitir el selector Personal/Familia. Es la decisión del usuario; el login queda único con destino directo al Feed.
- **Sí:** botones como mocks navegables sin validación. El auth real no existe; validar campos vacíos inventaría UX sin backend y rompería el flujo demo.
- **Sí:** valores iniciales precargados idénticos al mockup (email, código `7K4P9`, contraseña, consentimiento marcado) para que la comparación visual contra el diseño sea fiel.
- **Sí:** inputs escribibles con `useState` (client components). Los inputs muertos del mockup HTML se convierten en controles reales por poco costo.
- **No:** destino `/familia-feed` ni `/feed` reales. Ambos flujos cierran en pantallas de la app ya existentes (Feed y login) para que la navegación quede completa sin crear stubs nuevos.
- **No:** auth real, BD, responsive: fuera de alcance.

## Qué **no** entra en este spec

- Autenticación real y recuperación de contraseña.
- Selector Personal/Familia y `familia-feed`.
- Lógica de invitaciones y BD/persistencia.
- Responsive/móvil.

Cada uno, si aterriza, va en su propio spec.
