# Tasks: ZenBlog v0.9.x Release-Line Convergence

**Input**: `spec.md`, `clarifications.md`, `clarify-closeout.md`, `plan.md`, `research.md`, `data-model.md`, `quickstart.md`, `contracts/`, forensic registries and ADR-001.

**Task format**: `[ID] [P?] [Story] Description`

- `[P]` means the task can run in parallel with other tasks in that phase because it targets independent files/evidence.
- `[US#]` maps directly to the user stories in `spec.md`.
- Tests/characterization precede implementation for every functional delta.
- A task marked conditional is closed either by implementing the accepted delta or by recording REJECT/DEFER with evidence; no unresolved task may silently disappear.

## Phase 1 — Setup / Baseline Lock

**Purpose**: ensure implementation starts from attributable source/deployment state and rollback is recoverable.

- [ ] T001 [US1] Re-read `.specify/memory/constitution.md`, `specs/001-release-line-convergence/plan.md`, `docs/forensic/PROTECTED-SURFACE-REGISTRY-v0.1.txt`, and `docs/architecture/ADR-001-immutable-release-asset-identity.md`; record reviewer/date in `specs/001-release-line-convergence/evidence/implementation-baseline.md`.
- [ ] T002 [US1] Verify current `main` SHA still matches the planned canonical base or document the new SHA/diff in `specs/001-release-line-convergence/evidence/implementation-baseline.md`; STOP and refresh Plan evidence if main materially advanced.
- [ ] T003 [US1] Verify the 2026-08-22 Blogger rollback XML bytes against SHA-256 `42b439df1c96915a2568fce9b0a243f26196281d2c9f8afca0bb7f786df114d8`; record storage/location and restoration availability in `specs/001-release-line-convergence/evidence/implementation-baseline.md`.
- [ ] T004 [US1] Create bounded implementation branch `001-release-line-convergence-impl` from the accepted canonical/SDD base; record base SHA in `specs/001-release-line-convergence/evidence/implementation-baseline.md`.
- [ ] T005 [P] [US1] Create `specs/001-release-line-convergence/evidence/candidate-deltas.md` with rows M-001, M-002, M-003, M-004, M-005, A-001 and fields from `CandidateDelta` in `data-model.md`.
- [ ] T006 [P] [US4] Create `specs/001-release-line-convergence/evidence/qa-run.md` from `contracts/qa-evidence.md`, leaving candidate identity/result fields unfilled until execution.
- [ ] T007 [P] [US1] Create `docs/releases/v0.9x-convergence/RELEASE-MANIFEST.md` from `contracts/release-manifest.md` with status `CANDIDATE-DRAFT`; do not claim source/XML/QA values not yet produced.

**Checkpoint**: exact source baseline and rollback are known; implementation branch exists; evidence ledger is ready.

## Phase 2 — Foundational Test Extraction / Characterization Harness

**Purpose**: recover reusable evidence mechanisms without importing divergent branch history.

- [ ] T008 [P] [US3] Recreate the historical dependency-free About browser fixture as `tests/fixtures/about-smoke.html`, adapting only paths/data needed for current canonical source; preserve `zenSiteProfile.v1` semantics.
- [ ] T009 [P] [US3] Recreate/review the historical Chromium smoke runner as `tests/about-browser-smoke.mjs`; retain path-traversal protection, local no-network server, explicit browser discovery and fail-on-missing-browser behavior.
- [ ] T010 [US3] Add `test:browser` to `package.json` only after T008/T009 are reviewed; do not change product version in this task.
- [ ] T011 [US3] Add the About browser-smoke step to `.github/workflows/validate.yml` only after local/branch execution proves it deterministic; preserve existing syntax/unit/XML/invariant gates.
- [ ] T012 [US3] Run `npm run check`, `npm test`, and `npm run test:browser` against the unchanged canonical product baseline; record exact source SHA, result and browser binary in `specs/001-release-line-convergence/evidence/about-baseline.md`.
- [ ] T013 [US3] If T012 fails, determine whether failure is test-harness drift or actual About behavior; update only test harness until a harness defect is eliminated, and record the distinction in `evidence/about-baseline.md` before any product fix.
- [ ] T014 [P] [US2] Add static regression assertions for M-001/M-002 candidate boundaries in a new `tests/mobile-render-contract.test.js` or equivalent canonical test file, ensuring tests describe desired accepted behavior only after characterization decision; use temporary characterization assertions separately if needed.
- [ ] T015 [P] [US1] Add/extend release-provenance contract tests in `tests/release-cache.test.js` or a new bounded test file so the eventual release shell cannot mix payload SHAs or release keys; do not change delivery URLs yet.

