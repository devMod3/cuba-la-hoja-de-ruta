# Tasks: ZenBlog v0.9.x Release-Line Convergence

**Input**: `spec.md`, `clarifications.md`, `clarify-closeout.md`, `plan.md`, `research.md`, `data-model.md`, `quickstart.md`, `contracts/`, forensic registries, ADR-001 and ADR-002.

**Target canonical release**: `ZenBlog v0.9.2` as defined by ADR-002. This does NOT make the historical PR/branch named v0.9.2 canonical.

**Format**: `[ID] [P?] [Story] Description`

- `[P]` = safe to execute in parallel because different files/evidence are owned.
- `[US#]` maps to the user stories in `spec.md`.
- Characterization/tests precede product changes.
- Conditional implementation tasks close either with the accepted code delta or an evidence-backed REJECT/DEFER record.
- No task authorizes wholesale merge/cherry-pick of PR #13 or PR #14.

## Phase 1 — Baseline Lock and Durable Evidence

**Purpose**: make source, production and rollback independently attributable before implementation.

- [ ] T001 [US1] Re-read `.specify/memory/constitution.md`, `specs/001-release-line-convergence/plan.md`, `docs/forensic/PROTECTED-SURFACE-REGISTRY-v0.1.txt`, `docs/architecture/ADR-001-immutable-release-asset-identity.md`, and `docs/architecture/ADR-002-single-zenblog-release-version.md`; record reviewer/date in `specs/001-release-line-convergence/evidence/implementation-baseline.md`.
- [ ] T002 [US1] Verify current `main` SHA against planned canonical base `0a45bc523f0129d83307f1c6f3a972056b219ae0`; if main materially advanced, record the delta and STOP until Spec/Plan evidence is refreshed.
- [ ] T003 [US1] Re-hash the exact 2026-08-22 Blogger export and confirm SHA-256 `42b439df1c96915a2568fce9b0a243f26196281d2c9f8afca0bb7f786df114d8`.
- [ ] T004 [US1] Inspect the rollback XML for credentials/secrets/private tokens; if none are present, preserve the exact bytes under `docs/forensic/artifacts/blogger-theme-current-2026-08-22.xml` and add a SHA-256 sidecar/README. If anything sensitive exists, preserve it in a restricted location and record that location/hash instead of committing it publicly.
- [ ] T005 [P] [US1] Create `specs/001-release-line-convergence/evidence/candidate-deltas.md` with M-001, M-002, M-003, M-004, M-005 and A-001 using the `CandidateDelta` fields from `data-model.md`.
- [ ] T006 [P] [US4] Create `specs/001-release-line-convergence/evidence/qa-run.md` from `contracts/qa-evidence.md` with results initially `NOT_RUN`.
- [ ] T007 [P] [US1] Create `docs/releases/v0.9.2/RELEASE-MANIFEST.md` from `contracts/release-manifest.md`, status `CANDIDATE-DRAFT`, with no invented SHA/QA values.
- [ ] T008 [US1] Create implementation branch `001-release-line-convergence-impl` from the current SDD branch head and open it as a DRAFT stacked PR targeting `001-release-line-convergence`; do not target/merge to `main` until the SDD foundation PR has been explicitly accepted/merged or the branch is safely rebased/retargeted.

**Checkpoint**: rollback is durable, product implementation has an isolated stacked review path, and no production source changed.

## Phase 2 — Preserve Historical Evidence Required by the Spec

**Purpose**: close FR-017/SC-009 before historical PR cleanup.

- [ ] T009 [P] [US5] Recover historical `docs/QA-v0.9.md` into `docs/forensic/history/v0.9/QA-v0.9.md` with an unmistakable HISTORICAL header/reference while preserving the original test content.
- [ ] T010 [P] [US5] Recover historical `docs/RELEASE-v0.9-LAB.md` into `docs/forensic/history/v0.9/RELEASE-v0.9-LAB.md` with an unmistakable HISTORICAL header/reference.
- [ ] T011 [P] [US5] Recover historical `docs/STATUS-v0.9.md` into `docs/forensic/history/v0.9/STATUS-v0.9.md` with an unmistakable HISTORICAL header/reference.
- [ ] T012 [US5] Add `docs/forensic/history/v0.9/README.md` explaining that these records are evidence of historical state/gates, not current deployment status.

**Checkpoint**: historical QA/release/status evidence can no longer disappear or be mistaken for current truth.

## Phase 3 — Foundational Browser/Release Test Harness

**Purpose**: recover reusable test technique without importing divergent product history.

