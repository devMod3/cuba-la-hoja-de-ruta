# Quality gates

`pnpm check` es el gate canónico antes de merge/deploy y no permite warnings.

Incluye, en orden:

1. Prettier en modo check.
2. ESLint strict type-checked.
3. Fuente mantenida TypeScript/TSX-only.
4. Estándares de ingeniería del proyecto.
5. Fronteras arquitectónicas + SOLID/DIP.
6. Baseline de supply chain + peers + SBOM CycloneDX.
7. TypeScript de todos los paquetes y quality project.
8. Vitest con cobertura y umbrales inmutables.
9. Build estático de Next.
10. Verificación de todas las rutas de artículos.
11. Verificación SEO/ownership de GitHub Pages.
12. Presupuesto de performance.

El workflow de PR agrega además Playwright en Chromium, Firefox, WebKit y Mobile WebKit con `retries: 0`, más un ensayo de export con `basePath`.

El workflow de producción vuelve a ejecutar `pnpm check` antes de generar el artefacto Pages. CI verde de otro SHA no autoriza un deploy.
