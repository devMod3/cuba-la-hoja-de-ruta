# Research — Spec 001 Release-Line Convergence

**Date**: 2026-08-22

## Decision R-001 — Canonical code and active production are different states

**Decision**: treat `main` as canonical code lineage and the 2026-08-22 Blogger export as the active production baseline. Neither replaces the other as evidence.

**Canonical code**: `main` at `0a45bc523f0129d83307f1c6f3a972056b219ae0` at clarification time.

**Active Blogger deployment**:
- XML SHA-256 `42b439df1c96915a2568fce9b0a243f26196281d2c9f8afca0bb7f786df114d8`;
- asset pin `aa372e1cc7982d1f8335d0d21760869c396b32c3`;
- release-shell provenance `ad43ac63c12a666534e03cf9d5436184b985d1d1`.

**Rationale**: GitHub and Blogger are separate deployment systems. Current Blogger is demonstrably not loading current main assets.

**Rejected alternative**: assume main is production because it is the default/stable branch.

## Decision R-002 — Reconstruct from main; never merge divergent historical branches

**Decision**: any retained production behavior is recreated as a bounded delta against the canonical code baseline.

**Rationale**: PR #13/#14 and the old hardening line contain divergent ancestry and unrelated historical changes. Branch ancestry is not a safe integration contract.

**Rejected alternatives**:
- merge PR #13;
- merge PR #14;
- cherry-pick a broad range without per-delta evidence.

## Decision R-003 — Deployed behavior is evidence, not automatic acceptance

**Decision**: M-001/M-002/M-003/M-004 are candidate deltas because they are deployed, but each requires validation before canonicalization.

**Rationale**: production can contain experiments or temporary mitigations. Conversely, absence from main does not justify automatic removal.

## Decision R-004 — Reuse About browser-smoke technique, not the PR branch

**Decision**: extract the dependency-free Chrome/Chromium smoke-test pattern from PR #14/#15/#16 and recreate it on the canonical line if its determinism review passes.

**Evidence**: historical CI run 108 passed an explicit `About browser smoke` step.

**Why this method**:
- Node built-ins only;
- real Chromium rendering;
- no new npm dependency;
- local fixture/HTTP server;
- CI can fail when browser is unavailable rather than silently skip.

**Risks to review before adoption**:
- virtual-time timing assumption;
- semantic assertions must cover failure/partial-render behavior, not only happy path;
- fixture must not accidentally depend on branch-specific paths.

## Decision R-005 — Current About does not contain the transactional fix

**Decision**: A-001 remains conditional.

**Evidence**: `AboutFeature.js` at active `aa372e1...` and current main has the same blob SHA `9ec3aed5c283eefba23b649b6a191925f7459dce`.

**Consequence**: current deployment can validate whether the transactional/error-boundary improvement is actually needed. Do not attribute current About behavior to PR #14.

## Decision R-006 — Current immediate rollback is the 2026-08-22 export

**Decision**: use the supplied current Blogger XML as the operational rollback for any subsequent candidate installation.

**SHA-256**: `42b439df1c96915a2568fce9b0a243f26196281d2c9f8afca0bb7f786df114d8`.

**Rationale**: rollback should restore the exact known pre-change deployment, not an older historical approximation.

**Historical rollback evidence retained separately**:
- `ZenBlog-ABOUT-FAVICON-SIMPLIFIED-v0.1.xml`;
- SHA-256 `58cd7d098245cb739ac60550e52a4375627ec5af51ec7f5e117dbb6ca39211da`;
- LAB SHA `92054d7e5589635925adbb3efd4a356883fcd687`.

## Decision R-007 — Historical E4 is unavailable unless stronger attributable evidence appears

**Decision**: stop treating missing historical manual QA as an ambiguity that can block indefinitely. Record:

`historical E4 unavailable; fresh validation required`

**Rationale**: forensic archive, branch docs and PR discussion were searched; CI and screenshots exist, but no evidence unambiguously ties final main/v0.9.1 XML to a complete Blogger acceptance record.

## Decision R-008 — Release identity must be explicit and immutable enough to reproduce

**Decision**: Release Manifest separates:
- source SHA;
- asset/delivery identity;
- release/cache label;
- deployed XML SHA-256;
- rollback XML SHA-256.

A mutable branch name or a version query on a mutable asset alone is insufficient proof of deployed bytes.

**Open implementation choice, bounded by this decision**: candidate delivery may use a coherent GitHub Pages release-key model or immutable commit-pinned assets, but the chosen model must prevent silent drift and be documented before FROZEN.

## Decision R-009 — No performance claim without measurement

**Decision**: Spec 001 preserves critical-path structure and records M-003 preload cost/benefit qualitatively. Numeric performance budgets are deferred until a real baseline is measured after release convergence.

## Decision R-010 — Search Core/Metadata provenance remains separate debt

**Decision**: do not recover/refactor those source packages during release convergence.

**Rationale**: they are important maintenance work but unrelated to closing the v0.9.x deployment split; expanding scope would increase regression risk.

## Decision R-011 — Historical PR lifecycle cleanup follows evidence capture

**Decision**: close superseded/CI-only/experiment PRs only after useful tests, SHAs and disposition are referenced by canonical documentation.

**Rationale**: cleanup must not destroy discoverability before lineage is recorded.
