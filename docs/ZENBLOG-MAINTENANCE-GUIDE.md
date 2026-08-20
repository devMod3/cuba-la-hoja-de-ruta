# ZenBlog — Guía definitiva de mantenimiento y revisión

> Esta guía define cómo modificar **La hoja de ruta / ZenBlog** sin empezar de cero ni romper funcionalidades ya validadas. Antes de trabajar, leer también `ZENBLOG-FORENSIC-MEMORY.txt`.

## 1. Regla de cambio

El flujo obligatorio es:

**auditar → delimitar → proponer → aprobar → implementar el mínimo → probar → validar en Blogger → congelar**.

Un refactor no es un objetivo por sí mismo. Tiene que reducir un riesgo concreto, habilitar una capacidad o corregir un defecto demostrable. Si una pieza funciona y no está dentro del alcance aprobado, se considera protegida.

## 2. Mapa de responsabilidades

| Capa | Responsabilidad | No debe hacer |
|---|---|---|
| Blogger | CMS, URL pública, contenido, `Blog1`, head/plataforma | contener toda la lógica de producto |
| `adapters/` | hablar con Blogger/storage/infraestructura | decidir UX |
| `contracts/` / `domain/` | modelos y límites | conocer DOM/Blogger |
| `search/` | búsqueda pública actual | manipular UI directamente |
| `features/` | comportamiento de una vista | conocer detalles de persistencia innecesarios |
| `bootstrap/` | composición/dependencias | absorber lógica de dominio |
| `tools/admin/` | autoría/diagnóstico privado | contaminar el critical path público |
| `tools/inspector/` | diagnóstico temporal | alterar lectura cuando está OFF |
| `tools/about/` | perfil público | convertirse en repositorio documental |
| `tools/runtime/` | lazy loading auxiliar | crecer como segundo composition root |

### Principios SOLID aplicados

- **S — Single Responsibility:** un feature posee una responsabilidad visible; adaptadores poseen infraestructura.
- **O — Open/Closed:** nuevas fuentes de contenido/metadata deben entrar mediante adaptadores/contratos, no reescribiendo features.
- **L — Liskov:** cualquier implementación de un contrato debe conservar las expectativas de sus consumidores.
- **I — Interface Segregation:** no crear servicios gigantes para que un feature use dos métodos.
- **D — Dependency Inversion:** features dependen de abstracciones/servicios; Blogger/localStorage son detalles inyectados desde composición.

## 3. Protocolo de revisión antes de tocar código

Para cada solicitud registrar mentalmente o en el PR:

1. **síntoma / objetivo observable**;
2. **componente propietario** (selector Inspector + archivo fuente);
3. **invariantes protegidos**;
4. **dependencias aguas arriba/abajo**;
5. **riesgo de regresión**;
6. **prueba que demostrará el cambio**;
7. **plan de rollback**.

No usar búsqueda global/reemplazo masivo para resolver una discrepancia visual local sin comprender la propiedad del estilo.

## 4. Checklist de code review

### Funcionalidad
- ¿La solicitud exacta queda satisfecha?
- ¿Se preservan estados vacíos, errores y datos existentes?
- ¿El cambio funciona con navegación directa, refresh y navegación interna?
- ¿No cambia accidentalmente Explore, player, Metadata, Search Lab u otra pieza congelada?

### Arquitectura
- ¿La lógica está en la capa correcta?
- ¿Se introdujo una dependencia circular?
- ¿Un feature empezó a leer `localStorage`/Blogger directamente sin razón?
- ¿Se puede sustituir infraestructura sin reescribir el feature?
- ¿La nueva pieza tiene una sola responsabilidad clara?

### Accesibilidad
- HTML semántico primero.
- Navegación por teclado funcional.
- `focus-visible` perceptible.
- Labels y nombres accesibles en formularios.
- `aria-*` refleja estado real, no decoración.
- Touch targets importantes >= 44 px.
- `prefers-reduced-motion` respetado.
- No depender sólo de color/hover/gestos.

### Responsive
Probar al menos:
- móvil estrecho ~320–390 px;
- móvil normal ~390–430 px;
- móvil landscape / poca altura;
- tablet ~768–1024 px;
- escritorio ~1280–1440+ px.

