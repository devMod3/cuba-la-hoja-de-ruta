# ADR-011 — Blogger content control plane

## Status

Accepted for the parallel migration line.

## Context

ADR-006 established Blogger as the editorial CMS and canonical URL authority while ZenBlog Next consumes a validated snapshot at build time. The remaining operational gap was synchronization: content changes needed a repeatable backend process without introducing runtime network coupling, a mutable server into the GitHub Pages architecture, or unaudited writes to production.

Mobile first-level gesture navigation also remained part of the approved product contract and needed to be restored without interfering with article reading, controls, ZRP, accessibility or browser history.

## Decision

ZenBlog uses a repository-hosted content control plane rather than a public runtime API for this phase.

The control plane has four boundaries:

1. `@zenblog/cms-blogger` remains the only Blogger feed adapter and performs paginated CMS capture under controlled tooling.
2. A Node-only synchronization tool canonicalizes the captured article order, rejects foreign canonical origins and duplicate identity, computes SHA-256 over the canonical article array, and writes the snapshot plus metadata sidecar with same-filesystem atomic renames.
3. CI validates schema, origin, uniqueness, deterministic order, article count, content hash and metadata coherence before a candidate can build.
4. A scheduled or manually dispatched GitHub Actions workflow may update only a robot-owned branch and open or refresh a pull request. It never commits synchronized content directly to `main`.

The scheduled control plane runs every six hours. If the canonical content SHA is unchanged, it leaves `syncedAt` and the repository untouched. If content changes, the generated candidate must pass `pnpm check` before the automation publishes its review branch; the normal pull-request gates remain authoritative for promotion.

Public Next pages continue to consume only `@zenblog/content-snapshot`. They do not import `@zenblog/cms-blogger` and do not fetch Blogger from the browser.

For F06, mobile gesture navigation is mounted once in the root App Router layout. It preserves the established gesture thresholds and only navigates between `/`, `/explorar/` and `/acerca-de/`. It does not wrap at either end and ignores article routes, interactive controls, results surfaces and all protected ZRP surfaces.

## Consequences

Content publication and application deployment remain distinct, reviewable events. Blogger outages cannot break already deployed public navigation or search. A compromised or malformed CMS response cannot silently transfer canonical ownership or directly alter `main`.

Freshness is eventually consistent with a target polling lag of at most six hours unless the workflow is manually dispatched earlier. This is intentional while Blogger remains the CMS authority and GitHub Pages remains the static delivery platform.

A future move to event-driven synchronization or a dedicated backend service requires a separate ADR and must preserve the same provenance, review and canonical-ownership guarantees.
