# ZenBlog UI/UX Contract

Estado: LAB — contrato de producto previo a producción.

## 1. Identidad

- Producto público: **La hoja de ruta**.
- Motor técnico: **ZenBlog**.
- Marca: **HR**.
- Descriptor: **Soberanía · Constitución · Estado**.
- Carácter: institucional, editorial, sobrio, oscuro; nunca estética hacker.
- Geometría: bordes predominantemente cuadrados; el color y la forma tienen función semántica.

## 2. Principio de interacción

> Menos visible simultáneamente, no menos capacidad.

La interfaz usa disclosure progresivo. Las funciones aparecen cuando son pertinentes y no compiten con la lectura.

### Invariante de scroll

> El scroll vertical pertenece a la lectura, no a la interfaz.

Portada, Explorar, navegación, Acerca de y controles deben intentar permanecer dentro del viewport. El artículo largo es la excepción y puede usar scroll vertical natural.

## 3. Navegación global

Orden fijo:

**Portada · Explorar · Acerca de · Reproductor**

- Portada, Explorar y Acerca de son vistas del shell y no deben provocar una recarga completa del documento cuando ya estamos en el documento principal de ZenBlog.
- Cambiar entre vistas internas nunca debe destruir el reproductor.
- En móvil, la navegación debe evolucionar a un overlay compacto; no se debe resolver ocultando acciones funcionales.

## 4. Portada

La Portada es una superficie editorial de descubrimiento, no el feed crudo de Blogger.

Contenido aprobado:

- Kicker: **SOBERANÍA · CONSTITUCIÓN · ESTADO**
- Título: **Seguir el origen, los límites y el ejercicio del poder.**
- Texto: **Conceptos, normas, documentos y análisis organizados para situar, relacionar y verificar cada afirmación.**
- Acción: **Explorar el sistema →**
- Lectura destacada: último artículo disponible, con **DESTACADO**, título, resumen y acción **Leer**.

Reglas:

- Una pantalla útil (`one useful viewport`) en desktop.
- El resumen pertenece a Portada porque su función es descubrir contenido.
- La lectura destacada no convierte Portada en una lista infinita.

## 5. Explorar

Explorar sirve para localizar, no para descubrir.

- Búsqueda simple y avanzada son modos mutuamente exclusivos.
- Resultados: **Tipo · Fecha · Título**.
- Sin resumen/snippet.
- Año = año documental/histórico; el orden reciente/antiguo usa la fecha de publicación de Blogger.
- `Restablecer criterios` vuelve a: Todos · Todos · Todos · Más recientes.
- Un único scroll interno pertenece a la lista de resultados.

## 6. Artículo

Objetivo: lectura enfocada y documental.

- Fuente editorial: Source Serif 4.
- Ancho de lectura: 68–72ch.
- Header editorial, deck, metadata y progreso de lectura.
- Índice/rail contextual cuando exista estructura suficiente.
- Relaciones y datos documentales por disclosure progresivo.
- El artículo largo usa scroll vertical natural.

## 7. Acerca de

Acerca de se presenta como modal/panel institucional, no como una página decorativa independiente.

- Bordes cuadrados.
- Jerarquía editorial clara.
- Cierre explícito.
- Enlaces principales visibles y sobrios.

## 8. Zen Radio Player

El reproductor es un componente independiente y protegido, integrado visualmente con ZenBlog.

### Persistencia

> El reproductor permanece vivo al cambiar entre Portada, Explorar y Acerca de. Sólo el botón **Cerrar** del propio reproductor puede cerrarlo y liberar la fuente de audio.

- Ninguna acción de navegación interna puede desmontar `<zen-radio-player>`.
- Minimizar no equivale a cerrar.
- La playlist se abre sólo por decisión del usuario y permanece cerrada al abrir el reproductor.
- El reproductor siempre está en primer plano y dispone de un modo compacto en el que no estorba.

### Integración visual

Debe compartir la paleta institucional de ZenBlog:

- Canvas `#121416`
- Surface 1 `#171A1D`
- Surface 2 `#1D2125`
- Surface 3 `#24292E`
- Texto `#F1F0EB`
- Texto secundario `#B4B6B8`
- Texto terciario `#858A8F`
- Borde `#2D3338`
- Borde fuerte `#434A50`
- Acento institucional `#C5AE7A`
- Live/error `#D16F72`

Tipografía de controles: **Source Sans 3** con fallback del sistema. El reproductor conserva su propio Shadow DOM y arquitectura; ZenBlog no reimplementa su lógica.

## 9. Regla de migración

La migración a módulos GitHub no autoriza rediseños accidentales. Una funcionalidad se considera migrada únicamente cuando conserva su contrato de producto y comportamiento aprobado en LAB.
