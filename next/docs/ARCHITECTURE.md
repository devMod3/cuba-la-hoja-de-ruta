# Arquitectura de La hoja de ruta

## Horizonte

El producto se diseña para poder mantenerse durante décadas. **Next.js y GitHub Pages son la entrega actual, no la identidad del sistema.** El núcleo debe seguir siendo utilizable si en el futuro cambian framework, hosting, backend de authoring, lenguaje de implementación o equipo mantenedor.

## Estilo arquitectónico

La solución combina **Clean Architecture**, **Ports & Adapters (Hexagonal)**, módulos por capacidad y SOLID.

La regla de dependencias es:

```text
Delivery / Next.js
        ↓
Application / composition
        ↓
Ports + use-case contracts
        ↓
Domain
        ↑
Adapters externos
```

Las dependencias nunca apuntan desde el dominio hacia frameworks o infraestructura.

## SOLID como restricciones ejecutables

- **SRP:** cada paquete posee una responsabilidad estable.
- **OCP:** nuevos adapters/documentos se agregan sin modificar los cores genéricos.
- **LSP:** cualquier `VersionedJsonRepository` puede sustituir al adapter actual respetando concurrencia y validación.
- **ISP:** UI consume contratos pequeños, no SDKs multipropósito.
- **DIP:** UI y casos de uso dependen de puertos; infraestructura concreta se conecta en composition roots.

`pnpm architecture:check` valida estas fronteras.

## Paquetes

| Paquete                     | Responsabilidad                                      | Dependencias internas               |
| --------------------------- | ---------------------------------------------------- | ----------------------------------- |
| `@zenblog/domain`           | tipos, invariantes y parsing del dominio             | ninguna; cero runtime deps externas |
| `@zenblog/authoring-core`   | puertos, sesión, versionado y serialización canónica | ninguna                             |
| `@zenblog/authoring-github` | adapter actual de authoring                          | `authoring-core`                    |
| `@zenblog/site-config`      | documentos de configuración y vocabulario            | `domain`                            |
| `@zenblog/content-catalog`  | contenido editorial durable y provider-neutral       | `domain`                            |
| `@zenblog/content-renderer` | sanitización de HTML                                 | ninguna interna                     |
| `@zenblog/search-core`      | búsqueda determinista                                | `domain`                            |
| `@zenblog/zrp-adapter`      | integración aislada de ZRP                           | ninguna                             |
| `@zenblog/web`              | delivery Next.js y composition roots                 | APIs públicas anteriores            |

## Datos durables

- JSON UTF-8 para catálogos/configuración.
- JSON Schema 2020-12 para contratos persistidos.
- URNs como identidad de schema; no URLs de un proveedor.
- `schemaVersion` explícito y migraciones obligatorias para cambios incompatibles.
- IDs editoriales son opacos, estables y propiedad del producto.
- Las URLs de hosting se derivan en delivery y nunca se almacenan como identidad del artículo.
- HTML editorial permanece estándar y sanitizado.

## Infraestructura reemplazable

### Hosting

GitHub Pages es el **deployment vigente**. La URL canónica se resuelve en `apps/web/lib/site-address.ts`. El catálogo no conoce GitHub Pages.

### Authoring

`authoring-core` define `AuthoringConnector` y `VersionedJsonRepository`. GitHub es un adapter reemplazable y sólo se instancia en el Admin composition root.

### Framework

Next.js sólo pertenece a `apps/web`. Ningún paquete interno puede importarlo.

## Gates

- `architecture:check`: fronteras Clean/Hexagonal/SOLID y allowlists de dependencias.
- `portability:check`: invariantes de longevidad a 50 años.
- `source:typescript`: fuente mantenida TS/TSX-only.
- `project:standards`: TypeScript estricto, cobertura y Playwright sin retries.
- security, tests, build, SEO, performance y Pages rehearsal siguen siendo obligatorios.
