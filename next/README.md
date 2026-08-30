# ZenBlog Next

Aplicación estática Next.js de **La hoja de ruta**, publicada exclusivamente en GitHub Pages.

## Workspace

- `apps/web`: App Router, presentación y composition roots.
- `packages/domain`: contratos de dominio.
- `packages/content-catalog`: catálogo editorial propiedad del repositorio.
- `packages/site-config`: perfil, vocabulario y metadata compartida.
- `packages/content-renderer`: sanitización de HTML editorial.
- `packages/search-core`: búsqueda portable.
- `packages/authoring-core`: contratos de autoría.
- `packages/authoring-github`: adaptador GitHub Contents API.
- `packages/zrp-adapter`: integración aislada de ZRP.

## Desarrollo

Requiere Node `>=24.19.0 <25` y pnpm `>=11.22.0 <12`; CI fija Node `24.19.0` y pnpm `11.22.0` para builds reproducibles.

```bash
pnpm install --frozen-lockfile
pnpm check
pnpm test:e2e
```

`pnpm check` aplica TypeScript estricto, SOLID/boundaries, supply chain, cobertura, build estático, SEO y performance. Playwright usa `retries: 0` en Chromium, Firefox, WebKit y Mobile WebKit.
