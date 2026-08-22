# ZenBlog v0.9.2 — Release Manifest

**Status**: `ADMIN-HOTFIX-READY-FOR-BLOGGER-INSTALL`

## Baseline context

- Canonical baseline `main`: `0a45bc523f0129d83307f1c6f3a972056b219ae0`
- Active Blogger payload pin at implementation start: `aa372e1cc7982d1f8335d0d21760869c396b32c3`
- Active Blogger release-shell provenance at implementation start: `ad43ac63c12a666534e03cf9d5436184b985d1d1`
- Original rollback Blogger XML SHA-256: `42b439df1c96915a2568fce9b0a243f26196281d2c9f8afca0bb7f786df114d8`

## Previously installed v0.9.2 candidate

The owner reported successful installation in Blogger Real on 2026-08-22 at approximately 17:02 America/New_York. This records installation evidence only; full real QA was not yet completed before the Admin routing hotfix was requested.

- Payload SHA: `cefd0adc07e5405ddbeb51e0c53082c8f089c5b0`
- Release-shell SHA: `dba55ba2ac845c02071fe5236322cab97254c17a`
- Blogger XML SHA-256: `88dee9bc301058a6762aec1f726943b7e109795c1dab3f26bd5e1d75ac04dadb`
- Blogger XML bytes: `8380`
- Installation evidence: `USER_CONFIRMED_INSTALLED`
- Real QA status before hotfix: `INCOMPLETE`

This installed candidate is the immediate rollback point for the Admin routing hotfix.

## Current Admin hotfix identity

- Release label: `ZenBlog v0.9.2`
- Hotfix PR: `#23` — `MERGED`
- Main promotion merge SHA: `9336ad83a9da2ddc78b7c34c43ac5c5dbbc0b5b0`
- Payload SHA: `405de645153930d82ea82d488bd7e68869560aa5`
- Release-shell SHA: `d72ec668bbc8363d5b56a08306a7ccbbb46bcaf5`
- Asset delivery identity: `https://cdn.jsdelivr.net/gh/devMod3/cuba-la-hoja-de-ruta@405de645153930d82ea82d488bd7e68869560aa5/...`
- Application/cache release: `0.9.2`
- Blogger hotfix XML SHA-256: `5ab097112b3e5addce6937dadad4fb33be5e4a5e79d2cc8b29f0adfa233cf416`
- Blogger hotfix XML bytes: `8380`
- Blogger hotfix installation date/time: `NOT_INSTALLED`

## Admin routing contract

The hotfix makes the runtime Admin route suffix-based instead of exact-path-only:

```text
/admin                       -> Admin
/p/admin.html                -> Admin
/cualquier/ruta/admin        -> Admin
#admin                       -> Admin
#cualquier-ruta/admin        -> Admin
```

After Admin boot, non-canonical variants are normalized with `history.replaceState` to `/admin` without a reload.

This routing change does not alter the persistence model: Admin remains browser-local authoring unless an explicit publication workflow writes a public artifact. Public About continues to use the published snapshot rather than per-browser localStorage.

## Verification

- Hotfix payload CI: run #228 (`32598626964`) — `SUCCESS`
- Hotfix release-shell CI: run #229 (`32598683988`) — `SUCCESS`
- JavaScript checks: `PASS`
- Unit tests: `PASS`
- About same-origin browser smoke: `PASS`
- About cross-origin public-profile browser contract: `PASS`
- Admin deep-path/hash `/admin` browser contract: `PASS`
- Blogger XML parsing: `PASS`
- Architecture/player invariants: `PASS`
- Real Blogger Admin hotfix QA: `NOT_RUN — requires installation of hotfix XML`

## Public About publication boundary

- Mutable authoring draft: `SiteProfileStore` / browser-local Admin storage.
- Public runtime snapshot: `config/site-profile.public.json` through `PublishedSiteProfileStore`.
- Public Blogger must not treat browser-local Admin storage as authoritative shared content.
- The checked-in snapshot contains only profile values committed to the repository; unexported local Admin values are not implicitly public.

## Rollback

### Immediate hotfix rollback

- Previously installed v0.9.2 shell: `dba55ba2ac845c02071fe5236322cab97254c17a`
- Previously installed XML SHA-256: `88dee9bc301058a6762aec1f726943b7e109795c1dab3f26bd5e1d75ac04dadb`

### Original pre-v0.9.2 rollback

- Rollback XML SHA-256: `42b439df1c96915a2568fce9b0a243f26196281d2c9f8afca0bb7f786df114d8`
- Rollback source/reference: `docs/forensic/artifacts/blogger-theme-current-2026-08-22.xml`
- Captured active asset pin: `aa372e1cc7982d1f8335d0d21760869c396b32c3`
- Captured release-shell provenance: `ad43ac63c12a666534e03cf9d5436184b985d1d1`

## Deployment-state rule

`docs/DEPLOYMENT-STATE-RULE.md` is mandatory for code/runtime changes. `LOCAL / PRUEBAS`, `CI`, `GITHUB PAGES` and `BLOGGER REAL` are separate states and must never be conflated.

Current state:

```text
ENTORNO: BLOGGER REAL / PRODUCCIÓN
PREVIOUS v0.9.2 CANDIDATE: USER_CONFIRMED_INSTALLED / QA INCOMPLETE
ADMIN HOTFIX CODE: MERGED TO MAIN
ADMIN HOTFIX CI: PASS
ADMIN HOTFIX XML: READY / HASHED
ADMIN HOTFIX BLOGGER REAL: NOT INSTALLED
```

## Known debt

- Automated authenticated publication from Admin to the public profile snapshot is not implemented; current publication is explicit export/change/release.
- Admin has no server-side authentication boundary. The current Admin tools operate on browser-local state; any future shared/server write capability must add authentication before exposure.
- Search Core v1 source-provenance recovery remains a dedicated future Spec.
- Metadata source-of-truth/reproducibility review remains beyond Spec 001.
- Performance baseline and hosting/domain evolution remain outside Spec 001.

## Historical PR dispositions

- PR #13: `EXPERIMENT/REFERENCE — no wholesale merge`.
- PR #14: `EXPERIMENT/REFERENCE — no wholesale merge; A-001 deferred without importing it`.
- PR #18: `CLOSED WITHOUT MERGE / SUPERSEDED BY PR #22`.
- PR #22: `MERGED / initial v0.9.2 production promotion`.
- PR #23: `MERGED / Admin routing hotfix promotion`.

## Freeze rule

This manifest MUST NOT advance to `FROZEN` unless all required real Blogger QA is attributable to the exact installed candidate and Product Owner acceptance is recorded.
