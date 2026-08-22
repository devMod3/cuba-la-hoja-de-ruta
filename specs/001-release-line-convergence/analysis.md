# Analyze — Spec 001 Release-Line Convergence

**Date**: 2026-08-22

**Artifacts checked**:
- Constitution 1.1.0
- `spec.md`
- `clarifications.md`
- `clarify-closeout.md`
- `plan.md`
- `research.md`
- `data-model.md`
- `quickstart.md`
- `contracts/release-manifest.md`
- `contracts/qa-evidence.md`
- `tasks.md`
- Protected Surface Registry
- Discrepancy Register
- Release Lineage
- Current Blogger Deployment evidence
- ADR-001 immutable release asset identity
- ADR-002 single ZenBlog application release version

## Verdict

`PASS — READY FOR BOUNDED IMPLEMENTATION SETUP`

No unresolved Constitution violation or architecture ambiguity remains.

This PASS does NOT mean product behavior is already accepted. M-001/M-002/M-003/M-004 and A-001 remain empirical implementation-phase decision gates exactly as planned.

## Critical/high findings discovered and resolved during Analyze

### AN-001 — PAYLOAD_SHA ordering contradiction

**Severity before correction**: P1

Earlier tasks captured `PAYLOAD_SHA` before application-version normalization, which could have produced a payload SHA that did not identify the final browser bytes.

**Resolution**:
- ADR-002 defines target `ZenBlog v0.9.2`;
- current Tasks Phase 7 applies all accepted product deltas + v0.9.2 normalization before T052 captures `PAYLOAD_SHA`;
- no browser payload file may change after payload designation without invalidating/recreating the SHA.

**Status**: RESOLVED.

### AN-002 — Version-policy deferral contradicted release convergence

**Severity before correction**: P1

Deferring `package.json.version` vs runtime release semantics would have preserved D-001 inside a release whose purpose is provenance convergence.

**Resolution**:
- ADR-002 establishes one application release version;
- target release is v0.9.2;
- schema/contract versions and independently versioned Zen Radio Player remain separate;
- T048/T050/T077 enforce/close this discrepancy.

**Status**: RESOLVED.

### AN-003 — PR #17 independence vs implementation branch

**Severity before correction**: P1 process risk

Creating implementation directly against `main` while PR #17 remained unmerged would duplicate or bypass SDD artifacts; merging implementation into the same PR would destroy review separation.

**Resolution**:
- T008 creates `001-release-line-convergence-impl` as a DRAFT stacked PR against `001-release-line-convergence`;
- it cannot safely target/merge to main until the SDD base has explicit disposition;
- no merge is authorized by Analyze.

**Status**: RESOLVED.

### AN-004 — Historical v0.9 docs were referenced but not durably preserved

**Severity before correction**: P2 / FR-017 coverage gap

The Spec requires historical QA/release/status records to remain available without being mistaken for current state.

**Resolution**:
- Tasks T009-T012 explicitly recover QA-v0.9, RELEASE-v0.9-LAB and STATUS-v0.9 into `docs/forensic/history/v0.9/` with historical labeling.

**Status**: RESOLVED IN TASK DESIGN; execution pending.

### AN-005 — Current rollback artifact known by hash but not yet durable in repo/storage

**Severity**: P1 operational gate

**Resolution**:
- T003/T004 make hash verification + secret inspection + durable preservation a Phase 1 blocker;
- if the XML contains sensitive data it must not be committed publicly; location/hash are recorded instead.

**Status**: CONTROLLED; execution pending before product changes.

## Constitution consistency

I. Preserve Validated Behavior — PASS
- every functional delta is characterized before implementation;
- historical branches are evidence, not merge sources.

II. Blogger Anatomy / URLs / Public Documents — PASS
- XML invariants are explicit pre/post deployment gates;
- Article URL ownership untouched.

III. Contracts Before Infrastructure — PASS
- no backend/storage/CMS migration;
- source-provenance debt deferred to follow-up work.

IV. Reader Critical Path Minimal — PASS WITH EMPIRICAL GATE
- M-003 About preload must justify its global critical-path cost before KEEP.

V. UX Semantics Product Contracts — PASS
- Explore/Article/navigation/player semantics have protected-neighbor gates.

VI. Evidence Before Change/Merge — PASS
- tests + characterization precede every candidate change;
- no merge action is part of Analyze.

VII. Reversible/Converged Releases — PASS
- rollback artifact is Phase 1 blocker;
- ADR-001 + manifest define payload/shell/XML identities.

VIII. Maintainability Is a Product Feature — PASS
- release identity, source provenance, history and future debt are repository-visible;
- no generated runtime core is rewritten in this Spec.

IX. Security/Accessibility — PASS
- URL/image protections remain protected;
- keyboard/focus/visible navigation are QA cases;
- no new runtime or test framework dependency is required.

## Functional Requirement coverage

FR-001 canonical exact SHA
Covered by T002, T021, T052/T058 and Release Manifest.

