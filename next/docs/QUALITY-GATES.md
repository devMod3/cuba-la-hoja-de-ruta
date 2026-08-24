# Quality gates

A change is not releasable unless applicable gates pass:

1. Format check.
2. ESLint with zero warnings.
3. TypeScript strict typecheck.
4. Unit and contract tests.
5. Production build.
6. Playwright Chromium, Firefox, WebKit and mobile WebKit.
7. Runtime validation for external data.
8. Accessibility checks before feature parity acceptance.
9. Security/dependency review before production cutover.
10. Measured performance evidence for performance claims.
11. Blogger Real or target-host QA when browser automation cannot reproduce the production boundary.
12. Explicit Product Owner acceptance before freeze/cutover.
