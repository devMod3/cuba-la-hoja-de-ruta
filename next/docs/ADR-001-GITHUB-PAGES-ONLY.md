# ADR-001 — GitHub Pages como único destino

**Estado:** Aceptado

## Decisión

La aplicación Next.js se construye como export estático y se publica exclusivamente con GitHub Pages.

El repositorio mantiene su propio catálogo de contenido, canonical URLs, sitemap, robots y configuración pública. No existe dependencia de lectura o sincronización con un CMS externo.

## Consecuencias

- Los canónicos pertenecen a `https://devmod3.github.io/cuba-la-hoja-de-ruta/`.
- Los artículos son indexables en Pages.
- El despliegue sólo se considera correcto si el SHA desplegado coincide con el SHA final validado.
- La autoría compartida opcional usa GitHub como repositorio de documentos, no como dependencia para servir páginas públicas.
