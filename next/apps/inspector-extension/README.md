# Zen Inspector para Brave

Extensión Manifest V3 para inspeccionar cualquier página web normal desde Brave/Chromium sin integrar código de diagnóstico dentro del sitio inspeccionado.

## Privacidad y permisos

- `activeTab`: acceso temporal únicamente a la pestaña que el usuario activa explícitamente.
- `scripting`: inyección del runtime local del Inspector en esa pestaña.
- Sin `host_permissions`, `<all_urls>`, telemetría, red externa ni almacenamiento de contenido inspeccionado.
- Los valores de formularios, los valores `data-*` y los parámetros/hash de URL se redactan del log.
- La UI vive en un Shadow DOM cerrado y el content script se ejecuta en el isolated world de la extensión.

Brave/Chromium no permite que una extensión normal inyecte scripts en páginas internas protegidas como `brave://`, `chrome://` o la tienda de extensiones. El Inspector marca esas pestañas como no disponibles en vez de solicitar permisos más amplios.

## Build

Desde `next/`:

```sh
pnpm inspector:build
```

El artefacto no versionado se genera en `apps/inspector-extension/dist/`.

## Carga local en Brave

1. Abre `brave://extensions`.
2. Activa **Modo desarrollador**.
3. Pulsa **Cargar descomprimida**.
4. Selecciona `next/apps/inspector-extension/dist`.
5. Usa el icono de Zen Inspector o `Alt+Shift+Z` sobre una página web normal.

Al activarlo, mueve el puntero para identificar elementos y haz clic para bloquear la selección y abrir el log técnico. `Esc` libera la selección.
