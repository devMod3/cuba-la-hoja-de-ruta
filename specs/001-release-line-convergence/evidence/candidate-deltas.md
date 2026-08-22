# Candidate Deltas — Spec 001

**State**: M004_COMPLETE_T039
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
- `reproductionEvidence`: E3 — exact Chrome DevTools Protocol device metrics in GitHub Actions. Run #150 (`32588374314`) proved the harness at 320x568, 390x700, 390x560 and 667x375. Run #154 (`32588482004`) proved the bounded candidate. Run #162 (`32588735098`) validated the actual implementation against immutable canonical `0a45bc...` and deployed production `aa372e1...`.
- `regressionTest`: `tests/mobile-render-contract.test.js` freezes the accepted M-002 CSS contract and explicitly rejects unrelated deployed `100svh` / general mobile sizing. `tests/home-viewport-characterization.mjs` compares immutable canonical, local implementation and immutable deployed production.
- `accessibilityImpact`: positive for initial visibility at 320x568 and 390x560 while preserving reachable scroll in extreme landscape; no horizontal overflow or inaccessible essential content observed.
- `securityImpact`: none identified
- `criticalPathImpact`: public Home CSS, bounded to short-height media queries and fallback-scroll threshold.
- `decision`: ADJUST
- `decisionEvidence`: T029/T030 exact viewport comparison + T031 bounded-candidate proof + T032 post-implementation run #162. Full deployed `home.css` was NOT accepted wholesale. General mobile title-size changes and `100svh` remain excluded.
- `implementationStatus`: COMPLETE_T032 — product CSS implemented and post-implementation browser/CI contract PASS. This is pre-release evidence, not final Blogger candidate QA.

## M-003 — About stylesheet preload/delivery

- `productionState`: global head stylesheet ownership present
- `canonicalMainState`: lazy bootstrap ownership present
- `ownerFiles`: `blogger/theme.xml`, `tools/about/bootstrap.js`
- `canonicalThemeBlob`: `7dd61dc3ec2d2602e249be776c887c8ac5c578b4`
- `canonicalAboutBootstrapBlob`: `3b753e3980d2e7a02d8f58bd9088ee4e951a5e26`
- `productionPayloadAboutBootstrapBlob`: `003d8bda7959d83a3864fdc992b4f7e9e2635527`
- `implementedProductCommit`: `eca58b21d879650f05ffb1cfe0a9f8fd0ac9ee55`
- `harnessRaceFixCommit`: `d419657f304224a4d3f66cbb4b9fcbb768121f6d`
- `symptomOrBenefit`: deployed Blogger owns About CSS globally, avoiding first-open FOUC but penalizing every reader path. Canonical lazy ownership protects the reader critical path but originally mounted About before CSS readiness.
- `protectedNeighbors`: PS-008 About; PS-011 reader critical path; PS-016 deployment boundary
- `reproductionEvidence`: E3. T033 run #178 (`32589253689`, job `97070337147`) proved both endpoint costs. Under 1200ms CSS delay, lazy reader issued 0 About CSS requests while global reader waited approximately 1216ms; canonical lazy About rendered approximately 1202ms before CSS. T035 final run #190 (`32595190420`, job `97084892928`) proved the bounded implementation after correcting a measurement race in the harness: lazy reader still issued 0 About CSS requests; slow lazy About CSS completed at ~1227.2ms and shell/ready followed at ~1227.9ms with `styledAtRender=true`, `FOUC=0`.
- `regressionTest`: `tests/about-delivery-contract.test.js` protects lazy ownership, single stylesheet ownership, wait-before-mount and fallback-on-failure. `tests/about-delivery-characterization.mjs` + `tests/fixtures/about-delivery.html` verify real browser timing. The fixture observes stylesheet `load` at document capture phase so measurement cannot lose the event to listener ordering.
- `accessibilityImpact`: eliminates materially unstyled About on slow delivery while preserving the existing server-visible fallback on CSS failure.
- `securityImpact`: none identified
- `criticalPathImpact`: About CSS remains off unrelated reader paths.
- `decision`: ADJUST
- `decisionEvidence`: neither historical endpoint was accepted wholesale. Keep lazy/on-demand ownership; wait for actual stylesheet readiness before replacing fallback; preserve fallback on failure; prevent duplicate `#zen-about-css`; keep `blogger/theme.xml` free of global About CSS.
- `implementationStatus`: COMPLETE_T035 — E3 PASS in run #190. Final Blogger candidate QA remains NOT_RUN.

## M-004 — About mobile CSS / populated-profile contract

