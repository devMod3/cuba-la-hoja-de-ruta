# Implementation Plan: ZenBlog v0.9.x Release-Line Convergence

**Branch**: `001-release-line-convergence` | **Date**: 2026-08-22 | **Spec**: `specs/001-release-line-convergence/spec.md`

**Input**: Feature specification plus forensic baseline, protected-surface registry, discrepancy register, release lineage, current Blogger deployment evidence, and clarification record.

## Summary

Converge ZenBlog from a split state — canonical code on `main/v0.9.1` but current Blogger executing an immutable historical LAB snapshot (`aa372e1...`) — into one auditable release baseline without merging divergent PR history.

The technical approach is **reconstruction from canonical main, guided by deployed-behavior evidence**:

1. characterize current production deltas independently;
2. extract/recreate only reusable tests from historical branches;
3. prove each candidate delta against protected surfaces;
4. build any accepted change on a new bounded child branch from the SDD baseline, never from PR #13/#14;
5. create one release candidate with coherent version/provenance;
6. install the full candidate XML in Blogger;
7. execute the required real-environment QA matrix;
8. record acceptance and rollback in a Release Manifest;
9. close/supersede historical PRs only after evidence is preserved.

No Search Core refactor, Metadata core refactor, new persistence backend, framework, bundler, redesign, or unrelated feature work is permitted.

## Technical Context

**Language/Version**: JavaScript ESM; Node.js >=20 for repository tooling/tests; Blogger XML; CSS.

**Primary Dependencies**: Native browser APIs; Blogger as CMS/document host; GitHub repository/Pages; current historical deployment uses jsDelivr pinned to a commit; Zen Radio Player remains an independently versioned external module. No JavaScript framework is introduced.

**Storage**: Existing browser-local contracts only: `zenMetadataRegistry.v2`, `zenSiteProfile.v1`, `zenInspector.enabled`. Storage architecture is not changed in this specification.

**Testing**: `node --check`, `node:test`, Blogger XML parsing/invariants, existing GitHub Actions `Validate ZenBlog`, extracted dependency-free Chrome/Chromium browser smoke for About, contract/regression tests for any accepted delta, plus manual real-Blogger QA.

**Target Platform**: Blogger-hosted public web UI on modern desktop/mobile browsers; GitHub-hosted static module assets; explicit Safari/WebKit-class validation for safe-area/touch behavior.

**Project Type**: Modular browser application composed around Blogger.

**Performance Goals**: No invented numeric target in Spec 001. Preserve existing critical-path boundaries; do not add reader-global dependencies without measured justification. Establish a real performance baseline in the subsequent roadmap milestone.

**Constraints**:
- preserve exactly one `#page_body` and one `Blog1`;
- preserve real Blogger article URLs;
- Zen Radio Player internals remain independent;
- Explore simple search remains title-only;
- Metadata/Search/Inspector contracts remain protected;
- release changes must be reversible;
- CI passing is necessary but not sufficient for release acceptance;
- production currently differs from canonical main and must not be overwritten without behavioral characterization.

**Scale/Scope**: One Blogger site, one modular frontend repository, current v0.9.x release line, four deployed candidate deltas (safe-area tokens, short-height Home, About preload, About mobile CSS) plus About reliability browser coverage and release/PR cleanup.

## Constitution Check

*GATE: Must pass before implementation research and re-check before a functional candidate is opened.*

### I. Preserve Validated Behavior — PASS WITH GATE

The plan does not rewrite existing features. Candidate deltas are reconstructed only after current-deployment characterization. Protected surfaces are listed explicitly.

### II. Blogger Anatomy, URLs, and Public Documents Are Protected — PASS

No plan step replaces Blogger ownership, changes article URLs, duplicates `page_body`/`Blog1`, or introduces `zen_main`.

### III. Contracts Before Infrastructure — PASS

Storage/CMS/persistence contracts are not changed. Source-provenance debt is deferred rather than refactored opportunistically.

### IV. Reader Critical Path Stays Minimal — PASS WITH M-003 REVIEW

The current deployment globally preloads About CSS; main lazy-loads it. M-003 MUST be evaluated as a critical-path tradeoff. The deployed preload is not automatically retained merely because it exists.

### V. UX Semantics Are Product Contracts — PASS

Explore, Article, visible navigation, gestures, player and Admin semantics are protected from unrelated changes.

### VI. Evidence Before Change, Evidence Before Merge — PASS

Tests/characterization precede product edits. Real Blogger QA remains a release gate.

### VII. Releases Must Be Reversible and Converged — PASS

The current 2026-08-22 Blogger XML export is the immediate rollback artifact with SHA-256 `42b439df1c96915a2568fce9b0a243f26196281d2c9f8afca0bb7f786df114d8`.

### VIII. Maintainability Is a Product Feature — PASS

Historical PRs are evidence sources, not integration sources. The plan records provenance and requires release identity to be reconstructable from repository documentation.

### IX. Security and Accessibility Are Design Constraints — PASS

