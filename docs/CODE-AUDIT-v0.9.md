# ZenBlog v0.9 — Auditoría forense de código y SOLID

## Dictamen

**No se recomienda reescribir ZenBlog.** El proyecto ya posee fronteras útiles que deben convertirse en contratos cada vez más explícitos. La prioridad profesional es reducir divergencia de despliegue, dependencias globales y conocimiento tácito, no reemplazar módulos que funcionan.

## Escala usada

- **P0 — integridad:** puede destruir datos, URLs o arquitectura Blogger.
- **P1 — producción:** afecta rastreo, carga inicial, disponibilidad o navegación principal.
- **P2 — mantenibilidad:** aumenta acoplamiento o riesgo de regresión futura.
- **P3 — evolución:** oportunidad futura, no motivo para tocar hoy una función estable.

## Hallazgos

### P0 — Anatomía Blogger protegida

`#page_body` + `Blog1` es la frontera canónica con Blogger. La sustitución/relocalización indiscriminada rompería contenido, URL/document rendering y posiblemente el ecosistema de widgets.

**Control:** CI exige exactamente un `Blog1`, un `page_body`, ausencia de `zen_main` y presencia del player independiente.

### P1 — Divergencia del theme del repositorio

El `blogger/theme.xml` histórico quedó por detrás de los XML de laboratorio que realmente se probaban. Esto convierte el repositorio en documentación parcial y obliga al siguiente mantenedor a reconstruir decisiones desde la conversación.

**Corrección v0.9:** theme del repo vuelve a representar la arquitectura de producción: player v1.0.3, runtime lazy, SEO/social, CSS paralelo, composition root protegido.

### P1 — Critical path mezclaba producto y herramientas

About/Admin/Inspector son herramientas o features contextuales, no requisitos para pintar Portada.

**Corrección:** `tools/runtime/bootstrap.js` (~1.8 KB sin minificar en la rama auditada) decide qué auxiliar importar según ruta/estado. Esto mantiene responsabilidad única: selección de módulo, no lógica de negocio.

### P1 — CSS modular con descubrimiento secuencial

La modularidad vía `dist/zenblog.css` + `@import` era correcta conceptualmente pero subóptima para el theme activo.

**Corrección:** los seis owners CSS se enlazan en paralelo en Blogger. El entry de compatibilidad sigue existiendo para no romper consumidores anteriores.

### P1 — Favicon dependía de storage local

Una URL `data:` almacenada localmente nunca puede ser una identidad pública uniforme para crawlers/otros visitantes.

**Corrección:** exportación del mismo portrait a PNG + configuración autoritativa en Blogger. Fallback público en repo.

### P1 — Social metadata debe ser server-visible

Un crawler social no debe depender de que `AboutFeature` o la SPA hayan ejecutado JavaScript.

**Corrección:** Open Graph/X Card en `blogger/theme.xml`; imagen social pública ligera.

### P2 — Offsets responsive dispersos

Varios features conocían alturas concretas de header/player.

**Corrección:** `--zen-header-h`, `--zen-player-safe` y safe insets viven en tokens. Home/Explore consumen el contrato.

**Seguimiento:** Article aún conserva `--zen-article-header-offset` local porque forma parte de su rail/progress y tiene semántica específica; no se eliminó en este hardening para evitar una regresión visual innecesaria. Si se unifica después, hacerlo con pruebas de TOC/progress.

### P2 — Features grandes pero cohesionados

`ArticleFeature` y `ExploreFeature` tienen más superficie que módulos pequeños, pero hoy mantienen una cohesión funcional clara y tests existentes.

**Decisión:** no dividirlos por tamaño. Extraer sólo cuando aparezca una segunda razón de cambio concreta (por ejemplo, un servicio reutilizable o un estado independiente). Fragmentar ahora aumentaría imports y riesgo sin beneficio demostrado.

### P2 — Storage local atravesará una migración

`zenMetadataRegistry.v2` y `zenSiteProfile.v1` son implementaciones LAB.

**Fortaleza:** Metadata ya está detrás de un adapter/contract en el lector. About tiene un Store encapsulado.

**Próximo paso profesional:** repositorios compartidos/auth, manteniendo interfaces de consumo. No migrar mediante acceso remoto directo desde cada feature.

### P2 — Versionado manual de ESM

Query strings de versión son útiles para cache, pero requieren disciplina en cada dependency edge.

**v0.9:** la rama pública se mueve a 0.4.0 y se documenta el release SHA.

**Futuro P3:** cuando el número de módulos/version edges lo justifique, incorporar build manifest/import map/bundler. No hacerlo sólo por tendencia.

### P3 — Dominio/host futuro

Blogger puede dejar de ser la interfaz final. La arquitectura actual permite que sea reemplazado gradualmente si `ContentSource`, metadata repositories y public routing siguen siendo fronteras.

