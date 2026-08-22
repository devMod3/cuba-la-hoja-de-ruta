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
|---|---|---|
| Q-ADM-001 | Metadata | NOT_RUN | — |
| Q-ADM-002 | Search Lab | NOT_RUN | — |
| Q-ADM-003 | About Manager | NOT_RUN | — |
| Q-ADM-004 | Inspector | NOT_RUN | — |

## Pre-candidate characterization — M-002 Home density

This section is T029–T032 engineering evidence. It is NOT final-candidate QA and does not change the `NOT_RUN` state of the release matrix above.

Environment:
- GitHub Actions `ubuntu-24.04`
- Node `v20.20.2`
- Google Chrome `151.0.7922.137`
- exact CSS viewport dimensions established through Chrome DevTools Protocol `Emulation.setDeviceMetricsOverride`

### Canonical main vs deployed production

Workflow run #150 (`32588374314`) compared unchanged canonical Home CSS against immutable deployed payload `aa372e1cc7982d1f8335d0d21760869c396b32c3`.

| Case | canonical main | deployed production | Horizontal overflow |
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

Explicitly excluded:
- general deployed mobile title sizing changes outside short-height mode;
- deployed `100svh` override;
- safe-area token changes (M-001).

### T032 implemented product verification

- Home CSS commit: `a462c89a80dc10e0f64c9bc60ce2164ac98d35dd`
- post-implementation harness: `4aa2120ec2c5242499001db0c490e24fffc29ebb`
- workflow run #162: `32588735098`
- job: `97069058114`
- JavaScript checks PASS
- unit tests 64/64 PASS
- M-002 contract PASS
- About browser smoke PASS
- exact viewport characterization PASS
- Blogger XML PASS
- architecture invariants PASS

T032 result: `PASS — IMPLEMENTED`. Final Blogger Q-PUB-003/Q-PUB-004 remain `NOT_RUN` until a release candidate exists.

## Pre-candidate characterization — M-003 About stylesheet delivery

This section is T033–T035 engineering evidence. It is NOT final-candidate Q-PUB-012 and does not change the release matrix above.

Environment:
- GitHub Actions `ubuntu-24.04`
- Node `v20.20.2`
- Google Chrome `151.0.7922.137`
- Chrome DevTools Protocol real-time navigation; browser cache disabled
- deliberate About CSS server delay: `1200ms`

### T033 baseline

Workflow run #178 (`32589253689`), job `97070337147`, compared lazy vs global stylesheet ownership.

| Scenario | CSS requests | Observation | FOUC |
|---|---:|---|---:|
| lazy reader, 1200ms | 0 | wall load ~18ms | n/a |
| global reader, 1200ms | 1 | wall load ~1216ms | n/a |
| lazy About, 1200ms | 1 | shell ~27.4ms; CSS ~1229.5ms | ~1202.1ms |
| global About, 1200ms | 1 | CSS before shell | 0ms |
| lazy About, normal | 1 | shell ~29.6ms; CSS ~33.7ms | ~4.1ms |
| global About, normal | 1 | CSS before shell | 0ms |

T034 decision: `ADJUST` — preserve lazy ownership but make stylesheet readiness a prerequisite for replacing the fallback.

### T035 implemented product verification

Product implementation:
- bounded About bootstrap implementation: `eca58b21d879650f05ffb1cfe0a9f8fd0ac9ee55`
- measurement-race correction: `d419657f304224a4d3f66cbb4b9fcbb768121f6d`
- CI-only equivalent harness commit: `26b5bcaa0c2bad7beed11e727ec19ec798fe065e`
- workflow run #190: `32595190420`
- job: `97084892928`

The failed intermediate characterization was traced to the fixture observing the stylesheet target listener after product bootstrap had already registered its own listener. The corrected fixture observes `load` from `document` capture phase; no product change was introduced to satisfy the faulty measurement.

Final slow-delivery observations:
- lazy reader: 0 About CSS requests; wall load ~16ms;
- global reader control: approximately 1215ms wall load;
- lazy About: CSS ready ~1227.2ms; shell/About ready ~1227.9ms;
- `styledAtRender=true`;
- `FOUC=0`.