**Checkpoint**: a real browser smoke and release/mobile characterization harness exist without functional product changes.

## Phase 3 — User Story 1: One Trustworthy Release Baseline (Priority P1)

**Goal**: define exactly which source/deployment state is the starting point and what release identity must converge to.

**Independent test**: a maintainer can identify current production, canonical source, candidate branch, rollback and release identity from repository docs alone.

- [ ] T016 [US1] Populate `evidence/implementation-baseline.md` with canonical SHA, current deployment pin `aa372e1...`, current XML SHA-256, rollback location and all protected-surface stop conditions.
- [ ] T017 [US1] Confirm ADR-001 two-step payload/release-shell model against current implementation branch; record `PAYLOAD_SHA` and `RELEASE_SHELL_SHA` placeholders in `docs/releases/v0.9x-convergence/RELEASE-MANIFEST.md`.
- [ ] T018 [US1] Compare the implementation base against current production (`aa372e1...`) at file/blob level for `src/ui/styles/tokens.css`, `src/features/home/home.css`, `tools/about/about.css`, `tools/about/AboutFeature.js`, `tools/about/bootstrap.js`, `src/ui/styles/responsive.css`, `src/bootstrap/createZenBlog.js`, and `blogger/theme.xml`; record only material semantic differences in `evidence/candidate-deltas.md`.
- [ ] T019 [US1] Verify M-005 `src/ui/styles/responsive.css` remains equivalent; if blob/content differs because main advanced, reclassify M-005 and STOP before implementation until Plan evidence is refreshed.
- [ ] T020 [US1] Record release/version identity mismatch (`0.4.0` deployed internal graph vs `0.9.1` main release labeling) as a release-provenance concern, not a feature delta; define the target release label in `RELEASE-MANIFEST.md` without modifying `package.json` yet.

**Checkpoint**: baseline/release identity is explicit and no feature behavior has been accepted by assumption.

## Phase 4 — User Story 2: Preserve Intended Mobile Behavior Without Branch Drift (Priority P1)

**Goal**: decide M-001/M-002/M-003/M-004 from observable behavior, then reconstruct only accepted deltas on the canonical branch.

**Independent test**: accepted mobile behavior passes the relevant viewport/device cases while protected semantics remain unchanged.

### M-001 Safe-area accounting

- [ ] T021 [US2] Characterize current production M-001 on a WebKit/Safari safe-area phone class plus a normal non-notch phone; record screenshots/measurements/observations and candidate identities in `evidence/qa-run.md` under Q-PUB-005.
- [ ] T022 [US2] Characterize unchanged canonical main M-001 using the same acceptance criteria where reproducible; record whether fixed header/player-safe tokens cause overlap/lost space or are equivalent.
- [ ] T023 [US2] Record M-001 decision KEEP/ADJUST/REJECT in `evidence/candidate-deltas.md` with evidence references.
- [ ] T024 [US2] Conditional on M-001 KEEP/ADJUST: implement the minimum accepted token delta in `src/ui/styles/tokens.css` and finalize corresponding assertions in `tests/mobile-render-contract.test.js`; otherwise record no-code resolution.

### M-002 Short-height Home density

- [ ] T025 [US2] Characterize current production M-002 at ~320/390 widths with short-height and landscape classes; verify no essential content/action is clipped behind header/player and record Q-PUB-003/Q-PUB-004 evidence.
- [ ] T026 [US2] Characterize unchanged canonical main under the same dimensions and compare scroll threshold/content density without changing source.
- [ ] T027 [US2] Record M-002 decision KEEP/ADJUST/REJECT in `evidence/candidate-deltas.md`.
- [ ] T028 [US2] Conditional on M-002 KEEP/ADJUST: implement only accepted Home rules in `src/features/home/home.css` and finalize corresponding regression assertions; otherwise record no-code resolution.

### M-003 About stylesheet preload/delivery

