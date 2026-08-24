# ZenBlog v0.9.2 — Release Manifest

**Status**: `BLOGGER-REAL-Q035-TECHNICAL-GATES-CLOSED / FREEZE-AWAITING-EXPLICIT-PO`

## Canonical product identity

- Repository: `devMod3/cuba-la-hoja-de-ruta`
- Release: `v0.9.2`
- Latest product-affecting main merge: PR `#28`
- Product merge SHA: `7f137fae995d69f6e0e02d68334667da09a47d8f`
- Product tree: `eb9c6b1cf5fa72a08a638b135edb4a976e44c28b`
- Blogger theme blob: `e6af7b237503629e6c7bd237c1378472b132da51`
- Immutable Blogger payload pin: `3aa43f5b347a0711dafb4073fb5f2213a88909cc`
- Installed Blogger XML SHA-256: `e8f4637a76ced77e8131cfd967b0028171c42a538a48798dd70e1fc989a35550`
- Zen Radio Player: protected independent loader `v1.0.3`
- Freeze: `NO` until explicit Product Owner acceptance

Repository commits after PR #28 that only align documentation do not change the installed Blogger product payload.

## Current production state

Blogger Real is running the Q-035 shell produced after PR #28. The shell retains exactly one `#page_body`, exactly one `Blog1`, no `zen_main`, the v0.9.2 application graph, auxiliary Admin/About/Inspector runtime, and the protected Zen Radio Player v1.0.3 loader.

The public editorial profile remains mutable through `config/site-profile.public.json`; code, CSS and application assets remain commit-pinned. No GitHub token is embedded in the XML or JavaScript, and publication credentials are not persisted in browser storage or URLs.

## Hotfix lineage

- PR #22: initial v0.9.2 production promotion — merged.
- PR #23: Admin routing hotfix — merged.
- PR #24: public About save parity hotfix — merged.
- PR #25: public-profile native fetch receiver / Illegal invocation fix — merged.
- PR #26: direct raw-main public profile read + cache-buster — merged.
- PR #27: About Admin field parity — merged.
- PR #28: compound Admin hash ownership — merged and installed.
- PR #29: Q-035 documentation alignment — merged; docs only.

## HASH-COMPOUND-001

Previous Blogger Real failure:

`https://cubalahojaderuta.blogspot.com/#zen-explore/admin`

Observed result before PR #28: Portada.

Correction:
- the public ZenBlog entry does not boot on Admin-owned pathname/hash forms;
- Admin/runtime remains the owner of `/admin`, path-suffix `/admin` and hash-suffix `/admin` routes;
- normal public hashes remain owned by public navigation.

Post-deployment Blogger Real result in Q-035: `PASS`.

## Automated verification

PR #28 `Validate ZenBlog`:
- Run ID: `32677678214`
- Run number: `261`
- Conclusion: `SUCCESS`
- JavaScript checks: `PASS`
- Unit tests: `86/86 PASS`
- About same-origin browser smoke: `PASS`
- About Admin-to-public field parity browser contract: `PASS`
- Admin/public bootstrap ownership browser contract: `PASS`
- Blogger XML parse: `PASS`
- Architecture invariants: `PASS`
- Protected Blogger/player invariants: `PASS`

PR #29 documentation-only validation:
- Run ID: `32678243087`
- Run number: `263`
- Conclusion: `SUCCESS`

CI is not Blogger Real QA and is not Safari/iPhone/WebKit QA.

## Blogger Real QA — Q-035

- QA-HF-004 Search / Search Lab: `PASS`
  - Real status observed: `2 artículos indexados.`
  - Query exercised: `pueblo`.
- QA-HF-006 Inspector: `PASS`.
- QA-HF-007 leave Admin / return to public site: `PASS`.
- QA-HF-009 Zen Radio Player / ZenBlog navigation boundary: `PASS`.
- HASH-COMPOUND-001 after PR #28 deployment: `PASS`.

## Safari / iPhone / WebKit real acceptance

Final real-device gate in Q-035: `PASS`.

Product Owner verified on iPhone + Safari:
- Portada -> Explorar -> Acerca de navigation usable;
- no reported critical safe-area overlap;
- player coexistence with mobile UI;
- portrait/landscape transition without reported critical cut, overlap or horizontal overflow;
- Admin tabs usable;
- `Sitio ↗` visible in mobile format.

Therefore `ADMIN-RESPONSIVE-OBS-001` is closed as `NOT A DEFECT`.

## About / public profile state

- About Manager mounts and local save works.
- Production publication to `config/site-profile.public.json` works.
- Public read uses direct raw `main` with cache-busting.
- Admin -> main -> public read -> render parity was demonstrated in Blogger Real for the tested case.
- PR #27 corrected field parity for Género, Audio Clip, Wishlist, Pregunta aleatoria, Respuesta, Intereses, Películas favoritas, Música favorita and Libros favoritos.
- Only Intereses has individual manual Blogger Real verification; the remaining eight have automated CI coverage.

## Open non-blocking observation

### PERFORMANCE-OBS-001

Admin was perceived as somewhat slow. No before/after metric exists. Do not classify this as a performance regression and do not open a performance hotfix without measurement.

This observation is non-blocking for the current technical gate closure because there is no reproducible performance defect or failed acceptance criterion.

## Protected neighbor / future ZRP work

Zen Radio Player remains an independent protected product at loader `v1.0.3`.

Q-035 queued `ZRP-UX-IMPROVEMENT-001` for a future code phase:
- preserve minimized initial open and autoplay behavior;
- clicking the minimized player should expand the complete player surface, including controls plus playback/reproduction bar;
- preserve playlist behavior, persistence, ZenBlog navigation, and the protected product boundary.

This request is not part of v0.9.2 PR #28 and must not be silently implemented during release closeout.

## Freeze disposition

All currently defined automated, Blogger Real, routing, player-boundary and Safari/iPhone/WebKit technical gates are closed.

`FREEZE` remains `NO` because freeze is a Product Owner decision and MUST NOT be inferred from passing QA.

The remaining release decision is explicit Product Owner acceptance of `FROZEN`.

## Current rollback reference

The immediately previous Q-034 production XML remains the pre-PR28 rollback reference:
- XML SHA-256: `6ea67c63f0f199fd110d720da31023e5206e58fb6b368bf1cdd311d28dbfe520`
- Previous payload pin: `578f58f17f242f9e48a1c8627676541de29a5fa8`

The original pre-v0.9.2 forensic rollback artifact remains preserved separately under `docs/forensic/artifacts/`.

## Evidence file

Final Q-035 real QA is recorded in:
`docs/forensic/Q035-FINAL-REAL-QA-2026-08-23.txt`

## Authority rule

This manifest records repository release state. The current continuity package / consultation state remains the operational authority for the active handoff, and Blogger Real/Safari real evidence cannot be inferred from CI.