Revisar:
- overflow horizontal;
- safe areas;
- URLs/palabras largas;
- imágenes/iframe/video;
- tablas/pre/code;
- teclado virtual en formularios;
- player superpuesto;
- scroll interno vs scroll de lectura.

### SEO / social
- Metadata importante debe existir en HTML inicial si depende de crawler.
- No confiar en JavaScript para Open Graph/X card.
- No duplicar canonical/robots sin entender lo que ya emite Blogger.
- Structured data sólo con datos verdaderos/trazables.
- `og:image` debe ser público, estable y ligero.
- títulos/descripciones deben representar la página real.

### Seguridad
- URLs externas validadas.
- Evitar `innerHTML` con datos no confiables; preferir `textContent`/DOM APIs.
- No almacenar secretos en frontend/localStorage.
- Admin sin autenticación se considera LAB/privado, no seguridad real.
- No desactivar protecciones del navegador para ocultar problemas visuales.

### Rendimiento
- ¿El código entra en el critical path aunque sólo se use ocasionalmente?
- ¿Puede cargarse dinámicamente?
- ¿Se añadió una nueva fuente/CDN/conexión?
- ¿Hay cadenas de CSS `@import` en el tema activo?
- ¿Se duplican recursos por versionado inconsistente?
- ¿Las imágenes tienen tamaño/compresión razonable?
- ¿El cambio obliga a cargar Admin/Inspector en cada visita pública?

## 5. Presupuesto de critical path

El tema público activo debe aspirar a mantener:

- **1 entrada de producto:** `dist/zenblog.js`;
- **1 runtime auxiliar pequeño:** `tools/runtime/bootstrap.js`;
- **1 reproductor independiente protegido**;
- estilos públicos modulares enlazados en paralelo;
- About, Inspector y Admin fuera del critical path normal;
- gestos móviles descargados sólo en coarse-pointer móvil.

Una cuarta dependencia pública global requiere justificación en el PR.

`dist/zenblog.css` puede mantenerse por compatibilidad, pero el tema de producción no debe usar su cadena `@import` mientras exista la estrategia de enlaces CSS paralelos.

## 6. Versionado y cache

- Cambios de comportamiento público: incrementar versión visible/query string coherentemente.
- LAB de prueba: preferir URL pinneada a SHA exacto.
- Producción main: GitHub Pages estable + query de versión.
- No mezclar cinco SHAs arbitrarios en un XML si un solo release SHA puede fijar todo el conjunto.
- Guardar siempre el XML anterior validado antes de instalar uno nuevo.

## 7. Branch / PR

Convención recomendada:

- `lab-vX.Y-<objetivo>` para incrementos de laboratorio;
- PR Draft mientras Blogger no haya sido validado;
- PR describe alcance, invariantes protegidos, QA automática y QA manual;
- no fusionar porque “el código parece correcto” si el cambio depende de Blogger real.

### Un PR debe poder responder

- ¿Qué cambia?
- ¿Qué deliberadamente NO cambia?
- ¿Cómo se prueba?
- ¿Cuál es el SHA exacto probado?
- ¿Qué XML fue instalado?
- ¿Cómo se revierte?

## 8. Gates automáticos

Antes de entregar XML:

```bash
npm run check
npm test
```

CI además valida:

- XML Blogger bien formado;
- un solo `Blog1`;
- un solo `page_body`;
- ausencia de `zen_main`;
- player protegido presente;
- entrypoints requeridos;
- invariantes SEO/social;
- presupuesto del critical path;
- gestos/responsive.

Un test de texto/regex no sustituye QA de navegador; protege arquitectura y regresiones conocidas.

## 9. QA manual de release

Secuencia de humo mínima:

1. Portada carga, destacado aparece y CTA funciona.
2. Explorar simple sigue title-only.
3. Explorar avanzado conserva filtros/año/orden.
4. Abrir un resultado/artículo.
5. Artículo mantiene lectura, TOC y retorno a Portada.
6. Reproductor permanece operativo/persistente.
7. Acerca de muestra sólo contenido disponible y foto circular.
8. Admin abre cuatro tabs.
9. Metadata edita/guarda sin regresión.
10. Search Lab indexa/busca.
11. About Manager carga foto y exporta favicon.
12. Inspector ON identifica nodo exacto, abre modal; OFF restaura interacción.
13. Repetir vistas principales en desktop/tablet/móvil.
14. En móvil probar swipe en área vacía y confirmar que no roba scroll, controles, artículo ni player.
15. Refresh y deep links.

