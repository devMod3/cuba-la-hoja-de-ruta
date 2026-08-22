# Quickstart — Spec 001 Release-Line Convergence

This is the operational runbook for a maintainer executing Spec 001. It is intentionally conservative: characterize first, change second, deploy only after automated convergence.

## 0. Read before touching product code

Read in this order:

1. `.specify/memory/constitution.md`
2. `specs/001-release-line-convergence/spec.md`
3. `specs/001-release-line-convergence/clarifications.md`
4. `specs/001-release-line-convergence/plan.md`
5. `specs/001-release-line-convergence/research.md`
6. `docs/forensic/PROTECTED-SURFACE-REGISTRY-v0.1.txt`
7. `docs/forensic/DISCREPANCY-REGISTER-v0.1.txt`
8. `docs/forensic/RELEASE-LINEAGE-v0.1.txt`
9. `docs/forensic/CURRENT-BLOGGER-DEPLOYMENT-2026-08-22.txt`

Stop if any source contradicts a protected invariant without a recorded clarification/ADR.

## 1. Freeze the starting state

At the time this quickstart was authored:

```text
Canonical main SHA:
0a45bc523f0129d83307f1c6f3a972056b219ae0

Current Blogger export SHA-256:
42b439df1c96915a2568fce9b0a243f26196281d2c9f8afca0bb7f786df114d8

Current Blogger asset pin:
aa372e1cc7982d1f8335d0d21760869c396b32c3

Release-shell provenance:
ad43ac63c12a666534e03cf9d5436184b985d1d1
```

Before implementation, verify `main` has not advanced. If it has, redo the main-vs-production delta comparison and update the Spec artifacts before changing product code.

## 2. Preserve rollback first

Keep the exact 2026-08-22 Blogger export available and unedited.

Do not install a candidate unless its rollback artifact is locally/repository-accessible and its SHA-256 is known.

## 3. Create the bounded implementation branch

Use a new branch from the accepted SDD/canonical base, for example:

```text
001-release-line-convergence-impl
```

Never use PR #13 or PR #14 as the implementation branch.

Never merge a historical LAB stack to obtain the desired delta.

## 4. Extract tests before product changes

Recover only the useful About browser-smoke technique from the historical line:

```text
tests/about-browser-smoke.mjs
tests/fixtures/about-smoke.html
```

Review/adapt it against current canonical paths.

Required properties:
- Node built-ins only unless a later decision explicitly justifies a dependency;
- real Chrome/Chromium execution;
- no external network dependency;
- fail if browser is unavailable;
- deterministic fixture;
- semantic assertions;
- failure-path coverage if testing A-001 transactional rendering.

Run the extracted test on the unchanged baseline first.

## 5. Characterize candidate deltas

Evaluate each independently.

```text
M-001  Safe-area tokens
M-002  Short-height Home density
M-003  About stylesheet preload/delivery
M-004  About mobile CSS v0.1.5
A-001  Transactional About render/error boundary
```

For every delta record:
- exact symptom/benefit;
- device/browser/viewport;
- current production result;
- canonical main result;
- protected neighbors;
- accessibility/security/critical-path impact;
- KEEP / REJECT / ADJUST / DEFER;
- evidence reference.

Do not write product changes while the decision is UNRESOLVED.

## 6. Implement one accepted delta at a time

Preferred commit order:

```text
1. tests/characterization
2. M-001 if KEEP/ADJUST
3. M-002 if KEEP/ADJUST
4. M-004 if KEEP/ADJUST
5. M-003 if KEEP/ADJUST
6. A-001 only if a reproducible failure requires it
7. release identity/theme delivery changes
8. release documentation
```

After every product commit, rerun the smallest relevant test set plus the protected-neighbor regressions.

## 7. Automated pre-deployment gate

Run:

```text
npm run check
npm test
```

Also require:
- adopted browser smoke PASS;
- Blogger XML parses;
- architecture/SEO/player/cache invariants PASS;
- branch diff contains only approved blast radius.

Stop on unexpected changes to:
- Explore JS/query semantics;
- Article behavior/URLs;
- Metadata core;
- Search Lab/Search Core;
- Inspector semantics;
- Zen Radio Player internals;
- Blogger anatomy.

## 8. Create one identifiable candidate

Before Blogger installation record:

```text
Candidate source SHA:
Asset delivery identity:
Cache/release key:
Candidate Blogger XML SHA-256:
Rollback XML SHA-256:
Spec:
CI run:
```

Do not use `main` as the only asset identity.

Do not call the candidate VALIDATED yet.

## 9. Install the full candidate XML in Blogger

Install the complete XML through Blogger Theme/Edit HTML or equivalent supported workflow.

Do not patch production fragments manually.

Record the installation date/time.

## 10. Execute real Blogger QA

Use `contracts/qa-evidence.md`.

Minimum viewport/device classes:

```text
~320px narrow phone
~390px phone portrait
phone landscape / short-height
~768px tablet
>=1024px desktop
safe-area WebKit/Safari-class phone
```

Minimum public flows:

```text
Portada
Explore simple
Explore advanced
Article direct/open
Article -> Portada
About empty/populated/first-open as applicable
Player boundary/persistence
Refresh/deep-link
```

Admin/Inspector flows are required when affected and as specified by final smoke policy.

P0/P1 failure blocks acceptance.

## 11. Roll back on blocking failure

If the candidate produces a blocking regression:

1. reinstall the exact 2026-08-22 rollback XML;
2. verify the prior state is restored;
3. record the candidate failure;
4. return status to CANDIDATE;
5. do not continue to freeze.

## 12. Produce the Release Manifest

Use `contracts/release-manifest.md`.

A release cannot be FROZEN unless:

```text
CI PASS
browser smoke PASS when applicable
real Blogger QA PASS
Product Owner acceptance PASS
rollback artifact known
no unresolved P0/P1 blocker
```

## 13. Converge historical PRs

Only after release evidence is preserved:

```text
#4-#9   SUPERSEDED/ARCHIVED -> close without merge
#13     EXPERIMENT/REFERENCE -> close after delta dispositions
#14     EXPERIMENT/REFERENCE -> close after About test/A-001 disposition
#15-#16 CI-ONLY -> close after successful smoke evidence is referenced
```

Never use lifecycle cleanup as a substitute for preserving useful evidence first.

## 14. Freeze and hand off

After FROZEN:
- update handoff/release index;
- ensure a maintainer can identify canonical SHA/XML/rollback without chat history;
- leave future provenance/auth/performance work in separate Specs/Issues;
- do not reopen frozen behavior without explicit scope and evidence.

## Stop Conditions

Stop implementation and return to Spec/Plan if:
- `main` advances materially;
- production behavior cannot be reproduced;
- a desired fix requires touching an unplanned protected core;
- a new framework/dependency/build pipeline appears necessary;
- rollback cannot be guaranteed;
- candidate delivery identity cannot be made attributable;
- QA discovers a conflict between deployed behavior and a protected product contract.
