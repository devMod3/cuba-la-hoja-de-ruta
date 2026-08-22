# Blogger Real QA — Public About direct-main read — 2026-08-22

## Environment

```text
ENTORNO: BLOGGER REAL / PRODUCCIÓN
DESPLIEGUE EN ESTA INTERVENCIÓN: NO
```

## Installed candidate

- PR `#26`: `MERGED`
- Main merge SHA: `06c017d40dbf142caddc70c98fce27200f25215c`
- Designated executable payload SHA: `894330be2f83fc4cd6c6f9fda531e43ab5d81a8a`
- Release-shell SHA: `2a881eb223f5a8aceae78a900d0059a7cfe8f819`
- Blogger XML SHA-256: `536cabea5c8e8db35bb7ef90c632968bd226be0f48000622ac681d941309c0a6`
- Blogger theme blob SHA: `cacfb878343ef187653dbdf79d549b6ad865924a`
- Payload CI run #249: `SUCCESS`
- Release-shell CI run #250: `SUCCESS`

## Prior authenticated write evidence

The preceding production candidate successfully wrote the About profile to `main` through the authenticated GitHub Contents API, producing commit:

`e3702cbe76f5ce8bc27014e551acedb5efd542be`

The write updated `config/site-profile.public.json` with `updatedAt = 2026-08-22T22:17:40.784Z` and the intended profile data. The prior Admin then reported a failure because its success gate depended on GitHub Pages propagation rather than the `main` source of truth.

## PR #26 delivery correction

PR #26 removes GitHub Pages from the About publication/read-back dependency:

```text
Admin -> GitHub main -> raw.githubusercontent.com/main -> Blogger public About
```

Public About reads the mutable profile directly from `main` with a cache-busting query parameter. Code, CSS and static product assets remain immutable/pinned by payload SHA.

## User-confirmed real Blogger evidence

At `2026-08-22 18:31 America/New_York`, after installing the PR #26 Blogger shell, the Product Owner reported:

```text
ACERCA PUBLICO PASS
```

The check was performed on the public About surface in a separate/private context as instructed, without another Admin save or another token submission.

This proves:

```text
PROFILE PRESENT IN GITHUB MAIN: PASS
PUBLIC DIRECT-MAIN SNAPSHOT READ: PASS
BLOGGER REAL PUBLIC ABOUT READ: PASS
SEPARATE/INCOGNITO CONTEXT: PASS
LOCALSTORAGE-INDEPENDENT PUBLIC READ: PASS
```

## What this does not yet prove

This evidence does **not** by itself execute a fresh authenticated Save using the currently installed PR #26 runtime. Therefore the complete current-version end-to-end contract remains pending one bounded production mutation:

```text
PR #26 /admin Save
  -> operation-local token
  -> authenticated GitHub write
  -> direct-main read-back
  -> Admin success status
  -> separate public About read
```

Until that fresh write succeeds, do not collapse the distinction between:

```text
PUBLIC READ OF EXISTING WRITTEN SNAPSHOT = PASS
FRESH PR #26 AUTHENTICATED SAVE END-TO-END = PENDING
```

## Next user-action gate

The next valid test must use a **real content change the owner wants to keep**, rather than an artificial QA marker, to avoid creating an unnecessary cleanup commit.

```text
ACCIÓN DEL USUARIO:
Open Blogger Real /admin, change one About field to a real desired value, press Guardar Acerca de, enter the fine-grained token only in the ZenBlog authorization dialog, and confirm Autorizar y publicar.

POR QUÉ:
This is the only remaining proof that the currently installed PR #26 runtime can perform the full authenticated write + direct-main verification path, not merely read a snapshot written by the previous candidate.

SI SE OMITE:
Public reading remains proven, but the current-version Save contract remains PENDING and cannot be classified end-to-end PASS.

NO HACER:
Do not paste the token into chat, code, XML, URLs, commits, localStorage or sessionStorage. Do not use a throwaway public content marker that would require a second cleanup publication.

RESULTADO ESPERADO:
Admin reports `Acerca de guardado y publicado. El snapshot público ya está disponible.` and the changed value is then visible in public About from a separate incognito/private context.
```

## Current state

```text
ENTORNO: BLOGGER REAL / PRODUCCIÓN
PR #26 BLOGGER INSTALLATION: CONFIRMED BY REAL PUBLIC BEHAVIOR
PUBLIC ABOUT DIRECT-MAIN READ: PASS
PRIOR AUTHENTICATED GITHUB WRITE: PASS
FRESH PR #26 AUTHENTICATED SAVE: PENDING
FRESH PR #26 SEPARATE PUBLIC READ-BACK: PENDING
PARIDAD LOCAL -> PÚBLICO: PARTIAL PASS / FINAL E2E PENDING
FREEZE: NO
```
