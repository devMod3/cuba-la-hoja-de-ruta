# ADR-003 — Autoría compartida sobre GitHub

**Estado:** Aceptado

## Decisión

El Admin puede leer y escribir dos documentos compartidos mediante GitHub Contents API:

- `next/packages/site-config/data/metadata-registry.json`
- `next/packages/site-config/data/site-profile.json`

La credencial temporal se mantiene sólo en memoria. Cada escritura usa control optimista de concurrencia mediante el SHA esperado y realiza read-back del documento escrito.

## Propiedades de seguridad

- Sin persistencia de credenciales.
- Fail-closed ante autenticación, autorización, validación o transporte inválido.
- Conflictos 409/422 no disparan last-write-wins ni reintentos destructivos.
- Las páginas públicas son independientes de este mecanismo.
