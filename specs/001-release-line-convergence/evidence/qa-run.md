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

### T032 implemented product verification

Product implementation:
- Home CSS commit: `a462c89a80dc10e0f64c9bc60ce2164ac98d35dd`
- exact post-implementation characterization harness head: `4aa2120ec2c5242499001db0c490e24fffc29ebb`
- CI-only execution workflow commit: `71c6876de2a5d88c84e665be93bff5e091144687`
- Workflow run #162: `32588735098`
- Job: `97069058114`

The post-implementation harness used three explicit identities:
- canonical = immutable `0a45bc523f0129d83307f1c6f3a972056b219ae0`;
- implementation = local implementation branch content;
- production = immutable `aa372e1cc7982d1f8335d0d21760869c396b32c3`.

Implemented critical results:
- 320x568: `essentialOutside=false`, `essentialInaccessible=false`, `horizontalOverflow=false`, no Home scroll required;
- 390x700: `essentialOutside=false`, `essentialInaccessible=false`, `horizontalOverflow=false`, existing normal-phone fit preserved;
- 390x560: `essentialOutside=false`, `essentialInaccessible=false`, `horizontalOverflow=false`, reachable vertical fallback preserved;
- 667x375: `essentialOutside=true`, `essentialInaccessible=false`, `horizontalOverflow=false`, `scrollable=true`.

These three critical outcomes (`essentialOutside`, `essentialInaccessible`, `horizontalOverflow`) match deployed production for all four tested viewport classes. The implementation deliberately retains canonical M-001 tokens (`101px` / `56px`) because safe-area accounting remains a separate unresolved delta.

Run #162 full gate:
- JavaScript checks: PASS
- unit tests: 64/64 PASS
- M-002 contract tests: 3/3 PASS
- About browser smoke: PASS
- exact viewport characterization: PASS
- browser assertion: `M-002 implementation contract: PASS`
- Blogger XML parse: PASS
- architecture invariants: PASS

T032 result: `PASS — IMPLEMENTED`. This remains pre-release engineering evidence; Blogger real and final-candidate Q-PUB-003/Q-PUB-004 remain `NOT_RUN` until the final candidate exists.

Decision reference: `specs/001-release-line-convergence/evidence/candidate-deltas.md` — M-002 `ADJUST / COMPLETE_T032`.

## Pre-candidate characterization — M-003 About stylesheet delivery

This section is T033–T035 engineering evidence. It is NOT final-candidate Q-PUB-012 and does not change the release matrix above.

Environment:
- GitHub Actions `ubuntu-24.04`
- Node `v20.20.2`
- Google Chrome `151.0.7922.137`
- Chrome DevTools Protocol real-time navigation; browser cache disabled
- deliberate About CSS server delay: `1200ms`
- baseline workflow run #178: `32589253689`
- final implementation workflow run #190: `32595190420`

Decision: `M-003 = ADJUST`.

Accepted implementation:
- About CSS remains lazy and off the unrelated reader path;
- the custom About shell waits for stylesheet readiness;
- only one `#zen-about-css` owner exists;
- stylesheet failure preserves the server fallback.

Final slow-load evidence in run #190:
- lazy reader: zero About CSS requests;
- lazy About: CSS ready ~1227.2ms; shell/ready ~1227.9ms;
- `styledAtRender=true`;
- FOUC = 0.

Run #190 repository gates: 67/67 unit tests PASS, About browser smoke PASS, delivery contract PASS, Blogger XML PASS and architecture invariants PASS.

## Pre-candidate characterization — M-004 About mobile / populated profile

This section is T036–T039 engineering evidence. It is NOT final-candidate Q-PUB-010/Q-PUB-011 and does not change the release matrix above.

Baseline workflow run #195 (`32595381075`) compared canonical About v0.1.4 and deployed v0.1.5 at exact 320x568, 390x700 and 768x1024 viewports with empty and populated profiles.

Decision: `M-004 = ADJUST`.

Accepted implementation:
- portrait + identity stay side-by-side on normal phones;
- stack only at <=340px;
- root respects `--zen-player-safe`;
- long text/resource wrapping is defensive;
- overscroll is contained;
- `100dvh` / `100svh` were not imported.

Post-implementation run #200 (`32595520760`) PASS:
- 70/70 unit tests;
- About browser smoke;
- exact viewport characterization;
- Blogger XML;
- architecture invariants.

Populated 390px evidence: grid `96px 247px`, player-safe `56px`, full profile semantics present, no horizontal overflow and no inaccessible content.

## Pre-candidate defect correction — About local draft vs public Blogger profile

This section records a user-observed deployment-boundary defect discovered after M-004. It is pre-candidate engineering evidence and does NOT mark Q-PUB-011 as executed on real Blogger.

### Root cause

`AboutManager.save()` writes through `SiteProfileStore`, whose default backing store is browser `localStorage` under key `zenSiteProfile.v1`. Local Admin and local preview share one origin, so the workflow works locally. Blogger and the local Admin origin do not share browser storage; therefore public About could not use local Admin state as a publication mechanism.

### Corrected ownership model

- Local draft: `SiteProfileStore` / `localStorage`.
- Public artifact: `config/site-profile.public.json`.
- Public reader: `PublishedSiteProfileStore`.
- Source decision: same page/module origin => local draft; different page/module origins => published artifact.
- `AboutFeature` remains a renderer of the store interface and does not own publication.

### Browser contract

`tests/about-public-profile-browser.mjs` uses two HTTP origins to simulate Blogger and GitHub Pages. The simulated Blogger origin intentionally contains a conflicting `zenSiteProfile.v1` value in localStorage. The simulated asset origin serves a different published snapshot. The contract passes only when rendered `#zen-about` identifies `profileSource="published"` and renders the published profile instead of the conflicting browser-local profile.

First run #208 (`32596716567`) proved the product behavior but exposed an over-broad test assertion: the word LOCAL remained in the fixture `<script>` source even though rendered `#zen-about` was correct. The assertion was corrected to inspect the About DOM only; no product code was changed for that test failure.

Final run #209 (`32596764967`) SUCCESS:
- JavaScript checks PASS;
- unit tests PASS;
- existing same-origin About browser smoke PASS;
- cross-origin public-profile browser contract PASS;
- Blogger XML PASS;
- architecture invariants PASS.

Architecture reference: `docs/architecture/about-profile-publication.md`.

Final real Blogger/mobile acceptance remains `NOT_RUN` until this code is part of the release candidate and installed on Blogger.

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
