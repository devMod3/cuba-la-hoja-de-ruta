# Tasks: Shared Admin Persistence + Fail-Closed Authentication

## Phase 0 — Governance

- [x] T001 Create issue ledger #81 with R3 goal, scope and exit criteria.
- [x] T002 Create `002-shared-admin-persistence-auth` from current accepted main.
- [x] T003 Write specification with protected surfaces, fail-closed requirements and evidence boundary.
- [x] T004 Record architecture research and rejected alternatives.
- [x] T005 Produce implementation plan and bounded delivery sequence.
- [ ] T006 Run full CI on docs-only Spec 002 PR and merge exact green SHA.

## Phase 1 — R3A authoring core

- [ ] T101 Create `next/packages/authoring-core` with zero external runtime dependencies.
- [ ] T102 Define provider-neutral identity, capability and session-state types.
- [ ] T103 Define logical document-key and versioned JSON repository contracts.
- [ ] T104 Define typed safe failure model: unauthorized/forbidden/conflict/validation/transport.
- [ ] T105 Implement deterministic canonical JSON serializer.
- [ ] T106 Implement in-memory reference repository for shared contract tests.
- [ ] T107 Add unit tests proving fail-closed and optimistic-concurrency semantics.

## Phase 2 — R3A GitHub adapter

- [ ] T201 Create `next/packages/authoring-github` depending only on `authoring-core`.
- [ ] T202 Add fixed repository configuration and exact logical-key/path allowlist.
- [ ] T203 Add injected-fetch authenticated identity lookup.
- [ ] T204 Add repository capability verification separate from identity authentication.
- [ ] T205 Add UTF-8/base64 GitHub Contents read adapter with remote SHA version mapping.
- [ ] T206 Add create/update write adapter; updates require expected SHA/version.
- [ ] T207 Map stale/409/422 mutation failures to explicit conflict where applicable; never destructive retry.
- [ ] T208 Add safe transport/error mapping with credential redaction.
- [ ] T209 Add security tests for unknown key/path escape, malformed JSON, credential sentinel leakage and unauthorized writes.
- [ ] T210 Add shared repository contract suite executed against both in-memory and mocked GitHub implementations.
- [ ] T211 Add architecture invariant proving public packages/routes do not depend on authoring packages.
- [ ] T212 Run full Legacy + Next CI and Pages rehearsal; merge R3A only on exact green SHA.

## Phase 3 — R3B Admin session integration

- [ ] T301 Add Admin-only connection/session controller; token exists in memory only.
- [ ] T302 Add explicit disconnected/authenticating/authorized/forbidden/error UI states.
- [ ] T303 Ensure reload/logout destroys the in-memory credential and returns to disconnected state.
- [ ] T304 Add Metadata shared-document translator preserving `zenMetadataRegistry.v2` schema/semantics.
- [ ] T305 Add Site Profile shared-document translator preserving `zenSiteProfile.v1` and current public publication contract.
- [ ] T306 Add non-destructive migration planner: local-only, remote-only, equal, divergent/conflict.
- [ ] T307 Require successful remote write + read-back validation before marking migration synchronized.
- [ ] T308 Keep local data until explicit confirmed migration; never silently delete local source.
- [ ] T309 Rebuild Search Lab index after accepted Metadata remote synchronization using existing event semantics.
- [ ] T310 Add explicit conflict UX: reload remote, preserve local export, retry after review.

## Phase 4 — R3B QA / acceptance

- [ ] T401 Add cross-browser Admin tests for session states and migration without storing credentials.
- [ ] T402 Add axe WCAG A/AA coverage for new connection/conflict UI.
- [ ] T403 Add browser storage assertions proving credential absence from localStorage/sessionStorage/IndexedDB-visible application state.
- [ ] T404 Verify public Home/Explore/Reader/About/ZRP behavior with authoring backend unavailable.
- [ ] T405 Preserve `retries=0`, performance budget, coverage floors, SBOM and architecture gates.
- [ ] T406 Run a real GitHub remote mutation/read-back acceptance using a maintainer credential outside CI; record exact document/version evidence without credential material.
- [ ] T407 Verify a second independent authorized session observes the shared change.
- [ ] T408 Verify deliberate stale-write conflict against the real backend does not overwrite remote state.
- [ ] T409 Merge exact green SHA and verify post-merge Legacy + Next + Pages deployment.

## Deferred follow-up — identity UX

- [ ] T501 Evaluate a dedicated short-lived OAuth/session gateway only after R3A/R3B prove shared persistence value and an external deployment/account boundary is approved.
- [ ] T502 Replace the initial credential acquisition adapter without changing Metadata/About/shared-repository feature contracts.
