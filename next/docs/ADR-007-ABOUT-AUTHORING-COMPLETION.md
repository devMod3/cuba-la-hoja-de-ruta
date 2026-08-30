# ADR-007 — Admin / Acerca de completado

## Estado

Aceptado.

## Contexto

El perfil público se mantiene como un documento portable (`site-profile.json`) y se edita desde Admin sin convertir GitHub o GitHub Pages en parte del dominio.

La auditoría del issue #93 detectó cuatro ambigüedades: el preview abría la versión publicada en vez del borrador, el JSON Schema no describía el contrato interno, `order` no tenía invariantes explícitas y la UI no permitía modificar el orden editorial.

## Decisiones

1. `site-profile.schema.json` es el contrato durable legible sin TypeScript y describe íntegramente `profile`, `location`, `social` y `relatedResources` con JSON Schema 2020-12 y `$id` URN.
2. Los parsers mantenidos siguen siendo responsables de políticas que JSON Schema estándar no puede expresar de forma portable, especialmente unicidad por propiedad para `id` y `order`.
3. `id` debe ser único por colección.
4. `order` debe ser un entero no negativo y único por colección.
5. Una entrada visible de red exige URL HTTP(S). Una entrada visible de recurso exige título y URL HTTP(S).
6. Una entrada oculta puede estar incompleta para permitir preparación editorial, pero cualquier URL presente debe seguir siendo segura.
7. Admin permite mover redes y recursos arriba/abajo y renumera el orden tras mover o eliminar.
8. `Vista Previa ↗` valida y persiste únicamente el borrador local, luego abre `/admin/acerca-de-preview/`. No escribe el repositorio y no usa credenciales.
9. La vista previa reutiliza el mismo componente de presentación que `/acerca-de/`, evitando una segunda implementación visual.
10. El Admin certifica la escritura remota mediante optimistic concurrency y read-back. La finalización de CI/Pages continúa siendo responsabilidad del delivery pipeline; no se introduce polling de GitHub Actions en la UI de autoría.
11. `/admin/acerca-de-preview/` es `noindex`, no forma parte del sitemap y no constituye una URL pública canónica.

## Consecuencias

La diferencia entre borrador, repositorio y web publicada queda explícita:

- editar: estado local;
- preview: estado local validado;
- publicar: documento remoto versionado y verificado;
- CI/Pages: entrega del SHA resultante;
- `/acerca-de/`: perfil canónico construido desde el repositorio.

El contenido editorial sigue siendo opcional. Los campos vacíos no son deuda técnica y la aplicación pública continúa omitiéndolos.
