<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->


## MCPs

- Playwright Screenshots y cualquier cosa relacionada con Playwright tiene que estar en la carpeta .playwright-mcp
- Contex7 usada para obtener la documentacion actualizada del framework en lugar de los datos de entrenamiento.
  

## Commands

- `npm run dev` — dev server (Turbopack). `npm run build`, `npm run lint`, `npx tsc --noEmit` for typecheck.
- No test framework is configured.

## Stack quirks

- Next.js 16.4.1 with `cacheComponents: true` and `partialPrefetching: true` in `next.config.ts` — caching/prefetch behavior differs from older Next.js docs. Check `node_modules/next/dist/docs/` for the version's actual API.
- Tailwind CSS v4 is wired through a Turbopack loader rule in `next.config.ts` (no `postcss.config` or `tailwind.config`). Global styles are in `app/globals.css`.
- App Router (`app/`) only; no `pages/`.
- `next-env.d.ts` and `.next/` are gitignored — typecheck errors from a missing `next-env.d.ts` are fixed by running `npm run dev` or `npm run build`.

## Project context

- Spanish-language daycare app ("open-daycare"). `app/` is still create-next-app scaffolding; the intended screens live as design mockups in `references/pantallas/*.dc.html` and `references/screenshots/`. Note: only macOS AppleDouble `._*` metadata files survived the copy — the `.dc.html`/`.png` files may be missing placeholders; treat them as design intent, don't open them as HTML.
- Playwright MCP artifacts (screenshots, snapshots, console logs) go to `.playwright-mcp/` (gitignored).

## Supabase

Este proyecto usa Supabase como backend (base de datos Postgres, Auth, Storage, etc.).

- Para CUALQUIER tarea relacionada con Supabase, cargar primero la skill `supabase` (esquema, RLS, auth, migraciones,Edge Functions, debugging, logs).
- Antes de cambiar el esquema, inspeccionar las tablas existentes (`supabase_list_tables`) y revisar logs/advisories (`supabase_get_advisors`) al depurar.
- Para escribir o modificar cualquier cosa en Postgres (tablas, columnas, tipos, RLS, índices, triggers, migraciones, performance), cargar primero la skill `supabase-postgres-best-practices`.
- Usar `supabase_execute_sql` para consultas/DML y migraciones DDL con cuidado — se aplican directamente en el proyecto remoto. Crear migraciones locales con Supabase CLI cuando sea posible.
- Revisar `supabase_get_advisors` (security y performance) después de cambios DDL para detectar RLS faltante u otros problemas.
- Nunca leer archivos del servidor ni ejecutar comandos OS vía SQL (`COPY FROM PROGRAM`, `pg_read_file`, etc.).

## Skills

- /spec Usaremos esta habilidad para crear las especificaciones.
- /spec-impl Usaremos esta skill para hacer las implementaciones.
- /supabase Skill obligatoria para tareas con Supabase (DB, Auth, Storage, Edge Functions, Realtime, RLS, debugging, logs).
- /supabase-postgres-best-practices Skill obligatoria antes de escribir o cambiar SQL/esquema en Postgres (tipos, migraciones, RLS, índices, performance).

## Spec Driven Development - Verificación

- **Agente `spec-verifier`** (subagent): verifica specs en `specs/*.md` tras su implementación. Comprueba cada criterio de aceptación contra el código real (`tsc`, `lint`, `npm run dev` + Playwright MCP a 1280px, navegación, DOM), marca los checkboxes `[x]`/`[ ]` del spec según resultados reales y detiene el dev server al terminar. Artefactos en `.playwright-mcp/`.
- **Comando verify spec**: para verificar un spec, invocar el task tool con `subagent_type: "spec-verifier"`, pasando la ruta del spec (ej. `specs/01-feed-home.md`) y en el prompt: contexto del proyecto (Next.js 16 + `cacheComponents`, Tailwind v4 vía Turbopack loader), comandos de verificación, reglas de artefactos Playwright, el resumen de lo que exige el spec y la instrucción de actualizar los checkboxes del spec según resultados reales (PASS/FAIL/UNVERIFIABLE con evidencia).

## Reglas de codigo
- usar codigo limpio, nombres, funciones, variables, etc. en ingles