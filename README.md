# Cuba — La hoja de ruta

Plataforma editorial y documental modular sobre soberanía, constitucionalismo y Estado.

**Producto:** Cuba — La hoja de ruta  
**Arquitectura técnica:** ZenBlog

## Objetivo

Blogger funciona como CMS y host del contenido. La aplicación vive en este repositorio y se sirve como recursos externos, manteniendo el XML de Blogger pequeño, estable y fácil de recuperar.

```text
Blogger
  └─ blogger/theme.xml
      ├─ dist/zenblog.css
      └─ dist/zenblog.js
            ↓
       createZenBlog()
            ↓
   Navigation / Explore / Search
            ↓
   ContentSource / MetadataSource
            ↓
   Blogger / Registry adapters
```

## Estructura v0.1

```text
blogger/
  theme.xml
config/
  metadata-schema.json
  vocabulary.json
dist/
  zenblog.css
  zenblog.js
docs/
  ARCHITECTURE.md
src/
  adapters/
  bootstrap/
  contracts/
  features/
  search/
  ui/
tests/
.github/workflows/
```

## Principios

- XML de Blogger mínimo y estable.
- Arquitectura modular basada en SOLID.
- Dominio y features desacoplados de Blogger y del almacenamiento.
- Metadata explícita: la clasificación documental no se infiere.
- Explore muestra Tipo · Fecha · Título, sin resúmenes.
- Año documental y fecha de publicación son dimensiones distintas.
- Progressive disclosure: menos interfaz visible, sin perder capacidad.
- zenRadioPlayer permanece independiente y protegido.
- Desarrollo LAB antes de producción.

## Recursos públicos

Cuando GitHub Pages esté activo desde `main`:

```text
https://devmod3.github.io/cuba-la-hoja-de-ruta/dist/zenblog.css
https://devmod3.github.io/cuba-la-hoja-de-ruta/dist/zenblog.js
```

El XML de Blogger sólo necesita esos dos recursos externos, además del loader independiente de zenRadioPlayer.

## Estado

`v0.1` está en integración LAB. El Metadata Registry actual sigue siendo `zenMetadataRegistry.v2` en localStorage mediante un adapter. El siguiente paso de infraestructura será sustituir ese adapter por un Registry persistente compartido sin modificar Explore.

Ver [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md).
