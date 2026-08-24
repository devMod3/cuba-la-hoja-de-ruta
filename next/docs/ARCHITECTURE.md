# Architecture baseline

## Governing rule

Protect working production surfaces before accelerating migration.

## Dependency direction

`apps/web` owns framework composition. Framework-free packages expose public contracts consumed by the web application and adapters. The allowed dependency graph is enforced by `scripts/check-architecture.mjs`; folder placement alone is not considered an architectural guarantee.

## Boundaries

- `packages/domain` is the stable framework- and runtime-portable model. It cannot depend on Next.js, React, Node built-ins, Blogger globals or Zen Radio Player internals.
- `packages/search-core` may depend on domain but remains independent of CMS and UI frameworks.
- `packages/cms-blogger` is an external CMS adapter and may depend on domain; domain never depends on Blogger.
- `packages/zrp-adapter` owns the integration contract with the independent Zen Radio Player without transferring ownership of ZRP internals to ZenBlog.
- `apps/web` owns App Router rendering, composition and global UI such as Global.Header.
- Runtime validation is mandatory when untrusted/external data crosses into typed domain code.
- Deep imports across internal package boundaries and relative imports that escape a package are forbidden.

## Reproducibility and supply chain

The committed pnpm lockfile is an executable release input. CI validates its cryptographic baseline, dependency source policy, strict peers, install-script allowlist and CycloneDX SBOM before release acceptance.

## Migration policy

No production cutover until parity gates pass for routes, content, search, metadata, About, player persistence, SEO, accessibility, performance and mobile/WebKit behavior. Migration establishes behavioral parity before product redesign or opportunistic rewrites.
