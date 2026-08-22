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

User evidence at `2026-08-22 18:05 America/New_York` confirms the public-save hotfix is active in Blogger Real and works from both the normal browsing context and a private/incognito context. The private context requests publication authorization again, consistent with operation-local token handling and no cross-context credential persistence.

| Case | Expected | Result | Evidence |
|---|---|---|---|
| QA-PUBSAVE-001 `/admin` regression | Admin still opens normally | PASS | user is editing/saving through the deployed Admin after hotfix |
| QA-PUBSAVE-002 local save | local draft persists | PASS | previously confirmed and unchanged by the public-save flow |
| QA-PUBSAVE-003 authorization | publication authorization UI appears for production Save | PASS | user reports token is requested when applying changes |
| QA-PUBSAVE-004 public write | Save updates shared public profile | PASS | user confirms changes apply publicly |
| QA-PUBSAVE-005 public read-back | published result is observable after Save | PASS | public behavior confirmed after publication |
| QA-PUBSAVE-006 separate public context | private/incognito context observes the working public result | PASS | `USER_REPORTED_2026-08-22_18:05_ET: en incognito funciona también` |
| QA-PUBSAVE-007 credential non-persistence across contexts | incognito must not inherit the normal-context token | PASS | incognito requests token again before applying changes |
| QA-PUBSAVE-008 failure semantics | cancelled/failed auth leaves local save but reports NOT published | NOT_RUN | — |
| QA-PUBSAVE-009 player/public neighbors | public navigation and player remain unaffected | NOT_RUN | — |

## Parity result

```text
LOCAL SAVE: PASS
PUBLIC WRITE: PASS
SEPARATE PUBLIC/INCOGNITO CONTEXT: PASS
CREDENTIAL CROSS-CONTEXT PERSISTENCE: NO
PARIDAD LOCAL -> PÚBLICO: PASS
```

## Release state

```text
ENTORNO: BLOGGER REAL / PRODUCCIÓN
PUBLIC-SAVE HOTFIX: ACTIVE IN BLOGGER REAL — USER BEHAVIORAL EVIDENCE
CI: PASS
CORE PUBLIC-SAVE QA: PASS
PARIDAD LOCAL -> PÚBLICO: PASS
REMAINING REGRESSION QA: IN PROGRESS
FREEZE: NO
```

Do not mark the complete release `FROZEN` until the remaining required regression/failure cases are either tested or explicitly accepted by the Product Owner.
