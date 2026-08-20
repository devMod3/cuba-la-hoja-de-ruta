# ZenBlog v0.9 — Auditoría de producción

Fecha de auditoría: 2026-08-19/20  
Sitio: **La hoja de ruta**  
Host público: `cubalahojaderuta.blogspot.com`  
Rama de hardening: `lab-v0.9-production-hardening`

## Resumen ejecutivo

El sistema ya tenía una separación arquitectónica útil entre Blogger, adaptadores, servicios y features, pero el despliegue había acumulado **divergencia entre el XML real, `blogger/theme.xml` del repositorio y varios loaders LAB**. La prioridad de v0.9 no es reescribir funciones: es convertir decisiones ya validadas en invariantes de producción, mejorar el head rastreable, reducir el critical path, centralizar responsive y dejar memoria operativa.

## Hallazgos críticos y resolución

### A. Favicon local no era global

**Hallazgo:** la foto elegida en About se guarda en `zenSiteProfile.v1`, actualmente browser-local. Crear un `<link rel="icon">` desde ese valor sólo puede afectar el navegador que posee ese storage; no es una identidad global rastreable.

**Resolución:**
- se mantiene foto circular en About;
- Admin exporta esa misma foto como PNG 96×96 mediante **Descargar favicon**;
- Blogger Settings → Favicon se convierte en la fuente pública/autoritativa;
- repositorio incluye un favicon fallback público para la instalación inicial.

**Estado:** código resuelto; la subida final al setting de Blogger requiere acción en la cuenta.

### B. Social preview/X no estaba bajo control explícito

**Hallazgo:** el XML de trabajo no declaraba en la capa ZenBlog Open Graph/X Card explícitos. No se podía garantizar una tarjeta rica consistente ni una imagen institucional.

**Resolución:** metadata server-rendered en `blogger/theme.xml`:
- `og:title`, `og:url`, `og:type`, `og:site_name`, `og:description`;
- `og:image` con dimensiones/alt;
- `twitter:card=summary_large_image`;
- título/descripción X;
- imagen social pública `assets/social/zenblog-social-card.png`.

La imagen está diseñada como traducción social del lenguaje de `<article class="zen-feature">`, no como captura del DOM.

**Estado:** resuelto en theme v0.9; requiere instalar XML para llegar al sitio activo.

### C. SEO de producto dependía demasiado del head implícito de Blogger

**Hallazgo:** se preservaba `all-head-content`, correctamente, pero ZenBlog no expresaba de forma explícita su identidad semántica/search/social.

**Resolución:**
- descripción homepage;
- robots index/follow para homepage/single item;
- `max-image-preview:large`;
- WebSite JSON-LD en homepage;
- social metadata server-side;
- canonical/feed/platform siguen bajo `all-head-content` de Blogger.

No se añadió `Article` schema inventado: faltan datos server-visible suficientemente controlados para hacerlo sin falsificar propiedades.

### D. Sitio público ≠ sitio indexado

**Hallazgo:** el host responde públicamente, pero una búsqueda pública no aportó evidencia suficiente de indexación del sitio. Son estados distintos.

**Resolución:** código queda indexable y la guía de release incluye comprobaciones de cuenta:
- Privacy → Visible to search engines;
- Search description;
- Search Console;
- solicitud de indexación cuando proceda.

**Estado:** acceso público comprobable; indexación debe verificarse externamente después del deploy.

### E. Cascada CSS por `@import`

**Hallazgo:** `dist/zenblog.css` compone seis módulos mediante `@import`. Es modular pero crea dependencia secuencial de descubrimiento CSS.

**Resolución:** theme activo enlaza los seis CSS directamente/parallel:
- tokens;
- shell;
- Home;
- Explore;
- Article;
- responsive.

`dist/zenblog.css` queda como compatibilidad, no como stylesheet activo de producción.

### F. Herramientas auxiliares cargaban en el camino público

**Hallazgo:** sucesivas versiones podían cargar About/Inspector/Admin con loaders independientes incluso cuando el visitante no los necesitaba.

**Resolución:** nuevo `tools/runtime/bootstrap.js`:
- Admin sólo en ruta admin;
- About sólo al entrar a `#zen-about`;
- Inspector sólo si está habilitado o se solicita con Alt+I.

Critical path público queda acotado a ZenBlog + runtime ligero + player protegido.

### G. Responsive tenía números de header duplicados

