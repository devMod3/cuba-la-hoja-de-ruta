# QA Run — Spec 001

## Candidate header

- Candidate source SHA: `UNRESOLVED`
- Candidate Blogger XML SHA-256: `UNRESOLVED`
- Asset delivery identity: `UNRESOLVED`
- Candidate test date/time: `NOT_RUN`
- Candidate tester: `NOT_RUN`
- Candidate environment notes: `NOT_RUN`

The release candidate does not exist yet. Public/Admin cases below therefore remain `NOT_RUN` and this ledger does not claim Blogger or candidate acceptance.

## Public QA cases

| Case ID | Surface | Viewport/device class | Browser/engine | Result | Evidence reference |
|---|---|---|---|---|---|
| Q-PUB-001 | Portada desktop | >=1024px | Chromium-class desktop | NOT_RUN | — |
| Q-PUB-002 | Portada phone portrait | ~390 CSS px | mobile | NOT_RUN | — |
| Q-PUB-003 | Portada narrow phone | ~320 CSS px | mobile | NOT_RUN | — |
| Q-PUB-004 | Portada short-height/landscape | short-height / landscape | mobile | NOT_RUN | — |
| Q-PUB-005 | Safe-area phone | safe-area device class | WebKit/Safari-class | NOT_RUN | — |
| Q-PUB-006 | Explore simple | applicable | applicable | NOT_RUN | — |
| Q-PUB-007 | Explore advanced | applicable | applicable | NOT_RUN | — |
| Q-PUB-008 | Article direct/deep-link | applicable | applicable | NOT_RUN | — |
| Q-PUB-009 | Article -> Portada | applicable | applicable | NOT_RUN | — |
| Q-PUB-010 | About empty profile | applicable | applicable | NOT_RUN | — |
| Q-PUB-011 | About populated profile | applicable | applicable | NOT_RUN | — |
| Q-PUB-012 | About first-open render | applicable | applicable | NOT_RUN | — |
| Q-PUB-013 | Zen Radio Player boundary | applicable | applicable | NOT_RUN | — |
| Q-PUB-014 | Refresh/deep-link | applicable | applicable | NOT_RUN | — |

## Admin/debug QA cases

| Case ID | Surface | Result | Evidence reference |
|---|---|---|---|
| Q-ADM-001 | Metadata | NOT_RUN | — |
| Q-ADM-002 | Search Lab | NOT_RUN | — |
| Q-ADM-003 | About Manager | NOT_RUN | — |
| Q-ADM-004 | Inspector | NOT_RUN | — |

## Per-case evidence template

Use this block when a candidate case is executed:

```text
Case ID:
Surface:
Viewport/device class:
Browser/engine:
Preconditions:
Steps:
Expected:
Actual:
Result: PASS | FAIL | BLOCKED
Evidence reference:
Notes:
```

## Automated browser smoke — baseline harness validation

This section is pre-candidate T016/T017 evidence. It validates the harness against unchanged canonical product behavior and MUST NOT be counted as candidate/Blogger QA.

- State: `BASELINE_PASS`
- Canonical product baseline: `0a45bc523f0129d83307f1c6f3a972056b219ae0`
- Implementation harness head: `5a09acb0191ec14385cc0423928c33c0f18a5d31`
- CI-only execution head: `61cf1fe5b0335f76cade6826026dfb11b9686195`
- Workflow: `Validate ZenBlog #132`
- Run id: `32587219730`
- Job id: `97065328526`
- Browser binary/version: `google-chrome — Google Chrome 151.0.7922.137`
- Node: `v20.20.2`
- Unit tests in same run: `55/55 PASS`
- Browser result: `PASS`
- XML parse: `PASS`
- Architecture invariants: `PASS`
- Evidence reference: `specs/001-release-line-convergence/evidence/baseline-behavior.md`

## Severity gate

P0/P1 failures block `VALIDATED` and `FROZEN`. Baseline smoke, CI green, screenshots, or historical QA do not substitute for attributable final-candidate browser and Blogger QA.
