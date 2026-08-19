# LAB deployment

## GitHub Pages

Publish from the `main` branch, repository root.

Expected public resources after merge:

```text
https://devmod3.github.io/cuba-la-hoja-de-ruta/dist/zenblog.css
https://devmod3.github.io/cuba-la-hoja-de-ruta/dist/zenblog.js
```

## Blogger

The Blogger template is `blogger/theme.xml`.

It intentionally keeps application logic out of the XML. The template loads the two ZenBlog entrypoints above and keeps the zenRadioPlayer loader independent.

## LAB rule

Do not apply this template to the production blog until it has been imported and exercised on the LAB blog.

Current metadata persistence is local browser storage through `LocalMetadataSource`. It is a LAB adapter and will be replaced by a persistent shared Registry adapter later.
