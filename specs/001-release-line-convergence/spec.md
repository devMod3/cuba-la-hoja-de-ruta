# Feature Specification: ZenBlog v0.9.x Release-Line Convergence

**Feature Branch**: `001-release-line-convergence`

**Created**: 2026-08-22

**Status**: Draft

**Input**: Consolidate the current ZenBlog v0.9.x work into one trustworthy release baseline before starting new product features. Preserve validated behavior, reconcile the intended mobile-render work, isolate any still-needed About reliability fix, and require real Blogger evidence before release closure.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - One trustworthy release baseline (Priority: P1)

As the product owner/maintainer, I need a single unambiguous v0.9.x baseline so that future changes start from known accepted behavior instead of reconstructing state from divergent LAB branches and PR history.

**Why this priority**: Every subsequent feature, bug fix, or infrastructure migration depends on knowing which code and Blogger theme represent the accepted product.

**Independent Test**: A maintainer can begin from the documented accepted SHA, identify the exact active Blogger XML/release state, identify the rollback point, and understand whether any v0.9.x work remains blocked without consulting historical conversations.

**Acceptance Scenarios**:

1. **Given** current `main` and the existing v0.9.x LAB/draft lines, **When** release convergence is completed, **Then** exactly one release baseline is designated as canonical with an exact SHA and acceptance state.
2. **Given** a future maintainer with repository access only, **When** they read the release record and forensic memory, **Then** they can identify the canonical baseline, rollback baseline, protected surfaces, and any deferred work.
3. **Given** a historical LAB branch, **When** it contains changes not present in the canonical release, **Then** those changes are explicitly classified as integrated, rejected, superseded, or deferred rather than remaining ambiguous.

---

### User Story 2 - Preserve intended mobile behavior without importing branch drift (Priority: P1)

As a mobile reader, I need the validated ZenBlog experience to remain usable on supported phone layouts while the intended v0.9.2 mobile-render corrections are evaluated, without unrelated behavior changing as collateral damage.

**Why this priority**: The current mobile-render draft contains a focused product delta but its branch has diverged from the current canonical `main`; a wholesale merge would violate the project's preservation rule.

**Independent Test**: The intended mobile-render behavior can be validated on the current canonical baseline while Explore semantics, Article behavior, Metadata, Search Lab, Inspector, navigation semantics, and Zen Radio Player remain unchanged outside the approved scope.

**Acceptance Scenarios**:

1. **Given** the current canonical baseline, **When** the accepted mobile-render delta is applied, **Then** safe-area/header/player spacing and the approved compact mobile presentation behave correctly on the target mobile QA cases.
2. **Given** Explore, Article, Metadata, Search Lab, Inspector, navigation, and player behavior outside the mobile-render scope, **When** the candidate is tested, **Then** their protected behavior remains unchanged.
3. **Given** changes from the historical mobile-render branch that are no longer required or conflict with current `main`, **When** convergence occurs, **Then** they are omitted rather than carried forward because of branch ancestry.

---

### User Story 3 - Resolve About reliability safely (Priority: P2)

As a reader, I need the public About surface to render reliably without requiring a high-risk merge of an old divergent branch.

**Why this priority**: An About reliability branch exists, but its history is not a safe integration unit. The product outcome may still be valuable; the branch ancestry is not.

**Independent Test**: On the current canonical baseline, the public About surface either passes the defined reliability/browser-smoke criteria without additional changes, or a minimal isolated fix is applied and verified while protected unrelated features remain untouched.

**Acceptance Scenarios**:

1. **Given** the current canonical baseline, **When** About is exercised under the defined browser-smoke scenario, **Then** it renders the expected populated profile state without partial/destructive output.
2. **Given** that the current baseline already satisfies the reliability criterion, **When** the historical About fix is reviewed, **Then** no redundant code change is introduced.
3. **Given** that a fix remains necessary, **When** it is integrated, **Then** only the minimal required delta and its regression coverage are carried forward; unrelated historical branch changes are excluded.

---

### User Story 4 - Release closure requires real environment evidence (Priority: P2)

As the product owner, I need release status to reflect the actual Blogger deployment rather than GitHub state alone so that "merged" and "production accepted" are not confused.

**Why this priority**: GitHub Pages and Blogger are separate deployment surfaces, and `blogger/theme.xml` changes do not automatically update the live blog.

**Independent Test**: A release cannot be marked accepted until the required automated checks and real Blogger QA evidence are recorded.

**Acceptance Scenarios**:

1. **Given** a candidate with passing CI, **When** it has not yet been installed and tested in Blogger, **Then** its status remains candidate/blocked rather than accepted.
2. **Given** a candidate installed in Blogger, **When** the required smoke checks pass, **Then** the exact accepted SHA/XML and acceptance date are recorded.
3. **Given** a Blogger regression, **When** acceptance fails, **Then** the release record identifies the failure and rollback target without declaring convergence.

### Edge Cases

