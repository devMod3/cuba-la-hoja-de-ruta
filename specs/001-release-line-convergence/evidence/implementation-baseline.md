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

## Protected deployment facts

- active Blogger asset pin: `aa372e1cc7982d1f8335d0d21760869c396b32c3`
- release-shell provenance: `ad43ac63c12a666534e03cf9d5436184b985d1d1`
- current Blogger classification: `DERIVED — ACTIVE NON-CANONICAL DEPLOYMENT`
- target canonical release: `ZenBlog v0.9.2`
- Zen Radio Player remains independent/protected at `v1.0.3`

## Gate

No product source change is authorized by this record. Phase 1 may proceed only with durable rollback/evidence artifacts, QA ledger, release-manifest draft, and isolated stacked review path.
