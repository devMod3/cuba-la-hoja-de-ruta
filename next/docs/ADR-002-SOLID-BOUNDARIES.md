# ADR-002 — SOLID como restricción arquitectónica

**Estado:** Aceptado

## Decisión

SOLID se aplica a componentes y a paquetes. Las dependencias internas se declaran mediante una matriz de fronteras verificada por `scripts/check-architecture.ts`.

La infraestructura concreta de GitHub sólo puede importarse desde `apps/web/components/admin/admin-shell.tsx`, que actúa como composition root. `SharedAuthoring` depende del contrato `AuthoringConnector` definido en `authoring-core`.

## Consecuencias

- Un cambio de proveedor de authoring no obliga a reescribir UI ni dominio.
- Los paquetes portables no pueden importar Next, React ni builtins de Node.
- Los imports relativos no pueden escapar del paquete.
- Los imports internos profundos están prohibidos; sólo se usa la API pública del paquete.