Run #190 full gate:
- JavaScript checks PASS
- unit tests 67/67 PASS
- About browser smoke PASS
- M-003 delivery characterization PASS
- Blogger XML PASS
- architecture invariants PASS

T035 result: `PASS — IMPLEMENTED`. About CSS remains lazy and off unrelated reader paths; stylesheet failure preserves the server-visible fallback. Final Q-PUB-012 remains `NOT_RUN` until the exact release candidate is installed in Blogger.

## Pre-candidate characterization — M-004 About mobile / populated profile

This section is T036–T039 engineering evidence. It is NOT final-candidate Q-PUB-010/Q-PUB-011 and does not change the release matrix above.

Environment:
- GitHub Actions `ubuntu-24.04`
- Node `v20.20.2`
- Google Chrome `151.0.7922.137`
- exact CSS viewport dimensions established through CDP `Emulation.setDeviceMetricsOverride`
- test states: empty and populated `zenSiteProfile.v1`
- exact viewports: 320x568, 390x700, 768x1024

### T036/T037 baseline characterization

Workflow run #195 (`32595381075`), job `97085338911`, compared canonical About CSS v0.1.4 with the exact deployed v0.1.5 CSS snapshot preserved as a test-only fixture.

Semantic contract in every baseline case:
- title `La hoja de ruta` present;
- expected lead present;
- populated state contains profile, photo, 2 social links and 1 related resource;
- empty state preserves fallback;
- no horizontal overflow;
- no inaccessible content.

Material layout difference for populated profile:
- 320x568: canonical and production both stack; canonical root paddingBottom `0px`, production `56px`;
- 390x700: canonical grid `358px` (one column), scrollHeight ~755px, paddingBottom `0px`; production grid `96px 247px` (two columns), scrollHeight ~602px, paddingBottom `56px`;
- 768x1024: both use `124px 567px` two-column layout.

T038 decision: `ADJUST`.

Accepted from the deployed behavior:
- portrait + identity remain side-by-side on normal phones;
- stack only on genuinely narrow screens <=340px;
- About owns mobile player-safe padding through the shared token;
- wrapping for long identity/resource text;
- resource row wrapping;
- root overscroll containment.

Explicitly excluded:
- `100dvh`;
- `100svh`;
- wholesale copy of deployed v0.1.5 CSS.

### T039 implemented product verification

Implementation lineage:
- product CSS: `ed35ad4173cd615d67e1c2be558e19e69a60baf1`
- static long-term contract: `57f3f810cd65493be61c621afe69fc49004e4f92`
- post-implementation viewport harness: `4ec66f6055b23b36292885ca1224787fad904fc8`
- CI-only execution workflow commit: `76037550850c9fa27b8f51b3d7868c70691eedea`
- workflow run #200: `32595520760`
- job: `97085680622`

Implemented Case B results:
- 320x568 populated: title/lead/profile/photo/social/resources all present; one-column stack; root player-safe padding `56px`; scrollable/reachable; no horizontal overflow;
- 390x700 populated: title/lead/profile/photo/social/resources all present; grid `96px 247px`; root player-safe padding `56px`; scrollHeight ~654px; no inaccessible content; no horizontal overflow;
- 768x1024 populated: grid `124px 567px`; no horizontal overflow/inaccessible content.

Empty-profile fallback also remained correct at all three viewports.

Maintainability gate:
- unit test count increased to 70/70 PASS;
- `tests/about-mobile-contract.test.js` rejects reintroduction of the old <=500px one-column rule;
- stack is required only at <=340px;
- player-safe ownership, overflow wrapping and overscroll containment are asserted;
- `100dvh`/`100svh` are explicitly rejected;
- the production characterization fixture is prohibited from runtime/theme delivery.

Run #200 full gate:
- JavaScript checks PASS
- unit tests 70/70 PASS
- About browser smoke PASS
- exact About viewport characterization PASS
- browser assertion: `M-004 implementation characterization: PASS`
- Blogger XML PASS
- architecture invariants PASS

T039 result: `PASS — IMPLEMENTED`. This is E3 pre-candidate evidence. Final Blogger Q-PUB-010/Q-PUB-011 remain `NOT_RUN` until the immutable candidate exists.

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
