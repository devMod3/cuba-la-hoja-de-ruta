# Blogger Real QA — v0.9.2 — 2026-08-22

## Installed Admin-routing hotfix identity

- Environment: `BLOGGER REAL / PRODUCCIÓN`
- User-confirmed install: `2026-08-22 17:12 America/New_York`
- Payload SHA: `405de645153930d82ea82d488bd7e68869560aa5`
- Release-shell SHA: `d72ec668bbc8363d5b56a08306a7ccbbb46bcaf5`
- Blogger XML SHA-256: `5ab097112b3e5addce6937dadad4fb33be5e4a5e79d2cc8b29f0adfa233cf416`
- PR: `#23` merged to `main`

## Original real Blogger observation

| Case | Result | Evidence |
|---|---|---|
| `/admin` opens | PASS | `USER_REPORTED_2026-08-22_17:19_ET` |
| About Manager mounts | PASS | user reached the About editing surface |
| `Guardar Acerca de` persists browser-local draft | PASS | user explicitly confirmed local save works |
| same Save publishes the changed profile to public About | FAIL on previous shell | public About remained on the published snapshot |

That failure triggered the mandatory LOCAL -> PUBLIC parity hotfix.

## Mandatory parity rule

`docs/DEPLOYMENT-STATE-RULE.md` requires that functionality passing locally and deployed to Blogger Real produce the same functional result publicly. Persistence scope is part of the functional result.

For this surface:

```text
LOCAL / PRUEBAS
Guardar -> localStorage

BLOGGER REAL
Guardar -> localStorage -> authenticated publication -> public snapshot -> public About
```

A production Save that stops at localStorage is `FAIL` for the public-save contract and blocks `FROZEN`.

## Public-save parity hotfix

- PR `#24`: `MERGED`
- Main merge SHA: `797a787a985f72fdef7ef9af90ed1ffea19654f9`
- Payload SHA: `a88a5f4bbb285c3c6b36a90395c90c85200859f5`
- Release-shell SHA: `6f86487b9fd4617804ec9f14ea002266db1b679a`
- Payload CI run #235: `SUCCESS`
- Release-shell CI run #236: `SUCCESS`
- Unit tests in payload gate: `84/84 PASS`
- Existing browser contracts: `PASS`
- Blogger XML parse: `PASS`
- Architecture/player invariants: `PASS`

### Publication contract

1. Save local draft.
2. On `cubalahojaderuta.blogspot.com`, request operation-local GitHub authorization.
3. Verify GitHub owner identity.
4. Update `config/site-profile.public.json` on `main` through the GitHub Contents API.
5. Poll the public GitHub Pages snapshot until its `updatedAt` matches the saved profile.
6. Only then report `Acerca de guardado y publicado`.
7. If publication fails after local save, report `Guardado localmente, pero NO publicado`.

The credential is not embedded or persisted by the application. Stronger Admin authentication remains a later hardening step.

## Real Blogger public-save QA

At `2026-08-22 18:05 America/New_York` the user reported that the public-save authorization form appears in both a normal browsing context and a private/incognito context.

At `2026-08-22 18:06 America/New_York` the user clarified that **no token was entered in either context**. Therefore no authenticated GitHub write can be inferred from those observations. Any earlier classification of public write/read-back as PASS from that report is withdrawn.

The implementation saves the local draft before requesting the token, so seeing locally saved values after opening the authorization prompt is not evidence of public publication.

| Case | Expected | Result | Evidence |
|---|---|---|---|
| QA-PUBSAVE-001 `/admin` regression | Admin still opens normally | PASS | deployed Admin is reachable and About Save flow is being exercised |
| QA-PUBSAVE-002 local save | local draft persists | PASS | previously confirmed; implementation saves local draft before authorization |
| QA-PUBSAVE-003 authorization UI | production Save requests publication authorization | PASS | token form appears in normal and incognito contexts |
| QA-PUBSAVE-004 authenticated public write | valid token updates public snapshot | NOT_RUN | user did not enter token |
| QA-PUBSAVE-005 public read-back | Admin reports success only after public snapshot matches | NOT_RUN | authenticated publication was not executed |
| QA-PUBSAVE-006 separate public context | incognito/public reader sees newly published data | NOT_RUN | no authenticated publication occurred |
| QA-PUBSAVE-007 credential non-persistence | a token used in one context is not inherited by another | NOT_RUN | no token was entered in either context |
| QA-PUBSAVE-008 failure/cancel semantics | cancelled/failed auth leaves local save but reports NOT published | PARTIAL | local save-before-auth is exercised; explicit cancel/error status still not recorded |
| QA-PUBSAVE-009 player/public neighbors | public navigation and player remain unaffected | NOT_RUN | — |

## Current parity result

```text
LOCAL SAVE: PASS
AUTHORIZATION UI: PASS
AUTHENTICATED PUBLIC WRITE: NOT RUN
SEPARATE PUBLIC READ-BACK: NOT RUN
PARIDAD LOCAL -> PÚBLICO: PENDING
```

## Release state

```text
ENTORNO: BLOGGER REAL / PRODUCCIÓN
PUBLIC-SAVE HOTFIX: ACTIVE IN BLOGGER REAL — AUTH UI OBSERVED
CI: PASS
PUBLIC-SAVE QA: IN PROGRESS
PARIDAD LOCAL -> PÚBLICO: PENDING AUTHENTICATED WRITE + SEPARATE READ-BACK
FREEZE: NO
```

Do not mark the complete release `FROZEN` until authenticated publication and separate-context public read-back are proven and the remaining required regression/failure cases are either tested or explicitly accepted by the Product Owner.
