# Clarifications — Spec 001 Release-Line Convergence

**Date**: 2026-08-22

**Phase**: Clarify

**Rule**: Resolve ambiguity from evidence first. Ask the Product Owner only for information that cannot be derived from repository history, archived artifacts, CI, or the current public deployment.

## Decision status

### C-001 — What exact Blogger theme is installed now?

**Status**: OPEN — external artifact required.

Repository evidence can identify `main` and its `blogger/theme.xml`, but GitHub cannot prove which full XML is currently installed in Blogger because GitHub Pages and Blogger are separate deployments.

**Required evidence**: export/download the currently installed Blogger theme XML and preserve it without editing.

**Resolution rule**:
1. compute SHA-256 of the exported XML;
2. inspect its release/cache keys;
3. compare it with repository candidates and historical XMLs;
4. classify deployment as MATCH, DERIVED, STALE, MIXED, or UNKNOWN;
5. never infer installed state from `main` alone.

### C-002 — Which PR #13 mobile-render changes are legitimate candidates?

**Status**: PARTIALLY RESOLVED.

PR #13 is not an integration unit. It contains at least three independently testable hypotheses:

1. **M-001 Safe-area accounting** — current `main` mobile tokens use fixed `--zen-header-h: 101px` and `--zen-player-safe: 56px`; PR #13 proposes incorporating `env(safe-area-inset-top)` and `env(safe-area-inset-bottom)`.
2. **M-002 Short-height Home density** — PR #13 adds a short-phone layout before falling back to vertical scrolling.
3. **M-003 About stylesheet preload** — PR #13 preloads `about.css` in the Blogger theme. This is not inherently a mobile fix and must be evaluated separately from M-001/M-002.

**Decision**: none of M-001/M-002/M-003 is accepted merely because it exists in PR #13. Each requires current-baseline reproduction and bounded acceptance criteria.

**Remaining evidence**: real-device/browser reproduction after C-001 identifies the deployed baseline.

### C-003 — Does About still require the historical reliability fix?

**Status**: STRUCTURAL RISK CONFIRMED; PRODUCTION DEFECT NOT YET CONFIRMED.

Current `main` About rendering performs DOM replacement during render. The experimental branch changes this to build an off-DOM shell and commit only after a successful build, while catching initial/subscription render errors and preserving the last valid render.

This establishes a real failure-mode difference: an exception during current rendering can leave a partially mutated output, while the experimental design is transactional.

However, repository inspection alone does not prove that current real profile states trigger the failure.

**Decision**:
- PR #14 MUST NOT be merged wholesale.
- The browser smoke from the experimental line must be evaluated as independent diagnostic coverage.
- If current baseline reproduces the failure, recreate only the minimal transactional/error-boundary delta with regression coverage.
- If baseline passes deterministically, close the historical fix as unnecessary for release convergence and retain the structural improvement as separately assessable maintenance work only if justified.

### C-004 — Is there recoverable E4 evidence for v0.9/v0.9.1?

**Status**: OPEN / EVIDENCE INCOMPLETE.

Known evidence:
- PR #10 required real Blogger validation before merge.
- PR #10 head passed GitHub CI.
- GitHub PR discussion does not preserve manual Blogger QA evidence.
- historical `STATUS-v0.9.md` listed Blogger installation/QA as pending at that recorded point.
- forensic screenshots show historical rendered/blank states but cannot currently be tied unambiguously to the final v0.9.1 installed XML.

**Decision**: do not promote historical merge/CI to E4. If no attributable E4 artifact is recovered, execute a fresh baseline QA and state explicitly that historical manual evidence was unavailable.

### C-005 — Minimum QA matrix required for FROZEN

**Status**: RESOLVED AS SPEC DEFAULT, subject only to evidence-based reduction/expansion.

A release cannot become FROZEN without the following minimum matrix:

#### Viewport/device classes
- narrow phone: approximately 320px CSS width;
- normal phone portrait: approximately 390px CSS width;
- phone landscape / short-height viewport;
- tablet portrait: approximately 768px CSS width;
- desktop: >= 1024px CSS width;
- safe-area phone class where inset behavior is observable.

#### Browser engines
- Chromium-class desktop;
- WebKit/Safari-class mobile for safe-area/touch behavior;
- one secondary desktop engine when a change touches standards-sensitive DOM/CSS/navigation behavior.

#### Public flows
- Portada;
- Explore simple;
- Explore advanced;
- open Article;
- Article -> Portada;
- About with empty/partial/populated profile state as applicable;
- Zen Radio Player visibility/function/persistence boundary;
- direct refresh/deep-link where applicable.

#### Admin/debug flows when affected
- Metadata;
- Search Lab;
- About Manager;
- Inspector ON/OFF, exact node, modal and href restoration.

#### Release checks
- no horizontal page overflow;
- keyboard/focus semantics for changed controls;
- gestures do not replace visible navigation and do not steal protected interactions;
- cache keys coherent;
- Blogger XML well formed;
- CI green;
- installed Blogger XML hash recorded;
- Product Owner acceptance recorded.

A delta may require extra cases. It may not silently remove a case relevant to its risk surface.

### C-006 — What is the rollback baseline?

**Status**: PROVISIONAL RESOLUTION.

PR #10 explicitly names the previous validated XML as:

`ZenBlog-ABOUT-FAVICON-SIMPLIFIED-v0.1.xml`

and the previous LAB SHA as:

`92054d7e5589635925adbb3efd4a356883fcd687`

The forensic archive contains that XML intact.

**Archived XML SHA-256**:

`58cd7d098245cb739ac60550e52a4375627ec5af51ec7f5e117dbb6ca39211da`

**Classification**: PROVISIONAL ROLLBACK REFERENCE, not yet E5.

It becomes the formal rollback only if C-001/current-deployment evidence and historical acceptance evidence do not identify a newer demonstrably validated rollback artifact.

## Clarify exit criteria

Clarify is complete when:

1. C-001 is resolved from the currently installed Blogger XML;
2. C-002 has a reproduction table for M-001/M-002/M-003;
3. C-003 has a current-baseline browser result;
4. C-004 is either recovered or explicitly closed as `historical E4 unavailable; fresh validation required`;
5. C-005 remains the accepted QA matrix;
6. C-006 is confirmed or replaced by stronger evidence.

## Product Owner input still required

Only one artifact is mandatory before the technical plan can be considered trustworthy:

**Export/download the Blogger theme XML that is installed right now and provide that exact file without editing it.**

Optional but useful evidence, if readily available:
- screenshots or notes from the final v0.9/v0.9.1 Blogger acceptance;
- any locally saved XML explicitly known to be the last accepted production theme.

No memory-only answer is required when an artifact can be supplied.
