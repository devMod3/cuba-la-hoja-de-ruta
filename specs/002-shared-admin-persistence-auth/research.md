# Research: Shared Admin Persistence + Authentication

## Context

ZenBlog is statically exported to GitHub Pages. Public runtime availability must not depend on an authoring service. The current Admin runtime already uses browser-local state and an ephemeral GitHub credential for selected profile publication; the next step must preserve that security property while introducing shared state.

## Decision 1 — Separate authoring control plane from public runtime

**Decision**: Keep all shared persistence/authentication behind Admin-only packages and adapters. Public pages continue consuming deterministic repository snapshots at build time.

**Reasoning**:
- GitHub Pages cannot safely hold a server secret.
- A public runtime dependency would violate the established snapshot architecture and increase reader failure modes.
- Authoring availability is operationally different from content delivery availability.

**Rejected**: Fetching private/shared authoring state from public Home/Explore/Reader at runtime.

## Decision 2 — Provider-neutral core, GitHub-backed first adapter

**Decision**: Introduce a small provider-neutral `authoring-core` package and a separate GitHub adapter rather than embedding GitHub API calls directly into Admin modules.

**Reasoning**:
- The repository is already the release/control-plane authority.
- GitHub Contents provides version identifiers (`sha`) suitable for optimistic concurrency.
- A future identity gateway or database can replace the adapter while preserving feature contracts.

**Rejected**: Adding GitHub request/response types to Metadata Manager, About Manager or public domain packages.

## Decision 3 — Credential stays in memory

**Decision**: The initial adapter receives a credential from the Admin session boundary and never persists it.

**Reasoning**:
- Existing project behavior already treats GitHub publication credentials as ephemeral.
- Persisting a repository write credential in browser storage materially increases token-exfiltration impact.
- A static site cannot protect a long-lived shared secret.

**Operational consequence**: Reconnecting after reload is acceptable in the first increment. A future short-lived identity gateway may improve UX behind the same session interface.

## Decision 4 — Authentication and authorization are separate checks

**Decision**: Establish identity first, then verify repository capability before exposing a write-capable session.

**Fail-closed rule**: Any malformed response, network ambiguity, missing capability or credential error produces an unauthenticated/read-only result; mutation methods are not invoked.

## Decision 5 — Optimistic concurrency is mandatory

**Decision**: Every update of an existing shared document carries its expected remote version. Version mismatch becomes a typed conflict.

**Reasoning**:
- Multiple maintainers/sessions are the purpose of shared persistence.
- Silent last-write-wins would make shared storage less safe than localStorage.
- Git-backed SHA versions provide a natural compare-and-swap boundary.

**Rejected**: Automatic retry using the newest version without re-presenting the conflict to the user.

## Decision 6 — Exact document allowlist

**Decision**: The GitHub adapter is constructed with a fixed repository identity and exact writable path set. Callers choose a logical document key mapped internally to a path; callers do not provide arbitrary repository paths.

**Reasoning**:
- This converts a broad repository credential into a narrow application capability.
- It prevents path traversal and accidental writes to workflows, source, theme or ZRP files.

## Decision 7 — Deterministic JSON boundary

**Decision**: Shared documents use canonical JSON serialization: normalized validated data, stable object-key ordering where the contract requires it, two-space indentation and terminal newline.

**Reasoning**:
- Produces reviewable Git diffs.
- Prevents churn from logically equivalent writes.
- Fits the repository-as-control-plane model.

## Decision 8 — Real remote acceptance is not a CI secret requirement

**Decision**: Unit/contract CI uses injected `fetch` doubles. A separate manual/real-environment acceptance record validates actual remote GitHub mutation with a maintainer credential.

**Reasoning**:
- Privileged production credentials should not be introduced merely to make CI green.
- LOCAL/CI/Pages/real-authoring evidence remain distinct, consistent with existing release discipline.

## Open follow-up, not blocker for R3A

A more ergonomic production identity layer (for example, a short-lived session issued by a dedicated backend/OAuth gateway) requires an external deployment/account trust boundary. R3A intentionally avoids committing to that provider before it is necessary. The adapter/session contracts must make that replacement mechanical rather than architectural.
