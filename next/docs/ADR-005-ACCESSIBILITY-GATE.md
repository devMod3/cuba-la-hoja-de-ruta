# ADR-005 — Accessibility is a release gate

Status: Accepted

## Context

Accessibility defects are cheaper and safer to prevent during implementation than to retrofit after parity or cutover. Automated tools cannot prove full accessibility, but they can prevent broad classes of regressions continuously.

## Decision

- Public routes must satisfy structural browser contracts for language, landmarks, heading structure, keyboard reachability and horizontal overflow.
- Playwright executes those contracts in Chromium, Firefox, WebKit and mobile WebKit.
- Axe Core is run against public routes using WCAG A/AA rule tags.
- Automated accessibility checks are blocking CI gates.
- Automated PASS is not treated as proof of complete accessibility; assistive-technology and target-device validation remains a later acceptance layer when automation cannot reproduce the boundary.
- Axe rules are not disabled merely to obtain a green build. Any exception requires an explicit, attributable decision.

## Consequences

New UI must preserve semantics and keyboard behavior from its first implementation. Accessibility becomes part of the definition of done rather than a post-release audit.