- [ ] T029 [US2] Characterize About first-open behavior on current production and canonical main under normal and throttled/slow-style-load conditions; record visible FOUC/blank/unstyled behavior and the global critical-path request cost qualitatively in `evidence/candidate-deltas.md`.
- [ ] T030 [US2] Record M-003 decision KEEP/ADJUST/REJECT, explicitly balancing first-open stability against Constitution principle IV (minimal reader critical path).
- [ ] T031 [US2] Conditional on M-003 KEEP/ADJUST: implement the smallest accepted delivery strategy in `blogger/theme.xml` and/or `tools/about/bootstrap.js`, with a regression that prevents duplicate stylesheet ownership; otherwise retain lazy main behavior and record reason.

### M-004 About mobile CSS v0.1.5

- [ ] T032 [US2] Characterize current production About CSS at ~320/~390/~768 with empty and populated profile; verify portrait/identity layout, player-safe spacing, scroll containment, 100svh behavior and no horizontal overflow.
- [ ] T033 [US2] Compare canonical main About CSS v0.1.4 under the same matrix; record user-visible differences rather than copying branch CSS wholesale.
- [ ] T034 [US2] Record M-004 decision KEEP/ADJUST/REJECT.
- [ ] T035 [US2] Conditional on M-004 KEEP/ADJUST: reconstruct only accepted CSS rules in `tools/about/about.css`, preserving portrait/identity semantics and accessibility; otherwise record no-code resolution.

### Mobile protected-neighbor gate

- [ ] T036 [US2] Run Explore simple/advanced, Article, visible navigation, gestures exclusions and player boundary regressions after any accepted M delta; record zero intentional semantic changes in `evidence/qa-run.md`.

**Checkpoint**: each deployed mobile/About presentation delta has an evidence-backed disposition and accepted changes are bounded.

## Phase 5 — User Story 3: Resolve About Reliability Safely (Priority P1)

**Goal**: prove whether A-001 transactional rendering is required instead of merging PR #14.

**Independent test**: canonical About either passes deterministic browser coverage unchanged or receives one minimal reliability correction with regression proof.

- [ ] T037 [US3] Expand `tests/fixtures/about-smoke.html` / `tests/about-browser-smoke.mjs` to cover empty and populated profiles without external network dependency; assert ready/fallback semantics and no `zenabout:error` on valid inputs.
- [ ] T038 [US3] Run the expanded browser smoke on the implementation branch before any A-001 product change and record result in `evidence/about-baseline.md`.
- [ ] T039 [US3] Determine whether any realistic valid `zenSiteProfile.v1` state reproduces blank/partial/destructive About output; distinguish actual profile/input defects from synthetic fault-injection resilience scenarios.
- [ ] T040 [US3] If no realistic defect reproduces, mark A-001 DEFER in `evidence/candidate-deltas.md` and prohibit transactional refactor in Spec 001; create a follow-up maintenance note only if resilience work remains justified.
- [ ] T041 [US3] Conditional on a realistic reproducible defect: write a failing browser/regression case first, then implement the minimum transactional/error-boundary correction in `tools/about/AboutFeature.js` and/or `tools/about/bootstrap.js`; do not import unrelated PR #14 files.
- [ ] T042 [US3] After T040 or T041, run `npm run check`, `npm test`, `npm run test:browser`, URL/image-safety tests and About presentation tests; record result and exact SHA.

**Checkpoint**: PR #14 is no longer needed as an integration source; A-001 is implemented only if evidence requires it.

## Phase 6 — User Story 4: Real-Environment Release Closure (Priority P1)

**Goal**: construct one immutable candidate, validate it in Blogger, and either freeze or roll back.

**Independent test**: Release Manifest links exact source/assets/XML/CI/browser/Blogger QA/acceptance/rollback.

### Candidate construction

