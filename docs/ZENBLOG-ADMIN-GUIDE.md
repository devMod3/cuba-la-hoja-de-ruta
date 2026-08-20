# ZenBlog Admin — Guía de uso

**Estado documentado:** Admin v0.2.0 · Metadata Manager v0.5 · Search Core v1 LAB  
**Ruta de trabajo:** `/admin`  
**Ruta Blogger de respaldo:** `/p/admin.html`

> Esta guía describe el panel que existe actualmente. No documenta funciones futuras.

---

## 1. Qué es ZenBlog Admin

ZenBlog Admin es el panel de administración local de **La hoja de ruta**. En la versión actual contiene dos módulos:

1. **Metadata** — clasifica y estructura documentalmente los artículos de Blogger.
2. **Search Lab** — prueba el motor documental y explica por qué aparece cada resultado.

El panel se ejecuta dentro del dominio de Blogger, pero su código vive fuera del XML y se carga desde GitHub.

### Importante sobre seguridad

La versión actual **no tiene autenticación**. `/admin` es una ruta de laboratorio.

La metadata se guarda en el `localStorage` del navegador bajo:

```text
zenMetadataRegistry.v2
```

Por tanto:

- los datos pertenecen al navegador/perfil donde se editan;
- otro navegador o equipo no recibe automáticamente ese registro;
- borrar los datos del sitio/navegador puede borrar la metadata local;
- usa **Exportar** como copia de seguridad periódica.

---

# 2. Entrada al panel

Abre:

```text
https://cubalahojaderuta.blogspot.com/admin
```

Blogger puede servir internamente `/p/admin.html`; el bootstrap normaliza visualmente la ruta a `/admin`.

Al iniciar, el panel abre **Metadata Library**.

En consola puedes verificar la carga con:

```js
window.ZenBlogAdmin
```

La versión actual debe exponer aproximadamente:

```js
{
  version: "0.2.0",
  modules: ["metadata", "search-lab"],
  metadataVersion: "0.5",
  searchCoreVersion: "1.0.0-lab"
}
```

---

# 3. Metadata Library

Metadata Library es el módulo principal para clasificar artículos.

## 3.1 Encabezado

En la parte superior aparecen:

### Exportar

Descarga una copia JSON completa del registro canónico de metadata.

Úsalo:

- antes de cambios grandes;
- antes de importar otro registro;
- después de una sesión importante de clasificación;
- como respaldo para mover el trabajo a otro navegador/equipo.

El archivo exportado contiene el registro completo, no sólo el artículo abierto.

### Importar

Carga un registro JSON previamente exportado.

Antes de aceptar el archivo, el Manager comprueba:

- `schemaVersion` compatible;
- existencia de `records`;
- validez estructural de los registros.

Si encuentra metadata inválida, detiene la importación.

**Recomendación:** exporta el estado actual antes de importar.

### Search Lab

Cambia al módulo de diagnóstico del buscador documental.

No modifica metadata por sí mismo.

### ×

Cierra Metadata Manager.

En `/admin` normalmente no necesitas cerrar el panel; se mantiene como aplicación administrativa de pantalla completa.

---

# 4. Barra de estado

Debajo del encabezado aparece una línea de estado.

Ejemplos:

```text
12 artículos · 7 completos · 5 incompletos · 0 inválidos.
```

Puede mostrar también operaciones como:

```text
Metadata guardada para “Qué es pueblo”.
```

Los estados son:

### Completa

El registro es válido y tiene, como mínimo:

- Pilar principal;
- Tipo.

### Incompleta

El registro es estructuralmente válido, pero falta un dato obligatorio de clasificación, normalmente:

- Pilar principal;
- Tipo.

**Una metadata incompleta sí puede guardarse.** Sirve para avanzar por etapas sin inventar información.

### Inválida

Hay un error de contrato, vocabulario, rango o migración que debe corregirse.

Ejemplos:

- Pilar desconocido;
- Tipo desconocido;
- mismo Pilar como principal y relacionado;
- año documental fuera de `1500–2200`;
- concepto/norma fuera del vocabulario controlado;
- incidencia pendiente de migración v0.4.

