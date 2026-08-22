# Feature Specification: ZenBlog v0.9.x Release-Line Convergence

**Feature Branch**: `001-release-line-convergence`

**Created**: 2026-08-22

**Status**: Draft — forensic baseline incorporated

**Input**: Consolidate the current ZenBlog v0.9.x work into one trustworthy release baseline before starting new product features. Preserve validated behavior, reconcile the intended mobile-render work, isolate any still-needed About reliability fix, classify stale LAB/CI-only PRs, and require real Blogger evidence plus a release manifest before release closure.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - One trustworthy release baseline (Priority: P1)

As the product owner/maintainer, I need a single unambiguous v0.9.x baseline so that future changes start from known accepted behavior instead of reconstructing state from divergent LAB branches and PR history.

**Why this priority**: Every subsequent feature, bug fix, or infrastructure migration depends on knowing which code and Blogger theme represent the accepted product.

**Independent Test**: A maintainer can begin from the documented accepted SHA, identify the exact active Blogger XML/release state, identify the rollback point, and understand whether any v0.9.x work remains blocked without consulting historical conversations.

**Acceptance Scenarios**:

1. **Given** current `main` and the existing v0.9.x LAB/draft lines, **When** release convergence is completed, **Then** exactly one release baseline is designated as canonical with an exact SHA and acceptance state.
2. **Given** a future maintainer with repository access only, **When** they read the handoff, release manifest, protected-surface registry, discrepancy register and release lineage, **Then** they can identify the canonical baseline, rollback baseline, protected surfaces, and deferred work.
3. **Given** a historical LAB branch or PR, **When** it contains changes not present in the canonical release, **Then** those changes are explicitly classified as integrated, rejected, superseded, deferred, experimental, or still active rather than remaining ambiguous.

---

### User Story 2 - Preserve intended mobile behavior without importing branch drift (Priority: P1)

As a mobile reader, I need the validated ZenBlog experience to remain usable on supported phone layouts while the intended v0.9.2 mobile-render corrections are evaluated, without unrelated behavior changing as collateral damage.

**Why this priority**: The current mobile-render draft contains a focused product delta but its branch has diverged from the current canonical `main`; a wholesale merge would violate the project's preservation rule.

**Independent Test**: The intended mobile-render behavior can be validated on the current canonical baseline while Explore semantics, Article behavior, Metadata, Search Lab, Inspector, navigation semantics, and Zen Radio Player remain unchanged outside the approved scope.

**Acceptance Scenarios**:

1. **Given** the current canonical baseline, **When** each claimed mobile defect from PR #13 is reproduced, **Then** only reproducible defects become candidate work.
2. **Given** a reproducible safe-area/header/player or short-height issue, **When** a bounded correction is applied, **Then** the target mobile QA cases pass without changing protected semantics.
3. **Given** changes from the historical mobile-render branch that are no longer required or conflict with current `main`, **When** convergence occurs, **Then** they are omitted rather than carried forward because of branch ancestry.
4. **Given** an apparent mobile failure caused only by stale cache/version mixing, **When** cache state is normalized, **Then** no source change is introduced unless the defect still reproduces.

---

### User Story 3 - Resolve About reliability safely (Priority: P1)

As a reader, I need the public About surface to render reliably without requiring a high-risk merge of an old divergent branch.

**Why this priority**: The historical About fix attempted to solve a real render reliability problem, but its branch history is not a safe integration unit and its browser smoke is absent from current `main`.

**Independent Test**: On the current canonical baseline, the public About surface either passes a deterministic browser-smoke criterion without additional changes, or a minimal isolated fix is applied and verified while protected unrelated features remain untouched.

**Acceptance Scenarios**:

1. **Given** the current canonical baseline, **When** About is exercised with empty, partial, and populated `zenSiteProfile.v1` states, **Then** it produces a coherent render and does not leave partial/destructive output.
2. **Given** that the current baseline already satisfies the reliability criterion, **When** PR #14 is reviewed, **Then** no redundant code change is introduced.
3. **Given** that a fix remains necessary, **When** it is integrated, **Then** only the minimal required delta and regression/browser coverage are carried forward; unrelated historical branch changes are excluded.
4. **Given** the historical `tests/about-browser-smoke.mjs`, **When** it is evaluated, **Then** it is either adapted into deterministic canonical coverage or explicitly rejected with reason; it is not silently lost in an abandoned PR.

