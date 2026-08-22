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

## Regla obligatoria de paridad LOCAL -> PÚBLICO

Una funcionalidad que pasa en local no se considera desplegada correctamente si, una vez promovida a Blogger Real, no produce el mismo resultado funcional observable en el entorno público.

```text
LOCAL = PASS
+ DESPLIEGUE A BLOGGER REAL
=> BLOGGER REAL DEBE ENTREGAR EL MISMO RESULTADO FUNCIONAL
```

Si la función depende de persistencia o datos, la paridad incluye el alcance de la persistencia. Un guardado que sólo escribe `localStorage` no satisface un requisito de guardado público/compartido.

Para acciones de Admin con intención pública:

```text
Guardar / Publicar
  -> persistencia local segura cuando corresponda
  -> persistencia pública compartida
  -> verificación en la superficie pública real
```

Si cualquiera de esos pasos falla, el caso de producción es `FAIL` y el release no puede declararse `FROZEN` aunque CI y local sean `PASS`.

La paridad funcional no autoriza atajos de seguridad. Toda escritura pública debe tener una frontera de autenticación/autorización; nunca se incrustarán tokens, secretos o credenciales privadas en JavaScript público.

## Regla obligatoria de acción explícita del usuario

Toda operación que dependa de una acción manual del usuario debe explicar esa acción antes de que el flujo dependa de ella. No se asumirá que el usuario conoce un paso implícito, ni se declarará un flujo completo si falta una intervención humana requerida.

Cada instrucción manual debe declarar, como mínimo:

```text
ACCIÓN DEL USUARIO:
<qué debe hacer exactamente>

POR QUÉ:
<qué parte del flujo habilita o verifica>

SI SE OMITE O SE HACE MAL:
<qué puede fallar, quedar incompleto o poner en riesgo el proyecto>

RESULTADO ESPERADO:
<evidencia concreta que confirma que el paso terminó correctamente>
```

Cuando intervengan credenciales, despliegues, publicación, rollback, edición de Blogger, permisos de GitHub o cualquier operación con impacto real, la instrucción debe añadir explícitamente las restricciones de seguridad relevantes y lo que el usuario NO debe hacer.

Ejemplo de publicación autenticada:

```text
ACCIÓN DEL USUARIO:
Introducir el token fine-grained únicamente en el diálogo de autorización de ZenBlog Admin y confirmar la publicación.

POR QUÉ:
El navegador necesita autorización temporal para escribir el snapshot público en GitHub. Sin esta acción sólo existe el guardado local.

SI SE OMITE:
La publicación pública NO se ejecuta y el caso permanece pendiente; no puede declararse PASS.

NO HACER:
No pegar el token en chats, código, XML, URLs, commits ni almacenamiento persistente.

RESULTADO ESPERADO:
Admin informa publicación completada y el cambio puede verificarse desde un contexto público independiente.
```

Principio rector:

```text
PROTEGER EL PROYECTO > ACELERAR EL FLUJO
```

Si una acción manual es ambigua, irreversible, riesgosa o puede afectar producción, el flujo debe detener la promoción de estado hasta que esa acción esté descrita y su resultado sea verificable.

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

Antes de pedir una acción manual:

```text
¿QUÉ DEBE HACER EL USUARIO?
¿POR QUÉ ES NECESARIO?
¿QUÉ RIESGO EVITA?
¿QUÉ RESULTADO CONFIRMA ÉXITO?
```

Después de cambiar código:

```text
CÓDIGO: CAMBIADO / NO CAMBIADO
CI: PASS / FAIL / NO EJECUTADO
GITHUB PAGES: DESPLEGADO / NO DESPLEGADO
BLOGGER REAL: DESPLEGADO Y VERIFICADO / DESPLEGADO-QA-PENDIENTE / NO DESPLEGADO
PARIDAD LOCAL -> PÚBLICO: PASS / FAIL / NO APLICA
```

Regla de lenguaje: nunca confundir "funciona local", "CI PASS", "publicado en GitHub Pages" y "desplegado en Blogger Real".
