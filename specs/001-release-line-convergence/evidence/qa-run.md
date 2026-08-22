# QA Run — Spec 001

## Candidate header

- Candidate source SHA: `UNRESOLVED`
- Candidate Blogger XML SHA-256: `UNRESOLVED`
- Asset delivery identity: `UNRESOLVED`
- Test date/time: `NOT_RUN`
- Tester: `NOT_RUN`
- Environment notes: `NOT_RUN`

All results are initialized to `NOT_RUN`. This ledger does not claim browser or Blogger acceptance.

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

Use this block when a case is executed:

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

## Automated browser smoke

- State: `NOT_RUN`
- Browser binary/version: `UNRESOLVED`
- Source SHA: `UNRESOLVED`
- Result: `NOT_RUN`
- Evidence reference: `—`

## Severity gate

P0/P1 failures block `VALIDATED` and `FROZEN`. CI green, screenshots, or historical QA from another branch do not substitute for attributable candidate QA.