- [ ] T043 [US4] Re-run full automated suite on the bounded implementation branch and perform changed-file blast-radius review before designating payload; STOP on unexpected protected-surface changes.
- [ ] T044 [US4] Commit the exact accepted product/test payload and record the resulting full `PAYLOAD_SHA` in `docs/releases/v0.9x-convergence/RELEASE-MANIFEST.md`.
- [ ] T045 [US4] Update all production ZenBlog repository asset references in `blogger/theme.xml` to immutable `@<PAYLOAD_SHA>` URLs per ADR-001, while leaving Zen Radio Player independently pinned to its protected loader version.
- [ ] T046 [US4] Normalize the chosen release/cache label consistently across diagnostic/internal module keys where applicable; update `tests/release-cache.test.js`/provenance tests without using the label as a substitute for `PAYLOAD_SHA`.
- [ ] T047 [US4] Commit the release shell and record full `RELEASE_SHELL_SHA` in `RELEASE-MANIFEST.md`.
- [ ] T048 [US4] Export/materialize the exact candidate Blogger XML from the release shell, compute SHA-256, and record `BLOGGER_XML_SHA256` plus candidate artifact location in `RELEASE-MANIFEST.md`.
- [ ] T049 [US4] Verify candidate XML well-formedness, one `page_body`, one `Blog1`, no `zen_main`, server-rendered crawler metadata, one coherent payload pin, and player loader invariant before Blogger installation.
- [ ] T050 [US4] Obtain/record successful GitHub Actions `Validate ZenBlog` run for `RELEASE_SHELL_SHA`; record run ID/result in `RELEASE-MANIFEST.md`.

### Blogger installation / QA

- [ ] T051 [US4] Confirm the pre-change rollback XML hash `42b439df...` remains available immediately before deployment; record confirmation time in `evidence/qa-run.md`.
- [ ] T052 [US4] Install the full candidate XML in Blogger; record installation date/time and candidate XML SHA-256.
- [ ] T053 [US4] Execute Q-PUB-001 through Q-PUB-014 from `contracts/qa-evidence.md` as applicable, including Chromium desktop and WebKit/Safari safe-area/mobile classes; record PASS/FAIL/BLOCKED per case with attributable candidate identity.
- [ ] T054 [US4] Execute Q-ADM-001 through Q-ADM-004 when affected and the final Admin/Inspector smoke required by Spec; record evidence.
- [ ] T055 [US4] Verify social/SEO head, favicon strategy, no mixed release assets and direct/deep-link behavior on real Blogger; record evidence without claiming crawler indexing status absent external proof.
- [ ] T056 [US4] On any P0/P1 failure, reinstall the exact 2026-08-22 rollback XML, verify restoration, mark candidate FAIL in manifest and return to the relevant delta task; do not advance to VALIDATED.
- [ ] T057 [US4] If required Blogger QA passes, record Product Owner acceptance in `RELEASE-MANIFEST.md` and advance state from CANDIDATE to VALIDATED.
- [ ] T058 [US4] Complete known-debt/rollback/acceptance fields and advance to FROZEN only when the Release Manifest contract is fully satisfied with no unresolved P0/P1 blocker.

**Checkpoint**: one release is attributable and reversible; CI/merge/deployment/QA/acceptance are no longer conflated.

## Phase 7 — User Story 5: Historical GitHub Work Has Explicit Disposition (Priority P2)

**Goal**: remove ambiguous open integration paths only after evidence has been retained.

**Independent test**: every relevant PR has a canonical disposition and no superseded/CI-only/experiment PR remains a plausible merge target.

- [ ] T059 [P] [US5] Verify relevant functionality/evidence from PR #4-#9 is represented in canonical lineage/forensic docs; add missing lineage references before lifecycle changes.
- [ ] T060 [P] [US5] Verify PR #15/#16 successful browser-smoke evidence (including run #108) is referenced in canonical Spec/research docs.
- [ ] T061 [US5] Record final M-001..M-004 dispositions and A-001 disposition against PR #13/#14 in `docs/forensic/RELEASE-LINEAGE-v0.1.txt` or its successor.
- [ ] T062 [US5] Add explanatory GitHub comments and close PR #4-#9 as SUPERSEDED/ARCHIVED without merge after T059.
- [ ] T063 [US5] Add explanatory comments and close PR #15/#16 as CI-ONLY without product merge after T060.
- [ ] T064 [US5] Add explanatory disposition and close PR #13/#14 as EXPERIMENT/REFERENCE after T061 and release convergence preserves all useful evidence.
- [ ] T065 [US5] Confirm PR #17/final implementation PR are the only release-convergence integration paths still active; record status in Release Manifest.

