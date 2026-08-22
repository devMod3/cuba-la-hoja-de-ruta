# Blogger Real QA — v0.9.2 Admin hotfix — 2026-08-22

## Deployment identity

- Environment: `BLOGGER REAL / PRODUCCIÓN`
- User-confirmed hotfix install: `2026-08-22 17:12 America/New_York`
- Payload SHA: `405de645153930d82ea82d488bd7e68869560aa5`
- Release-shell SHA: `d72ec668bbc8363d5b56a08306a7ccbbb46bcaf5`
- Blogger XML SHA-256: `5ab097112b3e5addce6937dadad4fb33be5e4a5e79d2cc8b29f0adfa233cf416`
- PR: `#23` merged to `main`
- Payload CI: run #228 `SUCCESS`
- Release-shell CI: run #229 `SUCCESS`

## Evidence classification

- Installation: `PASS — USER_CONFIRMED_INSTALLED_HOTFIX`
- Automated pre-install routing/browser contract: `PASS (E3)`
- Real Blogger behavioral QA: `IN_PROGRESS`
- Assistant-side direct HTTP observation: `BLOCKED` because the execution environment cannot currently resolve `cubalahojaderuta.blogspot.com`; this is an environment limitation and is not a product FAIL.

## Hotfix-critical real cases

| Case | Expected | Result | Evidence |
|---|---|---|---|
| QA-HF-001 `/admin` | Admin shell opens and URL remains/canonicalizes to `/admin` | NOT_RUN | — |
| QA-HF-002 deep path + `/admin` | Admin shell opens and canonicalizes to `/admin` without reload loop | NOT_RUN | — |
| QA-HF-003 Admin Metadata tab | Metadata UI mounts and remains usable | NOT_RUN | — |
| QA-HF-004 Admin Search tab | Search Lab mounts and remains usable | NOT_RUN | — |
| QA-HF-005 Admin About tab | About Manager mounts; existing browser-local profile is readable/editable | NOT_RUN | — |
| QA-HF-006 Admin Inspector tab | Inspector tab mounts without affecting public route | NOT_RUN | — |
| QA-HF-007 Leave Admin | Site link returns to public blog without stale Admin overlay | NOT_RUN | — |
| QA-HF-008 Public About | Public About continues reading published snapshot, not Admin localStorage | NOT_RUN | — |
| QA-HF-009 Player boundary | Zen Radio Player remains independent and usable | NOT_RUN | — |
| QA-HF-010 refresh `/admin` | Refresh does not produce a boot loop or broken shell | NOT_RUN | — |

## Release state

```text
ENTORNO: BLOGGER REAL / PRODUCCIÓN
CÓDIGO: DESPLEGADO
CI: PASS
BLOGGER REAL: DESPLEGADO / QA EN CURSO
FREEZE: NO
```

Do not mark this release `FROZEN` until the real Blogger cases above are attributable to the installed hotfix and all P0/P1 failures are resolved or explicitly rejected by the Product Owner.
