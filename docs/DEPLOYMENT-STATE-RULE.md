# Regla obligatoria de estado de despliegue

## Propósito

Cada vez que se toque código, configuración ejecutable, tema Blogger, assets de runtime o datos públicos consumidos por ZenBlog, el trabajo debe declarar explícitamente el entorno objetivo antes de modificar archivos y repetir el estado al cerrar la intervención.

## Estados permitidos

### LOCAL / PRUEBAS

Usar cuando el cambio sólo está en una rama, entorno local, fixture, CI, harness o preview no productivo.

Debe mostrarse:

```text
ENTORNO: LOCAL / PRUEBAS
BLOGGER REAL: NO DESPLEGADO
DESPLIEGUE EN ESTA INTERVENCIÓN: NO
```

### BLOGGER REAL / PRODUCCIÓN

Usar únicamente cuando el objetivo de la intervención es publicar en el blog real.

Debe mostrarse antes de tocar producción:

```text
ENTORNO: BLOGGER REAL / PRODUCCIÓN
BLOGGER REAL: DESPLIEGUE SOLICITADO
DESPLIEGUE EN ESTA INTERVENCIÓN: SÍ
```

Al finalizar debe reemplazarse por uno de estos estados verificables:

```text
BLOGGER REAL: DESPLEGADO Y VERIFICADO
```

```text
BLOGGER REAL: DESPLEGADO / QA PENDIENTE
```

```text
BLOGGER REAL: NO DESPLEGADO
BLOQUEO: <causa concreta>
```

Nunca usar `DESPLEGADO` si sólo se actualizó GitHub, GitHub Pages, una rama, un PR, un XML candidato o un entorno local.

## Regla de promoción

Un cambio puede recorrer:

```text
LOCAL / PRUEBAS
  -> CI / CARACTERIZACIÓN
  -> CANDIDATO
  -> GITHUB PAGES / PAYLOAD PUBLICADO
  -> BLOGGER REAL / PRODUCCIÓN
  -> QA REAL
```

Cada transición debe quedar explícita. GitHub Pages y Blogger Real son estados distintos.

## Regla de evidencia

Para afirmar `BLOGGER REAL: DESPLEGADO`, debe existir evidencia de instalación efectiva del tema/cambio en el blog real.

Para afirmar `BLOGGER REAL: DESPLEGADO Y VERIFICADO`, además debe existir QA sobre la instancia real y sobre el payload/XML que se instaló.

## Aplicación obligatoria

Esta regla aplica a cualquier intervención que modifique:

- `src/`
- `dist/`
- `tools/`
- `assets/`
- `config/` cuando sea consumido por runtime público
- `blogger/theme.xml`
- scripts o workflows de despliegue
- versiones, cache keys, release pins o hashes de producción

No aplica a documentación puramente histórica que no altere comportamiento, aunque el cierre debe seguir indicando si hubo o no despliegue.

## Frontera de responsabilidad

`LOCAL / PRUEBAS` valida funcionalidad sin declarar producción.

`GITHUB PAGES` publica assets, pero no equivale por sí solo a instalar el tema en Blogger.

`BLOGGER REAL` significa la instancia pública real de La hoja de ruta.

## Regla operacional abreviada

Antes de cambiar código:

```text
¿ENTORNO? LOCAL / PRUEBAS | BLOGGER REAL
¿SE DESPLIEGA EN ESTA INTERVENCIÓN? SÍ | NO
```

Después de cambiar código:

```text
CÓDIGO: CAMBIADO / NO CAMBIADO
CI: PASS / FAIL / NO EJECUTADO
GITHUB PAGES: DESPLEGADO / NO DESPLEGADO
BLOGGER REAL: DESPLEGADO Y VERIFICADO / DESPLEGADO-QA-PENDIENTE / NO DESPLEGADO
```

Regla de lenguaje: nunca confundir "funciona local", "CI PASS", "publicado en GitHub Pages" y "desplegado en Blogger Real".
