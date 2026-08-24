# ADR-003 — Deterministic supply-chain baseline

Status: Accepted

## Context

ZenBlog Next is intended to remain reproducible and auditable across long maintenance horizons. Package-manager resolution, transitive dependencies and install scripts are part of the executable system and cannot be treated as incidental build noise.

## Decision

- Use an exact pnpm version and a committed lockfile.
- CI installs with `--frozen-lockfile` once the lockfile exists.
- Record and verify the lockfile SHA-256 and integrity-entry count.
- Reject exotic dependency sources in the approved graph.
- Keep strict peer-dependency enforcement enabled.
- Keep dependency build scripts denied by default and allow only exact audited package versions.
- Enforce a minimum package release age before adoption.
- Generate and validate a CycloneDX 1.7 SBOM in CI.
- Treat every dependency-graph change as an explicit security change that must renew the baseline.

## Consequences

Dependency upgrades require deliberate lockfile review and baseline renewal. This adds friction by design, but prevents silent graph drift and makes historical rebuilds materially more reliable.
