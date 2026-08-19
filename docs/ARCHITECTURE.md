# ZenBlog architecture v0.1

## Goal

Keep Blogger responsible for CMS/content delivery and keep application behavior outside the XML template.

```text
Blogger
  └─ blogger/theme.xml
      ├─ dist/zenblog.css
      └─ dist/zenblog.js
            ↓
        Composition Root
            ↓
  ┌─────────┼──────────┐
  │         │          │
Navigation Explore   Search
            │
      ContentSource
      MetadataSource
```

## Dependency direction

`features` depend on contracts/services. They do not depend directly on Blogger or localStorage.

`adapters` implement infrastructure concerns:

- `BloggerFeedSource` → Blogger public feed.
- `LocalMetadataSource` → LAB `zenMetadataRegistry.v2`.

The Composition Root in `src/bootstrap/createZenBlog.js` wires concrete adapters to features.

## Why this matters

The Blogger XML stays small. Replacing localStorage with a remote persistent registry later only requires a new `MetadataSource` implementation and a Composition Root change. Explore does not need to be rebuilt around the storage technology.

## Public entrypoints

Blogger loads only:

```html
<link rel="stylesheet" href="https://devmod3.github.io/cuba-la-hoja-de-ruta/dist/zenblog.css">
<script type="module" src="https://devmod3.github.io/cuba-la-hoja-de-ruta/dist/zenblog.js"></script>
```

`dist/zenblog.css` composes feature styles through CSS imports. `dist/zenblog.js` imports the application Composition Root.

## Product invariants

- Explore results use title/type/date only; no summaries.
- Documentary year is not Blogger publication date.
- Explicit metadata classifies; missing metadata remains missing.
- No popularity sorting without analytics.
- The zenRadioPlayer loader is kept independent and protected.
- Vertical page scroll is for reading; Explore uses its own bounded result scroll.

## LAB boundary

v0.1 still uses `zenMetadataRegistry.v2` from localStorage. This is intentionally an adapter, not the architecture's source of truth. A shared persistent Registry is the next infrastructure milestone.
