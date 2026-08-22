# Clarifications — Spec 001 Release-Line Convergence

**Date**: 2026-08-22

**Phase**: Clarify

**Rule**: Resolve ambiguity from evidence first. Ask the Product Owner only for information that cannot be derived from repository history, archived artifacts, CI, or the current deployment artifact.

## Decision status

### C-001 — What exact Blogger theme is installed now?

**Status**: RESOLVED.

The Product Owner supplied the Blogger theme exported from the currently installed theme on 2026-08-22.

**Artifact identity**:
- SHA-256: `42b439df1c96915a2568fce9b0a243f26196281d2c9f8afca0bb7f786df114d8`
- bytes: `26408`
- rendered text lines: `588`
- XML parse: PASS

**Observed protected invariants**:
- exactly one `#page_body`;
- exactly one `Blog1`;
- no `zen_main`;
- Zen Radio Player loader `v1.0.3`;
- crawler-facing metadata remains server-rendered.

**Active ZenBlog asset pin**:

`aa372e1cc7982d1f8335d0d21760869c396b32c3`

The exported XML loads favicon fallback, social image, product CSS, About CSS, `dist/zenblog.js`, the composition root and runtime bootstrap through jsDelivr at that immutable commit.

Repository history proves the release shell provenance:

1. `aa372e1cc7982d1f8335d0d21760869c396b32c3` — `fix(about): preload public stylesheet to prevent mobile layout flash`.
2. `ad43ac63c12a666534e03cf9d5436184b985d1d1` — `chore(release): pin mobile render assets to validated commit` — repinned the release shell from `feaa8f...` to `aa372e1...` across all critical asset references.

The supplied export carries those `aa372e1...` pins. Blogger has expanded/serialized the `Blog1` widget internals, so the export is not expected to be byte-identical to repository `blogger/theme.xml`.

**Deployment classification**:

`DERIVED — ACTIVE NON-CANONICAL DEPLOYMENT`

`DERIVED` means the installed/exported XML is Blogger's serialized representation of the repository release shell with unambiguous asset-pin provenance.

`NON-CANONICAL` means current canonical `main/v0.9.1` uses GitHub Pages plus the `v=0.9.1` release/cache key, while Blogger currently executes immutable assets from the historical `aa372e1...` LAB lineage.

The detailed evidence record is:

`docs/forensic/CURRENT-BLOGGER-DEPLOYMENT-2026-08-22.txt`

### C-002 — Which PR #13 mobile-render changes are legitimate candidates?

**Status**: DEPLOYED DELTAS IDENTIFIED; ACCEPTANCE VALIDATION PENDING.

PR #13 remains an invalid integration unit. However, C-001 changes the question materially: some experimental mobile/render behavior is already deployed in Blogger through `aa372e1...` and must therefore be evaluated as existing production behavior, not as a hypothetical future feature.

#### M-001 Safe-area accounting

**Deployment state**: PRESENT IN CURRENT BLOGGER ASSETS.

Current deployed `aa372e1.../src/ui/styles/tokens.css` uses `safe-area-inset-top` and `safe-area-inset-bottom` in mobile header/player-safe tokens.

Current `main` still uses fixed mobile values:
- `--zen-header-h: 101px`;
- `--zen-player-safe: 56px`.

**Clarify decision**: do not blindly revert production to main and do not blindly merge PR #13. Validate the deployed safe-area behavior and recreate it on the canonical line only if accepted/required.

#### M-002 Short-height Home density

**Deployment state**: PRESENT IN CURRENT BLOGGER ASSETS.

The deployed `aa372e1.../src/features/home/home.css` contains:
- adjusted mobile title widths/sizes;
- a dedicated `max-height: 760px` phone compaction block;
- last-resort scroll only below `560px` height;
- `overscroll-behavior-y: contain`;
- `100svh` handling.

Current `main` lacks the full deployed delta and falls back to scrolling at the older `620px` threshold.

**Clarify decision**: production behavior must be tested before preserve/reject decision.

#### M-003 About stylesheet preload

**Deployment state**: PRESENT IN CURRENT BLOGGER XML.

The exported theme preloads `tools/about/about.css` in `<head>` from `aa372e1...`.

Current `main` does not preload About CSS in `blogger/theme.xml`; its About bootstrap loads the stylesheet lazily.

**Clarify decision**: treat preload as an independent render-stability/performance hypothesis, not as an inseparable mobile change.

#### M-004 About mobile CSS v0.1.5

**Deployment state**: PRESENT IN CURRENT BLOGGER ASSETS.

The current deployed `aa372e1.../tools/about/about.css` is labeled v0.1.5 and includes:
- overscroll containment;
- mobile player-safe padding;
- tighter phone composition;
- portrait + identity side-by-side on normal phones;
- stacking only on genuinely narrow screens;
- `100svh` handling.

Current `main` has About CSS v0.1.4 and differs materially on the mobile breakpoints/layout.

**Clarify decision**: add this as a separate candidate delta; do not hide it under M-003.

#### M-005 Responsive foundation

**Deployment state**: EQUIVALENT TO MAIN for the checked file.

`src/ui/styles/responsive.css` at `aa372e1...` has the same Git blob SHA as current main (`839ae297acfe09eb2804a1e852c6c2e6797b3640`).