No existing unsafe-URL/image-source validation is weakened. Keyboard/focus and visible-navigation behavior are included in QA. No new dependency is required for the proposed About browser smoke.

## Phase 0 — Research / Evidence Characterization

### R0.1 Freeze the input baselines

Record and do not mutate:
- canonical code baseline: `main` at `0a45bc523f0129d83307f1c6f3a972056b219ae0` unless main advances before implementation;
- current Blogger export SHA-256: `42b439df1c96915a2568fce9b0a243f26196281d2c9f8afca0bb7f786df114d8`;
- active production asset pin: `aa372e1cc7982d1f8335d0d21760869c396b32c3`;
- release-shell provenance: `ad43ac63c12a666534e03cf9d5436184b985d1d1`;
- historical operational rollback reference: `92054d7e...` / archived XML hash from the discrepancy register.

If `main` advances, stop and rebase/re-run the evidence comparison before functional edits.

### R0.2 Recover reusable About browser coverage only

From PR #14/#15/#16 recover, independently:
- `tests/about-browser-smoke.mjs` concept;
- `tests/fixtures/about-smoke.html` concept;
- CI invocation pattern.

Do NOT merge the branch.

The historical smoke implementation is acceptable as a research basis because it:
- uses only Node built-ins;
- launches an already-installed Chrome/Chromium binary;
- serves repository files from a local HTTP server;
- fails rather than silently skipping when Chromium is unavailable;
- previously passed as an explicit CI step.

Before adoption, review path traversal protection, deterministic timing and semantic assertions. Improve only what is necessary for deterministic canonical coverage.

### R0.3 Characterize deployed deltas

Create a decision table for:

| ID | Current production | main | Validation required | Possible outcome |
|---|---|---|---|---|
| M-001 Safe-area tokens | present | absent | safe-area phone + normal phone + landscape | preserve / reject |
| M-002 Short-height Home | present | older layout | 320/390 short-height + landscape | preserve / adjust / reject |
| M-003 About CSS preload | present | lazy | About first-open render + reader critical-path observation | preserve / replace with bounded strategy / reject |
| M-004 About CSS v0.1.5 | present | v0.1.4 | 320/390/768 + populated/empty profile | preserve / adjust / reject |
| A-001 Transactional About render | absent | absent | deterministic failure-path browser/unit reproduction | implement only if defect proven / defer |

No row may be promoted to implementation solely from branch ancestry or deployment presence.

### R0.4 Close historical E4 question honestly

Unless stronger attributable evidence appears during this phase, record:

`historical E4 unavailable; fresh validation required`

Do not spend unlimited effort reconstructing missing manual evidence after the forensic/GitHub archive has been exhausted.

## Phase 1 — Design / Candidate Definition

### D1.1 Choose candidate deltas from evidence

For each M/A row, record:
- observed symptom/benefit;
- environment;
- expected behavior;
- protected surfaces;
- regression test;
- accessibility/security relevance;
- keep/reject/defer decision.

Only KEEP decisions enter the functional child branch.

### D1.2 Use a bounded implementation branch

Create a new child branch from the latest accepted SDD branch, e.g.:

`001-release-line-convergence-impl`

Do not commit functional changes directly to historical PR branches. Do not merge PR #13/#14 into it.

If PR #17 is merged before implementation, rebase/create the implementation branch directly from the new `main` and re-run Constitution/evidence checks.

### D1.3 Release identity model

The release candidate MUST distinguish:
- source/candidate Git SHA;
- asset identity/delivery reference;
- Blogger XML artifact SHA-256;
- cache/release label;
- current-production rollback XML SHA-256.

A mutable branch name alone is not an acceptable release identity.

The final delivery method (GitHub Pages release key vs immutable commit-pinned CDN asset graph) MUST be chosen explicitly in the Release Manifest/ADR based on reversibility and drift risk. The current split deployment proves that release provenance cannot remain implicit.

### D1.4 No hidden generated state

If the candidate theme is transformed/pinned for Blogger deployment, the Release Manifest MUST record exactly how the deployed XML relates to repository `blogger/theme.xml`. Do not claim byte equality after Blogger serializes/expands widget internals.

## Phase 2 — Verification-First Implementation Sequence

This phase occurs on the bounded implementation branch, not historical branches.

### I2.1 Add/extract tests before product changes

1. canonical About browser smoke + fixture;
2. regression/contract tests for each accepted M delta;
3. release/provenance consistency checks where practical.

Run them against the unchanged baseline first and record the result. A test designed to expose a known defect may fail before the fix; characterization tests must distinguish expected baseline behavior from acceptance behavior.

### I2.2 Implement accepted deltas independently

Recommended commit granularity:
1. tests only;
2. M-001 tokens if accepted;
3. M-002 Home if accepted;
4. M-004 About mobile CSS if accepted;
5. M-003 preload/delivery strategy if accepted;
6. A-001 transactional render only if failure reproduction proves it necessary;
7. release identity/theme changes;
8. documentation/manifest updates.

Each product commit must identify the related delta ID.

### I2.3 Automated gates

