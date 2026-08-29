# ADR-006 — Núcleo portable para un horizonte de 50 años

**Estado:** Aceptado

## Contexto

La aplicación se despliega hoy con Next.js y GitHub Pages, pero el contenido, el dominio y los contratos editoriales deben sobrevivir a esos productos. Un horizonte de 50 años obliga a tratar frameworks, hosts, proveedores de authoring y herramientas de validación como piezas reemplazables.

## Decisión

1. `@zenblog/domain` no tiene dependencias runtime externas.
2. Los artículos persistidos tienen identidad propia (`id`) y no guardan origen, host ni URL canónica de despliegue.
3. Las URLs absolutas se construyen exclusivamente en la capa de entrega (`apps/web`).
4. `authoring-core` no conoce nombres de documentos ni proveedores concretos; esas decisiones pertenecen al composition root/adapters.
5. Los documentos persistidos usan JSON UTF-8 y contratos JSON Schema 2020-12 con URNs estables.
6. HTML editorial se conserva como HTML estándar sanitizado, no como AST propietario de un framework.
7. Las dependencias internas sólo cruzan APIs públicas de paquetes.
8. Los artefactos de build son desechables; la fuente de verdad es contenido + configuración + código portable.
9. `pnpm portability:check` y `pnpm architecture:check` hacen fallar CI si reaparece acoplamiento a host/proveedor en capas internas.

## Consecuencias

- Migrar de Next.js a otro renderer no requiere reescribir dominio ni contenido.
- Migrar de GitHub Pages a otro host sólo cambia delivery/configuración.
- Migrar de GitHub authoring a otro backend sólo requiere un nuevo adapter/composition root.
- Un consumidor futuro puede interpretar los datos sin ejecutar TypeScript porque existen contratos JSON Schema estándar.
- Cualquier evolución incompatible de datos debe introducir una nueva versión de schema y una migración explícita; nunca se modifica silenciosamente un contrato histórico.