- `productionState`: v0.1.5 behavior present
- `canonicalMainState`: v0.1.4 behavior different
- `ownerFiles`: `tools/about/about.css`
- `canonicalBlob`: `a4b184a23306b386dbbfa4b176d6d2c98e7cbc98`
- `productionBlob`: `f8d2362c6bcb355d12efe7181705140f18b08310`
- `productionCharacterizationFixtureCommit`: `e353b530e01f2cb18e059355f8f9f011a27e1861`
- `viewportFixtureCommit`: `638891f16f53c826e266c61fff6f930147c58657`
- `exactViewportHarnessCommit`: `68563fc10bbbfd96503617c622ea04ae8b783f79`
- `implementedProductCommit`: `ed35ad4173cd615d67e1c2be558e19e69a60baf1`
- `maintainabilityContractCommit`: `57f3f810cd65493be61c621afe69fc49004e4f92`
- `postImplementationHarnessCommit`: `4ec66f6055b23b36292885ca1224787fad904fc8`
- `symptomOrBenefit`: canonical v0.1.4 stacks populated portrait + identity below 500px and owns no explicit player-safe root padding. Deployed v0.1.5 keeps portrait + identity side-by-side on normal phones, stacks only <=340px, adds player-safe spacing, wrapping and overscroll containment, and also carries `100dvh`/`100svh` behavior.
- `protectedNeighbors`: PS-002 player boundary; PS-008 About; PS-015 responsive/safe areas
- `reproductionEvidence`: E3. Baseline run #195 (`32595381075`, job `97085338911`) characterized exact 320x568, 390x700 and 768x1024 viewports with empty and populated `zenSiteProfile.v1`. Both sources rendered title/lead and remained horizontally safe. At populated 390px canonical used one column (`358px`), scrollHeight ~755px and root player-safe padding `0px`; deployed production used two columns (`96px 247px`), scrollHeight ~602px and root player-safe padding `56px`. At 320px both correctly stacked; at 768px both used two columns.
- `regressionTest`: `tests/about-mobile-contract.test.js` freezes the bounded long-term contract: normal phones remain two-column, <=340px stacks, About owns player-safe padding and wrapping/overscroll resilience, `100dvh`/`100svh` are absent, exactly one 500px and one 340px breakpoint remain, and the production-only fixture cannot enter `blogger/theme.xml`. `tests/about-viewport-characterization.mjs` performs exact browser verification.
- `accessibilityImpact`: populated About remains semantically complete, scroll-reachable and horizontally safe while reducing unnecessary vertical expansion on normal phones and reserving player-safe space.
- `securityImpact`: none identified; URL/image safety code was not changed.
- `criticalPathImpact`: About-only CSS; M-003 keeps it lazy/off unrelated reader paths.
- `decision`: ADJUST
- `decisionEvidence`: T036/T037 run #195 showed the useful production behavior, but full v0.1.5 was not justified. Accepted only: normal-phone side-by-side profile, stack <=340px, player-safe root padding through shared token, overflow wrapping, resource wrapping, and overscroll containment. Explicitly rejected from this delta: `100dvh` and `100svh`.
- `implementationStatus`: COMPLETE_T039 — post-implementation run #200 (`32595520760`, job `97085680622`) PASS: 70/70 unit tests, About browser smoke, exact viewport contract, Blogger XML and architecture invariants. Implemented populated 390px = `96px 247px`, player-safe `56px`, no horizontal overflow/inaccessible content; implemented 320px remains stacked. This is pre-release evidence, not final Blogger candidate QA.

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
- `decisionEvidence`: exact blob equality; KEEP means preserve canonical file unchanged / no-op, not copy from historical branch

## A-001 — About transactional render

- `productionState`: absent
- `canonicalMainState`: absent
- `ownerFiles`: `tools/about/AboutFeature.js`, `tools/about/bootstrap.js`
- `canonicalAboutFeatureBlob`: `9ec3aed5c283eefba23b649b6a191925f7459dce`
- `productionAboutFeatureBlob`: `9ec3aed5c283eefba23b649b6a191925f7459dce`
- `symptomOrBenefit`: historical PR #14 proposed off-DOM build plus final commit to preserve last valid render on exception. Current production and canonical main have byte-identical `AboutFeature.js` and do not contain that transactional render fix.
- `protectedNeighbors`: PS-008 About; URL/image safety; reader critical-path boundary
- `reproductionEvidence`: NOT_RUN — realistic valid-profile defect reproduction required
- `regressionTest`: recovered browser smoke proves normal valid-profile render; failing realistic exception/destructive-render case is still required before any product fix
- `accessibilityImpact`: blank/partial About could affect semantic availability if a real defect is demonstrated
- `securityImpact`: URL/image safety must not weaken
- `criticalPathImpact`: About auxiliary path
- `decision`: UNRESOLVED
- `decisionEvidence`: T022 exact AboutFeature blob equivalence confirms A-001 is not deployed; T041–T044 govern reproduction and DEFER/fix decision

## Release/version identity observation

`src/bootstrap/createZenBlog.js` is materially different across historical deployment and canonical main:

- deployed payload blob `f10435d027caeb8e7d42defc268584a666500ba5` carries VERSION/query key `0.4.0`;
- canonical blob `6aec3f2dac83eb7cb238d0c32478d2e142ef34ba` carries VERSION/query key `0.9.1`;
- canonical `package.json.version` is still `0.4.0`.

This is the accepted ADR-002 release-identity debt and must be normalized coherently to `0.9.2` only after functional delta decisions and before PAYLOAD_SHA capture.

## Gate result through T039

- M-001: MATERIAL / UNRESOLVED — WebKit/Safari safe-area evidence still required
- M-002: MATERIAL / ADJUST / COMPLETE_T032 — E3 PASS
- M-003: MATERIAL / ADJUST / COMPLETE_T035 — E3 PASS
- M-004: MATERIAL / ADJUST / COMPLETE_T039 — E3 PASS
- M-005: EXACT EQUIVALENCE / KEEP AS NO-OP
- A-001: NOT DEPLOYED / UNRESOLVED pending realistic reproduction

M-002, M-003 and M-004 are bounded implemented deltas with regression contracts. No historical product file was imported wholesale. M-001 and A-001 remain blocked by their independent evidence gates. T040 protected-neighbor verification is required after the accepted M changes before About reliability/A-001 work proceeds.