- [ ] T013 [P] [US3] Recreate/review `tests/fixtures/about-smoke.html` from the historical About CI line, adapting only canonical paths/data and preserving `zenSiteProfile.v1` semantics.
- [ ] T014 [P] [US3] Recreate/review `tests/about-browser-smoke.mjs` using Node built-ins, local no-network HTTP serving, safe path resolution, explicit Chrome/Chromium discovery and fail-on-missing-browser behavior.
- [ ] T015 [US3] Add `test:browser` to `package.json` after T013/T014 review; do not change the application version in this task.
- [ ] T016 [US3] Execute the browser smoke against the otherwise unchanged canonical product; record exact SHA, browser binary/version and PASS/FAIL in `specs/001-release-line-convergence/evidence/about-baseline.md`.
- [ ] T017 [US3] If T016 exposes harness drift, correct the harness only and repeat until harness validity is known; distinguish harness defects from product defects explicitly.
- [ ] T018 [US3] Add the deterministic browser-smoke command to `.github/workflows/validate.yml` only after it has passed/fails deterministically on the implementation branch; preserve all existing gates.
- [ ] T019 [P] [US2] Create neutral mobile characterization coverage in `tests/mobile-render-contract.test.js` that checks existing protected boundaries without prematurely encoding KEEP/REJECT decisions for M-001/M-002.
- [ ] T020 [P] [US1] Create/extend release-provenance tests so application-version consistency and deployable-shell immutable pin consistency can be verified separately; do not require a future payload SHA before it exists.

**Checkpoint**: tests can characterize baseline behavior and later enforce decisions without requiring a new framework/dependency.

## Phase 4 — User Story 1: One Trustworthy Release Baseline (P1)

**Goal**: make canonical source, deployed source, rollback and target identity unambiguous.

- [ ] T021 [US1] Populate `evidence/implementation-baseline.md` with canonical SHA, SDD/implementation branch base, active production `aa372e1...`, release-shell provenance `ad43ac63...`, current XML SHA-256 and rollback location.
- [ ] T022 [US1] Compare implementation base vs active production at file/blob/semantic level for `src/ui/styles/tokens.css`, `src/features/home/home.css`, `tools/about/about.css`, `tools/about/AboutFeature.js`, `tools/about/bootstrap.js`, `src/ui/styles/responsive.css`, `src/bootstrap/createZenBlog.js`, and `blogger/theme.xml`; record material differences in `evidence/candidate-deltas.md`.
- [ ] T023 [US1] Verify M-005 `src/ui/styles/responsive.css` remains equivalent; if not, re-open M-005 and STOP before product edits until scope is updated.
- [ ] T024 [US1] Record ADR-002 target application release `0.9.2` in `docs/releases/v0.9.2/RELEASE-MANIFEST.md`, while keeping `PAYLOAD_SHA`, `RELEASE_SHELL_SHA`, XML hash and QA fields unresolved.

**Independent test**: repository docs identify current production, canonical source, target release and rollback without chat history.

## Phase 5 — User Story 2: Mobile/Presentation Convergence (P1)

**Goal**: decide each deployed presentation delta independently, then reconstruct only accepted behavior on canonical source.

### M-001 — Safe-area accounting

- [ ] T025 [US2] Characterize current production on WebKit/Safari safe-area phone class plus normal non-notch phone; record Q-PUB-005 evidence including overlap/lost-space observations.
- [ ] T026 [US2] Characterize unchanged canonical main under equivalent criteria where reproducible.
- [ ] T027 [US2] Record M-001 KEEP/ADJUST/REJECT with evidence in `evidence/candidate-deltas.md`.
- [ ] T028 [US2] Conditional KEEP/ADJUST: implement minimum accepted delta in `src/ui/styles/tokens.css` and finalize M-001 assertions in `tests/mobile-render-contract.test.js`; otherwise record no-code resolution.

### M-002 — Short-height Home density

- [ ] T029 [US2] Characterize production at ~320/~390 widths plus short-height/landscape; verify no essential action/content is clipped behind header/player and record Q-PUB-003/Q-PUB-004.
- [ ] T030 [US2] Characterize unchanged canonical main at the same viewport classes.
- [ ] T031 [US2] Record M-002 KEEP/ADJUST/REJECT with evidence.
- [ ] T032 [US2] Conditional KEEP/ADJUST: implement only accepted rules in `src/features/home/home.css` and finalize regression assertions; otherwise record no-code resolution.

### M-003 — About stylesheet preload/delivery

