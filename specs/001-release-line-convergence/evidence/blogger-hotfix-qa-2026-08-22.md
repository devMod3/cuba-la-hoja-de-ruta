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

## Public-save parity hotfix — PR #24

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

## Real Blogger public-save QA on PR #24 candidate

At `2026-08-22 18:05 America/New_York` the user reported that the public-save authorization form appears in both a normal browsing context and a private/incognito context.

At `2026-08-22 18:06 America/New_York` the user clarified that **no token was entered in either context**. Therefore no authenticated GitHub write can be inferred from those observations.

At `2026-08-22 18:09 America/New_York` the user entered the fine-grained token and Admin reported:

```text
Guardado localmente, pero NO publicado: Failed to execute 'fetch' on 'Window': Illegal invocation
```

This is a real production runtime failure in the authenticated-publication path. It confirms the failure semantics correctly preserved the local draft and did not falsely report public success.

Root cause: `GitHubPublicProfilePublisher` stored browser-native `globalThis.fetch` and later invoked it as an instance method (`this.fetchImpl(...)`), changing the receiver from the browser global object to the publisher instance. A receiver-sensitive browser implementation can therefore throw `Illegal invocation` before the authenticated API flow completes.

| Case | Expected | Result | Evidence |
|---|---|---|---|
| QA-PUBSAVE-001 `/admin` regression | Admin still opens normally | PASS | deployed Admin is reachable and About Save flow is being exercised |
| QA-PUBSAVE-002 local save | local draft persists | PASS | status explicitly reported `Guardado localmente` after network failure |
| QA-PUBSAVE-003 authorization UI | production Save requests publication authorization | PASS | token form appeared and accepted user input |
| QA-PUBSAVE-004 authenticated public write | valid token updates public snapshot | FAIL on PR #24 candidate | browser `fetch` failed with `Illegal invocation` |
| QA-PUBSAVE-005 public read-back | Admin reports success only after public snapshot matches | NOT_RUN | write did not complete |
| QA-PUBSAVE-006 separate public context | incognito/public reader sees newly published data | NOT_RUN | write did not complete |
| QA-PUBSAVE-007 credential non-persistence | a token used in one context is not inherited by another | NOT_RUN | requires successful/controlled re-test |
| QA-PUBSAVE-008 failure semantics | failed publication preserves local save and reports NOT published | PASS | exact production status observed |
| QA-PUBSAVE-009 player/public neighbors | public navigation and player remain unaffected | NOT_RUN | — |

## Replacement hotfix — PR #25

Real-browser failure above triggered a bounded fetch-receiver hotfix.

- PR `#25`: `MERGED`
- Main merge SHA: `de7d47cd80a83100a40c92205bbac12e0eb2f26c`
- Designated executable payload SHA: `aa854ff47a5c7bf107438e681a512f6708800bee`
- Release-shell SHA: `884d54fa5eb7210109d27b6456b174655969ef17`
- Blogger theme blob SHA: `0911096e95f82e21442de373a42336ff260b92d5`
- Payload CI run #243: `SUCCESS`
- Release-shell CI run #244: `SUCCESS`
- JavaScript checks: `PASS`
- Unit tests: `PASS`, including a receiver-sensitive default-fetch regression test
- Browser smoke/contracts: `PASS`
- Blogger XML parse: `PASS`
- Architecture/player invariants: `PASS`

### PR #25 fix contract

The default network adapter is now a wrapper:

```js
function browserFetch(...args) {
  return globalThis.fetch(...args);
}
```

This preserves the browser-global receiver for native `fetch` while leaving explicitly injected test/network adapters unchanged.

A regression test replaces `globalThis.fetch` with a receiver-sensitive implementation and requires `this === globalThis` for all four network stages: owner verification, current-file read, PUT, and public read-back.

## Local retest of PR #25

At `2026-08-22 18:18 America/New_York` the user reported that the replacement candidate no longer produced the `Illegal invocation` error when exercised from the local environment, but the public About did not change.

This is the **expected LOCAL / PRUEBAS contract**, not a production-publication failure. `isProductionBloggerLocation()` authorizes shared publication only when `location.hostname === cubalahojaderuta.blogspot.com`; outside that host, Save remains local-only and returns before the authenticated publisher runs.

Therefore this observation proves only:

```text
PR #25 LOCAL SAVE / NO ILLEGAL INVOCATION: PASS
PR #25 PUBLIC WRITE FROM LOCAL: NOT APPLICABLE BY DESIGN
PR #25 BLOGGER REAL AUTHENTICATED WRITE: NOT YET TESTED
```

## User action gate for replacement candidate

The next valid publication test must be performed from the **real Blogger host**, not the local environment.

1. Ensure the PR #25 XML is installed in Blogger Real.
2. Open `https://cubalahojaderuta.blogspot.com/admin` (or the working Blogger Admin suffix route that canonicalizes to `/admin`).
3. Edit one clearly verifiable About field.
4. Press `Guardar Acerca de`.
5. Enter the fine-grained token only in the ZenBlog publication authorization dialog.
6. Confirm `Autorizar y publicar`.
7. Record the exact Admin status.
8. If success is reported, open the public About in a separate incognito/private context and verify the changed value.

Why: production publication is intentionally host-gated to prevent a local/preview copy from writing shared public state accidentally.

If omitted: no public GitHub write occurs, so public About remains unchanged and parity cannot be classified PASS.

## Current parity result

```text
LOCAL SAVE: PASS
PR #25 LOCAL FETCH REGRESSION: PASS — NO ILLEGAL INVOCATION REPORTED
LOCAL -> PUBLIC WRITE: NOT APPLICABLE BY DESIGN
BLOGGER REAL AUTHENTICATED WRITE: PENDING
SEPARATE PUBLIC READ-BACK: PENDING
PARIDAD LOCAL -> PÚBLICO: PENDING REAL BLOGGER TEST
```

## Release state

```text
ENTORNO: BLOGGER REAL / PRODUCCIÓN
REPLACEMENT HOTFIX PR #25: MERGED
REPLACEMENT HOTFIX CI: PASS
PR #25 LOCAL RETEST: PASS FOR LOCAL CONTRACT
BLOGGER REAL PR #25 INSTALLATION: REQUIRES CONFIRMATION
BLOGGER REAL AUTHENTICATED PUBLICATION: NOT YET TESTED
PARIDAD LOCAL -> PÚBLICO: PENDING
FREEZE: NO
```

Do not mark the complete release `FROZEN` until the PR #25 replacement XML is confirmed installed, authenticated publication succeeds from Blogger Real, the result is visible from a separate public-reading context, and remaining required regression cases are tested or explicitly accepted by the Product Owner.