## 10. Favicon, SEO e indexación

### Favicon

La foto subida a About vive inicialmente en storage local. Eso sirve para UI local, no como favicon global rastreable.

Flujo oficial de release:

1. Admin → Acerca de → Perfil → foto.
2. **Descargar favicon**.
3. Blogger → Configuración → Favicon.
4. Subir `la-hoja-de-ruta-favicon.png`.
5. Guardar y esperar actualización de caches/crawlers.

El repo contiene un favicon fallback público; no sustituye la configuración oficial de la foto elegida.

### Search visibility

Comprobar a nivel de cuenta:

- Blogger → Configuración → Privacidad → visible para buscadores: ON.
- Descripción de búsqueda configurada.
- No introducir robots personalizados salvo necesidad documentada.
- Search Console conectado/verificado.
- Solicitar indexación después de release importante cuando proceda.

No afirmar “indexado” sin evidencia de Search Console o resultado real del buscador.

## 11. Social previews

El crawler de X no debe depender de la SPA. El tema Blogger emite Open Graph/X metadata server-side.

La imagen base es:

`assets/social/zenblog-social-card.png`

Mantenerla:
- pública;
- estable;
- ligera;
- legible en crop social;
- consistente con `<article class="zen-feature">`.

El título y descripción de la tarjeta proceden de la página/Blogger; no incrustar el título de cada artículo dentro de una imagen estática.

## 12. Política de comentarios

**Comentar no es delito; es documentación ejecutable de intención.**

Comentar cuando exista:
- workaround de Blogger;
- compatibilidad histórica;
- invariante no obvio;
- decisión de rendimiento;
- riesgo de seguridad;
- motivo por el que NO se hace algo aparentemente más simple.

Evitar comentarios tipo:

```js
// incrementa i
i++;
```

Preferir:

```js
// Reserve the first/last 24px so the site swipe never competes with
// the browser/OS edge-back gesture on mobile.
```

## 13. Incidentes y depuración

1. Reproducir en Blogger real.
2. Activar Inspector sólo durante diagnóstico.
3. Obtener nombre lógico, nodo exacto, selector, geometría, layout y log.
4. Mapear selector a archivo propietario.
5. Confirmar si es CSS, estado, datos, navegación o infraestructura.
6. Añadir test que reproduzca la causa, no sólo el síntoma.
7. Corregir mínimo.
8. Inspector OFF y repetir interacción real.

Nunca dejar Inspector como dependencia UX del lector.

## 14. Datos y backups

Antes de cambios de almacenamiento:

- exportar Metadata;
- exportar About/site profile;
- conservar schemaVersion;
- no borrar campos ocultos por la UI;
- migraciones deben ser explícitas y reversibles cuando sea posible.

`localStorage` actual es infraestructura LAB. La migración a persistencia compartida debe implementarse detrás de adaptadores/contratos, no reescribiendo las vistas.

## 15. Cómo debe entrar otra IA o un nuevo desarrollador

No empezar generando código.

Orden obligatorio:

1. `ZENBLOG-FORENSIC-MEMORY.txt`
2. `ARCHITECTURE.md`
3. `UI-UX-CONTRACT.md`
4. `ZENBLOG-ADMIN-GUIDE.md`
5. esta guía
6. PR/branch validado más reciente
7. tests de los módulos afectados
8. sitio Blogger real

Luego realizar una **auditoría de diferencias** entre repo, XML desplegado y comportamiento real. La existencia de código más reciente en GitHub no demuestra que Blogger lo esté ejecutando.

## 16. Evolución futura

Este proyecto puede terminar en una arquitectura distinta: otro CMS, API propia, persistencia remota, build pipeline, autenticación y dominio propio. La estrategia profesional es conservar contratos y extraer dependencias una por una.

No convertir una migración futura en una reescritura prematura.

**Objetivo de mantenimiento:** poder sustituir infraestructura sin perder comportamiento de producto ni conocimiento institucional acumulado.