- [ ] T033 [US2] Compare About first-open behavior on production vs canonical main under normal and deliberately slow stylesheet-load conditions; record visible unstyled/blank/flash behavior plus qualitative global-request cost.
- [ ] T034 [US2] Record M-003 KEEP/ADJUST/REJECT, explicitly checking Constitution principle IV (reader critical path).
- [ ] T035 [US2] Conditional KEEP/ADJUST: implement smallest accepted ownership/delivery change in `blogger/theme.xml` and/or `tools/about/bootstrap.js`, adding regression coverage that prevents duplicate stylesheet ownership; otherwise retain lazy main behavior and record reason.

### M-004 — About mobile CSS v0.1.5 behavior

- [ ] T036 [US2] Characterize production About at ~320/~390/~768 with empty/populated profile; verify portrait/identity layout, player-safe spacing, scroll containment, 100svh behavior and horizontal overflow.
- [ ] T037 [US2] Characterize canonical main About CSS v0.1.4 under the same cases.
- [ ] T038 [US2] Record M-004 KEEP/ADJUST/REJECT with evidence.
- [ ] T039 [US2] Conditional KEEP/ADJUST: reconstruct only accepted CSS in `tools/about/about.css`; do not copy the historical file wholesale.

### Protected-neighbor gate

- [ ] T040 [US2] After accepted M changes, run Explore simple/advanced, Article/open-return, visible navigation, gesture exclusions, keyboard/focus checks and player boundary regressions; record zero intentional protected-semantic changes.

**Independent test**: every M delta has evidence-backed disposition and accepted mobile behavior passes its QA cases without branch drift.

## Phase 6 — User Story 3: About Reliability (P1)

**Goal**: decide A-001 from realistic reproduction, not structural preference alone.

- [ ] T041 [US3] Expand About browser fixture/smoke to cover empty and populated valid profile states without external network dependence; assert ready/fallback semantics and absence of `zenabout:error` on valid data.
- [ ] T042 [US3] Run expanded smoke before any A-001 product change and record result in `evidence/about-baseline.md`.
- [ ] T043 [US3] Attempt realistic valid-profile reproduction of blank/partial/destructive About output; explicitly distinguish realistic product failure from synthetic fault-injection resilience scenarios.
- [ ] T044 [US3] If no realistic defect reproduces, mark A-001 DEFER and prohibit transactional refactor inside Spec 001; preserve any resilience idea as separate follow-up only.
- [ ] T045 [US3] Conditional on realistic reproducible defect: write failing browser/regression case first, then implement minimum transactional/error-boundary correction in `tools/about/AboutFeature.js` and/or `tools/about/bootstrap.js`; import no unrelated PR #14 files.
- [ ] T046 [US3] Run syntax/unit/browser/URL-image-safety/About presentation tests after T044 or T045 and record exact SHA/result.

**Independent test**: PR #14 is no longer an integration dependency; current About is either proven adequate or minimally fixed with regression evidence.

## Phase 7 — Candidate Payload Construction and Version Convergence

**Purpose**: produce exact browser payload bytes before constructing the immutable Blogger shell.

- [ ] T047 [US1] Confirm all M/A decisions are KEEP/ADJUST/REJECT/DEFER and no candidate decision remains UNRESOLVED; STOP otherwise.
- [ ] T048 [US1] Normalize ZenBlog application version to `0.9.2` across `package.json.version`, `src/bootstrap/createZenBlog.js`, release-owned ESM query keys, `tools/runtime/bootstrap.js`, `tools/about/bootstrap.js`, and relevant tests; explicitly exclude schema/contract versions and Zen Radio Player `v1.0.3`.
- [ ] T049 [US4] Update the pre-shell `blogger/theme.xml` release/cache label to `0.9.2` using the existing mutable-development delivery form only so the payload commit is internally coherent; mark this theme state NON-DEPLOYABLE until immutable pinning in T053.
- [ ] T050 [US4] Refactor/add version-contract tests so T048/T049 prove one application version without pretending that the pre-shell theme is the final production asset identity.
- [ ] T051 [US4] Run `npm run check`, `npm test`, adopted `npm run test:browser`, Blogger XML parsing and architecture/player/SEO/protected-surface gates on the complete accepted payload state; STOP on any failure.
- [ ] T052 [US4] Commit the complete accepted product/test/version payload with no unresolved release-shell pin, then capture the resulting full immutable `PAYLOAD_SHA` externally/in the evidence ledger. Do not modify browser-executed payload bytes after this SHA is designated.

**Checkpoint**: `PAYLOAD_SHA` identifies all JS/CSS/assets/runtime version bytes that the release will execute.

