# ADR-003 — Autoría compartida sobre GitHub

**Estado:** Aceptado

## Decisión

El Admin puede leer y escribir dos documentos compartidos mediante GitHub Contents API:

- `next/packages/site-config/data/metadata-registry.json`
- `next/packages/site-config/data/site-profile.json`

La credencial temporal se mantiene sólo en memoria. Cada escritura usa control optimista de concurrencia mediante el SHA esperado y realiza read-back del documento escrito.

## Contrato de publicación de Acerca de

El perfil tiene dos contextos deliberadamente distintos:

1. **borrador local:** `zenSiteProfile.v1` en `localStorage`, usado para edición;
2. **perfil publicado:** `next/packages/site-config/data/site-profile.json` en `main`, consumido por el build estático.

`Guardar borrador` nunca equivale a publicar. `Publicar` primero conserva el borrador y abre la autoría compartida enfocada en **Perfil público**. La escritura remota exige autorización temporal, usa el SHA remoto como precondición cuando hay divergencia y verifica la nueva versión mediante read-back.

La página `/acerca-de/` no lee `localStorage` como fuente pública. El cambio se vuelve público sólo después de que el commit de `main` complete los gates y el despliegue estático de GitHub Pages.

## Propiedades de seguridad

- Sin persistencia de credenciales.
- Fail-closed ante autenticación, autorización, validación o transporte inválido.
- Conflictos 409/422 no disparan last-write-wins ni reintentos destructivos.
- Las páginas públicas no dependen de credenciales ni del almacenamiento local del Admin.
- Una escritura confirmada en GitHub no se presenta como despliegue terminado; CI/CD conserva esa responsabilidad.