FR-002 distinguish repository/Pages/Blogger/QA/acceptance/evidence
Covered by data model, manifest contract, T021, T058-T066.

FR-003 classify relevant historical lines
Covered by T067-T073.

FR-004 bounded mobile evaluation, no wholesale merge
Covered by T025-T040 plus stop rules.

FR-005 preserve behavior outside approved delta
Covered by T040, T051, T079.

FR-006 deterministic About reliability criterion
Covered by T013-T018, T041-T043.

FR-007 minimal About fix only if necessary
Covered by T044-T046.

FR-008 automated repository gates
Covered by T051, T055, T057, T082.

FR-009 real Blogger QA
Covered by T059-T063.

FR-010 rollback source/artifact
Covered by T003-T004, T059, T064.

FR-011 manual/account actions distinct from code
Covered by Release Manifest/QA contracts and Phase 9.

FR-012 no unrelated feature/backend/framework/bundler/core refactor
Covered by Constitution, Plan and Stop Conditions.

FR-013 claims require evidence
Covered by CandidateDelta decision tasks and Analyze gates.

FR-014 retained delta traceability
Covered by T005 plus M/A decision and regression tasks.

FR-015 merge is not E4
Covered by C-004 closeout and fresh QA requirement.

FR-016 mandatory Release Manifest fields
Covered by manifest contract, T007/T024/T058/T065-T066.

FR-017 preserve historical v0.9 QA/release/status
Covered explicitly by T009-T012.

FR-018 PR #4-#9 no merge + cleanup after proof
Covered by T067/T070.

FR-019 PR #15-#16 CI-only
Covered by T068/T071.

FR-020 PR #13/#14 experimental/reference only
Covered by all M/A reconstruction tasks and T069/T072.

FR-021 Search Core/Metadata provenance debt only
Covered by T074/T075 and protected-surface stop conditions.

FR-022 forensic registries as planning inputs
Covered by T001, T021/T022, T077/T079.

FR-023 accessibility-sensitive deltas preserve navigation/focus
Covered by T040, QA contract and T061.

FR-024 security-sensitive behavior not weakened
Covered by T046, QA contract, protected surface registry and T061-T063.

**FR coverage result**: 24/24 have one or more explicit task/evidence paths.

## Success Criteria coverage

SC-001 one canonical v0.9.x baseline
T021/T052/T056/T058/T066.

SC-002 all relevant historical PRs have disposition
T067-T073.

SC-003 automated gates zero failures
T051/T055/T057/T082.

SC-004 zero unintended protected changes
T040/T051/T079.

SC-005 real Blogger smoke recorded before FROZEN
T059-T066.

SC-006 mobile delta bounded vs PR #13
T025-T040.

SC-007 About reliability proven
T041-T046.

SC-008 repo docs sufficient without chat
T078-T083 + Manifest/Handoff.

SC-009 historical v0.9 records preserved/labeled
T009-T012.

SC-010 Search/Metadata source debt deferred explicitly
T074/T075.

SC-011 no SUPERSEDED/CI-ONLY/EXPERIMENT merge
Tasks/stop conditions/T067-T073.

**SC coverage result**: 11/11 covered.

## Remaining implementation-phase risks (not specification ambiguity)

### RISK-IMPL-001 — Safe-area validation needs real WebKit/device-class evidence

CI/desktop emulation alone cannot fully prove iPhone safe-area behavior. T025/T061 require WebKit/Safari-class evidence.

### RISK-IMPL-002 — About preload benefit may be network-sensitive

M-003 must be evaluated under deliberately slow stylesheet conditions; no assumption that global preload is free.

### RISK-IMPL-003 — About transactional improvement may be resilience-only

A structurally stronger design is not enough to modify product in Spec 001. If valid profile states do not reproduce a defect, T044 defers A-001.

### RISK-IMPL-004 — Immutable CDN is a delivery dependency

ADR-001 records this explicitly. The source Git SHA remains the release identity; a future hosting migration can replace jsDelivr under a new ADR.

### RISK-IMPL-005 — main may advance during implementation

T002 is a hard stop/re-evaluation gate.

## Task graph quality

Task count: 83.

Characteristics:
- functional changes are conditional and evidence-gated;
- payload/shell release construction is sequential where SHA dependency requires it;
- same-file edits are not marked parallel;
- high-value historical evidence is preserved before PR closure;
- rollback is verified before any Blogger candidate installation;
- final convergence maps all requirements/success criteria back to evidence.

## Analyze exit rule

Analyze is complete because:
- all critical/high cross-artifact contradictions found in this pass were resolved in ADRs/tasks;
- 24/24 functional requirements have task coverage;
- 11/11 success criteria have task coverage;
- no Constitution violation is accepted;
- remaining unknowns have explicit empirical tests and binary decision rules;
- no product code has been changed by the SDD/forensic/Plan/Tasks/Analyze work.

## Next phase

`IMPLEMENT`, beginning strictly with Phase 1 Baseline Lock and Phase 2 historical-evidence preservation before any functional product edit.