## Phase 8 — Immutable Release Shell Construction (ADR-001)

**Purpose**: create a deployable Blogger theme that references exactly `PAYLOAD_SHA`.

- [ ] T053 [US4] Update all ZenBlog repository asset references in `blogger/theme.xml` to immutable `https://cdn.jsdelivr.net/gh/devMod3/cuba-la-hoja-de-ruta@<PAYLOAD_SHA>/...` references; keep Zen Radio Player independently pinned to protected `v1.0.3`.
- [ ] T054 [US4] Update release-shell provenance tests to require one full payload SHA across favicon/social/CSS/modulepreload/product/runtime references and reject mixed SHAs/mutable production paths.
- [ ] T055 [US4] Verify release-shell XML well-formedness, exactly one `page_body`, one `Blog1`, no `zen_main`, server-rendered crawler metadata, About stylesheet ownership decision, and player invariant.
- [ ] T056 [US4] Commit the deployable shell and capture full `RELEASE_SHELL_SHA`. The shell commit should contain no change to browser payload files designated by `PAYLOAD_SHA` except release-shell/test/docs files explicitly required for pin verification.
- [ ] T057 [US4] Obtain a successful `Validate ZenBlog` CI run for `RELEASE_SHELL_SHA`; if CI requires test-only correction, do not silently redefine the shell SHA—fix, recommit, and capture a new shell SHA.
- [ ] T058 [US4] Materialize the candidate XML exactly from `RELEASE_SHELL_SHA`, compute `BLOGGER_XML_SHA256`, and record `PAYLOAD_SHA`, `RELEASE_SHELL_SHA`, XML hash, release `0.9.2`, CI run and rollback hash in `docs/releases/v0.9.2/RELEASE-MANIFEST.md` in a subsequent documentation commit.

**Checkpoint**: candidate is reproducible from two immutable SHAs plus one XML hash.

## Phase 9 — User Story 4: Real Blogger QA / Acceptance (P1)

**Goal**: validate the exact immutable candidate in the actual hosting environment and freeze only with attributable evidence.

- [ ] T059 [US4] Immediately before deployment, verify rollback artifact SHA-256 `42b439df...` and restoration availability; record time/location in `evidence/qa-run.md`.
- [ ] T060 [US4] Install the full candidate XML generated from `RELEASE_SHELL_SHA` in Blogger; record install date/time and XML SHA-256.
- [ ] T061 [US4] Execute Q-PUB-001 through Q-PUB-014 as applicable, including Chromium desktop and WebKit/Safari safe-area/mobile classes; record candidate SHA/XML identity for every result.
- [ ] T062 [US4] Execute Q-ADM-001 through Q-ADM-004 when affected and the final Admin/Inspector smoke required by Spec.
- [ ] T063 [US4] Verify real Blogger SEO/social head structure, favicon strategy, no mixed payload SHAs, direct/deep-link behavior and player independence; do not claim crawler indexing without external evidence.
- [ ] T064 [US4] On any P0/P1 failure, reinstall exact rollback XML, verify restoration, mark candidate FAIL and return to the owning M/A task; no VALIDATED/FROZEN status.
- [ ] T065 [US4] If QA passes, record explicit Product Owner acceptance and advance manifest CANDIDATE -> VALIDATED.
- [ ] T066 [US4] Complete rollback/debt/evidence fields and advance VALIDATED -> FROZEN only when the Release Manifest contract is fully satisfied and no P0/P1 blocker remains.

**Independent test**: one manifest links payload, shell, XML, CI, browser/Blogger QA, acceptance and rollback.

## Phase 10 — User Story 5: Historical GitHub Disposition (P2)

**Goal**: leave no ambiguous historical merge path after release evidence is preserved.

- [ ] T067 [P] [US5] Verify PR #4-#9 useful functionality/evidence is represented in canonical lineage/history before any closure.
- [ ] T068 [P] [US5] Verify PR #15/#16 browser-smoke evidence, including successful CI run #108, is referenced in canonical research/lineage.
- [ ] T069 [US5] Record final M-001..M-004 and A-001 dispositions against PR #13/#14 in `docs/forensic/RELEASE-LINEAGE-v0.1.txt` or successor.
- [ ] T070 [US5] Add explanatory comments and close PR #4-#9 as SUPERSEDED/ARCHIVED without merge after T067.
- [ ] T071 [US5] Add explanatory comments and close PR #15/#16 as CI-ONLY without product merge after T068.
- [ ] T072 [US5] Add explanatory comments and close PR #13/#14 as EXPERIMENT/REFERENCE after T069 and after all reusable deltas/tests are preserved.
- [ ] T073 [US5] Confirm only legitimate current SDD/implementation/release review paths remain open; record final PR dispositions in Release Manifest.

