# Incidente v0.9 — Portada/Acerca de sin elementos

## Síntoma
Portada y Acerca de podían quedar sin los elementos de ZenBlog al probar el nuevo theme LAB.

## Causa raíz
El theme LAB cargaba assets desde `https://devmod3.github.io/cuba-la-hoja-de-ruta/...`. GitHub Pages publica la rama `main`, pero el nuevo `tools/runtime/bootstrap.js`, los ajustes responsive, favicon/social y el nuevo bootstrap público estaban sólo en `lab-v0.9-production-hardening`.

Eso generaba una mezcla imposible de garantizar: XML nuevo + JS/CSS de `main` + módulos LAB ausentes.

## Corrección
- assets LAB fijados al commit inmutable `feaa8f561295204edbe1fa15d13a341899602fdd` mediante jsDelivr;
- `release-pin.test.js` impide volver a cargar código LAB desde Pages/main;
- la documentación de release obliga al patrón commit A (assets) + commit B (XML pinneado).

## Regla permanente
Si una feature desaparece simultáneamente en varias vistas, auditar primero **version alignment / asset origin** antes de editar lógica de la feature.
