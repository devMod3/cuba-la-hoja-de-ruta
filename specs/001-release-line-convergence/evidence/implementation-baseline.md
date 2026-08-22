# Implementation Baseline — Spec 001

**Spec**: `001-release-line-convergence`
**Implementation branch**: `001-release-line-convergence-impl`
**Reviewer**: GPT-5.6 Sol
**Review date**: 2026-08-22 (America/New_York)
**State**: BASELINE_LOCKED

## T001 — Governance review

Reviewed from SDD head `daae9380a2662b076eff9177a58f8dd0f3d44529`:

- `.specify/memory/constitution.md` — Constitution 1.1.0
- `specs/001-release-line-convergence/plan.md`
- `docs/forensic/PROTECTED-SURFACE-REGISTRY-v0.1.txt`
- `docs/architecture/ADR-001-immutable-release-asset-identity.md`
- `docs/architecture/ADR-002-single-zenblog-release-version.md`

Result: PASS. No accepted Constitution violation. Implementation remains bounded, evidence-first, reversible, and separated from historical PR integration.

## T002 — Canonical main verification

Planned canonical base:

`0a45bc523f0129d83307f1c6f3a972056b219ae0`

Live `main` observed on 2026-08-22:

`0a45bc523f0129d83307f1c6f3a972056b219ae0`

Result: PASS — no drift. STOP-001 not triggered.

SDD PR #17 head observed:

`daae9380a2662b076eff9177a58f8dd0f3d44529`

PR state at verification: OPEN / DRAFT / MERGEABLE.

Implementation branch origin:

`001-release-line-convergence-impl` was created from SDD head `daae9380a2662b076eff9177a58f8dd0f3d44529` and is reviewed through stacked draft PR #18 targeting `001-release-line-convergence`, not `main`.

## T003 — Current Blogger rollback identity

Exact Blogger XML was reconstructed from the forensic continuity guide using its Appendix A byte-extraction rule.

Observed:

- bytes: `26408`
- UTF-8 without BOM
- trailing newline: `false`
- XML parse: `PASS`
- SHA-256: `42b439df1c96915a2568fce9b0a243f26196281d2c9f8afca0bb7f786df114d8`

Expected SHA-256 matched exactly.

## T004 — Rollback security scan

Credential/secret scan result: PASS.

No matches detected for:

- email addresses;
- password/passwd/pwd assignments;
- secret or API-key assignments;
- Bearer credentials;
- OAuth credential assignments;
- private-key blocks;
- GitHub token patterns.

The only generic `token` occurrence is the public stylesheet path `src/ui/styles/tokens.css`.

Therefore the rollback XML is eligible for durable public-repository preservation under:

`docs/forensic/artifacts/blogger-theme-current-2026-08-22.xml`

with SHA-256 sidecar.

## T021 — Trustworthy release baseline

### Canonical source

- `main`: `0a45bc523f0129d83307f1c6f3a972056b219ae0`
- canonical runtime label at that source: `0.9.1`
- `package.json.version` at that source: `0.4.0` — known release-identity discrepancy, intentionally unresolved until candidate normalization.

### SDD / implementation topology

- SDD branch: `001-release-line-convergence`
- SDD base/head used to start implementation: `daae9380a2662b076eff9177a58f8dd0f3d44529`
- implementation branch: `001-release-line-convergence-impl`
- implementation review: stacked draft PR #18 -> `001-release-line-convergence`

### Active Blogger production

- classification: `DERIVED — ACTIVE NON-CANONICAL DEPLOYMENT`
- active asset payload pin: `aa372e1cc7982d1f8335d0d21760869c396b32c3`
- release-shell provenance: `ad43ac63c12a666534e03cf9d5436184b985d1d1`
- exact exported Blogger XML SHA-256: `42b439df1c96915a2568fce9b0a243f26196281d2c9f8afca0bb7f786df114d8`
- rollback artifact: `docs/forensic/artifacts/blogger-theme-current-2026-08-22.xml`
- rollback sidecar: `docs/forensic/artifacts/blogger-theme-current-2026-08-22.xml.sha256`

### Identity separation

The following are deliberately distinct:

1. canonical source SHA (`0a45bc...`);
2. deployed payload SHA (`aa372e1...`);
3. release-shell provenance (`ad43ac63...`);
4. exact installed/exported Blogger XML SHA-256 (`42b439...`).

Repository inspection reconfirmed why this separation is mandatory: `blogger/theme.xml` stored at payload snapshot `aa372e1...` still references an earlier immutable payload (`feaa8f...`), whereas the actual exported Blogger XML preserved here references `aa372e1...`. Therefore a repository theme blob is not proof of the bytes or asset identity currently installed in Blogger.

### Target

- canonical target application release: `ZenBlog v0.9.2`
- Zen Radio Player remains independently versioned/protected at `v1.0.3`

## T022/T023 — live file/blob comparison summary

Detailed semantic evidence lives in `candidate-deltas.md`.

| Surface | Canonical `main` | Active payload `aa372e1...` | Classification |
|---|---|---|---|
| `src/ui/styles/tokens.css` | blob `c3ede383...` | blob `75044c8b...` | MATERIAL — M-001 |
| `src/features/home/home.css` | blob `238c109d...` | blob `0c1db699...` | MATERIAL — M-002 |
| `tools/about/about.css` | blob `a4b184a2...` | blob `f8d2362c...` | MATERIAL — M-004 |
| `tools/about/AboutFeature.js` | blob `9ec3aed5...` | blob `9ec3aed5...` | EQUIVALENT — A-001 not deployed |
| `tools/about/bootstrap.js` | blob `3b753e39...` | blob `003d8bda...` | MATERIAL DELIVERY/RELEASE SEMANTICS — M-003 context |
| `src/ui/styles/responsive.css` | blob `839ae297...` | blob `839ae297...` | EXACT EQUIVALENCE — M-005 no-op |
| `src/bootstrap/createZenBlog.js` | blob `6aec3f2d...`, runtime `0.9.1` | blob `f10435d0...`, runtime `0.4.0` | MATERIAL VERSION/DELIVERY HISTORY; normalize only in v0.9.2 candidate |
| `blogger/theme.xml` | blob `7dd61dc3...`, mutable Pages + `?v=0.9.1` | repository snapshot blob `ae006d39...` pins `feaa8f...`; actual exported Blogger XML pins `aa372e1...` | MATERIAL RELEASE-SHELL/DEPLOYMENT IDENTITY |

M-005 live re-verification result: PASS. Both canonical and deployed payload resolve `src/ui/styles/responsive.css` to Git blob `839ae297acfe09eb2804a1e852c6c2e6797b3640`. No product edit is justified for this surface.

## Gate

T021–T024 establish one trustworthy release baseline. They do not authorize product source changes for M-001/M-002/M-003/M-004/A-001. Those remain evidence-gated by their task-specific browser/real-device checks.
