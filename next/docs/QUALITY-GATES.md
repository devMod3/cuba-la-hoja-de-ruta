# Quality gates

A change is not releasable unless applicable gates pass:

1. Deterministic formatting check.
2. ESLint with zero warnings.
3. Executable architecture-boundary check.
4. Frozen pnpm lockfile installation.
5. Supply-chain baseline verification: lockfile SHA-256, integrity count, package-manager/runtime pins, source policy and install-script allowlist.
6. Strict peer-dependency check.
7. CycloneDX 1.7 SBOM generation and validation.
8. TypeScript strict typecheck.
9. Unit and contract tests.
10. Production static build.
11. Static JS/CSS compressed-size performance budgets.
12. Structural accessibility contracts for public routes.
13. Axe Core WCAG A/AA automated accessibility checks for public routes.
14. Playwright Chromium, Firefox, WebKit and mobile WebKit.
15. Runtime validation for external data at typed boundaries.
16. Measured performance evidence for performance claims beyond the static budgets.
17. Blogger Real or target-host QA when browser automation cannot reproduce the production boundary.
18. Explicit Product Owner acceptance before freeze/cutover.

Automated accessibility PASS is necessary but does not prove complete accessibility. Assistive-technology or real-device checks remain applicable when their boundary cannot be reproduced by automation.
