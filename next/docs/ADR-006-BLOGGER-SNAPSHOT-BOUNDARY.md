# ADR-006 — Deterministic Blogger snapshot boundary

## Status

Accepted for the parallel migration line.

## Context

Blogger remains the editorial CMS and canonical URL authority during migration. Fetching the Blogger feed directly from the public browser introduced runtime network coupling, delayed Explore hydration, and made cross-browser behavior depend on the CMS boundary. It also increased the client JavaScript budget by shipping CMS parsing/validation code to users.

## Decision

ZenBlog Next consumes a validated, versioned Blogger snapshot at build time. The browser never fetches the Blogger feed for public Explore search.

The snapshot must:

- be captured from the configured Blogger origin by controlled tooling;
- preserve Blogger article IDs and canonical article URLs;
- include a deterministic SHA-256 over the canonical article payload;
- declare its article count and synchronization timestamp;
- pass schema, origin, uniqueness, count, and SHA verification in CI;
- remain generated evidence and therefore outside Prettier ownership.

The snapshot is encapsulated by the first-class `@zenblog/content-snapshot` package. That package owns the generated evidence and exposes only its typed public API to consumers. `@zenblog/web` may depend on `@zenblog/content-snapshot` but may not reach the snapshot through a relative path and may not depend on `@zenblog/cms-blogger`.

The CMS adapter remains an independent boundary for synchronization and parity tests.

## Consequences

Public navigation and search become deterministic and network-independent at runtime. Static export remains viable. Content changes require an explicit snapshot synchronization before a new build can include them. This is intentional: content publication and application deployment become auditable events instead of hidden runtime drift.

No canonical ownership is transferred to Next during this phase. Article links continue to point to Blogger until a future cutover ADR is explicitly accepted.
