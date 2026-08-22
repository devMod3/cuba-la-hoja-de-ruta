# Candidate Deltas — Spec 001

**State**: M003_DECIDED_T034
**Rule**: no delta may enter product implementation while `decision=UNRESOLVED`.

## Comparison baseline

- canonical `main`: `0a45bc523f0129d83307f1c6f3a972056b219ae0`
- active Blogger payload pin: `aa372e1cc7982d1f8335d0d21760869c396b32c3`
- exact current Blogger XML SHA-256: `42b439df1c96915a2568fce9b0a243f26196281d2c9f8afca0bb7f786df114d8`
- release-shell provenance: `ad43ac63c12a666534e03cf9d5436184b985d1d1`

The `aa372e1.../blogger/theme.xml` repository blob is historical source evidence, not the installed-theme identity. The preserved exported Blogger XML is the authoritative deployment artifact and pins project assets to `aa372e1...`.

## M-001 — Safe-area accounting

- `productionState`: present
- `canonicalMainState`: different
- `ownerFiles`: `src/ui/styles/tokens.css`
- `canonicalBlob`: `c3ede383f99aea91633a6d1515c8d14ea5cd94b5`
- `productionBlob`: `75044c8bc8deb7f75735a2c8efc449d1d1de8713`
- `symptomOrBenefit`: production computes mobile header/player-safe values with `env(safe-area-inset-top/bottom)`; canonical main uses fixed `101px` / `56px` mobile values.
- `protectedNeighbors`: PS-001 Blogger anatomy; PS-002 Zen Radio Player; PS-011 reader critical path; PS-015 responsive/safe areas
- `reproductionEvidence`: NOT_RUN — WebKit/Safari safe-area, non-notch phone and landscape required
- `regressionTest`: neutral ownership/boundary characterization exists in `tests/mobile-characterization.test.js`; behavioral decision test pending T025–T027
- `accessibilityImpact`: potential reflow/touch-target/visible-content impact
- `securityImpact`: none identified
- `criticalPathImpact`: CSS layout tokens on public reader path
- `decision`: UNRESOLVED
- `decisionEvidence`: static T022 characterization confirms a material delta; empirical T025–T027 still required

## M-002 — Short-height Home density

- `productionState`: present
- `canonicalMainState`: different
- `ownerFiles`: `src/features/home/home.css`
- `canonicalBlob`: `238c109d1d45552a559ab3d82962070827e533d3`
- `productionBlob`: `0c1db69994aecac82d27e362d9736b1194a63701`
- `implementedProductCommit`: `a462c89a80dc10e0f64c9bc60ce2164ac98d35dd`
- `postImplementationHarnessCommit`: `4aa2120ec2c5242499001db0c490e24fffc29ebb`
- `symptomOrBenefit`: production adds short-phone compaction at <=760px width/height, changes mobile title sizing, delays emergency vertical scroll to <=560px, adds overscroll containment, and adds `100svh`; canonical main retains the older <=620px fallback and lacks the dedicated short-phone compaction block.
- `protectedNeighbors`: PS-002 player boundary; PS-011 reader critical path; PS-015 responsive/safe areas
- `reproductionEvidence`: E3 — exact Chrome DevTools Protocol device metrics in GitHub Actions. Run #150 (`32588374314`) proved the harness at 320x568, 390x700, 390x560 and 667x375. Canonical main: 320x568 and 390x560 place essential Home elements outside the initial Home box but keep them reachable by vertical scroll; 390x700 fits; landscape remains reachable by scroll; no horizontal overflow. Deployed production: 320x568 and 390x560 keep essential elements inside the Home box; 390x700 remains fitting; landscape remains reachable by scroll; no horizontal overflow. Run #154 (`32588482004`) proved a bounded candidate consisting only of short-height compaction plus moving last-resort scroll from <=620px to <=560px with overscroll containment. Run #162 (`32588735098`) then validated the actual implementation against immutable canonical `0a45bc...` and deployed production `aa372e1...` using the same exact viewports.
- `regressionTest`: `tests/mobile-render-contract.test.js` freezes the accepted M-002 CSS contract and explicitly rejects unrelated deployed `100svh` / general mobile sizing. `tests/home-viewport-characterization.mjs` compares immutable canonical, local implementation and immutable deployed production. Run #162: 64/64 unit tests PASS; About browser smoke PASS; `M-002 implementation contract: PASS`; XML parse PASS; architecture invariants PASS.
- `accessibilityImpact`: positive for initial visibility at 320x568 and 390x560 while preserving reachable scroll in extreme landscape; no horizontal overflow or inaccessible essential content observed.
- `securityImpact`: none identified
- `criticalPathImpact`: public Home CSS, bounded to short-height media queries and fallback-scroll threshold.
- `decision`: ADJUST
- `decisionEvidence`: T029/T030 exact viewport comparison + T031 bounded-candidate proof + T032 post-implementation run #162. Full deployed `home.css` was NOT accepted wholesale. General mobile title-size changes and `100svh` remain excluded. Implemented behavior is limited to: (1) the <=760px width + <=760px height compaction rules that preserve the same content/actions, and (2) changing the last-resort scroll threshold from <=620px to <=560px with `overscroll-behavior-y: contain`.
- `implementationStatus`: COMPLETE_T032 — product CSS implemented and post-implementation browser/CI contract PASS. This is pre-release evidence, not final Blogger candidate QA.

