# Candidate Deltas — Spec 001

**State**: INITIAL_LEDGER
**Rule**: no delta may enter product implementation while `decision=UNRESOLVED`.

## M-001 — Safe-area accounting

- `productionState`: present
- `canonicalMainState`: different
- `symptomOrBenefit`: production includes safe-area top/bottom accounting and calculated mobile header/player-safe spacing; canonical main uses fixed mobile values.
- `ownerFiles`: `src/ui/styles/tokens.css`
- `protectedNeighbors`: PS-001 Blogger anatomy; PS-002 Zen Radio Player; PS-011 reader critical path; PS-015 responsive/safe areas
- `reproductionEvidence`: NOT_RUN — WebKit/Safari safe-area, non-notch phone and landscape required
- `regressionTest`: pending Phase 3/5 characterization
- `accessibilityImpact`: potential reflow/touch-target/visible-content impact
- `securityImpact`: none identified
- `criticalPathImpact`: CSS layout tokens on public reader path
- `decision`: UNRESOLVED
- `decisionEvidence`: pending T025–T027

## M-002 — Short-height Home density

- `productionState`: present
- `canonicalMainState`: different
- `symptomOrBenefit`: production includes short-phone compaction, extreme-height scroll fallback, overscroll containment, `100svh`, and mobile typography adjustments.
- `ownerFiles`: `src/features/home/home.css`
- `protectedNeighbors`: PS-002 player boundary; PS-011 reader critical path; PS-015 responsive/safe areas
- `reproductionEvidence`: NOT_RUN — ~320/~390/short-height/landscape required
- `regressionTest`: pending Phase 3/5 characterization
- `accessibilityImpact`: essential-action visibility, reflow and scroll behavior
- `securityImpact`: none identified
- `criticalPathImpact`: public Home CSS
- `decision`: UNRESOLVED
- `decisionEvidence`: pending T029–T031

## M-003 — About stylesheet preload/delivery

- `productionState`: present
- `canonicalMainState`: absent
- `symptomOrBenefit`: production preloads `about.css` globally; canonical main lazy-loads About CSS. Tradeoff is first-open flash risk versus reader-global request/cost.
- `ownerFiles`: `blogger/theme.xml`, `tools/about/bootstrap.js`
- `protectedNeighbors`: PS-008 About; PS-011 reader critical path; PS-016 deployment boundary
- `reproductionEvidence`: NOT_RUN — normal and deliberately slow stylesheet-load comparison required
- `regressionTest`: pending duplicate-ownership/first-open coverage
- `accessibilityImpact`: possible visible-layout stability impact
- `securityImpact`: none identified
- `criticalPathImpact`: HIGHER REVIEW REQUIRED — global reader request if preload retained
- `decision`: UNRESOLVED
- `decisionEvidence`: pending T033–T034

## M-004 — About mobile CSS v0.1.5 behavior

- `productionState`: present
- `canonicalMainState`: different
- `symptomOrBenefit`: production adds overscroll containment, player-safe padding, portrait/identity side-by-side behavior, narrow-only stack, and `100svh`; canonical main uses About CSS v0.1.4.
- `ownerFiles`: `tools/about/about.css`
- `protectedNeighbors`: PS-002 player boundary; PS-008 About; PS-015 responsive/safe areas
- `reproductionEvidence`: NOT_RUN — ~320/~390/~768 with empty/populated profile required
- `regressionTest`: pending Phase 5 characterization
- `accessibilityImpact`: reflow, overflow and readable identity layout
- `securityImpact`: none identified
- `criticalPathImpact`: About-only stylesheet unless M-003 changes ownership
- `decision`: UNRESOLVED
- `decisionEvidence`: pending T036–T038

## M-005 — Responsive foundation equivalence

- `productionState`: present
- `canonicalMainState`: present
- `symptomOrBenefit`: forensic capture reports production and canonical main `src/ui/styles/responsive.css` as the same Git blob `839ae297acfe09eb2804a1e852c6c2e6797b3640`.
- `ownerFiles`: `src/ui/styles/responsive.css`
- `protectedNeighbors`: PS-011 reader critical path; PS-015 responsive/safe areas
- `reproductionEvidence`: captured static equivalence; live re-verification pending T023
- `regressionTest`: no product change expected if equivalence remains true
- `accessibilityImpact`: protected responsive baseline
- `securityImpact`: none identified
- `criticalPathImpact`: public CSS; expected no delta
- `decision`: UNRESOLVED
- `decisionEvidence`: pending T023 live equivalence verification

## A-001 — About transactional render

- `productionState`: absent
- `canonicalMainState`: absent
- `symptomOrBenefit`: historical PR #14 proposed off-DOM build plus final commit to preserve last valid render on exception; current production and main share the same AboutFeature blob and do not contain that fix.
- `ownerFiles`: `tools/about/AboutFeature.js`, `tools/about/bootstrap.js`
- `protectedNeighbors`: PS-008 About; URL/image safety; reader critical-path boundary
- `reproductionEvidence`: NOT_RUN — realistic valid-profile defect reproduction required
- `regressionTest`: failing browser/regression case required before any product fix
- `accessibilityImpact`: blank/partial About could affect semantic availability
- `securityImpact`: URL/image safety must not weaken
- `criticalPathImpact`: About auxiliary path
- `decision`: UNRESOLVED
- `decisionEvidence`: pending T041–T044; DEFER if no realistic defect reproduces

## Initial gate result

No KEEP/ADJUST authorization exists yet. Product code remains unchanged.
