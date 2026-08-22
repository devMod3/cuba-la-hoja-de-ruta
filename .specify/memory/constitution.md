# La hoja de ruta / ZenBlog Constitution

## Core Principles

### I. Preserve Validated Behavior
Any behavior already validated outside the approved scope MUST be treated as protected. Changes MUST begin by naming the intended scope and the protected surfaces. Rewrites are prohibited when a bounded change can satisfy the requirement. The governing sequence is: audit → isolate owner → state protected surfaces → implement the minimum coherent change → regression tests → CI → real Blogger QA → freeze after acceptance.

### II. Blogger Anatomy, URLs, and Public Documents Are Protected
Blogger remains the current CMS and public document host. The product MUST preserve exactly one `#page_body` and exactly one `Blog1`, with `Blog1` under `#page_body`; `zen_main` MUST NOT replace Blogger anatomy. Real Blogger article URLs and server-rendered public document semantics MUST be preserved. ZenBlog may compose around Blogger but MUST NOT silently replace Blogger platform responsibilities such as canonical handling or index/noindex authority.

### III. Contracts Before Infrastructure
Infrastructure changes MUST enter behind existing contracts/adapters/repositories rather than through direct feature coupling. `ContentSource`, metadata boundaries, site-profile storage, search services, public routing, and equivalent interfaces are architectural seams to preserve. Shared persistence, authentication, a future backend, another CMS, or a future domain MUST be introduced by replacing bounded infrastructure while keeping validated feature behavior stable.

### IV. Reader Critical Path Stays Minimal
Reader-facing Home, Explore, Article, Navigation, and the independent Zen Radio Player have priority over authoring/debug tooling. Admin, Inspector, Search Lab, and contextual About support MUST remain outside the initial reader critical path unless a measured product requirement proves otherwise. New global dependencies, scripts, storage keys, or `window.*` APIs require an explicit owner, lifecycle, and documented reason.

### V. UX Semantics Are Product Contracts
Institutional/editorial/dark/sober presentation, restrained iOS-like interaction principles, square institutional geometry, readable long-form Article behavior, and full mobile functional parity are intentional product constraints. Gestures may enhance visible navigation but MUST NOT replace it. Explore simple search MUST remain title-only; Explore rows MUST remain `Type · Date · Title` without summaries; documentary year MUST remain distinct from Blogger publication date. The Zen Radio Player is independent and protected; ZenBlog MUST NOT restyle, hide, close, or reimplement player internals.

### VI. Evidence Before Change, Evidence Before Merge
Every material change MUST be testable against explicit acceptance criteria. Claims about performance, indexing, crawler behavior, accessibility, security posture, or production correctness MUST use evidence from the relevant environment; estimates or assumptions MUST NOT be presented as measurements. Required automated gates are `npm run check`, `npm test`, Blogger XML well-formedness, and architecture/production invariants. Changes that affect rendering, navigation, responsive behavior, Blogger integration, or deployment MUST also pass the relevant real-browser and real-Blogger checks before being frozen. A merge is repository evidence; it is not by itself proof of real-environment acceptance.

### VII. Releases Must Be Reversible and Converged
Every release candidate MUST identify its baseline SHA, intended delta, rollback SHA/XML, and acceptance state. GitHub Pages and Blogger are separate deployment surfaces and MUST NOT be treated as a single deployment. A feature or release is not done because code exists or CI is green; it is done only when implementation, tests, documented scope, and the actual Blogger result converge. Diverged or stale LAB branches MUST be reconciled intentionally, never merged wholesale without comparison to current `main`. Releases MUST distinguish EXPERIMENT, CANDIDATE, VALIDATED, and FROZEN states.

### VIII. Maintainability Is a Product Feature
The repository MUST remain sufficient for a competent future maintainer to understand, build, test, modify, and roll back the product without relying on chat history or undocumented memory. Generated or bundled runtime artifacts MUST have a versioned source of truth and a reproducible generation path, or be explicitly frozen with provenance and integrity evidence until such a path exists. Distribution fragments MUST NOT silently become the only editable source. Architectural decisions with long-lived consequences MUST be recorded as ADRs. Comments SHOULD preserve WHY, compatibility boundaries, risks, invariants, and deliberate no-change decisions rather than narrating syntax. Between equally correct solutions, prefer the one that requires less implicit knowledge to maintain safely.

### IX. Security and Accessibility Are Design Constraints
Security and accessibility MUST be considered during specification and design, not added only after implementation. Public reader surfaces SHOULD meet WCAG 2.2 AA wherever applicable, including keyboard operation, visible focus, semantic naming, contrast, reflow, touch targets, error states, and non-exclusive gesture alternatives. Security-sensitive work involving Admin, storage, import/export, URLs, files/images, DOM injection, third-party dependencies, authentication, authorization, or remote persistence MUST include a proportional threat/risk analysis and verification plan. OWASP ASVS 5.0 and NIST SSDF 1.1 are reference catalogs for applicable controls; irrelevant controls MUST NOT be added mechanically. Secrets MUST NOT be committed. New dependencies require purpose, maintenance status, license, attack-surface, size/critical-path impact, and replacement-cost review.

