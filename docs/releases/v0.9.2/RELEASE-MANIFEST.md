# ZenBlog v0.9.2 — Release Manifest

**Status**: `CANDIDATE-DRAFT`

## Baseline context

- Canonical baseline `main`: `0a45bc523f0129d83307f1c6f3a972056b219ae0`
- Active Blogger payload pin at implementation start: `aa372e1cc7982d1f8335d0d21760869c396b32c3`
- Active Blogger release-shell provenance: `ad43ac63c12a666534e03cf9d5436184b985d1d1`
- Active/rollback Blogger XML SHA-256: `42b439df1c96915a2568fce9b0a243f26196281d2c9f8afca0bb7f786df114d8`

These baseline identities are historical/starting evidence. They are not candidate payload/shell/XML identities.

## Identity

- Release label / ADR-002 target application release: `ZenBlog v0.9.2`
- Spec: `specs/001-release-line-convergence/`
- Canonical candidate source SHA: `UNRESOLVED — candidate payload not yet constructed`
- Payload SHA: `UNRESOLVED`
- Release-shell SHA: `UNRESOLVED`
- Asset delivery identity: `UNRESOLVED`
- Cache/release key: `0.9.2` target per ADR-002; not yet normalized in payload
- Blogger candidate XML SHA-256: `UNRESOLVED`
- Blogger installation date/time: `NOT_INSTALLED`

## Verification

- CI workflow/run: `NOT_RUN_FOR_CANDIDATE`
- Automated test result: `NOT_RUN_FOR_CANDIDATE`
- Browser smoke result: `NOT_RUN`
- Real Blogger QA result: `NOT_RUN`
- QA evidence: `specs/001-release-line-convergence/evidence/qa-run.md`
- Product Owner acceptance: `NOT_REQUESTED`

## Rollback

- Rollback XML SHA-256: `42b439df1c96915a2568fce9b0a243f26196281d2c9f8afca0bb7f786df114d8`
- Rollback source/reference: `docs/forensic/artifacts/blogger-theme-current-2026-08-22.xml`
- Captured active asset pin: `aa372e1cc7982d1f8335d0d21760869c396b32c3`
- Captured release-shell provenance: `ad43ac63c12a666534e03cf9d5436184b985d1d1`

## Known debt

- Search Core v1 source-provenance recovery deferred to a dedicated future Spec.
- Metadata source-of-truth/reproducibility review deferred beyond Spec 001.
- Browser-local profile/metadata persistence, Admin auth, shared persistence, performance baseline, and hosting/domain evolution remain outside Spec 001.

## Historical PR dispositions

- PR #4–#9: `PENDING — historical LAB evidence must be preserved before closure`
- PR #13: `EXPERIMENT/REFERENCE — no wholesale merge`
- PR #14: `EXPERIMENT/REFERENCE — no wholesale merge; A-001 evidence only`
- PR #15/#16: `CI_ONLY — no product merge`
- PR #17: `ACTIVE SDD FOUNDATION — lifecycle independent from implementation PR`

## Freeze rule

This manifest MUST NOT advance to `FROZEN` unless all of the following are attributable to the final candidate:

```text
CI = PASS
AND required browser smoke = PASS
AND Blogger QA = PASS
AND Product Owner acceptance = PASS
AND rollback artifact is known
AND no unresolved P0/P1 release blocker remains
```

No unresolved field in this draft is evidence of completion.
