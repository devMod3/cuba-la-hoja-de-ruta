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

## Pre-candidate characterization — M-002 Home density

This section is T029–T031 decision evidence. It is NOT final-candidate QA and does not change the `NOT_RUN` state of the release matrix above.

Environment:
- GitHub Actions `ubuntu-24.04`
- Node `v20.20.2`
- Google Chrome `151.0.7922.137`
- exact CSS viewport dimensions established through Chrome DevTools Protocol `Emulation.setDeviceMetricsOverride`

### Canonical main vs deployed production

Workflow run #150 (`32588374314`) compared unchanged canonical Home CSS against immutable deployed payload `aa372e1cc7982d1f8335d0d21760869c396b32c3`.

| Case | main | deployed production | Horizontal overflow |
|---|---|---|---|
| 320x568 narrow phone | essential elements extend beyond initial Home; reachable by scroll | essential elements remain inside Home; no scroll required | none |
| 390x700 normal phone | essential elements inside Home; no scroll | essential elements inside Home; no scroll | none |
| 390x560 short phone | essential elements extend beyond initial Home; reachable by scroll | essential elements remain inside Home; reachable scroll remains available | none |
| 667x375 landscape | essential elements extend beyond initial Home; reachable by scroll | same accessibility outcome with lower content height; reachable by scroll | none |

No case produced `essentialInaccessible=true`.

### Bounded M-002 candidate

Workflow run #154 (`32588482004`) tested a candidate built from canonical main plus only:

1. short-height compaction at `max-width:760px` + `max-height:760px`;
2. moving emergency vertical scroll from `max-height:620px` to `max-height:560px`;
3. `overscroll-behavior-y: contain` on that last-resort scroll.

Explicitly excluded from this candidate:
- general deployed mobile title sizing changes outside short-height mode;
- deployed `100svh` override;
- safe-area token changes (M-001).

Observed critical results:
- 320x568: essentials inside Home, no horizontal overflow, no inaccessible content;
- 390x700: existing passing behavior preserved;
- 390x560: essentials inside Home, vertical fallback still reachable, no horizontal overflow;
- 667x375: reachable scroll preserved, no horizontal overflow;
- harness assertion: `M-002 minimal candidate: PASS`;
- full run: JavaScript checks PASS; 61/61 unit tests PASS; About browser smoke PASS; exact viewport characterization PASS; Blogger XML parse PASS; architecture invariants PASS.

Decision reference: `specs/001-release-line-convergence/evidence/candidate-deltas.md` — M-002 `ADJUST`.

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

P0/P1 failures block `VALIDATED` and `FROZEN`. Baseline smoke, pre-candidate characterization, CI green, screenshots, or historical QA do not substitute for attributable final-candidate browser and Blogger QA.
