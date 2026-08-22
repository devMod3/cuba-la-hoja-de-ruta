# ZenBlog — SDD Roadmap

Date: 2026-08-22  
Baseline: `main` at `0a45bc523f0129d83307f1c6f3a972056b219ae0`  
Adoption branch: `001-release-line-convergence`

## Purpose

Introduce Spec-Driven Development without discarding ZenBlog's existing forensic memory, architecture, UX contracts, LAB workflow, or validated behavior. Spec Kit is an orchestration layer over the existing knowledge base, not a replacement for it.

## Current Baseline

- Product: La hoja de ruta.
- Engine: ZenBlog.
- CMS/public document host: Blogger.
- GitHub Pages and Blogger are separate deployment surfaces.
- Package version: `0.4.0`.
- Canonical production-hardening history is consolidated on `main` as v0.9/v0.9.1 plus definitive handoff documentation.
- Automated validation currently includes JavaScript syntax checks, Node tests, Blogger XML well-formedness, and architecture/production invariants.
- There are no open GitHub Issues tracking product work.
- Work remains distributed across historical LAB branches and open draft PRs.

## Protected Product Surfaces

The following are protected unless a specification explicitly includes them:

- Blogger anatomy: one `#page_body`, one `Blog1`, no `zen_main` replacement.
- Real Blogger article URLs and server-rendered document ownership.
- Explore simple search semantics: title-only.
- Explore result rows: Type · Date · Title, no summary.
- Documentary year distinct from Blogger publication date.
- Article long-form reading behavior and URL continuity.
- Independent Zen Radio Player boundary.
- Metadata core/adaptive behavior unless explicitly scoped.
- Search Lab and Inspector semantics unless explicitly scoped.
- Reader critical path boundary that keeps Admin/Inspector/contextual tools lazy.

## Current Operational Debt

### Release-line convergence

`main` is the canonical v0.9.1 baseline, but `lab-v0.9.2-mobile-render` remains an open draft line with a focused mobile-render delta and has diverged from `main`. It must be reconciled against the current baseline rather than merged wholesale.

### About reliability branch hygiene

The open About reliability branch has a very large divergent history relative to current `main`. The desired About fix, tests, and browser-smoke concepts may be useful, but the branch itself must not be treated as a safe merge unit. Any retained fix should be extracted as an intentionally scoped delta onto the current baseline.

### No issue-level work ledger

The repository has PR history but no open Issues representing current requirements, acceptance criteria, dependencies, or remaining work. Spec Kit tasks should become the forward-looking work ledger after specifications and plans stabilize.

### Manual Blogger release boundary

Updating `blogger/theme.xml` in GitHub does not install the active Blogger theme. Release closure still requires a validated XML, Blogger installation, real-site QA, and an explicit acceptance/freeze decision.

### Accepted future debt

- Metadata registry remains browser-local/LAB.
- Site profile remains browser-local/LAB.
- Admin has no production authentication layer.
- Social image is a common branded fallback rather than generated per article.
- Theme installation remains manual.
- Native ESM/version-edge management remains manual by design until a build manifest or bundler demonstrably reduces operational cost.

## Roadmap

### R0 — Establish SDD governance

Status: In progress on `001-release-line-convergence`.

Deliverables:
- `.specify/memory/constitution.md`
- this roadmap
- first specification under `specs/`

Exit criteria:
- Constitution reflects existing forensic/architecture/UX contracts.
- No functional source code changed.
- First spec has bounded scope and measurable release-convergence criteria.

### R1 — Converge v0.9.x release line

Goal: establish one unambiguous, validated release line before new product work.

Scope candidates:
- Rebase/reconstruct the intended v0.9.2 mobile-render delta on current `main`.
- Decide which About reliability changes are still required and extract only those changes.
- Preserve all protected features outside the approved scope.
- Run automated gates plus real mobile/browser/Blogger QA.
- Record accepted SHA, rollback SHA/XML, and release evidence.

Exit criteria:
- No ambiguous draft branch is required to understand the current production state.
- Intended mobile/About fixes are either integrated and validated or explicitly rejected/deferred.
- Release state is documented as accepted, rejected, or still blocked by named evidence.

### R2 — Production evidence baseline

Goal: replace qualitative performance assumptions with dated production evidence.

Deliverables:
- mobile and desktop Lighthouse/PageSpeed baseline after the accepted Blogger deployment;
- test conditions and date;
- Core Web Vitals observations where available;
- explicit distinction between lab measurements and real production evidence.

Exit criteria:
- performance work can be prioritized using measured bottlenecks rather than trend-driven refactoring.

### R3 — Shared persistence + Admin authentication

Goal: replace LAB-local authoring persistence with a shared, authenticated infrastructure while preserving public UX and contracts.

Constraints:
- no direct backend coupling from public features;
- metadata and site profile migrate behind repositories/adapters;
- migration and rollback plan required;
- Admin authorization must fail closed;
- public reader behavior remains independent from authoring availability.

Exit criteria:
- metadata/profile edits are shared across authorized sessions;
- unauthenticated users cannot access authoring mutations;
- existing public Explore/About contracts continue to pass regression tests.

### R4 — Release/version automation

Trigger: only when manual ESM cache/version edges create repeated operational cost.

Possible scope:
- release manifest;
- generated cache key propagation;
- integrity checks preventing mixed version keys;
- optional build/import-map strategy if justified by measured maintenance cost.

Exit criteria:
- release version propagation becomes deterministic without introducing unnecessary runtime or build complexity.

### R5 — Hosting/domain evolution

Trigger: product requirement, not modernization pressure.

Goal: allow Blogger to become one `ContentSource` among alternatives without rewriting Home, Explore, Article, About, or search semantics.

Exit criteria:
- infrastructure can change behind contracts;
- public URLs/content migration has an explicit compatibility and redirect strategy;
- product behavior remains independently testable.

## Spec Kit Working Rule

For each new material change:

`constitution → specify → clarify (when ambiguity matters) → plan → tasks → analyze → implement in small batches → converge → PR → real-environment acceptance → merge/freeze`

Bug work should use an evidence-first assess/fix/test flow rather than report-to-patch jumping.

## Immediate Next Specification

`001-release-line-convergence`

This specification intentionally precedes new persistence, SEO, visual redesign, or hosting work. The system first needs a single trustworthy baseline and a reproducible release closure process.