**Una metadata inválida no se guarda desde el editor.**

---

# 5. Biblioteca lateral

La columna izquierda organiza artículos por **Pilar principal**.

Vistas actuales:

- **Todos** — todos los artículos recuperados del feed de Blogger.
- **Sin clasificar** — artículos sin Pilar principal.
- **Soberanía**
- **Constitución**
- **Estado**

El número a la derecha de cada carpeta es el total de artículos que pertenecen a esa vista.

La carpeta sólo utiliza el **Pilar principal**. Los Pilares relacionados no mueven el artículo de carpeta.

---

# 6. Buscar artículos en Metadata

El campo:

```text
Buscar artículos…
```

busca **por título** dentro de Metadata Library.

Es insensible a mayúsculas/minúsculas y acentos mediante normalización interna.

Ejemplo:

```text
constitucion
```

puede localizar un título que contenga:

```text
Constitución
```

Este buscador sirve para **localizar el artículo que quieres editar**. No es Search Lab.

---

# 7. Actualizar

El botón **Actualizar** vuelve a consultar el feed de Blogger.

Úsalo cuando:

- publicaste un artículo nuevo;
- cambiaste el título de una entrada;
- quieres reconciliar la biblioteca con Blogger.

El Manager pagina el feed y evita IDs duplicados.

Actualizar no borra deliberadamente tu clasificación existente; reconcilia los artículos encontrados con el registro local.

---

# 8. Lista de artículos

Cada fila muestra:

1. casilla de selección;
2. título;
3. Pilar principal o `Sin clasificar`;
4. salud de metadata: Completa / Incompleta / Inválida;
5. Tipo;
6. fecha de publicación.

Haz clic en el **título** para abrir el editor de ese artículo.

---

# 9. Selección múltiple y Mover

Puedes marcar varios artículos mediante las casillas.

La casilla del encabezado selecciona o deselecciona **todos los artículos visibles en la vista actual**.

En la barra inferior aparece el contador:

```text
N seleccionados
```

Después puedes usar:

```text
Mover a…
```

Opciones:

- Sin clasificar
- Soberanía
- Constitución
- Estado

Pulsa **Mover** para cambiar en bloque el **Pilar principal** de los seleccionados.

### Efecto importante

Si el Pilar de destino estaba también dentro de `Pilares relacionados`, el Manager lo elimina de relacionados para evitar duplicar Pilar principal y relacionado.

**Mover no cambia Tipo, conceptos, normas, año, estado ni revisión.**

---

# 10. Editor de metadata

Al pulsar el título de un artículo se abre el editor lateral.

En la cabecera ves:

- título del artículo;
- URL canónica;
- estado de validación;
- detalle del primer problema o dato faltante.

## 10.1 Pilar principal

Define la clasificación temática principal del documento.

Valores actuales:

- Soberanía
- Constitución
- Estado
- Sin clasificar

Regla práctica:

> Elige el Pilar que mejor describe la función central del documento, no cada tema que simplemente menciona.

---

## 10.2 Relacionados

Permite vincular el documento con otros Pilares sin cambiar su clasificación principal.

Ejemplo:

```text
Pilar principal: Soberanía
Relacionado: Constitución
```

El Manager impide que el mismo Pilar sea simultáneamente principal y relacionado.

Search Core sí puede recuperar un documento mediante un Pilar relacionado.

---

## 10.3 Tipo

Describe **qué clase de pieza documental es**.

Tipos actuales:

- Concepto
- Análisis
- Norma
- Documento
- Cronología
- Historia
- Dossier

Ejemplos orientativos:

- definición de “Pueblo” → **Concepto**;
- examen argumental de una cuestión → **Análisis**;
- Constitución, ley o artículo normativo → **Norma**;
- fuente primaria/documento reproducido → **Documento**;
- secuencia temporal → **Cronología**;
- reconstrucción histórica → **Historia**;
- agrupación documental temática → **Dossier**.

---

## 10.4 Año documental

