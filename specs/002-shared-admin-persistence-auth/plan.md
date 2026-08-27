# Implementation Plan: Shared Admin Persistence + Fail-Closed Authentication

## Baseline

- Repository: `devMod3/cuba-la-hoja-de-ruta`
- Starting main: `c3d1aaedd664d26ed89c4be3fbac948ff878bcbc`
- Spec branch: `002-shared-admin-persistence-auth`
- Work ledger: #81

## Technical Context

- Next.js static export on GitHub Pages.
- pnpm workspace with independent packages under `next/packages/*`.
- Legacy Admin modules remain generated/materialized auxiliary runtime and are protected against unnecessary rewrites.
- Public content is build-time snapshot backed.
- Existing full quality chain includes strict formatting/lint/types, unit coverage, architecture/security checks, SBOM, performance budget, cross-browser/axe and Pages base-path rehearsal.

## Architecture

### Package A: `@zenblog/authoring-core`

Responsibilities:
- provider-neutral `AuthoringIdentity`, `AuthoringCapability`, `AuthoringSession`;
- typed fail-closed session state;
- logical shared-document keys;
- `VersionedJsonDocument<T>` and `VersionedJsonRepository` contract;
- typed `Unauthorized`, `Forbidden`, `Conflict`, `Validation`, `Transport` failures;
- deterministic canonical JSON helper;
- in-memory repository used for contract tests.

Must have zero runtime dependency on React, Next, GitHub or legacy Admin modules.

### Package B: `@zenblog/authoring-github`

Responsibilities:
- fixed owner/repository configuration;
- exact logical-key → repository-path allowlist;
- injected `fetch` implementation for deterministic tests;
- identity lookup and repository capability verification;
- GitHub Contents read/write mapping;
- base64 UTF-8 codec;
- remote SHA → version mapping;
- expected-version enforcement for update;
- safe error mapping/redaction.

Must not persist credentials or expose them through returned objects.

### Admin integration boundary (R3B)

Admin feature code receives an `AuthoringSession`/repository from a small integration controller. Existing Metadata/About modules remain authoritative for field semantics; the integration layer translates their validated state to shared documents and back.

No authoring package is imported by public Home/Explore/Reader/About server components.

## Data Flow

### Read
1. Admin collects credential at explicit connection boundary.
2. GitHub adapter authenticates identity.
3. Adapter verifies repository write capability.
4. Session exposes allowed repository operations.
5. Repository reads an allowlisted document and validates/returns `{ value, version }`.
6. Admin may compare remote data with local legacy data before migration.

### Write
1. Admin produces validated domain document.
2. Canonical serializer produces deterministic JSON.
3. Existing document update requires `expectedVersion`.
4. GitHub adapter PUT includes current remote SHA.
5. GitHub conflict/status is mapped to typed conflict without retry.
6. Successful response returns new version.
7. R3B read-backs and validates before marking migration synchronized.

## Security Plan

- Credential parameter is private to adapter/session closure.
- No credential fields in serializable session state.
- No browser storage APIs in authoring packages.
- No arbitrary URL, repository or path input at mutation call sites.
- Fetch requests target only configured GitHub API origin/repository routes.
- Error objects contain safe status/context codes, never Authorization header/body dumps.
- Tests include malicious logical keys/path escape attempts and credential sentinel leakage checks.

## Testing Strategy

### R3A unit/contract
- unauthenticated session rejects write before fetch;
- authenticated but insufficient capability rejects write;
- allowed read parses UTF-8/base64 JSON and version;
- malformed JSON is validation failure;
- create/update happy paths;
- update without expected version rejected;
- stale version mapped to conflict;
- unexpected HTTP mapped to safe transport failure;
- exact allowlist rejects unknown keys;
- credential sentinel absent from errors/serialized objects;
- deterministic serializer produces stable output;
- in-memory and GitHub repositories satisfy shared contract tests.

### R3B browser
- connection UX keyboard/accessibility;
- local-only state remains intact before migration confirmation;
- second session sees shared edit;
- conflict UX requires explicit action;
- logout/reload removes credential by construction;
- public routes remain unchanged and pass existing cross-browser matrix.

## Delivery Sequence

1. Merge Spec 002 docs only.
2. Branch R3A implementation from fresh main.
3. Add `authoring-core` and `authoring-github` with tests; do not wire Admin yet.
4. Run full Legacy + Next CI; merge only exact green SHA.
5. Branch R3B integration from fresh main.
6. Add Admin controller/UI/migration, cross-browser coverage and real remote acceptance instructions.
7. Merge after complete gates and record Pages evidence.

## Rollback

Each increment is independently reversible. R3A is inert until Admin imports it. R3B must preserve legacy local data until shared read-back succeeds, so rollback to the pre-R3B commit restores local-only behavior without data deletion.
