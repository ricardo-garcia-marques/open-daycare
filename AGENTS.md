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

## Spec Driven Development - Skills

- /spec Usaremos esta habilidad para crear las especificaciones.
- /spec-impl Usaremos esta skill para hacer las implementaciones.