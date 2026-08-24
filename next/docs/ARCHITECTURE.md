# Architecture baseline

## Governing rule

Protect working production surfaces before accelerating migration.

## Dependency direction

`apps/web` -> domain/application packages -> adapters. Domain packages must not import Next.js, React, Blogger globals, browser globals or Zen Radio Player internals.

## Boundaries

- Blogger is an external CMS boundary, never the domain model.
- Zen Radio Player is an independent product boundary, never a React component owned by ZenBlog.
- Search semantics are framework-free and independently testable.
- Runtime validation is mandatory when untrusted/external data crosses into typed domain code.
- App Router layouts own global UI such as Global.Header.

## Migration policy

No production cutover until parity gates pass for routes, content, search, metadata, About, player persistence, SEO, accessibility, performance and mobile/WebKit behavior.