**Hallazgo:** Home/Explore/Article/shell utilizaban varios offsets hardcoded (`58px`, `101px`, etc.), aumentando el riesgo de desalineación cuando cambia el chrome.

**Resolución:** tokens globales:
- `--zen-header-h`;
- `--zen-player-safe`;
- `--zen-safe-inline`.

Home/Explore usan estos contratos de layout. Responsive global endurece overflow, embeds, tablas, safe areas, coarse-pointer y poca altura.

### H. Navegación móvil sólo tenía controles visibles

**Hallazgo:** funcionalmente correcto, pero faltaba una capa gestual coherente con la UX móvil solicitada.

**Resolución:** `MobileGestureNavigation` lazy:
- sólo coarse-pointer móvil;
- Home ↔ Explore ↔ About;
- no roba gestos del artículo, player, resultados, links o controles;
- edge guard de 24px conserva gestos de sistema/browser;
- navegación visible permanece siempre disponible.

## Arquitectura: evaluación

### Fortalezas preservadas

- Blogger como CMS y composition host.
- `ContentSource`/`MetadataSource` como límites de infraestructura.
- Search/Explore separados.
- Player desacoplado/protegido.
- Admin/Metadata/Search Lab pueden evolucionar sin reescribir lector público.
- Native ESM permite modularidad sin build obligatorio.

### Deuda aceptada conscientemente

- Metadata y Site Profile siguen en storage local.
- Admin no tiene autenticación real.
- `dist/zenblog.css` sigue existiendo como entry legacy.
- GitHub/Blogger despliegues siguen separados/manual para theme.
- Social image es fallback institucional común, no imagen dinámica por artículo.

Estas deudas tienen fronteras claras; no justifican una reescritura inmediata.

## Rendimiento — cambios estructurales

Sin inventar métricas de laboratorio que no fueron medidas en un navegador real, v0.9 reduce trabajo inicial de forma verificable por arquitectura:

- elimina la cadena `@import` del XML activo;
- añade preconnect para fonts/GitHub Pages;
- usa `display=swap` en fuentes;
- `modulepreload` para entry + composition root;
- lazy load de About/Inspector/Admin;
- lazy load de gesture module sólo móvil touch;
- social PNG ligero;
- controls/imágenes/medios con reglas responsive globales.

Recomendación posterior al deploy: capturar Lighthouse/PageSpeed móvil y desktop y guardar LCP/INP/CLS como baseline real. No optimizar contra números no medidos.

## Responsive — matriz cubierta

- escritorio amplio;
- desktop estrecho;
- tablet 761–1023;
- teléfono <=760;
- teléfono muy estrecho <=420;
- landscape/poca altura;
- safe-area devices;
- pointer coarse;
- reduced motion;
- contenido largo, tablas, pre, iframe, imagen/video.

## Código y SOLID — dictamen

No se recomienda una reescritura. La estrategia correcta es fortalecer contratos existentes:

1. mantener features pequeños;
2. extraer nueva infraestructura a adapters/tools;
3. dejar bootstrap como composición;
4. no hacer que UI conozca persistence;
5. migrar localStorage a un repositorio compartido mediante implementaciones sustitutas;
6. introducir build tooling sólo cuando su beneficio supere el coste de despliegue/debug.

## Gates nuevos

`tests/production-hardening.test.js` bloquea regresiones en:
- metadata social/SEO;
- PNG social local;
- CSS paralelo;
- critical path/lazy auxiliary tools;
- mobile gesture guards;
- responsive safety;
- favicon export;
- Blogger/player invariants.

CI actualiza sus architecture invariants en el mismo sentido.

## Acciones de cuenta que el código no puede ejecutar

Después de instalar el XML validado:

1. Blogger → Configuración → Privacidad → confirmar visible para buscadores.
2. Blogger → Configuración → Etiquetas meta → descripción de búsqueda.
3. Admin → About → descargar favicon y Blogger → Configuración → Favicon → subir PNG.
4. Abrir Search Console desde Blogger/Google, verificar propiedad y revisar indexación.
5. Tras propagación, probar URL en X y verificar `summary_large_image`.

## Criterio de cierre v0.9

No congelar v0.9 hasta que el Product Owner confirme en Blogger real:
- no regresiones de Home/Explore/Article/player;
- About correcto;
- Admin correcto;
- Inspector correcto;
- responsive desktop/tablet/mobile;
- swipe móvil no interfiere;
- favicon configurado;
- fuente HTML publicada contiene OG/X metadata.

Después de aceptación, registrar el SHA y XML exactos como nueva base estable.