## M-003 — About stylesheet preload/delivery

- `productionState`: global head stylesheet ownership present
- `canonicalMainState`: lazy bootstrap ownership present
- `ownerFiles`: `blogger/theme.xml`, `tools/about/bootstrap.js`
- `canonicalThemeBlob`: `7dd61dc3ec2d2602e249be776c887c8ac5c578b4`
- `canonicalAboutBootstrapBlob`: `3b753e3980d2e7a02d8f58bd9088ee4e951a5e26`
- `productionPayloadAboutBootstrapBlob`: `003d8bda7959d83a3864fdc992b4f7e9e2635527`
- `symptomOrBenefit`: the exact installed Blogger XML declares `tools/about/about.css` globally in `<head>`, eliminating first-open unstyled About but moving an auxiliary stylesheet onto every reader path. Canonical main omits the global stylesheet and lazy-loads it only when About boots, but mounts `AboutFeature` immediately without waiting for stylesheet readiness.
- `protectedNeighbors`: PS-008 About; PS-011 reader critical path; PS-016 deployment boundary
- `reproductionEvidence`: E3 — GitHub Actions run #178 (`32589253689`), job `97070337147`, Google Chrome `151.0.7922.137`, Node `20.20.2`, CDP real-time delivery characterization with cache disabled. Eight scenarios compared lazy/global × reader/About × normal/1200ms stylesheet delay. Under 1200ms delay: lazy reader made 0 About CSS requests and loaded in ~18ms; global reader made 1 About CSS request and load waited ~1216ms. Lazy About mounted at ~27.4ms while CSS completed at ~1229.5ms, producing ~1202.1ms measured FOUC. Global About CSS completed at ~1212.3ms before shell mount at ~1224.8ms, producing FOUC=0. Normal-network lazy About also rendered before CSS, but only by ~4.1ms. Run #178 completed all repository gates PASS.
- `regressionTest`: `tests/about-delivery-characterization.mjs` + `tests/fixtures/about-delivery.html` establish the decision baseline. T035 must add a durable contract that (a) reader/theme does not globally own About CSS, (b) only one `#zen-about-css` link is created, and (c) About shell mount waits for stylesheet readiness while preserving fallback on failure.
- `accessibilityImpact`: lazy-as-is can expose a materially unstyled About on slow delivery; global-as-deployed prevents FOUC but can delay unrelated reader views by the stylesheet latency.
- `securityImpact`: none identified
- `criticalPathImpact`: decisive. Constitution principle IV / protected reader critical path rejects a globally render-blocking About-only request when equivalent About stability can be achieved inside the auxiliary bootstrap.
- `decision`: ADJUST
- `decisionEvidence`: T033 run #178 demonstrates both harms empirically. T034 chooses neither historical endpoint wholesale. Preserve canonical lazy ownership so non-About reader views issue zero About CSS requests, but change the About bootstrap so it waits for the single lazy stylesheet to become ready before replacing the existing fallback with `AboutFeature`. Do not add About CSS to `blogger/theme.xml`. If stylesheet loading fails, preserve the fallback rather than committing an unstyled custom shell.
- `implementationStatus`: AUTHORIZED_T035 — no M-003 product edit had been made at decision time.

## M-004 — About mobile CSS v0.1.5 behavior

- `productionState`: present
- `canonicalMainState`: different
- `ownerFiles`: `tools/about/about.css`
- `canonicalBlob`: `a4b184a23306b386dbbfa4b176d6d2c98e7cbc98`
- `productionBlob`: `f8d2362c6bcb355d12efe7181705140f18b08310`
- `symptomOrBenefit`: production v0.1.5 adds root overscroll containment, overflow wrapping, player-safe mobile padding, `100dvh`/`100svh` height accounting, keeps portrait + identity side-by-side on normal phones, and stacks only <=340px. Canonical main v0.1.4 stacks the profile below 500px and lacks those deployed mobile protections.
- `protectedNeighbors`: PS-002 player boundary; PS-008 About; PS-015 responsive/safe areas
- `reproductionEvidence`: NOT_RUN — ~320/~390/~768 with empty/populated profile required
- `regressionTest`: canonical populated-profile Chrome smoke exists; viewport/mobile behavioral characterization pending T036–T038
- `accessibilityImpact`: reflow, overflow and readable identity layout
- `securityImpact`: none identified
- `criticalPathImpact`: About-only stylesheet unless M-003 changes ownership
- `decision`: UNRESOLVED
- `decisionEvidence`: static T022 characterization confirms a material delta; empirical T036–T038 still required