---

### User Story 4 - Release closure requires real environment evidence (Priority: P1)

As the product owner, I need release status to reflect the actual Blogger deployment rather than GitHub state alone so that `merged`, `CI green`, `deployed`, `validated`, and `frozen` are never conflated.

**Why this priority**: GitHub Pages and Blogger are separate deployment surfaces, and historical PR #10 explicitly required Blogger validation although the PR itself does not preserve that manual evidence.

**Independent Test**: A release cannot be marked FROZEN until automated checks, browser checks, Blogger installation/QA, exact artifacts, acceptance and rollback are recorded in one release manifest.

**Acceptance Scenarios**:

1. **Given** a candidate with passing CI, **When** it has not yet been installed and tested in Blogger, **Then** its status remains CANDIDATE rather than VALIDATED/FROZEN.
2. **Given** a candidate installed in Blogger, **When** the required smoke checks pass, **Then** the exact accepted Git SHA, Blogger XML SHA-256, installation date and QA evidence are recorded.
3. **Given** a Blogger regression, **When** acceptance fails, **Then** the release record identifies the failure and rollback target without declaring convergence.
4. **Given** a historical merge with no recoverable E4 record, **When** release history is reconstructed, **Then** the merge is recorded as repository integration evidence and not promoted to E4 by assumption.

---

### User Story 5 - Historical GitHub work has an explicit disposition (Priority: P2)

As a future maintainer, I need open historical PRs to communicate their real status so that I cannot accidentally merge superseded stacks or mistake CI-only experiments for pending product work.

**Why this priority**: PRs #4-#9 remain open although their feature lines are represented in the later v0.9 consolidation; PRs #15-#16 explicitly say they are CI-only; PRs #13-#14 are experiments, not release candidates.

**Independent Test**: Every relevant open historical PR has a documented disposition in the release lineage and, when safe, a corresponding GitHub lifecycle action/comment that leaves only genuinely active work open.

**Acceptance Scenarios**:

1. **Given** PRs #4-#9, **When** their relevant functionality is confirmed present/superseded by canonical main, **Then** they are marked SUPERSEDED/ARCHIVED and are not merge targets.
2. **Given** PRs #15-#16, **When** useful CI/browser evidence is preserved, **Then** they are marked CI-ONLY and closed without product merge.
3. **Given** PR #13 and PR #14, **When** their useful deltas/tests are evaluated, **Then** they remain experiment/reference sources and are not merged wholesale.
4. **Given** active PR #17, **When** the forensic foundation is accepted, **Then** it remains the only active release-convergence line unless a bounded child branch is explicitly created by the plan.

---

### User Story 6 - Maintenance gaps are recorded without expanding release scope (Priority: P2)

As a long-term maintainer, I need critical source-provenance gaps discovered during convergence to be recorded and scheduled without turning release convergence into an unrelated refactor.

**Why this priority**: The forensic archive contains the modular source package for Search Core v1 while canonical main primarily retains the generated browser distribution; Metadata v0.5 also has an unclear generated/source relationship.

**Independent Test**: The release can converge without refactoring these cores, while the discrepancy register preserves the exact maintenance risk and a follow-up specification is defined before any future modification to those generated distributions.

**Acceptance Scenarios**:

1. **Given** Search Core v1 source exists in the forensic archive but not as a canonical modular package in main, **When** Spec 001 closes, **Then** this remains registered debt with a dedicated follow-up path and does not trigger runtime changes inside Spec 001.
2. **Given** Metadata v0.5 is protected and represented as fragmented distribution files, **When** release convergence completes, **Then** its runtime remains unchanged and its source-of-truth recovery is deferred explicitly.

### Edge Cases

