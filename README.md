# Cuba · La hoja de ruta

Aplicación editorial estática construida con Next.js y desplegada exclusivamente en GitHub Pages.

El código mantenido vive en `next/` y sigue fronteras SOLID verificadas automáticamente: dominio, configuración, catálogo de contenido, búsqueda, renderizado, autoría y adaptadores de infraestructura están separados por contratos explícitos.

## Desarrollo

```bash
cd next
corepack enable
pnpm install --frozen-lockfile
pnpm check
pnpm test:e2e
```

La versión de producción se publica únicamente desde `main` mediante `.github/workflows/deploy-pages.yml`.
