# ADR-004 — Executable architecture boundaries

Status: Accepted

## Context

A folder structure is not an architecture if dependencies can silently point in any direction. Long-lived maintainability requires the dependency graph to be enforceable by machines.

## Decision

- `apps/web` owns framework composition and may depend on approved domain/application packages.
- `packages/domain` is framework- and runtime-portable and cannot depend on Next.js, React or Node built-ins.
- `packages/search-core` may depend on domain but not on CMS/framework code.
- `packages/cms-blogger` is an adapter and may depend on domain; domain never depends on Blogger.
- `packages/zrp-adapter` owns the Zen Radio Player integration boundary without importing ZRP internals into the application domain.
- Deep imports across internal packages are forbidden; consumers use public package roots.
- Relative imports may not escape their package boundary.
- CI runs an architecture guard before typechecking/build acceptance.

## Consequences

Features may require explicit public contracts instead of convenient cross-folder imports. This is intentional: violations become local CI failures rather than accumulated architectural erosion.
