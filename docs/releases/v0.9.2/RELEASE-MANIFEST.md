# ZenBlog v0.9.2 — Release Manifest

**Status**: `PUBLIC-ABOUT-SAVE-HOTFIX-READY-FOR-BLOGGER-INSTALL`

## Baseline context

- Canonical baseline `main`: `0a45bc523f0129d83307f1c6f3a972056b219ae0`
- Active Blogger payload pin at implementation start: `aa372e1cc7982d1f8335d0d21760869c396b32c3`
- Original rollback Blogger XML SHA-256: `42b439df1c96915a2568fce9b0a243f26196281d2c9f8afca0bb7f786df114d8`

## Installed Admin-routing hotfix

- PR `#23`: `MERGED`
- Main promotion merge SHA: `9336ad83a9da2ddc78b7c34c43ac5c5dbbc0b5b0`
- Payload SHA: `405de645153930d82ea82d488bd7e68869560aa5`
- Release-shell SHA: `d72ec668bbc8363d5b56a08306a7ccbbb46bcaf5`
- Blogger XML SHA-256: `5ab097112b3e5addce6937dadad4fb33be5e4a5e79d2cc8b29f0adfa233cf416`
- Installation: `2026-08-22 17:12 America/New_York — USER_CONFIRMED_INSTALLED_HOTFIX`
- Real QA: `/admin = PASS`; About local save = `PASS`.

Real QA then exposed a release-blocking parity gap: `Guardar Acerca de` persisted browser-local state but did not publish the same profile to the public About surface.

## Current public-save hotfix identity

- Release label: `ZenBlog v0.9.2`
- Hotfix PR: `#24` — `MERGED`
- Main promotion merge SHA: `797a787a985f72fdef7ef9af90ed1ffea19654f9`
- Payload SHA: `a88a5f4bbb285c3c6b36a90395c90c85200859f5`
- Release-shell SHA: `6f86487b9fd4617804ec9f14ea002266db1b679a`
- Asset identity: `https://cdn.jsdelivr.net/gh/devMod3/cuba-la-hoja-de-ruta@a88a5f4bbb285c3c6b36a90395c90c85200859f5/...`
- Application/cache release: `0.9.2`
- Blogger installation: `NOT_INSTALLED`

## Required LOCAL -> PUBLIC parity

`docs/DEPLOYMENT-STATE-RULE.md` now requires that functionality which passes locally and is deployed to Blogger Real produce the same functional result publicly. Persistence scope is part of the result: a localStorage-only save cannot satisfy a public/shared-save contract.

For About:

```text
LOCAL / PRUEBAS
Guardar -> localStorage

BLOGGER REAL
Guardar -> localStorage -> authenticated publication -> config/site-profile.public.json -> public About
```

If the public publication fails, Admin must report `Guardado localmente, pero NO publicado`; the release case is not PASS.

## Publication implementation

- Admin production host detection is limited to `cubalahojaderuta.blogspot.com`.
- `Guardar Acerca de` first preserves the existing local draft behavior.
- On Blogger Real it then requests operation-local GitHub authorization and updates only `config/site-profile.public.json` on `main` through the GitHub Contents API.
- The public About reader on Blogger reads the mutable GitHub Pages snapshot `https://devmod3.github.io/cuba-la-hoja-de-ruta/config/site-profile.public.json` with no credentials.
- Code/CSS/assets remain pinned to the immutable payload SHA; only the editorial profile snapshot is mutable.
- Publication is not reported as success until the updated `updatedAt` can be read back from the public snapshot URL.

## Security boundary for this hotfix

- No static Admin password is embedded in public JavaScript.
- No GitHub token is embedded in code.
- No publication token is written to localStorage/sessionStorage/global application state.
- The publication prompt requires a fine-grained GitHub token for the owner account and repository with `Contents: write`.
- A stronger passkey/OAuth/server-side Admin gateway remains a future hardening step; it is not required to validate the functional parity hotfix.

## Verification

Public-save payload CI run #235 (`32599648151`) — `SUCCESS`:
- JavaScript checks: `PASS`
- Unit tests: `84/84 PASS`
- About same-origin browser smoke: `PASS`
- About cross-origin public-profile browser contract: `PASS`
- Admin `/admin` route browser contract: `PASS`
- Blogger XML parsing: `PASS`
- Architecture/player invariants: `PASS`
- publishing contract validates owner, file update, public read-back and credential non-persistence: `PASS`

Public-save release-shell CI run #236 (`32599728267`) — `SUCCESS`:
- JavaScript checks: `PASS`
- Unit tests: `PASS`
- browser contracts: `PASS`
- Blogger XML parsing: `PASS`
- architecture invariants: `PASS`

Real Blogger public-save QA remains `NOT_RUN` until the shell `6f86487b9fd4617804ec9f14ea002266db1b679a` XML is installed.

## Rollback

Immediate rollback is the currently installed Admin-routing hotfix:
- Payload: `405de645153930d82ea82d488bd7e68869560aa5`
- Shell: `d72ec668bbc8363d5b56a08306a7ccbbb46bcaf5`
- XML SHA-256: `5ab097112b3e5addce6937dadad4fb33be5e4a5e79d2cc8b29f0adfa233cf416`

Original pre-v0.9.2 rollback remains:
- XML SHA-256: `42b439df1c96915a2568fce9b0a243f26196281d2c9f8afca0bb7f786df114d8`
- Source: `docs/forensic/artifacts/blogger-theme-current-2026-08-22.xml`

## Deployment state

```text
ENTORNO: BLOGGER REAL / PRODUCCIÓN
CURRENT BLOGGER: ADMIN-ROUTING HOTFIX INSTALLED / QA IN PROGRESS
PUBLIC-SAVE HOTFIX CODE: MERGED TO MAIN
PUBLIC-SAVE HOTFIX CI: PASS
PUBLIC-SAVE XML: READY FOR INSTALL
PUBLIC-SAVE BLOGGER REAL: NOT INSTALLED
PARIDAD LOCAL -> PÚBLICO: FAIL ON CURRENT INSTALLED SHELL / PENDING QA ON NEW SHELL
FREEZE: NO
```

## Historical PR dispositions

- PR #13: experiment/reference — no wholesale merge.
- PR #14: experiment/reference — no wholesale merge.
- PR #18: closed without merge / superseded.
- PR #22: merged / initial v0.9.2 production promotion.
- PR #23: merged / Admin routing hotfix.
- PR #24: merged / public About save parity hotfix.

## Freeze rule

This manifest MUST NOT advance to `FROZEN` until real Blogger QA proves that the installed public-save hotfix preserves `/admin`, successfully publishes an edited About profile, and that the changed profile is observable from a separate public-reading context.
