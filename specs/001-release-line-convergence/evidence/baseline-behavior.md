# Baseline Behavior — Spec 001

**Purpose**: T016–T017 baseline evidence before any candidate product delta is accepted.

## Source identity

- canonical product baseline: `main` @ `0a45bc523f0129d83307f1c6f3a972056b219ae0`
- implementation harness head under test: `5a09acb0191ec14385cc0423928c33c0f18a5d31`
- ephemeral CI-only head: `61cf1fe5b0335f76cade6826026dfb11b9686195`
- GitHub Actions run: `Validate ZenBlog #132` / run id `32587219730`
- job id: `97065328526`
- result: `SUCCESS`

The CI-only head adds test/forensic/SDD material and a temporary workflow invocation. It does not modify the canonical About product implementation under test.

## Environment

- runner: `ubuntu-24.04`
- runner image: `20260816.277.1`
- Node: `v20.20.2`
- npm: `10.8.2`
- browser selected by smoke harness: `google-chrome`
- browser version: `Google Chrome 151.0.7922.137`

## Automated results

- `npm run check`: PASS
- `npm test`: PASS — 55/55 tests
- `npm run test:browser`: PASS
- Blogger XML parse: PASS
- production architecture invariants: PASS

Browser semantic assertions observed PASS for a known-valid `zenSiteProfile.v1` fixture:

- `zenabout:ready` reached;
- no `zenabout:error` marker;
- `.zen-about-shell` rendered;
- `.zen-about-profile-top` rendered;
- “Redes sociales” rendered;
- “Recursos relacionados” rendered;
- fallback marker removed.

## About baseline characterization

### Valid profile

Observed in real headless Chrome through the recovered dependency-free smoke harness: the current canonical About renders the populated profile and replaces the fallback successfully.

### Empty profile

Source characterization of canonical `tools/about/AboutFeature.js` v0.1.4: when profile/social/resources are empty, `renderFallback()` replaces the About root with `.zen-about-shell` containing the editorial fallback identity/description.

This empty-profile behavior was not separately executed as a browser case in run #132; it remains a characterization datum, not an additional browser PASS claim.

## Interpretation

The historical About browser harness is valid against the unchanged canonical product baseline. Therefore the harness may be promoted into the Spec 001 implementation workflow. This result does **not** justify A-001 transactional-render changes; realistic failure reproduction remains required before any such fix.