## Phase 11 — User Story 6: Long-Term Maintenance Debt Without Scope Expansion (P2)

**Goal**: schedule provenance/performance work without touching protected cores in Spec 001.

- [ ] T074 [P] [US6] Create follow-up Spec/Issue for Search Core v1 modular-source recovery/reproducible generation referencing D-012; do not modify `tools/admin/search-core-v1.part*.txt` runtime in Spec 001.
- [ ] T075 [P] [US6] Create follow-up Spec/Issue for Metadata v0.5 source-of-truth/reproducible generation referencing D-013; do not modify Metadata core runtime in Spec 001.
- [ ] T076 [P] [US6] Create post-convergence performance-baseline task for real Lighthouse/PageSpeed/Core Web Vitals measurement before numeric budgets.
- [ ] T077 [US6] Mark discrepancy D-001 version identity RESOLVED by ADR-002/release v0.9.2 if final version tests pass; update all other Spec-001 discrepancies OPEN/CLOSED/DEFERRED in the discrepancy register successor.

## Phase 12 — Final ANALYZE/CONVERGE/Handoff

**Purpose**: demonstrate Spec, Plan, Tasks, implementation, deployment and docs describe the same accepted system.

- [ ] T078 [US1] Produce `specs/001-release-line-convergence/evidence/convergence-report.md` mapping FR-001..FR-024 and SC-001..SC-011 to tasks/evidence/manifest references.
- [ ] T079 [US1] Audit final implementation diff against Protected Surface Registry and list every intentional product file; zero unexplained changes required.
- [ ] T080 [P] [US4] Validate `quickstart.md` against actual completed workflow and correct documentation drift only.
- [ ] T081 [P] [US1] Update project handoff/release index so release `0.9.2`, PAYLOAD_SHA, RELEASE_SHELL_SHA, Blogger XML SHA-256, state and rollback are discoverable without chat history.
- [ ] T082 [US1] Re-run final CI on handoff/documentation head and record result.
- [ ] T083 [US1] Mark Spec 001 complete only when Release Manifest is FROZEN, or explicitly close it as non-released with failure + rollback evidence; never leave ambiguous DONE state.

## Dependencies / Execution Order

```text
Phase 1 Baseline Lock
        |
        v
Phase 2 Historical Evidence
        |
        v
Phase 3 Test Harness
        |
        v
Phase 4 Baseline Identity
        |
        +--------------------+
        |                    |
        v                    v
Phase 5 US2             Phase 6 US3
Mobile/Presentation     About Reliability
        |                    |
        +---------+----------+
                  |
                  v
Phase 7 Version + Payload
                  |
                  v
Phase 8 Immutable Shell
                  |
                  v
Phase 9 Blogger QA/Acceptance
                  |
        +---------+----------+
        |                    |
        v                    v
Phase 10 PR Cleanup     Phase 11 Debt
        |                    |
        +---------+----------+
                  |
                  v
Phase 12 Convergence/Handoff
```

Mandatory gates:
- Phase 7 cannot start with unresolved M/A decisions.
- `PAYLOAD_SHA` is captured only AFTER all product bytes + application v0.9.2 normalization are complete.
- No browser payload file changes after `PAYLOAD_SHA` designation; changing one invalidates the SHA and returns to T051/T052.
- `RELEASE_SHELL_SHA` is captured only after immutable payload pinning and shell validation.
- Historical PR cleanup never precedes evidence preservation.
- FROZEN never precedes real Blogger QA + Product Owner acceptance.
- PR #17 remains independent governance/spec review; the child implementation PR is stacked until explicit base-branch disposition is safe.

## Parallel Opportunities

Safe groups include:
- T005/T006/T007;
- T009/T010/T011;
- T013/T014;
- T019/T020;
- evidence collection for independent M deltas when different test environments are available;
- T067/T068;
- T074/T075/T076;
- T080/T081 after manifest stability.

Tasks that modify the same product/release file are intentionally sequential.

## Stop Conditions

Return to Spec/Plan if:
- `main` materially advances;
- a desired change requires an unplanned protected-core modification;
- rollback cannot be restored;
- a new framework/dependency/build pipeline appears necessary;
- QA contradicts a protected product contract;
- asset delivery cannot be attributed to exact payload bytes;
- a P0/P1 defect cannot be isolated within approved blast radius;
- a task would require treating a historical branch merge as evidence.
