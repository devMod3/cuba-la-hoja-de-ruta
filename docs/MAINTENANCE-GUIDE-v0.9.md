# ZenBlog — Guía definitiva de mantenimiento v0.9

## 1. Antes de tocar código
Lee en este orden:
1. `docs/FORENSIC-MEMORY-v0.9.md`
2. `docs/ARCHITECTURE.md`
3. `docs/UI-UX-CONTRACT.md`
4. `docs/ZENBLOG-ADMIN-GUIDE.md`
5. este documento.

Confirma la rama, SHA y XML realmente instalados. No asumas que `main`, Pages y Blogger están sincronizados.

## 2. Política de cambios
- Una función validada se congela.
- Todo cambio empieza con auditoría read-only y alcance explícito.
- Cambios pequeños, reversibles y con prueba de regresión.
- No aprovechar una corrección para rediseñar módulos vecinos.
- Mantener separación de responsabilidades (SOLID): UI, dominio, adapters, storage y composition root no deben mezclarse.

## 3. Contrato de arquitectura
- Blogger = CMS + host + composition root.
- GitHub = módulos/versionado/documentación/CI.
- `src/features/*` contiene comportamiento de producto.
- `src/adapters/*` encapsula Blogger/localStorage/infraestructura.
- `src/contracts/*` define dependencias estables.
- `src/bootstrap/*` ensambla dependencias.
- `tools/*` contiene herramientas auxiliares que no deben contaminar el reader público.

## 4. Release seguro
Nunca despliegues un XML LAB que apunte a `devmod3.github.io/cuba-la-hoja-de-ruta/...` si el código aún no está en `main`.

Patrón obligatorio LAB:
- commit A = assets completos;
- commit B = XML fijado a A mediante `cdn.jsdelivr.net/gh/...@<SHA>/...`;
- CI sobre B;
- XML completo entregado al usuario;
- prueba real Blogger;
- freeze/merge sólo con aprobación.

## 5. Gates mínimos
Antes de entrega:
- `npm run check`
- `npm test`
- parse XML
- `Blog1 == 1`
- `page_body == 1`
- `zen_main` ausente
- reproductor presente y versión protegida
- Home carga
- Explore carga
- About carga/fallback
- artículo abre y vuelve a Portada
- Admin tabs cargan en `/admin`
- Inspector OFF no altera enlaces
- Inspector ON restaura `href` al apagarse

## 6. SEO y social
- canonical/indexabilidad: Blogger/all-head-content es autoridad salvo decisión explícita.
- OG/X: server-rendered en `<head>`.
- Nunca confiar en JS para datos que necesita un crawler social.
- Imágenes sociales deben ser públicas, HTTPS y estables.
- No duplicar meta robots contradictorias.
- Mantener un único nombre editorial: `La hoja de ruta`.

## 7. Rendimiento
- Evitar cascadas `@import` en producción.
- CSS crítico por links paralelos o bundle estable.
- Diferir Admin/About/Inspector cuando no son necesarios.
- No cargar librerías externas sin necesidad.
- Imágenes: dimensiones conocidas, compresión, lazy loading fuera del primer viewport.
- Evitar listeners globales duplicados; cada feature implementa `destroy()`.

## 8. Responsive y móvil
Validar al menos:
- 320–420 px móvil estrecho;
- 430–760 px móvil grande;
- 761–1023 px tablet;
- >=1024 px desktop.

Revisar overflow, safe areas, teclado, touch targets, orientación y `prefers-reduced-motion`. Los gestos nunca deben secuestrar inputs, selección de texto, carruseles, scroll horizontal ni enlaces.

## 9. Diagnóstico rápido
### Home/About en blanco
Primero revisar URLs de loaders. Si XML LAB usa Pages/main pero el código está en LAB, corregir el pin antes de tocar features.

### CSS extraño
Verificar que todos los CSS pertenecen al mismo release SHA.

### Admin no abre
Confirmar ruta `/admin`/`/p/admin.html`, loader Admin y que el shell no esté siendo reemplazado por una feature pública.

### Datos About/Metadata desaparecen
Recordar que en LAB son localStorage y dependen del navegador/origen. Exportar backups antes de cambios de persistencia.

## 10. Regla de cierre
Un cambio no está terminado porque compile. Está terminado cuando: pruebas automáticas + invariantes + Blogger real + aprobación del usuario coinciden.