- `main` changes while the release-convergence work is in progress.
- A historical branch contains both a desired fix and unrelated stale changes.
- CI passes but Blogger real-world rendering fails.
- Mobile behavior differs between narrow portrait, normal phone portrait, and short-height/landscape.
- A fix appears necessary because of stale cache rather than source behavior.
- About data is absent or partially populated; reliability must not depend on every optional field being present.
- The active Blogger theme cannot be proven to match the repository candidate.
- A release candidate changes a cache/version key inconsistently across CSS, JS, lazy imports, favicon, or social assets.
- An intended improvement conflicts with a protected invariant or existing forensic decision.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The project MUST designate one canonical v0.9.x release baseline by exact commit SHA.
- **FR-002**: The release record MUST distinguish repository state, Blogger deployment state, QA state, and final acceptance state.
- **FR-003**: Every relevant open/historical v0.9.x draft line MUST be classified as integrated, superseded, rejected, deferred, or still active.
- **FR-004**: The intended mobile-render work MUST be evaluated as a bounded delta against the current canonical baseline, not accepted through a wholesale merge of divergent history.
- **FR-005**: Protected behavior outside the approved mobile-render scope MUST remain unchanged.
- **FR-006**: The current About surface MUST be tested against an explicit reliability/browser-smoke criterion before deciding whether any historical About fix is still required.
- **FR-007**: If an About fix remains necessary, only the minimal required behavior change and regression coverage MUST be integrated onto the current baseline.
- **FR-008**: A release candidate MUST pass `npm run check`, `npm test`, Blogger XML well-formedness, and the repository architecture/production invariants.
- **FR-009**: Blogger-sensitive acceptance MUST include real Blogger QA of Home, Explore simple/advanced, Article/open-return flow, About, player, Admin/Inspector surfaces relevant to the release, and target desktop/tablet/mobile layouts.
- **FR-010**: The release record MUST identify a rollback commit and the corresponding previously validated Blogger XML or equivalent rollback artifact.
- **FR-011**: Release closure MUST record any remaining manual/account actions separately from code-complete work.
- **FR-012**: No new product feature, persistence backend, framework, bundler, or unrelated redesign may be introduced as part of this specification.
- **FR-013**: Any claim that a branch/fix is no longer required MUST be supported by current-baseline tests or real-environment evidence, not branch age alone.
- **FR-014**: Any retained v0.9.x delta MUST have a traceable reason, protected-surface statement, and acceptance evidence.

### Protected Surfaces

Unless a later clarification explicitly changes scope, this specification MUST NOT alter:

- Explore simple-search title-only semantics;
- Explore result-row content contract;
- documentary-year semantics;
- Article URL ownership and long-form reading behavior;
- Metadata core/adaptive semantics;
- Search Lab semantics;
- Inspector semantics outside any required regression verification;
- Zen Radio Player internals;
- Blogger anatomy invariants;
- server-rendered crawler-facing metadata architecture;
- reader critical-path lazy-loading boundary.

### Key Entities

- **Release Baseline**: Exact repository SHA, release label, known product state, and its relationship to the active Blogger theme.
- **Candidate Delta**: A bounded set of intended behavior changes evaluated against the baseline independently from historical branch ancestry.
- **Protected Surface**: A validated behavior or architectural boundary explicitly excluded from the candidate delta.
- **Release Evidence**: Automated checks, browser tests, Blogger QA observations, and environment/date information supporting acceptance or rejection.
- **Rollback Point**: Previously validated repository SHA and Blogger XML/artifact that can restore the last accepted state.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: One and only one canonical v0.9.x baseline is documented with exact SHA, acceptance state, and rollback point.
- **SC-002**: 100% of currently relevant v0.9.x draft lines reviewed by this spec have an explicit disposition: integrated, superseded, rejected, deferred, or active.
- **SC-003**: The accepted candidate passes all repository automated gates with zero failures.
- **SC-004**: All protected surfaces named in this spec show zero intentional behavior changes outside approved scope.
- **SC-005**: Target real-Blogger smoke scenarios required by FR-009 are completed and recorded before the release is marked accepted.
- **SC-006**: The mobile-render delta, if retained, is represented as a reviewable bounded change against the current baseline rather than as the full divergent branch history.
- **SC-007**: The About reliability outcome is proven on the current baseline; either no change is required or the retained fix is independently testable and bounded.
- **SC-008**: A maintainer using repository documentation alone can identify what is production-accepted, what remains pending, and how to roll back without consulting prior chat history.

## Assumptions

- `main` at the start of this specification is the authoritative repository baseline documented by the v0.9.1 handoff.
- Historical LAB branches remain available as evidence while convergence is performed.
- Real Blogger installation/QA remains a separate manual product-owner step unless a later tool integration changes that capability.
- Mobile stabilization and About reliability are the only candidate product deltas considered by this specification; future persistence/authentication work begins only after release-line convergence.
- Existing forensic memory, architecture, UI/UX contract, maintenance guide, production audit, and code audit remain authoritative evidence unless explicitly amended through governance.
