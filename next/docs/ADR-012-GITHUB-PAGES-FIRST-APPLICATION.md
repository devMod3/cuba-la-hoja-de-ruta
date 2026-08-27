# ADR-012 — GitHub Pages-first application boundary

## Status

Accepted for the active ZenBlog Next migration line.

## Context

ZenBlog Next already builds as a deterministic static export for GitHub Pages, while Blogger remains the current editorial source and historical canonical owner for article URLs. Earlier migration work deliberately preserved that Blogger boundary to avoid premature SEO or content-ownership changes.

The product now needs to be developed and reviewed as a complete application on GitHub Pages before deciding whether Blogger should remain part of the final delivery architecture. Treating Blogger as a required runtime surface would distort frontend, reader, search and administration decisions around a platform that may later be removed.

## Decision

GitHub Pages is the primary application delivery target for all new ZenBlog Next product work.

The following rules apply:

1. Every public product function must be complete and testable on the GitHub Pages static export, including Portada, Explore, Article, About and ZRP integration.
2. Public browser code must not require Blogger network availability. Content is consumed through validated build-time snapshots or future platform-neutral repositories/adapters.
3. Blogger may remain a transitional editorial input through `@zenblog/cms-blogger` and the repository-hosted content control plane, but it is not part of the public runtime dependency graph.
4. Internal navigation on GitHub Pages is authoritative for the Next application. Explore and other discovery surfaces route to Next article paths rather than sending users to Blogger.
5. Existing Blogger canonical ownership and `noindex` safeguards remain unchanged until a separate SEO/URL-ownership migration explicitly transfers authority. Pages-first product completeness does not silently change canonical ownership.
6. Blogger XML integration and production Blogger theme work are deferred. They cannot block completion of the GitHub Pages application and must be evaluated later as an optional integration/cutover decision.
7. Features that require mutation, authentication or shared persistence must use an explicit control-plane/backend boundary. They must not pretend that GitHub Pages itself provides a mutable server runtime.
8. GitHub Pages base-path export, static asset integrity, accessibility, cross-browser behavior and stale-deployment protection remain mandatory release gates.

## Consequences

The application can be reviewed end-to-end on one deployment surface without Blogger UI/runtime coupling. Content ingestion and product delivery remain separable, which makes a future CMS or hosting change an adapter concern rather than a frontend rewrite.

Article canonical URLs will temporarily continue to point to Blogger even while navigation and rendering occur on GitHub Pages. This is intentional migration state and must remain visible in SEO tests until an explicit ownership transfer is approved.

Admin/shared-persistence work will require a separate authenticated backend or repository control plane. Static hosting constraints must be modeled explicitly rather than bypassed with client-side secrets or unsafe direct writes.

## Reversal

If Blogger is later selected as the permanent delivery surface, a new ADR must demonstrate why reintroducing that runtime dependency improves the product without weakening the Pages-complete implementation, quality gates, URL continuity or rollback guarantees.
