# ADR-001 — Immutable Asset Identity for Blogger Production Releases

**Status**: Accepted for Spec 001 implementation

**Date**: 2026-08-22

## Context

ZenBlog has two separate deployment surfaces:

1. repository/static assets;
2. Blogger theme installation.

The forensic review identified two delivery models in the project history:

- canonical `main/v0.9.1` theme references mutable GitHub Pages paths with a query release key (`?v=0.9.1`);
- the currently installed Blogger theme references jsDelivr paths pinned to exact Git commit `aa372e1cc7982d1f8335d0d21760869c396b32c3`.

The current deployment could therefore be attributed to exact repository bytes even after the branch moved. The mutable GitHub Pages model cannot independently prove that a future request to the same path returns the bytes that were accepted when Blogger was installed.

The project constitution requires releases to be reversible, auditable and converged. Long-term maintenance also requires a future engineer to identify exactly what a historical Blogger theme executed.

## Decision

Blogger PRODUCTION release XML MUST identify ZenBlog repository assets by an immutable full Git commit SHA.

For Spec 001, the preferred delivery form is:

```text
https://cdn.jsdelivr.net/gh/devMod3/cuba-la-hoja-de-ruta@<FULL_PAYLOAD_SHA>/<path>
```

or another future delivery mechanism only if it provides equivalent immutable byte identity and is documented by a superseding ADR.

GitHub Pages remains allowed for:
- development/latest preview;
- repository documentation;
- non-production testing where exact historical byte identity is not required.

It MUST NOT be treated as sufficient production release provenance merely because a query-string version is present.

## Two-step release construction

A production release uses two identities:

### A. Payload SHA

Commit containing the exact JS/CSS/assets that browsers must execute.

Example:

```text
PAYLOAD_SHA = <immutable commit A>
```

### B. Release-shell SHA

Subsequent commit containing `blogger/theme.xml` whose repository asset references are pinned to `PAYLOAD_SHA`.

Example:

```text
RELEASE_SHELL_SHA = <commit B>
```

The Blogger candidate XML comes from the release-shell state and is hashed before installation.

This avoids a self-referential commit problem: a commit cannot know its own final SHA while constructing URLs inside itself.

## Release Manifest requirements

Every production release manifest records separately:

```text
Payload SHA
Release-shell SHA
Blogger XML SHA-256
Release/cache label
CI run
QA evidence
Rollback XML SHA-256
```

A version label such as `0.9.2` is descriptive metadata, not a substitute for payload identity.

## Internal ESM query keys

Internal `?v=<release>` keys SHOULD remain coherent for diagnostics/cache semantics, but immutability is guaranteed by the outer payload commit path, not by the query string.

Relative ESM imports loaded from the commit-pinned payload remain within the same immutable repository snapshot.

## Third-party CDN consideration

jsDelivr is an external delivery dependency and therefore a risk that must remain visible.

Mitigations:
- release identity is the Git commit, not “whatever is currently on main”;
- the source repository remains authoritative;
- rollback XML preserves the exact commit reference;
- a future migration to another immutable static delivery mechanism can preserve the same contract without changing feature code.

This ADR does NOT make jsDelivr an irreplaceable application dependency. It standardizes immutable production asset identity.

## Security considerations

- Only repository-controlled paths at an exact Git SHA are referenced.
- No runtime secret is introduced.
- New third-party scripts are not added.
- Zen Radio Player remains independently versioned under its existing contract and is outside this ADR except that its exact loader version remains recorded in the manifest.

A future Content Security Policy/SRI design may strengthen delivery integrity, but is not introduced opportunistically in Spec 001 because Blogger compatibility and module-graph behavior require dedicated validation.

## Alternatives considered

### Mutable GitHub Pages path + `?v=release`

Rejected for production identity.

Reason: the URL path ultimately follows mutable branch content. A query key invalidates caches but does not prove historical bytes after `main` moves.

### Pin production to a branch name

Rejected.

Reason: branch refs move.

### Pin production to a Git tag only

Not selected as the primary identity.

Reason: tags are human-friendly and may be added as release labels, but a full commit SHA is the irreducible identity. A tag can reference the SHA; it does not replace it.

### Bundle/vendor all code into Blogger XML

Rejected.

Reason: increases theme size, couples product code to Blogger deployment, damages modular maintainability and contradicts the existing architecture.

## Consequences

Positive:
- historical releases are attributable;
- rollback is deterministic;
- Blogger cannot silently start executing newer `main` assets;
- cache/version incidents are easier to diagnose;
- release manifest has a stable payload identity.

Costs:
- release creation requires a two-step payload/shell process;
- production asset delivery depends on an immutable CDN/static mechanism;
- accepted fixes require a new payload SHA rather than editing in place.

These costs are accepted because they directly support reversibility and long-term maintenance.

## Review trigger

Revisit this ADR if:
- ZenBlog moves away from Blogger;
- a first-party immutable artifact/release hosting mechanism replaces the CDN;
- CSP/SRI requirements materially change the delivery model;
- a build pipeline can demonstrably reduce release complexity without sacrificing auditability.
