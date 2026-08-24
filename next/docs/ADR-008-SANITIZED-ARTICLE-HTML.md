# ADR-008 — Sanitized Blogger HTML at the build boundary

## Status

Proposed on Q-042 pending the complete dependency, build, security and browser gates.

## Context

Q-041 established safe article previews by rendering Blogger HTML as inert text. That proved static routing, SEO ownership and browser behavior, but intentionally sacrificed headings, emphasis, lists and links. Full fidelity cannot justify rendering raw CMS HTML because Blogger content is an external trust boundary and React's `dangerouslySetInnerHTML` is unsafe without prior sanitization.

## Decision

Introduce a first-class server/build-only package, `@zenblog/content-renderer`, pinned to `sanitize-html@2.17.7` with `@types/sanitize-html@2.16.1`.

The renderer uses an explicit allowlist. It preserves only editorial structure needed by current content: paragraphs, headings below the document title, emphasis, block quotes, lists, safe links, line breaks, code/preformatted blocks and structural divs. It removes presentation attributes and all event handlers. Links are limited to `http`, `https` and `mailto`, and protocol-relative URLs are rejected. Embedded media, forms, frames, SVG, MathML and raw-text elements are not permitted.

Nested Blogger `h1` elements are transformed to `h2` so every preview keeps a single document-level `h1` owned by the article title.

`@zenblog/content-renderer` is server-only from the perspective of the Web package. The architecture gate must reject imports of it from any `'use client'` module. Sanitization occurs while Next prerenders the article route; the sanitized result, not the sanitizer runtime, is shipped to browsers.

Q-042 also replaces the noisy browser request for an unknown dynamic article ID with an export-level gate that verifies the exact set of static article directories against the content snapshot.

## Consequences

Article previews regain semantic fidelity without transferring trust to Blogger markup. The dependency graph and SBOM grow and therefore require a new cryptographic lockfile baseline. The sanitizer version is exact because this dependency sits directly on an XSS boundary. Blogger remains canonical and all preview routes remain `noindex` until an explicit future cutover decision.
