# ZenBlog Engineering Constitution — Long-Horizon Baseline

Status: mandatory project-wide engineering policy.

## Purpose

ZenBlog must remain understandable, testable, portable, and replaceable across technology generations. A 50-year service horizon cannot depend on any current framework surviving unchanged. Longevity is achieved by isolating volatile technology behind stable contracts, keeping the domain portable, preserving deterministic evidence, and making architectural violations mechanically detectable.

This policy applies to the whole repository: production Blogger code, tooling, tests, CI, the parallel Next platform, adapters, domain packages, content boundaries, search, metadata, and Zen Radio Player integration.

## Non-negotiable principles

1. Working production behavior is protected. Refactoring does not justify changing behavior.
2. Dependencies point inward. Domain code must not depend on UI frameworks, CMS implementations, browsers, Node-specific APIs, or delivery mechanisms.
3. Frameworks are replaceable delivery details. Next.js, React, Blogger, and Playwright are infrastructure choices, not the domain model.
4. Every external boundary validates unknown input before converting it into a trusted domain value.
5. Public package APIs are explicit and singular. Consumers import package roots, never package internals.
6. Internal package dependency graphs must remain acyclic.
7. Type safety may not be bypassed with `any`, double assertions, TypeScript suppression comments, or equivalent escape hatches.
8. Compiler strictness is a floor, not an option. Package-local configuration may not weaken the canonical TypeScript baseline.
9. Tests are deterministic evidence. Focused, skipped, fixme, or retry-dependent tests are not accepted.
10. Test failures are fixed at the cause. Gates are not weakened to make a change pass.
11. Technical debt must be explicit, attributable, and traceable to an issue or decision record. Anonymous TODO/FIXME/HACK markers are prohibited.
12. Supply-chain inputs, CI actions, toolchain versions, and runners are pinned wherever the platform permits.
13. Generated evidence must be reproducible from source and must never substitute for real-environment validation when the latter is required.
14. Security, accessibility, SEO ownership, performance budgets, and content integrity are architecture concerns, not release-polish tasks.
15. Small interfaces and cohesive modules are preferred over inheritance hierarchies or convenience abstractions.
16. Prefer composition, immutable data, pure transformations, explicit effects, and dependency injection at boundaries.
17. Boolean flags that create multiple behavioral modes should be replaced by explicit policies, strategies, states, or commands when the distinction is domain-significant.
18. Exceptions must fail closed at trust boundaries and fail observably at operational boundaries. Silent corruption is forbidden.
19. Compatibility behavior must be tested before refactoring and retained until an explicit migration decision retires it.
20. Every architectural exception requires an ADR or tracked issue with rationale, owner, scope, and retirement condition.

## Clean Architecture policy

The stable center is the domain and its contracts. Infrastructure and delivery layers may depend on the stable center; the stable center may not depend on them.

Preferred dependency direction:

`delivery/UI -> application/adapters -> domain/contracts`

Current package roles:

- `@zenblog/domain`: stable domain schemas and types.
- `@zenblog/search-core`: framework-free search semantics.
- `@zenblog/cms-blogger`: Blogger translation adapter.
- `@zenblog/content-snapshot`: immutable captured-content boundary.
- `@zenblog/content-renderer`: trusted rendering transformation boundary.
- `@zenblog/zrp-adapter`: public Zen Radio Player integration contract.
- `@zenblog/web`: delivery mechanism and composition root.

No package may create a dependency cycle to obtain convenience reuse.

## TypeScript contract policy

The canonical compiler baseline requires strict mode plus defensive options including unchecked-index protection, exact optional properties, unknown catch variables, side-effect import checking, isolated modules, casing consistency, and library type checking.

Rules:

- External data begins as `unknown`.
- Runtime validation converts `unknown` into trusted domain values.
- `any` is prohibited in maintained TypeScript source.
- `as unknown as` is prohibited.
- `@ts-ignore`, `@ts-nocheck`, and `@ts-expect-error` are prohibited.
- Internal packages expose one root API through `src/index.ts`.
- Internal workspace dependencies use `workspace:*`.
- Package TypeScript configs inherit the canonical base and do not weaken it.

## Clean Code beyond SOLID

The project additionally enforces:

- high cohesion and low coupling;
- command-query separation where practical;
- explicit side-effect boundaries;
- deterministic pure functions for domain transformations;
- tell-don't-ask for stateful collaborators where it reduces temporal coupling;
- law of Demeter at architectural boundaries;
- no speculative generality;
- no boolean blindness for domain-significant alternatives;
- no primitive obsession when a value carries domain invariants;
- no hidden global state as a domain dependency;
- no deep imports across package boundaries;
- no duplicated source of truth for contracts or version constants;
- no silent fallback that changes semantics without observable evidence.

Patterns are used only when they simplify change: ports/adapters, strategy, state, command, factory, repository, anti-corruption layer, and composition root. Pattern names do not justify unnecessary indirection.

## Testing standards

Every change must be tested at the lowest reliable layer and, when applicable, again at the integration boundary.

Required hierarchy:

- unit tests for pure domain behavior;
- contract tests for adapters and versioned integration boundaries;
- integration tests for composition and persistence boundaries;
- browser tests for routing, accessibility, responsiveness, and user-visible behavior;
- real-environment tests only for evidence that automation cannot observe.

Rules:

- no `.only`, `.skip`, or `.fixme`;
- no CI retries as acceptance criteria;
- failures must be reproducible and attributable;
- regression tests accompany bug fixes;
- tests assert observable contracts, not incidental implementation details;
- mocks/fakes may replace external systems only when the boundary itself is what is being tested;
- browser compatibility includes Chromium, Firefox, WebKit, and mobile WebKit for the parallel web platform.

## Legacy production policy

The Blogger production line is protected, not exempt. Existing behavior is treated as a compatibility contract. Hardening may add static checks, tests, pinned CI, and documentation without rewriting stable product code merely to match a preferred style.

New legacy-code changes must meet the same principles where the language permits: explicit modules, no hidden globals without a documented compatibility reason, deterministic tests, no suppressed failures, no anonymous technical debt, and minimal attributable diffs.

## CI and reproducibility

CI is executable policy. Required gates include, as applicable:

- syntax and formatting;
- lint with zero warnings;
- architecture boundaries;
- project-wide engineering standards;
- runtime-contract tests;
- strict TypeScript checks;
- deterministic unit tests;
- reproducible build/export;
- supply-chain baseline and SBOM;
- SEO ownership and static-route invariants;
- performance budgets;
- accessibility and cross-browser smoke tests;
- legacy production invariants.

Toolchain and workflow action versions must be pinned. Mutable convenience tags such as `ubuntu-latest` or unpinned action major tags are not accepted when a stable pinned equivalent is available.

## Change governance

Each change must identify:

- the contract being changed or preserved;
- the owning architectural layer;
- protected neighboring behavior;
- automated evidence;
- any human-only evidence still required;
- rollback or containment strategy when risk is non-trivial.

A green test suite is necessary but not sufficient for a release. Promotion and production freeze remain explicit Product Owner decisions.
