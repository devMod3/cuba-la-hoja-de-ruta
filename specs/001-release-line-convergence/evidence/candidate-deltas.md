# Candidate Deltas — Spec 001

**State**: M002_DECIDED_T031
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
- `symptomOrBenefit`: production adds short-phone compaction at <=760px width/height, changes mobile title sizing, delays emergency vertical scroll to <=560px, adds overscroll containment, and adds `100svh`; canonical main retains the older <=620px fallback and lacks the dedicated short-phone compaction block.
- `protectedNeighbors`: PS-002 player boundary; PS-011 reader critical path; PS-015 responsive/safe areas
- `reproductionEvidence`: E3 — exact Chrome DevTools Protocol device metrics in GitHub Actions. Run #150 (`32588374314`) proved the harness at 320x568, 390x700, 390x560 and 667x375. Canonical main: 320x568 and 390x560 place essential Home elements outside the initial Home box but keep them reachable by vertical scroll; 390x700 fits; landscape remains reachable by scroll; no horizontal overflow. Deployed production: 320x568 and 390x560 keep essential elements inside the Home box; 390x700 remains fitting; landscape remains reachable by scroll; no horizontal overflow. Run #154 (`32588482004`) tested a bounded candidate consisting only of short-height compaction plus moving last-resort scroll from <=620px to <=560px with overscroll containment. That candidate matched the production critical outcomes for all four viewport classes and printed `M-002 minimal candidate: PASS`.
- `regressionTest`: `tests/home-viewport-characterization.mjs` now proves exact viewport dimensions and the bounded candidate acceptance criteria; `tests/mobile-characterization.test.js` remains the neutral ownership/boundary test. T032 will convert the accepted rules into product CSS and freeze only those behaviors in regression assertions.
- `accessibilityImpact`: positive for initial visibility at 320x568 and 390x560 while preserving reachable scroll in extreme landscape; no horizontal overflow observed.
- `securityImpact`: none identified
- `criticalPathImpact`: public Home CSS, but bounded to short-height media queries and fallback-scroll threshold.
- `decision`: ADJUST
- `decisionEvidence`: T029/T030 exact viewport comparison + T031 bounded-candidate proof. Full deployed `home.css` is NOT accepted wholesale. General mobile title-size changes and `100svh` are not required to obtain the observed benefit and therefore remain excluded. Authorized T032 implementation is limited to: (1) the <=760px width + <=760px height compaction rules that preserve the same content/actions, and (2) changing the last-resort scroll threshold from <=620px to <=560px with `overscroll-behavior-y: contain`.

## M-003 — About stylesheet preload/delivery

- `productionState`: present
- `canonicalMainState`: absent/different
- `ownerFiles`: `blogger/theme.xml`, `tools/about/bootstrap.js`
- `canonicalThemeBlob`: `7dd61dc3ec2d2602e249be776c887c8ac5c578b4`
- `canonicalAboutBootstrapBlob`: `3b753e3980d2e7a02d8f58bd9088ee4e951a5e26`
- `productionPayloadAboutBootstrapBlob`: `003d8bda7959d83a3864fdc992b4f7e9e2635527`
- `symptomOrBenefit`: the exact installed Blogger XML declares `tools/about/about.css` globally in `<head>` with immutable `@aa372e1...` identity. Canonical `main` omits that global stylesheet and `tools/about/bootstrap.js` lazy-loads it on About boot. The deployed payload bootstrap also retains defensive `loadStylesheet()` logic but becomes a no-op when the head-owned `#zen-about-css` already exists.
- `protectedNeighbors`: PS-008 About; PS-011 reader critical path; PS-016 deployment boundary
- `reproductionEvidence`: NOT_RUN — normal and deliberately slow stylesheet-load comparison required
- `regressionTest`: recovered About browser smoke proves canonical lazy delivery renders a valid profile in Chrome; slow-load/first-open ownership evidence pending T033–T034
- `accessibilityImpact`: possible visible-layout stability impact
- `securityImpact`: none identified
- `criticalPathImpact`: HIGHER REVIEW REQUIRED — retaining preload adds About CSS to every reader navigation; rejecting it risks first-open flash if lazy CSS arrives too late
- `decision`: UNRESOLVED
- `decisionEvidence`: static T022 confirms material delivery ownership difference; T033–T034 required

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

## Gate result through T031

- M-001: MATERIAL / UNRESOLVED — WebKit/Safari safe-area evidence still required
- M-002: MATERIAL / ADJUST — bounded implementation authorized for T032
- M-003: MATERIAL / UNRESOLVED
- M-004: MATERIAL / UNRESOLVED
- M-005: EXACT EQUIVALENCE / KEEP AS NO-OP
- A-001: NOT DEPLOYED / UNRESOLVED pending realistic reproduction

Only the explicitly bounded M-002 T032 change is now authorized in product source. M-005 remains untouched; all other product deltas remain blocked.