No es la fecha de publicación en Blogger.

Representa el año propio del documento/hecho que estás clasificando.

Ejemplo:

```text
Artículo 40 de la Constitución de 1940
Año documental: 1940
```

Rango admitido:

```text
1500–2200
```

Déjalo vacío cuando no exista un año documental defendible.

---

## 10.5 Estado

Estado editorial controlado.

Valores actuales:

- Verificado
- En revisión
- Pendiente

Es metadata editorial; no equivale a fecha ni Tipo.

---

## 10.6 Revisión

Campo de texto para identificar una revisión editorial.

Ejemplo:

```text
1.0
```

No es obligatorio para que el registro sea considerado completo.

---

# 11. Conceptos

La sección **Conceptos** usa vocabulario controlado.

Conceptos actuales:

- Pueblo
- Soberanía popular
- Poder constituyente
- Continuidad jurídica
- Legitimidad
- Estado de derecho

## Añadir

1. abre `Seleccionar concepto…`;
2. elige un concepto;
3. pulsa **Añadir**.

Aparece como una etiqueta en `Seleccionados`.

## Quitar

Pulsa `×` en la etiqueta del concepto.

### Regla epistemológica

No añadas un concepto sólo para que el buscador encuentre más resultados.

> Metadata clasifica lo que el documento realmente contiene; Search Core recupera esa clasificación. El buscador no debe fabricar metadata.

---

# 12. Normas y referencias estructuradas

La sección **Normas** vincula el documento con fuentes normativas mediante referencias estructuradas.

Normas actualmente registradas:

- Constitución de 1940 (`c40`)
- Código Electoral de 1943 (`codigo-electoral-1943`)

## Añadir una norma

1. selecciona la norma;
2. pulsa **Añadir**;
3. aparece una fila de referencia.

## Artículos

En la fila puedes escribir artículos separados por coma:

```text
2, 40, 118, 119
```

El Manager los guarda como una colección estructurada, no como una frase libre.

Esto permite que Search Core entienda consultas como:

```text
C40 art 40
```

sin depender de coincidencias de texto accidentales.

## Quitar una norma

Pulsa `×` en la fila correspondiente.

---

# 13. Migración v0.4

Si existe metadata antigua bajo:

```text
zenMetadataRegistry.v1
```

el Manager puede migrarla al registro canónico:

```text
zenMetadataRegistry.v2
```

La migración intenta resolver valores mediante el vocabulario controlado.

Si encuentra conceptos o normas que no puede resolver, **no los inventa**. Crea una incidencia de migración para revisión manual.

Cuando abres un artículo afectado aparece una sección de migración con los problemas pendientes.

Al revisar y guardar valores canónicos válidos, se considera revisada la incidencia de ese registro.

---

# 14. Guardar metadata

Pulsa:

```text
Guardar metadata
```

El Manager:

1. construye el registro canónico;
2. valida contrato y vocabulario;
3. bloquea el guardado si existen errores reales;
4. permite guardar aunque falten Pilar o Tipo, marcándolo como **Incompleta**;
5. escribe el registro en `zenMetadataRegistry.v2`;
6. actualiza `window.ZenMetadataRegistry`;
7. dispara el evento:

```text
zenmetadata:changed
```

Search Lab escucha ese evento y reconstruye su índice automáticamente.

---

# 15. Abrir artículo

Dentro del editor, **Abrir artículo** abre la publicación real de Blogger en una pestaña nueva.

Úsalo para comprobar el contenido antes de clasificarlo.

No guarda cambios automáticamente.

---

# 16. Cerrar editor

Pulsa `×` en la cabecera del editor.

También puedes usar:

```text
Esc
```

si el editor está abierto.

Cerrar sin pulsar **Guardar metadata** descarta los cambios del formulario que no hayan sido guardados.

---

# 17. Search Lab

Search Lab es un entorno de diagnóstico para **Zen Search Core v1**.

Sirve para responder:

