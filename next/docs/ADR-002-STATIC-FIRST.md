# ADR-002: Static-first App Router baseline

Status: Accepted
Date: 2026-08-23

Decision: Begin with Next.js App Router and `output: export`.

Rationale: Static export lets the team prove routing, rendering, content adapters, accessibility and performance without introducing a server runtime. Server-only features may be adopted later behind a separate ADR when authentication, secure mutation, ISR or other requirements justify the operational cost.