This area does not require a convergence change solely because production is commit-pinned.

**Remaining evidence for C-002**: browser/device QA against the current deployed behavior and a main-based reconstruction candidate. No delta is accepted only because it is deployed; no deployed behavior is removed only because it is absent from main.

### C-003 — Does About still require the historical reliability fix?

**Status**: CURRENT DEPLOYMENT IDENTIFIED; STRUCTURAL RISK CONFIRMED; RUNTIME DEFECT VALIDATION PENDING.

The active deployed `aa372e1.../tools/about/AboutFeature.js` has blob SHA:

`9ec3aed5c283eefba23b649b6a191925f7459dce`

This is the same AboutFeature blob currently present on `main`.

Therefore the current Blogger deployment does **not** contain the later transactional render implementation from PR #14. The active deployment differs from main primarily through About CSS/preload and release delivery, not through AboutFeature transactional rendering.

The experimental PR #14 design still establishes a real failure-mode improvement:
- build off-DOM;
- commit only after successful build;
- preserve last valid render on error.

But the need for that fix must be proven by a deterministic browser smoke against the current/main-equivalent AboutFeature behavior.

**Decision**:
- PR #14 MUST NOT be merged wholesale.
- The historical browser smoke must be evaluated as independent diagnostic coverage.
- If current behavior reproduces partial/destructive render, recreate only the minimal transactional/error-boundary delta on the canonical baseline.
- If current behavior passes, PR #14 is not required for release convergence; a future resilience improvement would need its own justification/spec.

### C-004 — Is there recoverable E4 evidence for v0.9/v0.9.1?

**Status**: HISTORICAL E4 STILL INCOMPLETE; FRESH DEPLOYMENT ARTIFACT NOW AVAILABLE.

Known evidence:
- PR #10 required real Blogger validation before merge;
- PR #10 head passed GitHub CI;
- GitHub PR discussion does not preserve manual Blogger QA evidence;
- historical `STATUS-v0.9.md` listed Blogger installation/QA as pending at that recorded point;
- forensic screenshots show historical rendered/blank states but cannot be tied unambiguously to a final `main/v0.9.1` installed XML;
- the current 2026-08-22 Blogger export is attributable to `ad43ac63` / `aa372e1`, not to canonical `main/v0.9.1`.

**Decision**: historical merge/CI remains below E4 unless attributable manual evidence is recovered. If none is recovered, the release record will say:

`historical E4 unavailable; fresh validation required`

The current XML export proves deployment provenance/configuration, not browser QA or historical acceptance.

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
- cache/release graph coherent;
- Blogger XML well formed;
- CI green;
- installed Blogger XML hash recorded;
- Product Owner acceptance recorded.

A delta may require extra cases. It may not silently remove a case relevant to its risk surface.

### C-006 — What is the rollback baseline?

**Status**: RESOLVED FOR FORWARD WORK; HISTORICAL RELEASE ROLLBACK REMAINS PROVISIONAL.

For any change made after this clarification, the exact Blogger export supplied on 2026-08-22 is the immediate operational rollback artifact.

**Current deployment rollback identity**:

`SHA-256 42b439df1c96915a2568fce9b0a243f26196281d2c9f8afca0bb7f786df114d8`

This means the pre-change Blogger state is recoverable before any convergence candidate is installed.

It does **not** promote the historical current deployment to E5.

The older historical rollback reference from PR #10 remains:

`ZenBlog-ABOUT-FAVICON-SIMPLIFIED-v0.1.xml`

SHA-256:

`58cd7d098245cb739ac60550e52a4375627ec5af51ec7f5e117dbb6ca39211da`

Associated previous LAB SHA:

`92054d7e5589635925adbb3efd4a356883fcd687`

Use the 2026-08-22 current export for immediate operational rollback during Spec 001. Preserve the older artifact as historical lineage evidence.

## Version / delivery clarification discovered from C-001

The current deployment exposes a separate release-provenance problem that planning MUST address:

- active outer deployment URLs are immutable `@aa372e1...` jsDelivr URLs;
- `createZenBlog.js` inside `aa372e1...` still identifies/imports the internal graph as `0.4.0`;
- current canonical `main` identifies/imports that graph as `0.9.1`;
- much of the executable logic is equivalent, but release identity is not.

Spec 001 MUST converge release identity and deployment provenance without assuming that a numeric label alone proves semantic version equivalence.

## Clarify exit criteria

Clarify is complete when:

1. ~~C-001 current deployment identified~~ — DONE;
2. C-002 has browser/device validation for M-001/M-002/M-003/M-004 and an explicit preserve/reject decision for each;
3. C-003 has a deterministic current-baseline About browser result;
4. C-004 is either recovered or explicitly closed as `historical E4 unavailable; fresh validation required`;
5. ~~C-005 QA matrix defined~~ — DONE;
6. ~~C-006 immediate operational rollback identified~~ — DONE.

## Product Owner input still required

No additional documentary artifact is mandatory at this point.

Optional historical evidence remains useful if readily available:
- screenshots or notes explicitly tied to the final Blogger acceptance of a known SHA/XML;
- a locally saved XML explicitly known to be the last accepted production theme before the current deployment.

The next required evidence is behavioral QA, not memory-only testimony.
