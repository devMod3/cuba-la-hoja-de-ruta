# Clarify Closeout — Spec 001 Release-Line Convergence

**Date**: 2026-08-22

**Status**: COMPLETE — remaining uncertainty is behavioral validation, not architecture/spec ambiguity.

## Resolved decisions

C-001 — RESOLVED
Current Blogger deployment identified from exported XML.

Classification:
`DERIVED — ACTIVE NON-CANONICAL DEPLOYMENT`

Current export SHA-256:
`42b439df1c96915a2568fce9b0a243f26196281d2c9f8afca0bb7f786df114d8`

Active asset pin:
`aa372e1cc7982d1f8335d0d21760869c396b32c3`

Release-shell provenance:
`ad43ac63c12a666534e03cf9d5436184b985d1d1`

C-002 — SPEC AMBIGUITY RESOLVED; VALIDATION TRANSFERRED TO PLAN
The relevant deployed differences are independently identified as M-001 through M-004; M-005 is equivalent to main for the inspected responsive foundation. Preserve/reject decisions require browser/device characterization and therefore become implementation-plan gates rather than clarification questions.

C-003 — SPEC AMBIGUITY RESOLVED; VALIDATION TRANSFERRED TO PLAN
Current production and main use the same non-transactional AboutFeature blob. The PR #14 transactional design is a conditional candidate A-001 only if a deterministic failure is reproduced. The historical browser-smoke technique is reusable evidence and will be extracted independently.

C-004 — CLOSED
`historical E4 unavailable; fresh validation required`

The forensic/GitHub evidence set does not contain attributable proof that a final canonical main/v0.9.1 XML completed the entire manual Blogger acceptance matrix. This is no longer treated as an endlessly open research question. Fresh validation is mandatory for the new candidate.

C-005 — RESOLVED
The minimum QA matrix is defined in `clarifications.md` and formalized by `contracts/qa-evidence.md`.

C-006 — RESOLVED FOR FORWARD WORK
The exact 2026-08-22 current Blogger export is the immediate operational rollback artifact for Spec 001 candidate deployment.

## Why Clarify may close before M-001/M-004 and A-001 are tested

Spec Kit clarification resolves ambiguity that could change what the feature means or how it must be planned. The remaining questions are empirical:
- does a deployed CSS behavior pass the acceptance matrix?;
- does main reproduce an About failure?;
- does preload materially prevent first-open layout instability?;

Those questions have explicit environments, tests and binary decision rules in `plan.md`. They do not require inventing a new requirement or choosing an architecture before evidence exists.

## Phase transition

```text
FORENSIC BASELINE  COMPLETE
CLARIFY            COMPLETE
PLAN               COMPLETE after quickstart/contracts/research/data-model
TASKS              NEXT
ANALYZE             after tasks
IMPLEMENT           only after analyze passes
CONVERGE            before release acceptance
```

No product source file was changed during Clarify.
