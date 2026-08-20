# ZenBlog — Memoria forense operativa v0.9

## Identidad
- Producto público: **La hoja de ruta**.
- Tagline: **Soberanía · Constitución · Estado**.
- Propósito editorial: seguir el origen, los límites y el ejercicio del poder.
- Stack actual: Blogger como CMS/host + GitHub para módulos públicos/Admin + zen-radio-player independiente.

## Invariantes absolutas
1. Si una función fue validada por el usuario, no se modifica fuera del alcance aprobado.
2. `#page_body` debe existir exactamente una vez.
3. `Blog1` debe existir exactamente una vez y vivir dentro de `#page_body`.
4. No introducir `zen_main`.
5. Explore mantiene resultados título/tipo/fecha; no añadir snippets.
6. Reproductor es independiente, persistente y protegido.
7. Scroll vertical de página pertenece a lectura; interfaces funcionales usan layout acotado cuando corresponde.
8. Blogger XML es composition root, no monolito de aplicación.
9. Metadata documental y perfil del sitio son contratos separados.
10. Un LAB nunca debe mezclar XML de una rama con assets de GitHub Pages `main`; usar SHA inmutable.

## Componentes principales
- `src/bootstrap/createZenBlog.js`: composition root público.
- `src/features/navigation`: routing interno Home/Explore/About y regreso desde artículos.
- `src/features/home`: Portada + destacado.
- `src/features/explore`: búsqueda/localización documental.
- `src/features/article`: lectura de artículos.
- `tools/about`: perfil público, redes, recursos y favicon runtime.
- `tools/admin`: shell Admin, Metadata v0.6 UI sobre core v0.5, Search Lab, About Manager, Inspector switch.
- `tools/inspector`: inspector público de nodos DOM.
- `tools/runtime/bootstrap.js`: cargador diferido de About/Inspector/Admin según contexto.

## Datos
- `zenMetadataRegistry.v2`: metadata documental LAB, localStorage.
- `zenSiteProfile.v1`: perfil/Acerca de LAB, localStorage.
- `zenInspector.enabled`: estado Inspector.
- Persistencia local es una deuda consciente; no equivale a publicación centralizada.

## Flujo de release LAB
1. Cambios funcionales en rama LAB.
2. Ejecutar `npm run check` y `npm test`.
3. Validar `blogger/theme.xml` como XML.
4. Verificar invariantes de arquitectura.
5. Congelar un **asset commit A**.
6. En un commit posterior B, fijar el XML a `A` mediante jsDelivr SHA exacto.
7. Abrir PR Draft contra `main` para activar CI real.
8. Generar XML completo para Blogger desde el commit B.
9. Usuario prueba en `cubalahojaderuta.blogspot.com`.
10. Sólo después de aprobación se considera estable/mergeable.

## Incidente v0.9: Home/About en blanco
Causa: `blogger/theme.xml` de LAB cargaba `devmod3.github.io/cuba-la-hoja-de-ruta/...`; Pages publica `main`, mientras `tools/runtime/bootstrap.js` y otras mejoras estaban sólo en la rama LAB. Se mezcló shell nuevo con assets viejos/ausentes. Corrección: fijar **todos** los assets del tema LAB al commit `feaa8f561295204edbe1fa15d13a341899602fdd` por jsDelivr.

## SEO/social
- Metadata Open Graph/X debe existir en HTML inicial, no depender de JS.
- Blogger conserva autoridad sobre canonical/index/noindex mediante `all-head-content`.
- Tarjeta social pública: `assets/social/zenblog-social-card.png`.
- Favicon público tiene fallback en repo; la foto del perfil puede sincronizar favicon runtime, pero para crawlers/dispositivos externos debe configurarse también como favicon público de Blogger/asset persistente.

## Rendimiento
- Evitar cadenas de `@import` en el tema activo; cargar CSS en paralelo.
- `modulepreload` sólo para entrypoints críticos conocidos.
- About/Inspector/Admin deben cargarse de forma diferida cuando no son necesarios.
- Imágenes y embeds deben respetar límites responsive.

## Responsive/UX móvil
- Safe areas iOS.
- Targets táctiles robustos.
- `min-width:0` en layouts/grid/flex.
- Gestos de navegación sólo donde no interfieran con scroll horizontal, formularios, enlaces o contenido seleccionable.
- `prefers-reduced-motion` respetado.

## Regla para futuras IAs/desarrolladores
Antes de editar: leer este archivo, `ARCHITECTURE.md`, `UI-UX-CONTRACT.md`, `ZENBLOG-ADMIN-GUIDE.md` y la guía de mantenimiento. Auditar primero el estado real y el SHA desplegado. Nunca reconstruir desde memoria si existe un artefacto validado.