## Additional Constraints

- The onboarding authority is `docs/PROJECT-HANDOFF-v0.9.1.txt` followed by `docs/ZENBLOG-FORENSIC-MEMORY.txt` and the current forensic registers.
- `docs/forensic/PROTECTED-SURFACE-REGISTRY-v0.1.txt` defines the current protected-surface baseline.
- `docs/forensic/DISCREPANCY-REGISTER-v0.1.txt` records unresolved inconsistencies and maintenance debt.
- `docs/forensic/RELEASE-LINEAGE-v0.1.txt` records how historical LAB work reached or did not reach the canonical line.
- Architectural boundaries are defined in `docs/ARCHITECTURE.md`; visual/interaction constraints in `docs/UI-UX-CONTRACT.md`; operational protocol in `docs/ZENBLOG-MAINTENANCE-GUIDE.md`.
- `docs/PRODUCTION-AUDIT-v0.9.md` and `docs/CODE-AUDIT-v0.9.md` record accepted debt and explicit no-change decisions; future work MUST distinguish deliberate omissions from defects.
- Native ESM remains intentional until a build/bundle pipeline demonstrates lower operational cost and a reproducible migration path.
- Metadata and site profile are currently LAB/local implementations. Future shared persistence and Admin authentication MUST be introduced behind stable contracts.
- Server-visible SEO/social metadata MUST remain server-rendered; runtime JavaScript MUST NOT become the only source for crawler-facing metadata.
- No feature may invent documentary metadata, popularity, structured-data facts, indexing status, or performance measurements without a traceable source.
- Version numbers, product release identifiers, and cache keys MUST have an explicit versioning policy before the next release-number transition.
- Historical source packages preserved outside `main` that are required to maintain generated runtime distributions MUST be recovered into a versioned, auditable source-of-truth location through a dedicated specification; recovery MUST prove equivalence before changing runtime behavior.

## Development Workflow and Quality Gates

1. Start from the latest validated `main` unless the specification explicitly requires another baseline.
2. Read the handoff, forensic memory, protected-surface registry, discrepancy register, release lineage, and owner documents for the affected surface before planning implementation.
3. Write a specification that defines the user/business outcome, protected surfaces, acceptance scenarios, measurable success criteria, and explicit out-of-scope items without prematurely choosing implementation details.
4. Clarify unresolved requirements before the technical plan when ambiguity can alter architecture, UX semantics, security, accessibility, or release state.
5. In the plan, name affected owners/contracts, regression risks, validation strategy, rollback strategy, data/security implications, accessibility implications, and any justified new dependency.
6. For long-lived architecture or versioning choices, create or update the relevant ADR before implementation.
7. Break work into independently verifiable tasks. Prefer small increments that can be reviewed and reverted independently.
8. Run automated checks before integration. For product-visible or Blogger-sensitive work, perform real-browser and real-Blogger QA before declaring completion.
9. Security-sensitive changes MUST receive proportional abuse-case/threat analysis and verification. Accessibility-affecting changes MUST include keyboard/focus/semantic/responsive checks as applicable.
10. Converge implementation against spec, plan, tasks, tests, source provenance, and actual environment evidence. Unmet requirements become explicit remaining tasks or registered debt, never silent omissions.
11. Merge only the intended delta. Historical LAB branches are evidence/reference, not merge targets by default.
12. Close or archive superseded PRs only after their disposition and relevant lineage have been documented.

## Governance

This Constitution governs Spec Kit specifications, plans, tasks, implementation reviews, release convergence, maintenance, and source provenance for ZenBlog. Existing project documents remain authoritative domain evidence; when this Constitution and an older informal practice conflict, the stricter preservation/evidence rule applies until an explicit amendment is approved.

Amendments MUST:
- state the problem that the current Constitution cannot handle;
- identify affected principles and protected surfaces;
- include a migration/compatibility impact assessment;
- update dependent templates, ADRs, registers, or guidance when necessary;
- use semantic versioning for this Constitution: MAJOR for incompatible governance changes, MINOR for new principles/materially expanded rules, PATCH for clarifications without behavioral change.

All PRs MUST be reviewable against these principles. Complexity, new dependencies, generated artifacts without source provenance, new global state, or contract breaks MUST be justified in the plan. A passing CI run is necessary but not sufficient for Blogger-sensitive acceptance.

**Version**: 1.1.0 | **Ratified**: 2026-08-22 | **Last Amended**: 2026-08-22
