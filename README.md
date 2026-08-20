# La hoja de ruta — ZenBlog

Plataforma editorial y documental modular sobre soberanía, Constitución y Estado.

**Producto público:** La hoja de ruta  
**Arquitectura técnica:** ZenBlog  
**CMS/host actual:** Blogger  
**Sitio:** `https://cubalahojaderuta.blogspot.com/`

## Antes de modificar código

**No empieces de cero.** Lee primero:

1. [`docs/ZENBLOG-FORENSIC-MEMORY.txt`](docs/ZENBLOG-FORENSIC-MEMORY.txt) — contexto operativo e invariantes.
2. [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) — fronteras técnicas actuales.
3. [`docs/UI-UX-CONTRACT.md`](docs/UI-UX-CONTRACT.md) — contrato visual/experiencia.
4. [`docs/ZENBLOG-MAINTENANCE-GUIDE.md`](docs/ZENBLOG-MAINTENANCE-GUIDE.md) — protocolo de cambios y code review.
5. [`docs/PRODUCTION-AUDIT-v0.9.md`](docs/PRODUCTION-AUDIT-v0.9.md) y [`docs/CODE-AUDIT-v0.9.md`](docs/CODE-AUDIT-v0.9.md) — hallazgos de producción y deuda aceptada.

Regla operativa: **si una función está validada y no forma parte del alcance, se considera protegida.**

## Arquitectura resumida

```text
Blogger document
│
├─ server-rendered SEO / Open Graph / X metadata
├─ #page_body → Blog1   [protected]
├─ public CSS modules   [parallel]
├─ dist/zenblog.js
│     ↓
│  createZenBlog()
│     ├─ Navigation
│     ├─ Home
│     ├─ Explore
│     ├─ Article
│     └─ Mobile gestures [lazy]
├─ tools/runtime/bootstrap.js
│     ├─ About     [lazy]
│     ├─ Inspector [lazy]
│     └─ Admin     [admin route]
└─ zenRadioPlayer [independent / protected]
```

Blogger sigue siendo CMS y propietario de URLs/documentos. El comportamiento de producto vive en módulos externos y depende de adapters/contracts para que la infraestructura pueda cambiar sin reconstruir features estables.

## Estructura

```text
assets/
  brand/
  social/
blogger/
  theme.xml
config/
dist/
docs/
src/
  adapters/
  bootstrap/
  contracts/
  domain/
  features/
  search/
  ui/
tests/
tools/
  about/
  admin/
  inspector/
  runtime/
.github/workflows/
```

## Invariantes

- exactamente un `#page_body` y un `Blog1`;
- no `zen_main` sustituyendo la anatomía Blogger;
- Explore simple sigue title-only y sus filas no muestran resumen;
- año documental ≠ fecha de publicación;
- player independiente/protegido;
- metadata explícita, no clasificación inventada;
- vertical page scroll pertenece principalmente a lectura;
- Admin/Inspector no forman parte del critical path lector;
- crawler metadata debe ser server-rendered;
- cambios pasan LAB + CI + Blogger real antes de congelarse.

## Desarrollo

```bash
npm run check
npm test
```

El workflow `Validate ZenBlog` añade validación XML e invariantes de arquitectura/producción.

## Deploy

GitHub Pages publica el repositorio desde `main`, pero **GitHub y Blogger son superficies separadas**. Actualizar `blogger/theme.xml` en GitHub no modifica automáticamente el tema activo del blog. Cada release del theme requiere XML completo validado e instalación/verificación en Blogger.

## Estado de infraestructura

Metadata y Site Profile mantienen adapters/storage locales durante la fase LAB. La evolución prevista es persistencia compartida y autenticación detrás de contratos existentes, sin reescribir Explore/About por tecnología de almacenamiento.

Para cualquier cambio, la memoria forense es el punto de entrada, no esta sección de estado.
