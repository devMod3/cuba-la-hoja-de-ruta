# Feature Specification: Shared Admin Persistence + Fail-Closed Authentication

**Feature Branch**: `002-shared-admin-persistence-auth`

**Created**: 2026-08-27

**Status**: Draft — implementation-ready boundary

**Issue**: #81

**Input**: Replace ZenBlog's browser-local-only authoring persistence with a shared authenticated control plane without coupling public Home, Explore, Reader, About, Search or ZRP behavior to authoring availability.

## User Scenarios & Testing

### User Story 1 — Authorized edits are shared (P1)

As an authorized maintainer, I need Metadata and Site Profile authoring state to be stored in a shared versioned repository so edits are visible from another authorized browser/session instead of being trapped in one browser's localStorage.

**Independent Test**: Session A writes a valid document, Session B reads the same remote version, and both observe identical canonical JSON without public runtime dependencies.

**Acceptance Scenarios**:
1. Given an authenticated authorized session, when it writes a valid shared authoring document, then a fresh authorized session can read the same committed version.
2. Given a successful shared write, when local migration cleanup occurs, then the local source is not deleted until the remote version is read back and validated.
3. Given the authoring backend is unavailable, when a reader opens a public page, then public static content continues to render normally.

### User Story 2 — Unauthorized mutation fails closed (P1)

As the maintainer, I need every shared mutation to require a verified identity and repository capability so a missing, expired, malformed or insufficient credential can never fall through to an authoring write.

**Independent Test**: Missing credentials, failed identity checks and read-only repository access all return typed authorization failures before any mutation request is emitted.

**Acceptance Scenarios**:
1. Given no credential, when a shared mutation is requested, then no network write occurs.
2. Given a credential that authenticates but lacks required repository capability, when a mutation is requested, then the operation fails closed.
3. Given an authentication response that cannot be validated, when authorization is evaluated, then the session remains unauthenticated.

### User Story 3 — Concurrent edits cannot silently overwrite each other (P1)

As an author, I need stale edits to surface an explicit conflict instead of silently replacing newer remote work.

**Independent Test**: Two clients read version A; client 1 writes version B; client 2 attempts to write using version A and receives a conflict with no silent retry or last-write-wins fallback.

**Acceptance Scenarios**:
1. Given a versioned remote document, when updating it, then the expected remote version is mandatory.
2. Given the expected version is stale, when a write is attempted, then a typed conflict is returned and remote content is unchanged by that operation.
3. Given a conflict, when Admin presents recovery, then reload/review/retry is explicit; automatic destructive merge is forbidden.

### User Story 4 — Credentials are ephemeral and non-leaking (P1)

As a maintainer, I need authoring credentials to remain in process memory only so repository access tokens are not persisted in application storage, generated artifacts, logs or error payloads.

**Independent Test**: Security tests verify the adapter never calls localStorage/sessionStorage/indexedDB for credentials and redacts credential material from thrown/loggable errors.

### User Story 5 — Backend provider remains replaceable (P2)

As a future maintainer, I need Admin feature logic to depend on authoring contracts rather than GitHub-specific request shapes so a future identity or persistence service can replace the first adapter without rewriting Metadata/About feature behavior.

**Independent Test**: Contract tests can run against an in-memory repository and the GitHub adapter implements the same interfaces without GitHub types crossing into Admin/domain modules.

## Requirements

### Functional Requirements

- **FR-001**: Public Home, Explore, Reader, About and ZRP MUST remain independent of authoring authentication and backend availability.
- **FR-002**: Shared authoring mutations MUST fail closed unless an authenticated session has the required capability.
- **FR-003**: Authoring credentials MUST NOT be stored in localStorage, sessionStorage, IndexedDB, cookies written by ZenBlog, repository files, generated Pages artifacts, telemetry or log/error strings.
- **FR-004**: The initial remote adapter MUST be isolated behind provider-neutral session and versioned-document repository contracts.
- **FR-005**: The initial GitHub adapter MUST constrain repository owner/name and writable document paths through an explicit allowlist; arbitrary repository/path writes are forbidden.
- **FR-006**: Identity and repository write capability MUST be verified before a shared mutation is permitted.
- **FR-007**: Existing remote documents MUST require an expected version token for update; stale writes MUST surface a typed conflict and MUST NOT auto-overwrite.
- **FR-008**: Remote JSON MUST be parsed and validated before being returned to Admin feature logic; malformed documents fail closed.
- **FR-009**: Network, authorization, validation and conflict failures MUST be distinguishable without including secret material.
- **FR-010**: Shared writes MUST be deterministic canonical JSON for equivalent logical data.
- **FR-011**: Local `zenMetadataRegistry.v2` and `zenSiteProfile.v1` data MUST remain recoverable until remote migration is confirmed by read-back validation.
- **FR-012**: Existing Metadata v0.5/adaptive semantics, Search Lab semantics, About public contract, Explore contracts and Inspector behavior MUST NOT change as collateral work.
- **FR-013**: The public content snapshot remains the reader-facing content boundary; authoring writes MUST NOT introduce runtime Blogger/GitHub fetches into public pages.
- **FR-014**: The initial credential UX MAY use a maintainer-supplied GitHub credential, but provider-specific credential handling MUST remain outside domain/feature logic and MUST be replaceable by a future short-lived identity gateway.
- **FR-015**: CI MUST preserve all existing lint, type, unit coverage, architecture, security, SBOM, performance, cross-browser, axe and Pages base-path gates with no threshold reduction or retries.
- **FR-016**: Real remote mutation acceptance MUST be recorded separately from mocked/contract CI; CI MUST never require a privileged production credential.

### Protected Surfaces

This specification MUST NOT alter:
- Zen Radio Player implementation or public contract;
- Explore title-only simple search or `Type · Date · Title` result-row contract;
- documentary-year semantics;
- Reader article URL/long-form behavior;
- Blogger `#page_body` / `Blog1` anatomy;
- public snapshot-only content architecture;
- Metadata v0.5/adaptive classification semantics;
- Search Core/Search Lab query semantics;
- Inspector click-interception semantics;
- public About field semantics and unsafe URL/image protections.

## Security Invariants

1. Credential absence is unauthenticated, never anonymous-write.
2. Authentication success does not imply authorization; repository capability is checked separately.
3. Path normalization cannot expand the allowlist.
4. Remote version mismatch is conflict, never overwrite.
5. Secret-bearing headers/values are never interpolated into exceptions.
6. Public bundles may contain adapter code only when required by Admin; normal reader critical path remains free of authoring code.

## Scope Split

### R3A — contracts + GitHub adapter
- provider-neutral authoring session/capability model;
- versioned JSON repository contract;
- in-memory reference repository for contract tests;
- GitHub Contents adapter with injected fetch, allowlist, auth/capability verification and optimistic concurrency;
- deterministic serializer and typed failures;
- unit/security/architecture tests.

### R3B — Admin migration/integration
- explicit connection/session UI;
- Metadata remote migration/sync preserving `zenMetadataRegistry.v2` semantics;
- Site Profile remote migration/sync preserving current publication flow;
- conflict/recovery UI;
- cross-browser/axe evidence;
- real remote acceptance evidence using a maintainer credential outside CI.

## Exit Criteria

R3 is complete only when authorized edits are shared across independent sessions, unauthenticated mutation is impossible, conflict handling is explicit, local migration is non-destructive, public pages remain backend-independent, and full Legacy + Next + Pages gates pass without lowered quality floors.
