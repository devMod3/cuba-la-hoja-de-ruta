# ZenBlog Next

Parallel modernization line for La hoja de ruta.

## Safety invariant

The current Blogger/ZenBlog production baseline is not modified by work in this directory. Migration work proves parity before any cutover.

## Stack baseline

- Node.js 24 LTS
- Next.js 16.2 Active LTS (App Router)
- React 19.2
- TypeScript 6.0 in strict mode
- ESLint 10 with direct Next.js and React Hooks plugins
- pnpm 11 workspace with reviewed dependency build allowlist
- Zod runtime validation at external boundaries
- Vitest for unit/contract tests
- Playwright for Chromium, Firefox, WebKit and mobile WebKit

## Architecture

`apps/web` owns rendering and routing. `packages/domain` owns stable domain contracts. `packages/cms-blogger` translates Blogger data into domain objects. `packages/search-core` owns framework-free retrieval semantics. `packages/zrp-adapter` owns the integration contract with the independent Zen Radio Player.

Framework code must not leak into domain packages.