## SOLID por módulo

### `BloggerFeedSource`
- **S:** obtener/normalizar contenido Blogger.
- No debe renderizar UI ni clasificar metadata.

### `LocalMetadataSource`
- **S:** adapter LAB de registry.
- Es reemplazable por una implementación remota.

### `SearchService` / `ExploreQueryService`
- SearchService: búsqueda/ranking público actual.
- ExploreQueryService: contrato de modos de Explore.
- La separación protege la regla title-only en modo simple.

### `NavigationFeature`
- **S:** route/hash state y enlaces visibles.
- Gestos se extrajeron a `MobileGestureNavigation` en vez de inflar NavigationFeature.

### `MobileGestureNavigation`
- **S:** interpretación de swipe seguro.
- Depende de NavigationFeature como autoridad de rutas.
- No conoce Home/Explore internamente; sólo route IDs y exclusiones de interacción.

### `tools/runtime/bootstrap.js`
- **S:** lazy loading contextual.
- No debe convertirse en event bus general ni service locator.

### `AdminShell`
- **S:** composición y tabs del Admin.
- Lógica de Metadata/Search/About/Inspector permanece en sus módulos.

### `AdaptiveMetadataUI`
- Decorator/presentation layer sobre core v0.5.
- Ejemplo deliberado de Open/Closed: cambia presentación sin reescribir engine validado.

### Inspector
- Diagnostics y Controller separados.
- Buen límite entre análisis del DOM y interacción/modal.
- Inspector OFF debe equivaler funcionalmente a ausencia de Inspector.

## Auditoría de estado global / side effects

Side effects aceptados y documentados:
- `window.ZenBlog`: API diagnóstica/composición pública.
- `window.ZenBlogAdmin`: API diagnóstica Admin.
- `window.ZenInspector`: herramienta temporal.
- localStorage keys documentadas.

Regla: un nuevo `window.*` o storage key requiere documentación, namespace estable y dueño de ciclo de vida.

## Auditoría DOM

Selectores `#zen-*` y clases `.zen-*` forman parte de un contrato práctico porque Inspector, CSS y tests los consumen.

No renombrar masivamente por estética. Si un selector cambia:
- localizar Inspector registry;
- tests;
- CSS;
- event delegation;
- docs;
- backward compatibility cuando proceda.

## Auditoría de errores

Patrón recomendado:
- errores de infraestructura se registran con contexto (`console.error('[ZenBlog/Feature] ...')`);
- UI muestra fallback útil, no stack trace;
- no ocultar errores silenciosamente salvo best-effort no crítico documentado (storage/copy helpers).

Futuro: centralizar telemetría sólo si existe un destino/consentimiento real. No añadir analytics ficticios.

## Auditoría de rendimiento

No se atribuyen números LCP/INP/CLS sin una medición real después del deploy.

Sí se pueden probar invariantes estructurales:
- tres scripts públicos globales como máximo en theme;
- herramientas auxiliares lazy;
- CSS product modules paralelos;
- social PNG bajo presupuesto;
- gesture module sólo touch-mobile;
- no duplicar reproductor.

Después del deploy, crear baseline Lighthouse/PageSpeed y guardar resultados con fecha/dispositivo/red simulada.

## Auditoría responsive

Responsabilidad dividida correctamente:
- feature CSS: composición específica;
- `responsive.css`: seguridad transversal;
- `tokens.css`: dimensiones compartidas.

Riesgos que deben probarse manualmente:
- teclado móvil y selects en Explore/Admin;
- viewport de Safari/iOS con barras dinámicas;
- landscape muy bajo;
- imágenes/iframes de entradas Blogger arbitrarias;
- TOC rail + player en tablet.

## Decisiones explícitas de NO cambio

v0.9 **no**:
- cambia algoritmos Explore/Search;
- reescribe Metadata core;
- cambia player;
- mueve datos locales a un backend improvisado;
- introduce framework/bundler;
- cambia URLs de artículos;
- inventa schema Article;
- elimina compatibilidad `dist/zenblog.css`;
- convierte swipe en navegación obligatoria.

Estas omisiones son parte de la robustez, no trabajo pendiente accidental.

## Próximos hitos recomendados

1. Validar v0.9 en Blogger y congelar.
2. Establecer baseline Core Web Vitals/Lighthouse real.
3. Persistencia compartida + autenticación del Admin mediante contratos.
4. Automatizar release manifest/versioning si el número de módulos lo exige.
5. Considerar dominio propio y ContentSource remoto sin tocar UX.

## Conclusión

El proyecto está en una fase donde **documentar y estabilizar fronteras aporta más valor que reescribir**. El nivel profesional se alcanza haciendo que cada siguiente modificación sea más barata, rastreable y reversible que la anterior.
