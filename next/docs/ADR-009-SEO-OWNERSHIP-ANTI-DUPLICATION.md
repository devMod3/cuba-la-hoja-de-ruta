# ADR-009 — SEO ownership and anti-duplication during migration

Status: Accepted for the parallel Next migration line.

## Context

Blogger remains the canonical publishing authority while the Next platform is developed in parallel. The Next article routes are migration previews generated from the captured Blogger snapshot; they are not yet entitled to become competing indexable documents.

## Decision

Until an explicit hostname cutover is accepted by the Product Owner:

- Blogger article URLs remain the canonical URLs for article content.
- Every `/articulo/[id]` preview remains `noindex`.
- `robots.txt` disallows `/articulo/` while leaving the public shell crawlable.
- The Next platform does not advertise its own sitemap before a real public hostname and cutover policy exist.
- A post-build gate reads the exported HTML and fails if a preview loses `noindex`, points canonical somewhere other than its exact Blogger URL, or if `robots.txt` no longer enforces the migration boundary.

## Verification

The acceptance evidence for this ADR is the normal Next quality pipeline: the static export must complete first and `seo:ownership:check` must then pass against that generated export. No source-only assertion substitutes for the exported-HTML check.

## Consequences

This creates defense in depth: metadata, exported HTML and crawler policy all express the same ownership model. The rule is executable rather than documentary only.

The gate does not claim that `robots.txt` alone prevents indexing; `noindex` and canonical metadata remain independently mandatory. Nor does this decision define the future production hostname, sitemap ownership or redirect plan. Those are cutover decisions and must be made separately.

## Non-goals

Q-043 does not change Blogger content, the existing production theme, Explore behavior, article ordering, ZRP, navigation, About, Inspector, or the canonical authority of Blogger.