Required before Blogger candidate installation:
- `npm run check`;
- `npm test`;
- browser smoke when adopted;
- Blogger XML well-formedness;
- repository architecture/SEO/cache/player invariants;
- no unintended changed files outside approved surfaces.

### I2.4 Convergence analysis before deployment

Compare implementation branch to its canonical base.

Expected product blast radius should be limited to approved files such as:
- `src/ui/styles/tokens.css` only if M-001 kept;
- `src/features/home/home.css` only if M-002 kept;
- `tools/about/about.css` only if M-004 kept;
- `blogger/theme.xml` only if M-003/release delivery requires it;
- `tools/about/AboutFeature.js` / `bootstrap.js` only if A-001 is proven;
- tests and release docs.

Any change to Explore JS, Article behavior, Metadata/Search/Inspector core, player internals or unrelated Admin code is a stop condition.

## Phase 3 — Blogger Candidate / Real QA

### B3.1 Generate/preserve candidate artifact

Before installation:
- preserve full candidate XML locally/repository evidence as appropriate;
- compute SHA-256;
- record source SHA and asset delivery identity;
- keep the 2026-08-22 current export available for immediate rollback.

### B3.2 Install full XML in Blogger

Do not patch fragments in production. Install the complete candidate XML.

### B3.3 Execute QA matrix

At minimum:
- 320-class narrow phone;
- 390-class phone portrait;
- short-height/landscape phone;
- 768-class tablet;
- >=1024 desktop;
- safe-area phone/WebKit class.

Flows:
- Portada;
- Explore simple;
- Explore advanced;
- Article open/read/return;
- About;
- player boundary/persistence;
- refresh/deep-link;
- Admin/Inspector only where affected or as final smoke required by Spec.

Record failures, browser/device class and candidate SHA/XML hash.

### B3.4 Acceptance / rollback

If a P0/P1 regression occurs:
- reinstall the exact 2026-08-22 rollback XML;
- record failure against candidate;
- do not call release converged.

If QA passes:
- Product Owner acceptance is recorded;
- release status advances to VALIDATED.

## Phase 4 — Release Manifest / Freeze

Create a manifest under a stable release-document path containing at least:
- release label;
- canonical source SHA;
- asset/delivery identity;
- Blogger XML SHA-256;
- Spec reference;
- automated CI run;
- browser-smoke result;
- Blogger installation date;
- QA matrix/result;
- acceptance;
- rollback artifact SHA-256;
- known debt;
- PR/branch dispositions.

Only after these fields are complete may status advance to FROZEN/E5.

## Phase 5 — Historical PR Convergence

After useful evidence is captured and the new release state is unambiguous:
- PR #4-#9: mark SUPERSEDED/ARCHIVED and close without merge;
- PR #13: EXPERIMENT/REFERENCE, close when all useful deltas have explicit keep/reject/defer disposition;
- PR #14: EXPERIMENT/REFERENCE, close after reusable browser coverage and A-001 decision are preserved;
- PR #15-#16: CI-ONLY, close after their successful browser-smoke evidence is referenced;
- PR #17: foundation/Spec line; keep its lifecycle independent from product implementation review.

No branch deletion is required by Spec 001; retention/deletion can follow repository archival policy later.

## Project Structure

### Documentation (this feature)

```text
specs/001-release-line-convergence/
├── spec.md
├── clarifications.md
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   ├── release-manifest.md
│   └── qa-evidence.md
└── tasks.md                 # generated in next phase, not by Plan

docs/forensic/
├── PROTECTED-SURFACE-REGISTRY-v0.1.txt
├── DISCREPANCY-REGISTER-v0.1.txt
├── RELEASE-LINEAGE-v0.1.txt
└── CURRENT-BLOGGER-DEPLOYMENT-2026-08-22.txt
```

### Source / product paths potentially involved later

```text
blogger/theme.xml
src/
├── bootstrap/createZenBlog.js
├── features/home/home.css
└── ui/styles/tokens.css

tools/about/
├── AboutFeature.js
├── about.css
└── bootstrap.js

tests/
├── about-browser-smoke.mjs          # candidate extraction
├── fixtures/about-smoke.html        # candidate extraction
└── [bounded delta regression tests]
```

**Structure Decision**: preserve the existing modular native-ESM architecture. Spec 001 introduces no new application layer, framework, package, bundle system or storage implementation.

## Complexity Tracking

No Constitution violation is currently justified or accepted.

Potential complexity requiring explicit stop/review if proposed later:
- adding a new runtime dependency for testing or release delivery;
- creating a build/bundle pipeline;
- changing storage architecture;
- rewriting About/Metadata/Search rather than applying a bounded correction;
- keeping both mutable and immutable asset delivery modes without a single release policy.

## Plan Exit Criteria

The Plan phase is complete when:
1. research decisions are recorded;
2. Release Manifest and QA Evidence contracts are defined;
3. entity/data model for release convergence is documented;
4. maintainer quickstart is documented;
5. Constitution Check remains PASS;
6. `tasks.md` can be generated without unresolved architecture questions.
