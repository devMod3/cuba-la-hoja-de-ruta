# ZenBlog v0.9 — Auditoría de producción

Fecha: 2026-08-19/20  
Sitio: **La hoja de ruta**  
Host: `cubalahojaderuta.blogspot.com`  
Rama: `lab-v0.9-production-hardening`

## Resumen ejecutivo

ZenBlog ya tenía fronteras útiles entre Blogger, adapters, servicios y features. El riesgo principal era operativo: **divergencia entre el XML realmente probado y `blogger/theme.xml`, herramientas auxiliares entrando al critical path, metadata social no controlada y supuestos responsive repetidos**. v0.9 endurece esas fronteras sin reescribir las funciones que ya estaban validadas.

## Hallazgos y resolución

### A. Favicon local no era global

**Hallazgo:** la foto de About vive en `zenSiteProfile.v1`, browser-local. Un `<link rel="icon">` construido sólo desde ese storage no es identidad pública uniforme para otros visitantes/crawlers.

**Resolución:**
- foto circular pública preservada;
- Admin exporta la misma foto como PNG 96×96 mediante **Descargar favicon**;
- Blogger → Configuración → Favicon es la fuente autoritativa pública;
- repo incluye fallback público para instalación inicial.

**Pendiente manual:** subir el PNG elegido a Blogger.

### B. X / Open Graph no estaba bajo control explícito

**Resolución:** `blogger/theme.xml` emite server-side:
- `og:title`, `og:url`, `og:type`, `og:site_name`, `og:description`;
- `og:image` + tamaño/alt;
- `twitter:card=summary_large_image`;
- título/descripción/imagen X.

La imagen `assets/social/zenblog-social-card.png` traduce el lenguaje visual de `<article class="zen-feature">`; no es una captura del DOM.

### C. SEO dependía demasiado del head implícito

Se preserva `b:include ... all-head-content` porque Blogger debe seguir siendo autoridad de **canonical, plataforma e index/noindex**.

ZenBlog añade sólo su capa de producto:
- identidad/descripción de homepage;
- política de preview/snippet (`max-image-preview`, etc.);
- Open Graph/X;
- WebSite JSON-LD en homepage.

**Decisión de robustez:** ZenBlog NO fuerza `index,follow`. Si Blogger está configurado como noindex, el theme no debe contradecir a la plataforma.

No se añadió `Article` schema inventado: structured data debe usar propiedades server-visibles y trazables.

### D. Público no significa indexado

El host responde públicamente desde Internet, pero durante la auditoría una búsqueda pública no dio evidencia suficiente de indexación. Accesibilidad HTTP e indexación son estados distintos.

Después del deploy comprobar:
- Blogger → Privacidad → Visible para buscadores;
- descripción para búsquedas;
- Search Console;
- inspección/solicitud de indexación cuando proceda.

### E. Cascada CSS `@import`

`dist/zenblog.css` sigue existiendo por compatibilidad, pero el theme activo ya no lo usa. Los seis owners CSS se enlazan directamente y el navegador puede descubrirlos en paralelo:
- tokens;
- shell;
- Home;
- Explore;
- Article;
- responsive.

### F. Tools auxiliares en carga pública

Nuevo `tools/runtime/bootstrap.js` concentra sólo la decisión de lazy loading:
- Admin únicamente en ruta admin;
- About al visitar About;
- Inspector si está habilitado o se solicita.

Critical path público objetivo: ZenBlog entry + runtime pequeño + player protegido.

### G. Responsive con offsets repetidos

Se centralizaron:
- `--zen-header-h`;
- `--zen-player-safe`;
- `--zen-safe-inline`.

Home/Explore consumen el contrato. Responsive global cubre safe-area, media/iframe, tablas, pre/code, overflow, coarse pointer, very narrow phones y short-height/landscape.

### H. Mobile gestures

Nuevo `MobileGestureNavigation`, lazy sólo en touch/coarse mobile:
- Home ↔ Explore ↔ About;
- no intercepta links/controles;
- excluye Article/player/results scroll;
- reserva 24px de bordes para gestos OS/browser;
- exige gesto horizontal claro;
- nunca sustituye navegación visible.

## Arquitectura — dictamen

**No reescribir.** La estrategia correcta es fortalecer los contratos existentes.

Fortalezas preservadas:
- Blogger como CMS/document host;
- `ContentSource`/`MetadataSource` como límites;
- Search/Explore separados;
- player desacoplado;
- Admin/Metadata/Search Lab fuera del lector;
- native ESM modular.

Deuda consciente:
- metadata/profile browser-local;
- Admin sin autenticación real;
- deploy Blogger manual;
- social image común, no por artículo;
- `dist/zenblog.css` legacy compatible.

## Rendimiento

No se inventan métricas LCP/INP/CLS: no hubo un Lighthouse de la versión v0.9 desplegada porque todavía no está instalada en Blogger.

Mejoras estructurales verificables:
- sin `@import` en theme activo;
- CSS paralelo;
- preconnect fonts/CDN;
- `display=swap`;
- modulepreload de entry/composition root;
- About/Admin/Inspector lazy;
- gesture module lazy móvil;
- PNG social ligero.

Después del deploy debe crearse baseline PageSpeed/Lighthouse móvil+desktop con fecha y condiciones de prueba.

## SOLID / mantenibilidad

- Navigation y gestos separados por responsabilidad.
- Runtime lazy no contiene dominio.
- Metadata core v0.5 no se reescribe; Adaptive UI lo decora.
- Storage futuro debe entrar detrás de adapters/repositorios.
- No introducir framework/build tooling hasta que reduzca coste real.

## Gates

`tests/production-hardening.test.js` protege:
- SEO/social head;
- asset social PNG;
- CSS parallel delivery;
- lazy tools / script budget;
- mobile gesture guards;
- responsive safety;
- favicon export;
- Blogger/player invariants.

CI valida además JS, unit tests, Blogger XML e invariantes de arquitectura.

## Acciones fuera de alcance del código

No existe integración conectada en esta sesión para modificar Blogger/Search Console directamente. Tras instalar XML:

1. Blogger → Configuración → Privacidad → Visible para buscadores = ON.
2. Blogger → Configuración → Metaetiquetas → descripción de búsqueda.
3. Admin → About → Descargar favicon; Blogger → Configuración → Favicon → subir PNG.
4. Search Console → verificar propiedad/estado y solicitar indexación si procede.
5. Probar una URL en X después de que el HTML nuevo esté público.

## Criterio de cierre

v0.9 sólo se congela después de QA real en Blogger: Home, Explore simple/advanced, artículo/retorno, player, About, Admin, Inspector, desktop/tablet/mobile, landscape, swipe no intrusivo, favicon y HTML social/SEO publicado.