- ¿este documento aparece para esta consulta?;
- ¿por qué aparece?;
- ¿qué peso tiene cada coincidencia?;
- ¿funciona la referencia normativa?;
- ¿la metadata que acabo de guardar produce el comportamiento esperado?

Search Lab **no edita metadata**.

---

# 18. Entrar y salir de Search Lab

Desde Metadata pulsa:

```text
Search Lab
```

En Search Lab pulsa:

```text
Metadata
```

para volver al Manager.

Ambos módulos trabajan sobre el mismo registro local.

---

# 19. Actualizar índice

Pulsa:

```text
Actualizar índice
```

Search Lab vuelve a leer:

- artículos de Blogger;
- cuerpo del artículo;
- encabezados H2/H3;
- metadata canónica actual.

Después muestra:

```text
N artículos indexados.
```

### Actualización automática

Cuando Metadata Manager dispara `zenmetadata:changed`, Search Lab reconstruye el índice automáticamente si ya ha cargado artículos.

Si Search Lab está visible, vuelve a ejecutar la consulta actual.

---

# 20. Consulta libre

El campo **Consulta** acepta texto normal.

Ejemplo:

```text
pueblo
```

El motor puede contrastarlo contra varias señales, entre ellas:

- título;
- conceptos controlados;
- normas;
- aliases documentales;
- keywords;
- cuerpo del artículo.

La búsqueda normaliza mayúsculas/minúsculas y acentos.

---

# 21. Frases exactas

Usa comillas dobles:

```text
"continuidad juridica"
```

El parser conserva esa secuencia como frase.

Puede producir razones como:

- Frase en título;
- Frase en cuerpo.

---

# 22. Exclusiones con `-`

Anteponer `-` excluye documentos que contienen ese token según las reglas del motor.

Ejemplo:

```text
pueblo -legitimidad
```

Úsalo para probar precisión y reducir resultados no deseados.

---

# 23. Referencias naturales de artículos

Search Core reconoce expresiones naturales como:

```text
C40 art 40
```

También reconoce variantes de `artículo/articulo/art.` mediante normalización y aliases del vocabulario.

Para que aparezca una razón **Referencia de artículo**, el registro debe tener una referencia estructurada correspondiente en Metadata → Normas.

---

# 24. Operadores escritos en la consulta

El parser de Search Core entiende internamente:

```text
pilar:constitucion
tipo:norma
año:1940
norma:c40
art:40
articulo:40
estado:verificado
```

Sin embargo, en **la interfaz actual de Search Lab** debes usar los controles dedicados para:

- Pilar;
- Tipo;
- Estado.

Esos selectores son autoritativos y reemplazan esos tres filtros del parser.

Los operadores más útiles dentro del texto de consulta actualmente son:

```text
norma:c40
art:40
año:1940
```

además de frases, texto libre y negativos.

---

# 25. Filtros de Search Lab

## Pilar

Filtra por:

- Pilar principal;
- Pilares relacionados.

Esto significa que un documento puede aparecer en `Constitución` aunque su Pilar principal sea `Soberanía`, si Constitución fue registrada como relacionada.

## Tipo

Coincidencia exacta contra el Tipo controlado del registro.

## Desde / Hasta

Filtran por **Año documental**, no por fecha de publicación en Blogger.

Ejemplo:

```text
Desde: 1940
Hasta: 1959
```

## Estado

Filtra por estado editorial:

- Verificado
- En revisión
- Pendiente

---

# 26. Ejecutar búsqueda

Pulsa:

```text
Ejecutar búsqueda
```

También puedes pulsar **Enter** dentro del campo Consulta.

Si no hay texto ni filtros, Search Lab no devuelve la biblioteca completa: mantiene la vista vacía para evitar confundir diagnóstico con navegación general.

---

# 27. Cómo leer un resultado

Cada resultado muestra:

1. **Título** — abre el artículo en pestaña nueva.
2. **Score** — puntuación de relevancia documental.
3. **Metadata básica** — Pilar, Tipo y Año documental.
4. **Reasons** — razones exactas que aportaron puntuación.

El score es una métrica interna de ranking: **más alto = más señales/peso de coincidencia**, no un porcentaje de verdad ni de calidad del artículo.