**Checkpoint**: repository PR state communicates reality instead of historical accidents.

## Phase 8 — User Story 6: Maintenance Gaps Recorded Without Scope Expansion (Priority P2)

**Goal**: preserve discovered long-term debt without refactoring protected cores during release convergence.

**Independent test**: a maintainer can identify follow-up work for Search Core/Metadata source provenance, versioning and performance without reading chat history.

- [ ] T066 [P] [US6] Create a follow-up Spec/Issue candidate for Search Core v1 modular-source recovery/reproducible generation, referencing discrepancy D-012; do not modify `tools/admin/search-core-v1.part*.txt` in Spec 001.
- [ ] T067 [P] [US6] Create a follow-up Spec/Issue candidate for Metadata v0.5 source-of-truth/reproducibility, referencing D-013; do not modify Metadata core runtime in Spec 001.
- [ ] T068 [P] [US6] Create a follow-up versioning ADR/Spec task resolving `package.json` application version vs release/cache label semantics; do not opportunistically renumber unrelated historical releases.
- [ ] T069 [P] [US6] Create a post-convergence performance-baseline task covering real Lighthouse/PageSpeed/Core Web Vitals measurement before numeric budgets are adopted.
- [ ] T070 [US6] Update `docs/forensic/DISCREPANCY-REGISTER-v0.1.txt` or successor with final OPEN/CLOSED/DEFERRED state for all discrepancies touched by Spec 001.

## Phase 9 — Final Convergence / Handoff

**Purpose**: prove Spec, Plan, Tasks, implementation and deployment all describe the same accepted system.

- [ ] T071 [US1] Run Spec-to-implementation trace: map FR-001 through FR-024 and SC-001 through SC-011 to task/evidence/manifest references in `specs/001-release-line-convergence/evidence/convergence-report.md`.
- [ ] T072 [US1] Run protected-surface diff audit against the implementation base; record all intentional product files and zero unexplained changes in `evidence/convergence-report.md`.
- [ ] T073 [P] [US4] Validate `quickstart.md` against the actual completed workflow and correct documentation drift without changing accepted product behavior.
- [ ] T074 [P] [US1] Update project handoff/release index so canonical SHA, payload SHA, release-shell SHA, Blogger XML SHA-256, state and rollback are discoverable without chat history.
- [ ] T075 [US1] Re-run final CI at the release/handoff head and record result.
- [ ] T076 [US1] Mark Spec 001 complete only after Release Manifest is FROZEN or explicitly close it as non-released with failure/rollback evidence; never leave ambiguous “done” state.

## Dependencies & Execution Order

```text
Phase 1 Baseline Lock
        |
        v
Phase 2 Test/Characterization Harness
        |
        v
Phase 3 US1 Baseline Identity
        |
        +---------------------------+
        |                           |
        v                           v
Phase 4 US2 Mobile/Presentation   Phase 5 US3 About Reliability
        |                           |
        +-------------+-------------+
                      |
                      v
             Phase 6 US4 Release/QA
                      |
             +--------+--------+
             |                 |
             v                 v
      Phase 7 US5 PRs    Phase 8 US6 Debt
             |                 |
             +--------+--------+
                      |
                      v
             Phase 9 Convergence
```

Phase 6 MUST NOT begin until all candidate deltas have KEEP/ADJUST/REJECT/DEFER decisions.

Historical PR cleanup MUST NOT precede evidence extraction.

FROZEN MUST NOT precede real Blogger QA + Product Owner acceptance.

## Parallel Opportunities

Safe parallel groups include:
- T005/T006/T007;
- T008/T009;
- T014/T015;
- independent evidence preparation for M-001/M-002/M-003/M-004 when different testers/environments are available;
- T059/T060;
- T066/T067/T068/T069;
- T073/T074 after the release manifest is stable.

Tasks modifying the same product file are intentionally sequential.

## Stop Conditions

Return to Spec/Plan before continuing if:
- canonical main materially advances;
- a candidate delta requires an unplanned protected-core modification;
- rollback artifact cannot be restored;
- a new dependency/framework/build pipeline becomes necessary;
- browser/Blogger evidence contradicts the protected product contract;
- asset delivery cannot be attributed to exact payload bytes;
- a P0/P1 failure cannot be isolated within the approved blast radius.
