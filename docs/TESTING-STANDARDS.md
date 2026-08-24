# ZenBlog Testing Standards

Status: normative for the parallel modernization line. These rules cover the protected Blogger application, shared tooling, internal packages and the Next.js platform.

## Principle

Tests are executable evidence of contracts and behavior. A coverage percentage is never accepted as a substitute for a meaningful assertion, and a green retry is never accepted as evidence of determinism.

## Test taxonomy

1. Characterization tests protect behavior of the working legacy system before migration or refactoring.
2. Unit tests cover pure domain logic, parsers, policies, adapters and deterministic transformations.
3. Contract tests protect external and cross-boundary shapes: Blogger snapshots/feeds, metadata, Zen Radio Player events and public package APIs.
4. Integration tests prove components cooperate through their public boundaries rather than internal implementation details.
5. Browser E2E tests prove routing, interaction, persistence and rendering in Chromium, Firefox, WebKit and mobile WebKit.
6. Accessibility tests are required independently of unit coverage and use semantic assertions plus axe.
7. Security tests cover trust boundaries and hostile inputs; sanitizer tests are not inferred from generic line coverage.
8. Performance gates enforce explicit budgets and must use measured evidence.
9. Production/Blogger Real validation remains a separate evidence class and is never replaced by CI when a real-host property is being claimed.

## Determinism

- Playwright retries are permanently zero.
- Focused, skipped and fixme tests are prohibited by the project standards gate.
- Tests must not depend on execution order, wall-clock timing, external mutable network services or shared hidden state unless the contract being tested explicitly requires it.
- External network boundaries are replaced with deterministic fakes in CI. Real-host validation is recorded separately.
- A flaky test is a defect in the test or product and must be corrected rather than retried.

## Type safety in tests

Tests are compiled under the same strict TypeScript baseline as production code. `any`, double assertions, TypeScript suppression comments and untyped legacy imports are forbidden. Legacy JavaScript consumed by TypeScript receives explicit declaration contracts instead of suppression comments.

## Code coverage: what it governs

Line/branch/function/statement coverage is mandatory for code where direct execution is a meaningful signal:

- `next/packages/*/src/**/*.ts`
- `next/apps/web/adapters/**/*.ts`
- protected legacy `src/**/*.js` and `tools/**/*.js` as a non-regression baseline

TSX delivery components and App Router pages are not forced through unit line coverage. Their quality gate is browser behavior, route/SEO contracts and accessibility. This distinction is deliberate: counting transpiler lines in UI components is weaker evidence than exercising the rendered behavior in the supported browser matrix.

## Next coverage thresholds

The V8 provider is pinned to the same exact version as Vitest. Uncovered portable source files are included explicitly. `autoUpdate` is disabled so a tool can never silently rewrite the standard.

Global minimums:

- statements: 90%
- branches: 70%
- functions: 90%
- lines: 95%

Risk-tiered package thresholds are stricter. Domain, content renderer and ZRP contract code approach or require 100% where meaningful. Search Core requires complete line/function coverage with a branch floor. The Blogger adapter has a lower branch threshold because malformed external-input permutations are effectively unbounded, but its line/function floors remain high and hostile-boundary cases are explicit tests.

Coverage thresholds may be raised without architectural approval. They may not be lowered merely to make CI green. A lower threshold requires a documented architectural reason and Product Owner acceptance because it weakens evidence.

## Legacy coverage baseline

The first Node 24 measurement on Q-046 produced:

- lines: 50.57%
- branches: 59.39%
- functions: 57.01%

The immediate non-regression gate is therefore:

- lines >= 50%
- branches >= 59%
- functions >= 57%

This is a floor, not a target. Low-coverage legacy modules are visible technical debt and must be improved through characterization tests without changing working behavior. The initial measurement identified `ArticleFeature.js` and `AdaptiveMetadataUI.js` as priority characterization targets.

Node's built-in test coverage remains marked Experimental in Node 24.19.0. For that reason it is supplemental evidence for the protected legacy line and is not the sole acceptance gate; the existing unit, browser, XML and architecture invariants remain mandatory.

## Coverage artifacts

Permanent Next CI uploads the generated coverage report. Coverage reports are evidence artifacts, not source files and are not committed to the repository.

## Mutation and fault sensitivity

High percentage coverage does not prove assertions would detect incorrect behavior. Mutation/fault-sensitivity testing belongs after the coverage baseline is stable and should focus first on portable domain/search/security code where mutants are deterministic and inexpensive. It must not be introduced as a repository-wide dependency until its runtime cost and supply-chain impact are measured.

## Change rule

Every behavior change must identify its owning layer, protected neighbors and the smallest appropriate test level. Tests that reach across private internals are rejected when the same contract can be proven through a public API. Working out-of-scope surfaces remain untouched.