---

# 28. Razones de coincidencia

Search Lab traduce las razones del motor a etiquetas legibles.

Puede mostrar:

- Título exacto
- Prefijo de título
- Frase en título
- Palabra en título
- Concepto exacto
- Alias de concepto
- Norma exacta
- Alias de norma
- Referencia de artículo
- Metadata controlada
- Alias documental exacto
- Alias documental
- Keyword exacta
- Keyword
- Frase en cuerpo
- Palabra en cuerpo
- Filtro estructurado

### Ejemplo

Consulta:

```text
C40 art 40
```

Un resultado bien catalogado puede mostrar:

```text
Alias de norma · Constitución de 1940
Referencia de artículo · 40
```

Esto permite auditar si el resultado apareció por metadata estructurada o sólo porque encontró texto libre.

---

# 29. Flujo recomendado: clasificar un artículo nuevo

## Paso 1 — Actualizar biblioteca

En Metadata:

```text
Actualizar
```

## Paso 2 — Buscar el título

Usa `Buscar artículos…`.

## Paso 3 — Abrir editor

Pulsa el título.

## Paso 4 — Clasificación mínima

Define:

```text
Pilar principal
Tipo
```

Con eso el registro puede pasar a **Completa** si no existen errores.

## Paso 5 — Añadir sólo metadata defendible

Según el documento:

- Pilares relacionados;
- Año documental;
- Estado;
- Revisión;
- Conceptos;
- Normas y artículos.

## Paso 6 — Guardar

Pulsa **Guardar metadata**.

## Paso 7 — Verificar en Search Lab

Abre Search Lab y busca con una consulta que debería recuperar el artículo.

Comprueba **Reasons**, no sólo que aparezca.

---

# 30. Flujo recomendado: documento normativo

Ejemplo conceptual:

```text
Título: Artículo 40 de la Constitución de 1940
Pilar principal: Constitución
Tipo: Norma
Año documental: 1940
Norma: Constitución de 1940
Artículos: 40
```

Después prueba:

```text
C40 art 40
```

La meta no es simplemente obtener un resultado; busca que aparezca la razón:

```text
Referencia de artículo
```

---

# 31. Flujo recomendado: copia de seguridad

Antes de una sesión grande:

```text
Exportar
```

Trabaja normalmente.

Al terminar:

```text
Exportar
```

Conserva la copia más reciente fuera del almacenamiento del navegador.

---

# 32. Qué NO hace todavía el panel

En la versión actual:

- no hay contraseña/autenticación;
- no sincroniza metadata automáticamente entre dispositivos;
- no escribe metadata dentro de Blogger ni GitHub como base persistente central;
- no edita el cuerpo de los artículos;
- Search Lab no modifica registros;
- Metadata Manager v0.5 aún no usa la futura **Adaptive UI v0.6**;
- Search Lab es diagnóstico/LAB, no reemplaza automáticamente el buscador público de Explore.

---

# 33. Diagnóstico desde consola

## Estado general del Admin

```js
window.ZenBlogAdmin
```

## Diagnóstico de Metadata Manager

```js
window.ZenMetadataManager.diagnostics()
```

Devuelve información como:

- cantidad de artículos;
- cantidad de registros;
- completos / incompletos / inválidos;
- versión de schema;
- versión de vocabulario;
- clave de almacenamiento;
- estado de carga.

## Inspeccionar registro sin modificarlo

```js
window.ZenMetadataManager.getRegistry()
```

## Inspeccionar artículos cargados

```js
window.ZenMetadataManager.getPosts()
```

Estas funciones son útiles para diagnóstico; para trabajo normal utiliza la interfaz.

---

# 34. Regla operativa

La regla más importante del sistema es:

> **Clasifica explícitamente; no clasifiques para manipular el buscador.**

Metadata Manager responde **qué es y con qué se relaciona el documento**.

Search Lab responde **cómo lo recupera el motor y por qué**.

Mantener separadas esas dos funciones protege la trazabilidad documental del sistema.
