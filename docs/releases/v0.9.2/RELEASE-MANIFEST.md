# ZenBlog v0.9.2 — Release Manifest

**Status**: `CANDIDATE-READY-FOR-BLOGGER-INSTALL`

## Baseline context

- Canonical baseline `main`: `0a45bc523f0129d83307f1c6f3a972056b219ae0`
- Active Blogger payload pin at implementation start: `aa372e1cc7982d1f8335d0d21760869c396b32c3`
- Active Blogger release-shell provenance at implementation start: `ad43ac63c12a666534e03cf9d5436184b985d1d1`
- Active/rollback Blogger XML SHA-256: `42b439df1c96915a2568fce9b0a243f26196281d2c9f8afca0bb7f786df114d8`

These baseline identities are rollback/starting evidence. They are not the v0.9.2 candidate identities.

## Identity

- Release label / ADR-002 application release: `ZenBlog v0.9.2`
- Spec: `specs/001-release-line-convergence/`
- Production PR: `#22` — `MERGED`
- Main promotion merge SHA: `112d23e089bcf5447fa93f0e7f961b00736e514d`
- Payload SHA: `cefd0adc07e5405ddbeb51e0c53082c8f089c5b0`
- Release-shell SHA: `dba55ba2ac845c02071fe5236322cab97254c17a`
- Asset delivery identity: `https://cdn.jsdelivr.net/gh/devMod3/cuba-la-hoja-de-ruta@cefd0adc07e5405ddbeb51e0c53082c8f089c5b0/...`
- Application/cache release: `0.9.2`
- Blogger candidate XML SHA-256: `88dee9bc301058a6762aec1f726943b7e109795c1dab3f26bd5e1d75ac04dadb`
- Blogger candidate XML bytes: `8380`
- Blogger installation date/time: `NOT_INSTALLED`

## Verification

- Payload CI: run #221 (`32597502257`) — `SUCCESS`
- Release-shell CI: run #222 (`32597556213`) — `SUCCESS`
- Final promotion-head CI: run #223 (`32597668897`) — `SUCCESS`
- Automated test result: `PASS`
- Browser smoke result: `PASS`
- T040 protected-neighbor gate: `PASS` in release test suite
- About local/public cross-origin contract: `PASS`
- `main` promotion: `VERIFIED` at `112d23e089bcf5447fa93f0e7f961b00736e514d`
- GitHub Pages post-merge deployment result: `UNVERIFIED FROM CURRENT TOOLING` — do not conflate main promotion with Pages deployment
- Real Blogger QA result: `NOT_RUN`
- Safari/iPhone safe-area acceptance: `NOT_RUN_ON_CANDIDATE`
- QA evidence: `specs/001-release-line-convergence/evidence/qa-run.md`
- Product Owner acceptance: `NOT_REQUESTED_AFTER_REAL_QA`

## Candidate decisions relevant to promotion

- M-001: preserve the safe-area accounting already active in Blogger production; automated Chrome tests freeze the token contract, while real Safari/iPhone overlap/lost-space acceptance remains part of post-install Blogger QA. Do not describe this as Safari-proven before that QA.
- M-002: `ADJUST / IMPLEMENTED / E3 PASS`.
- M-003: `ADJUST / IMPLEMENTED / E3 PASS`.
- M-004: `ADJUST / IMPLEMENTED / E3 PASS`.
- M-005: `KEEP / exact equivalence`.
- A-001: `DEFER` for Spec 001 because valid populated/empty/public About paths pass and no realistic transactional-render defect has been reproduced; no speculative PR #14 refactor is imported.

## Public About publication boundary

- Mutable authoring draft: `SiteProfileStore` / local Admin storage.
- Public runtime snapshot: `config/site-profile.public.json` through `PublishedSiteProfileStore`.
- Public Blogger must not treat browser-local Admin storage as authoritative shared content.
- The checked-in candidate snapshot contains only profile values actually committed to the repository; unexported local Admin values are not implicitly available to production.

## Rollback

- Rollback XML SHA-256: `42b439df1c96915a2568fce9b0a243f26196281d2c9f8afca0bb7f786df114d8`
- Rollback source/reference: `docs/forensic/artifacts/blogger-theme-current-2026-08-22.xml`
- Captured active asset pin: `aa372e1cc7982d1f8335d0d21760869c396b32c3`
- Captured release-shell provenance: `ad43ac63c12a666534e03cf9d5436184b985d1d1`

## Deployment-state rule

`docs/DEPLOYMENT-STATE-RULE.md` is mandatory for code/runtime changes. `LOCAL / PRUEBAS`, `CI`, `GITHUB PAGES` and `BLOGGER REAL` are separate states and must never be conflated.

Current state:

```text
ENTORNO: BLOGGER REAL / PRODUCCIÓN
MAIN: PROMOTED / VERIFIED
GITHUB PAGES: POST-MERGE RESULT UNVERIFIED FROM CURRENT TOOLING
BLOGGER REAL: NOT INSTALLED
DESPLIEGUE EN ESTA INTERVENCIÓN: BLOCKED ONLY AT BLOGGER INSTALLATION BOUNDARY
```

## Known debt

- Search Core v1 source-provenance recovery remains a dedicated future Spec.
- Metadata source-of-truth/reproducibility review remains beyond Spec 001.
- Automated authenticated publication from Admin to the public profile snapshot is not implemented; current publication is explicit export/change/release.
- Admin auth, broader shared persistence, performance baseline and hosting/domain evolution remain outside Spec 001.

## Historical PR dispositions

- PR #13: `EXPERIMENT/REFERENCE — no wholesale merge`.
- PR #14: `EXPERIMENT/REFERENCE — no wholesale merge; A-001 deferred without importing it`.
- PR #15/#16/#19/#20/#21: historical/CI-only lanes; not production merge sources.
- PR #18: `CLOSED WITHOUT MERGE / SUPERSEDED BY PR #22`.
- PR #22: `MERGED TO MAIN / PRODUCTION PROMOTION SOURCE`.

## Freeze rule

This manifest MUST NOT advance to `FROZEN` unless all of the following are attributable to the exact candidate:

```text
CI = PASS
AND required browser smoke = PASS
AND Blogger QA = PASS
AND Product Owner acceptance = PASS
AND rollback artifact is known
AND no unresolved P0/P1 release blocker remains
```

`CANDIDATE-READY-FOR-BLOGGER-INSTALL` is not equivalent to `DEPLOYED`, `QA PASS` or `FROZEN`.
