# ADR-007 — Zen Inspector como extensión Brave/Chromium

## Estado

Aceptado.

## Contexto

El Inspector se ejecutaba dentro de la aplicación pública Next.js, dependía de React/Next y mantenía un registro específico de componentes del sitio. Ese diseño limita su utilidad a una sola aplicación y añade código de diagnóstico al runtime de producción.

## Decisión

Zen Inspector se distribuye como extensión Manifest V3 compatible con Brave/Chromium y se elimina del runtime público del sitio.

La extensión:

- usa únicamente `activeTab` y `scripting`;
- no declara `host_permissions`, `<all_urls>`, content scripts persistentes ni recursos web-accessible;
- se inyecta sólo tras una acción explícita del usuario;
- ejecuta el content runtime en el isolated world y aísla su UI con Shadow DOM cerrado;
- no realiza peticiones de red ni telemetría;
- no persiste el contenido inspeccionado;
- redacta valores de formularios, valores `data-*` y parámetros/hash de URL;
- usa introspección DOM genérica; `data-component`/`data-zen-component` son mejoras opcionales, no requisitos.

## Límites de plataforma

Las páginas internas protegidas por Chromium/Brave (`brave://`, `chrome://`, Web Store y equivalentes) no aceptan inyección normal de extensiones. Es una restricción del navegador y no se evita solicitando permisos permanentes más amplios.

## Consecuencias

- La web pública deja de cargar React/CSS/estado del Inspector.
- El mismo Inspector puede utilizarse sobre sitios ajenos sin integración previa.
- La superficie de permisos permanece mínima y temporal.
- El build de la extensión se genera desde TypeScript y los `.js` resultantes no se versionan.
