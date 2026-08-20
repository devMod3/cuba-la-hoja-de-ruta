# ZenBlog architecture v0.9

## Goal

Keep **Blogger responsible for CMS, public document URLs and platform head integration**, while ZenBlog owns product behavior through bounded modules. Infrastructure must be replaceable without rebuilding working features.

```text
Blogger public document
│
├─ server-rendered <head>
│  ├─ Blogger all-head-content
│  ├─ search identity
│  ├─ Open Graph / X Card
│  └─ WebSite JSON-LD
│
├─ protected composition anatomy
│  └─ #page_body → Blog1
│
├─ public styles (parallel links)
│  ├─ tokens
│  ├─ shell
│  ├─ Home
│  ├─ Explore
│  ├─ Article
│  └─ responsive
│
├─ dist/zenblog.js
│     ↓
│  createZenBlog (composition root)
│     ├─ NavigationFeature
│     ├─ HomeFeature
│     ├─ ExploreFeature
│     ├─ ArticleFeature
│     └─ MobileGestureNavigation [lazy / touch mobile]
│
├─ tools/runtime/bootstrap.js
│     ├─ Admin [lazy / admin route]
│     ├─ About [lazy / about route]
│     └─ Inspector [lazy / enabled or Alt+I]
│
└─ zen-radio-player [independent / protected]
```

## Dependency direction

```text
Infrastructure (Blogger, storage)
        ↓
Adapters implement contracts
        ↓
Domain / services
        ↓
Features
        ↓
Composition root
```

Features should not know whether metadata comes from localStorage, an API or another repository. The composition root chooses implementations.

## Core contracts / adapters

- `BloggerFeedSource` → public Blogger content feed.
- `LocalMetadataSource` → current LAB `zenMetadataRegistry.v2` adapter.
- `ContentSource` / `MetadataSource` → infrastructure boundaries.

Future shared persistence should be introduced by adding/replacing adapters behind these boundaries rather than rewriting Explore/Home/Article.

## Feature ownership

### Navigation
Owns internal public route state for `zen-home`, `zen-explore`, `zen-about`. Direct Blogger article documents preserve their real URL and have special return-to-home behavior.

### MobileGestureNavigation
Optional enhancement only. Dynamically imported for coarse-pointer mobile devices. Never replaces visible navigation and deliberately excludes articles, player, result scroll and interactive controls.

### Home
Discovery surface: product statement + highlighted reading. Summary belongs here.

### Explore
Locating surface: title/type/date, title-only simple search, advanced structured filtering, bounded internal scroll. Explore semantics are protected from layout/performance refactors.

### Article
Reading surface: adapts Blogger content into long-form reading, TOC/rail/progress/print. Vertical page scroll is expected here.

### About
Public site identity backed by `zenSiteProfile.v1`. Loaded only when needed. Profile storage is currently local-browser infrastructure and therefore is not suitable as a global crawler-visible favicon source.

## Runtime auxiliary boundary

`tools/runtime/bootstrap.js` is intentionally tiny. It answers one question: **which optional tool must be loaded for this context?**

It must not accumulate domain logic.

- `/admin` → Admin bootstrap.
- `#zen-about` → About bootstrap.
- Inspector enabled / Alt+I → Inspector bootstrap.

This keeps authoring/diagnostic code off the normal reader critical path.

## Public head / crawler boundary

Search and social metadata must be available in Blogger's initial HTML. Do not move Open Graph/X/structured data into SPA JavaScript.

Blogger `all-head-content` remains in place for platform-managed head data. ZenBlog layers product identity and social metadata around it without replacing Blogger internals.

## CSS delivery

`dist/zenblog.css` remains a compatibility composition entry that uses CSS imports.

The **active production Blogger theme does not load it**. It links the six product CSS owners directly so the browser can discover them in parallel. This preserves modular ownership while removing the import waterfall.

A future build system may produce a bundled/minified CSS artifact, but it must preserve module ownership and regression gates.

## Layout contracts

Global tokens include:

- `--zen-header-h`
- `--zen-player-safe`
- `--zen-safe-inline`
- `--zen-reading-width`

Feature CSS should consume these instead of duplicating header/player heights.

Responsive foundation owns generic safety: safe areas, media/embed overflow, tables/code, pointer/touch ergonomics, reduced motion. Feature CSS owns feature-specific layout.

## Product invariants

- exactly one `#page_body`;
- exactly one `Blog1` under it;
- no `zen_main` replacement root;
- Explore simple query stays title-only;
- Explore rows do not gain summaries;
- documentary year is not publication date;
- no popularity sorting without analytics;
- player remains independent/protected;
- vertical page scroll belongs primarily to reading;
- Admin/Inspector must not affect readers when unused;
- social/search metadata is server-rendered;
- working features are not rewritten during unrelated hardening.

## Current persistence boundary

LAB/local browser stores:

- `zenMetadataRegistry.v2`
- `zenSiteProfile.v1`
- `zenInspector.enabled`

These are implementations, not the long-term model. The architectural migration path is shared persistence + authentication behind bounded repositories/adapters.

## Deployment boundary

GitHub Pages deploys repository assets from `main`.

Blogger theme deployment is separate: changing `blogger/theme.xml` in GitHub **does not update the active Blogger site**. Release procedure therefore produces a full validated XML, installs it in Blogger, verifies the real site, then freezes the accepted SHA/XML.

## Required context

Before architecture changes read:

1. `ZENBLOG-FORENSIC-MEMORY.txt`
2. this file
3. `UI-UX-CONTRACT.md`
4. `ZENBLOG-MAINTENANCE-GUIDE.md`
5. relevant tests and latest validated PR

The forensic memory is authoritative when a historical workaround or product invariant is not obvious from code alone.
