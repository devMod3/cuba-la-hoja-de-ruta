# ADR-002 — One ZenBlog Application Release Version

**Status**: Accepted for Spec 001

**Date**: 2026-08-22

## Context

ZenBlog currently exposes conflicting version identifiers:

- `package.json` on canonical main reports `0.4.0`;
- `src/bootstrap/createZenBlog.js` on canonical main reports/imports `0.9.1`;
- runtime/About cache keys use `0.9.1`;
- the current Blogger deployment executes the historical immutable payload `aa372e1...`, whose composition root still reports/imports `0.4.0`;
- the draft PR #13 used the label `0.9.2`, but that branch is not a release and does not own the meaning of the version number.

This ambiguity increases maintenance and cache-debugging risk. The repository is private as an npm package (`"private": true`), so `package.json.version` does not need an independent package-publication lifecycle.

## Decision

ZenBlog SHALL use one application release version across release-owned version identifiers.

For a FROZEN release, the same semantic version MUST be used by:

- `package.json.version`;
- `createZenBlog`/public runtime version constants;
- release-owned internal ESM query keys;
- runtime/About release constants;
- Blogger theme release/cache metadata where query keys are used;
- release tests;
- Release Manifest release label.

The Zen Radio Player version is explicitly excluded because it is a separately versioned product/repository.

Schema/contract versions are also excluded. Examples:
- `zenSiteProfile.v1`;
- metadata `contractVersion: 1.0.0`;
- vocabulary versions.

Those identify data contracts, not ZenBlog application releases.

## Target release for Spec 001

The next canonical convergence release is:

`ZenBlog v0.9.2`

Rationale:
- canonical code is currently documented as v0.9.1;
- Spec 001 is a backward-compatible convergence/hardening patch, not a new product architecture;
- retained mobile/About changes, if any, are fixes/refinements;
- release engineering/provenance corrections are patch-level hardening.

The historical branch/PR named v0.9.2 does NOT become canonical by naming coincidence. Canonical v0.9.2 is defined only by the future Release Manifest, payload SHA, release-shell SHA, XML hash, QA and acceptance produced by Spec 001.

## Version transition rule

Version normalization occurs as part of constructing the candidate payload, after behavioral delta decisions and before `PAYLOAD_SHA` is captured.

The payload commit MUST contain all release-owned runtime/version changes required for v0.9.2.

The subsequent release-shell commit pins `blogger/theme.xml` to that immutable payload SHA per ADR-001.

## Tests

Automated tests MUST prevent:
- mixed ZenBlog application versions in the public runtime graph;
- stale `package.json.version` relative to release constants;
- release-shell asset references that mix payload SHAs;
- accidental replacement of the independently protected Zen Radio Player version.

Tests MAY distinguish a pre-shell payload state from a deployable release-shell state. A payload commit is not itself a Blogger release candidate until the subsequent shell pins it immutably.

## Alternatives considered

### Keep `package.json.version` independent

Rejected.

There is no published npm package requiring an independent lifecycle, and the distinction has already caused ambiguity without providing value.

### Use Git SHA only, no semantic version

Rejected as the sole human-facing version.

SHA is the immutable technical identity; semantic version communicates release sequence and compatibility. Both are needed and have different roles.

### Reuse `0.4.0`

Rejected.

Canonical project documentation and runtime already identify v0.9.1. Moving backward would create more ambiguity.

### Rename the release to avoid historical `v0.9.2` branch collision

Rejected.

Branch names are historical implementation labels, not release authority. The Release Manifest makes the distinction explicit.

## Consequences

Positive:
- one human-readable application version;
- simpler cache/release diagnostics;
- `package.json`, runtime and manifest cannot silently drift;
- historical PR #13 is clearly separated from the canonical release definition.

Cost:
- Spec 001 must update stale release-owned version strings coherently;
- tests need to distinguish application release version from schema/player versions.

## Review trigger

Revisit if ZenBlog becomes a separately published package with a lifecycle that genuinely differs from the application release.
