# ADR-010 — Zen Radio Player root-layout integration

Status: Accepted for the parallel Next migration line.

## Context

Zen Radio Player is an independent deployed product. ZenBlog must integrate its public contract without copying player internals or recreating its playback state. App Router navigation must not remount the integration boundary and interrupt the player.

## Decision

- `@zenblog/zrp-adapter` remains the sole owner inside ZenBlog of the approved ZRP version, script URL and public open event name.
- The external v1.0.4 module loader is mounted in the root layout, outside route content.
- `Global.Header` exposes a `Reproductor` launcher as a small Client Component that dispatches only the public `zen-radio-player:open` event.
- ZenBlog does not import ZRP implementation code, playlist internals, audio state or player CSS.
- App Router navigation must preserve the mounted loader/runtime boundary rather than loading another player instance.

## Verification

Unit tests pin the exact public contract. Multi-browser Playwright substitutes the external script with a deterministic test double, asserts one loader request, dispatches the real public event through the launcher, navigates through App Router and proves that the same runtime receives the next event without a second loader request.

The test double verifies ZenBlog's integration boundary; it does not claim to replace Blogger Real or physical Safari acceptance of the independently deployed player.

## Non-goals

Q-044 does not modify Zen Radio Player itself, Blogger production, playlist ordering, autoplay policy, volume, metadata, About, Explore semantics, article content or the existing production theme.