## M-005 — Responsive foundation equivalence

- `productionState`: present
- `canonicalMainState`: present
- `ownerFiles`: `src/ui/styles/responsive.css`
- `canonicalBlob`: `839ae297acfe09eb2804a1e852c6c2e6797b3640`
- `productionBlob`: `839ae297acfe09eb2804a1e852c6c2e6797b3640`
- `symptomOrBenefit`: no delta exists. Canonical and deployed payload use byte-identical `responsive.css` content.
- `protectedNeighbors`: PS-011 reader critical path; PS-015 responsive/safe areas
- `reproductionEvidence`: T023 live Git blob identity reverified on 2026-08-22
- `regressionTest`: `tests/mobile-characterization.test.js` protects safe-inset/touch/overflow boundaries without freezing candidate behavior
- `accessibilityImpact`: protected responsive baseline remains unchanged
- `securityImpact`: none identified
- `criticalPathImpact`: public CSS, no candidate edit required
- `decision`: KEEP
- `decisionEvidence`: T023 exact blob equality `839ae297acfe09eb2804a1e852c6c2e6797b3640`; KEEP means preserve canonical file unchanged / no-op, not copy from historical branch

## A-001 — About transactional render

- `productionState`: absent
- `canonicalMainState`: absent
- `ownerFiles`: `tools/about/AboutFeature.js`, `tools/about/bootstrap.js`
- `canonicalAboutFeatureBlob`: `9ec3aed5c283eefba23b649b6a191925f7459dce`
- `productionAboutFeatureBlob`: `9ec3aed5c283eefba23b649b6a191925f7459dce`
- `symptomOrBenefit`: historical PR #14 proposed off-DOM build plus final commit to preserve last valid render on exception. Current production and canonical main have byte-identical `AboutFeature.js` and do not contain that transactional render fix. Bootstrap differs for release/delivery mechanics, not because A-001 is deployed.
- `protectedNeighbors`: PS-008 About; URL/image safety; reader critical-path boundary
- `reproductionEvidence`: NOT_RUN — realistic valid-profile defect reproduction required
- `regressionTest`: recovered browser smoke proves normal valid-profile render; failing realistic exception/destructive-render case is still required before any product fix
- `accessibilityImpact`: blank/partial About could affect semantic availability if a real defect is demonstrated
- `securityImpact`: URL/image safety must not weaken
- `criticalPathImpact`: About auxiliary path
- `decision`: UNRESOLVED
- `decisionEvidence`: T022 exact AboutFeature blob equivalence confirms A-001 is not deployed; T041–T044 govern reproduction and DEFER/fix decision

## Release/version identity observation

`src/bootstrap/createZenBlog.js` is also materially different across historical deployment and canonical main:

- deployed payload blob `f10435d027caeb8e7d42defc268584a666500ba5` carries VERSION/query key `0.4.0`;
- canonical blob `6aec3f2dac83eb7cb238d0c32478d2e142ef34ba` carries VERSION/query key `0.9.1`;
- canonical `package.json.version` is still `0.4.0`.

This is not a new product-behavior CandidateDelta. It is the already accepted ADR-002 release-identity debt and must be normalized coherently to `0.9.2` only after functional delta decisions and before PAYLOAD_SHA capture.

## Gate result through T034

- M-001: MATERIAL / UNRESOLVED — WebKit/Safari safe-area evidence still required
- M-002: MATERIAL / ADJUST / IMPLEMENTED — T032 browser + CI PASS
- M-003: MATERIAL / ADJUST — T033 E3 PASS; bounded T035 bootstrap implementation authorized
- M-004: MATERIAL / UNRESOLVED
- M-005: EXACT EQUIVALENCE / KEEP AS NO-OP
- A-001: NOT DEPLOYED / UNRESOLVED pending realistic reproduction

M-002 remains the only functional product delta implemented so far. M-003 is authorized only for a bounded lazy-stylesheet readiness change in `tools/about/bootstrap.js`; `blogger/theme.xml` must remain free of globally owned About CSS. All other unresolved product deltas remain blocked.