- `main` changes while release convergence is in progress.
- A historical branch contains both a desired fix and unrelated stale changes.
- CI passes but Blogger real-world rendering fails.
- Mobile behavior differs between narrow portrait, normal phone portrait, safe-area phones, and short-height/landscape.
- A fix appears necessary because of stale cache rather than source behavior.
- About data is absent or partially populated; reliability must not depend on every optional field being present.
- The active Blogger theme cannot be proven to match the repository candidate.
- A release candidate changes a cache/version key inconsistently across CSS, JS, lazy imports, favicon, or social assets.
- An intended improvement conflicts with a protected invariant or existing forensic decision.
- Historical QA exists but cannot be tied to the currently deployed Blogger XML.
- A PR was merged historically even though its body required manual validation that is not preserved in GitHub.
- A generated distribution is executable but its maintainable source is not versioned in the canonical repo.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The project MUST designate one canonical v0.9.x release baseline by exact commit SHA.
- **FR-002**: The release record MUST distinguish repository state, GitHub Pages state, Blogger deployment state, QA state, acceptance state, and evidence level.
- **FR-003**: Every relevant open/historical v0.9.x draft line MUST be classified as integrated, superseded, rejected, deferred, experimental, CI-only, or active.
- **FR-004**: The intended mobile-render work MUST be evaluated as bounded reproducible defects/deltas against the current canonical baseline, not accepted through a wholesale merge of divergent history.
- **FR-005**: Protected behavior outside an approved bounded delta MUST remain unchanged.
- **FR-006**: The current About surface MUST be tested against an explicit deterministic reliability/browser-smoke criterion before deciding whether any historical About fix is still required.
- **FR-007**: If an About fix remains necessary, only the minimal required behavior change and regression coverage MUST be integrated onto the current baseline.
- **FR-008**: A release candidate MUST pass `npm run check`, `npm test`, Blogger XML well-formedness, and the repository architecture/production invariants.
- **FR-009**: Blogger-sensitive acceptance MUST include real Blogger QA of Home, Explore simple/advanced, Article/open-return flow, About, player, relevant Admin/Inspector surfaces, and target desktop/tablet/mobile layouts.
- **FR-010**: The release manifest MUST identify rollback commit and corresponding previously validated Blogger XML or equivalent rollback artifact.
- **FR-011**: Release closure MUST record remaining manual/account actions separately from code-complete work.
- **FR-012**: No new product feature, persistence backend, framework, bundler, Search Core refactor, Metadata core refactor, or unrelated redesign may be introduced as part of this specification.
- **FR-013**: Any claim that a branch/fix is no longer required MUST be supported by current-baseline tests, code equivalence evidence, or real-environment evidence, not branch age alone.
- **FR-014**: Any retained v0.9.x delta MUST have a traceable reason, protected-surface statement, regression strategy, and acceptance evidence.
- **FR-015**: A GitHub merge MUST NOT be used as proof of E4 Blogger validation when the real-environment evidence cannot be located.
- **FR-016**: The release manifest MUST contain at minimum: release label, Git SHA, Blogger XML SHA-256, cache/release key, Spec reference, CI run, browser-smoke result, Blogger installation date, Blogger QA matrix, acceptance result, rollback reference, known debt and Product Owner sign-off.
- **FR-017**: Historical v0.9 QA/release/status documents recovered from old branches MUST be preserved as historical evidence without being presented as current state.
- **FR-018**: PRs #4-#9 MUST NOT be merged as part of this specification; after supersession is proven, their GitHub status SHOULD be cleaned up with an explanatory disposition.
- **FR-019**: PRs #15-#16 MUST NOT produce a product merge; any reusable browser-test evidence MUST be recovered before they are closed.
- **FR-020**: PRs #13 and #14 MUST remain reference/experimental sources; only independently justified deltas may be recreated against current baseline.
- **FR-021**: Search Core v1 and Metadata v0.5 source-provenance gaps MUST remain recorded maintenance debt and MUST NOT be “fixed” by an unplanned refactor in this specification.
- **FR-022**: The project MUST use the current protected-surface registry, discrepancy register, and release lineage as inputs to planning and convergence.
- **FR-023**: Accessibility-sensitive retained deltas MUST preserve keyboard/focus/semantic usability and visible navigation; gestures MUST remain optional enhancement.
- **FR-024**: Security-sensitive behavior in About/Admin/import/export/URL handling MUST not be weakened by a retained delta; existing unsafe-URL/image-source protections remain protected.

### Protected Surfaces

Unless a later clarification explicitly changes scope, this specification MUST NOT alter:

