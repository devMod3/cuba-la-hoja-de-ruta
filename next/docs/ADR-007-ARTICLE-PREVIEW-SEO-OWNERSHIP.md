# ADR-007 — Static article preview and SEO ownership

## Status

Proposed on Q-041 pending the complete Next validation gate.

## Context

Blogger remains the canonical public publisher while ZenBlog Next evolves in parallel. The migration line needs a real article route to validate static generation, content rendering, metadata, accessibility, and performance without creating duplicate-indexing risk or transferring URL authority prematurely.

## Decision

ZenBlog Next generates one preview route per captured Blogger article at `/articulo/[id]/` using `generateStaticParams()` and `dynamicParams = false`.

Each preview route must:

- derive its ID and editorial fields only from `@zenblog/content-snapshot`;
- emit the original Blogger URL as `alternates.canonical`;
- emit `noindex, follow` while Blogger remains canonical;
- preserve the original publication and modification timestamps when available;
- reject unknown IDs rather than creating runtime dynamic content;
- render no raw Blogger HTML until a dedicated sanitizer boundary has been accepted and gated.

Until that sanitizer boundary exists, article content is transformed to inert plain text and rendered through normal React text nodes. This prioritizes execution safety and deterministic static output over visual fidelity.

Explore continues linking directly to the canonical Blogger articles during this phase. The preview routes are migration evidence, not a cutover.

## Consequences

Article routing and metadata can be tested across browsers before any public URL migration. Duplicate indexing is explicitly prevented. Full editorial HTML fidelity remains a separate Q-041 security task with its own dependency and supply-chain review.
