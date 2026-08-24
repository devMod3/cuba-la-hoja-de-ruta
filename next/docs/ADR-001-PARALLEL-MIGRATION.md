# ADR-001: Parallel migration instead of in-place rewrite

Status: Accepted
Date: 2026-08-23

Decision: Build ZenBlog Next in an isolated development line while the existing Blogger/ZenBlog implementation remains the production baseline.

Rationale: A framework migration, redesign, CMS migration and behavior change must not occur as one irreversible operation. Parity is proven before cutover and rollback remains the current production deployment until acceptance.