- Blogger `#page_body` / `Blog1` anatomy;
- Zen Radio Player internals;
- Explore simple-search title-only semantics;
- Explore result-row content contract;
- documentary-year semantics;
- Article URL ownership and long-form reading behavior;
- Metadata v0.5 core semantics;
- Adaptive Metadata UI v0.6 semantics;
- Search Core/Search Lab classification boundary;
- Inspector semantics outside required verification;
- AdminShell functional ownership boundaries;
- `zenSiteProfile.v1` data contract unless a reliability defect proves a contract bug;
- server-rendered crawler-facing metadata architecture;
- reader critical-path lazy-loading boundary;
- release-cache consistency invariant.

### Evidence Model

- **E0**: unverified statement.
- **E1**: historical intent/documentation.
- **E2**: current code/static-test evidence.
- **E3**: automated behavioral/browser evidence.
- **E4**: documented real Blogger QA.
- **E5**: accepted/frozen release with SHA/XML/rollback manifest.

No artifact may be promoted to a higher level without the corresponding evidence.

### Key Entities

- **Release Baseline**: Exact repository SHA, release label, known product state, and relationship to active Blogger theme.
- **Release Manifest**: Single record linking source SHA, XML integrity, cache key, CI, browser/Blogger QA, acceptance, debt and rollback.
- **Candidate Delta**: Bounded behavior change evaluated against baseline independently from historical branch ancestry.
- **Protected Surface**: Validated behavior or architectural boundary excluded from unintended changes.
- **Release Evidence**: Automated checks, browser tests, Blogger QA observations, environment/date information and integrity hashes.
- **Rollback Point**: Previously validated repository SHA and Blogger XML/artifact that can restore the last accepted state.
- **Disposition**: Explicit status assigned to a historical PR/branch: ACTIVE, EXPERIMENT, CI-ONLY, SUPERSEDED, ARCHIVED, REJECTED or DEFERRED.
- **Source Provenance Gap**: Runtime/generated artifact whose maintainable source or reproducible generation path is not yet canonical in the repo.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: One and only one canonical v0.9.x baseline is documented with exact SHA, evidence level, acceptance state, XML integrity reference, and rollback point.
- **SC-002**: 100% of relevant v0.9.x/open historical PR lines reviewed by this spec have an explicit disposition.
- **SC-003**: The accepted candidate passes all repository automated gates with zero failures.
- **SC-004**: Protected surfaces show zero unintended behavior changes outside approved scope.
- **SC-005**: Required real-Blogger smoke scenarios are completed and recorded before status FROZEN.
- **SC-006**: Any retained mobile delta is a bounded reviewable change against current baseline rather than the full divergent PR #13 history.
- **SC-007**: About reliability is proven on current baseline; either no change is required or the retained fix is independently testable and bounded.
- **SC-008**: A maintainer using repository documentation alone can identify what is canonical, validated/frozen, experimental, superseded, pending and rollback-capable without consulting prior chat history.
- **SC-009**: Historical v0.9 QA/release/status records are preserved with historical labels and cannot be mistaken for current deployment state.
- **SC-010**: Search Core/Metadata source-provenance debt is explicitly deferred rather than silently accepted or accidentally refactored.
- **SC-011**: No historical PR classified as SUPERSEDED, CI-ONLY or EXPERIMENT is merged into the canonical line during Spec 001.

## Out of Scope

- Shared/remote metadata persistence.
- Admin authentication/authorization backend.
- New CMS or domain migration.
- Search Core v1 source-package recovery implementation.
- Metadata Manager v0.5 source reconstruction/refactor implementation.
- New build/bundle pipeline.
- Product redesign.
- New feature development unrelated to release convergence.
- Performance optimization before a real baseline exists.

## Assumptions

- `main` at the start of this specification is the authoritative repository baseline documented by the v0.9.1 handoff; the observed starting handoff commit is `0a45bc523f0129d83307f1c6f3a972056b219ae0`.
- Historical LAB branches remain available as evidence while convergence is performed.
- Real Blogger installation/QA remains a separate manual Product Owner step unless a compatible integration later changes that capability.
- The merge of PR #10 is evidence of repository integration but is not treated as sufficient proof that its manual Blogger gate occurred.
- Mobile stabilization and About reliability are the only candidate product deltas considered by this specification.
- Source-provenance recovery for Search Core v1 and Metadata v0.5 will be planned separately after release convergence.
- Existing handoff, forensic memory, architecture, UI/UX contract, maintenance guide, production/code audits, protected-surface registry, discrepancy register and release lineage are authoritative evidence unless explicitly amended through governance.
