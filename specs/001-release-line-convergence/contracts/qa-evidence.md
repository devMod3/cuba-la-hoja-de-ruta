# Contract — ZenBlog QA Evidence

## Purpose

Make browser/Blogger validation attributable to one candidate instead of recording vague statements such as “mobile works”.

## Required header

```text
Candidate source SHA:
Candidate Blogger XML SHA-256:
Asset delivery identity:
Test date/time:
Tester:
Environment notes:
```

## Required case record

For every applicable case:

```text
Case ID:
Surface:
Viewport/device class:
Browser/engine:
Preconditions:
Steps:
Expected:
Actual:
Result: PASS | FAIL | BLOCKED
Evidence reference:
Notes:
```

## Minimum public QA cases

### Q-PUB-001 Portada desktop
Verify primary navigation, visible statement/featured content, no horizontal overflow and player boundary.

### Q-PUB-002 Portada phone portrait
At ~390 CSS px verify content fits/scroll behavior is deliberate, navigation remains accessible and player-safe spacing is correct.

### Q-PUB-003 Portada narrow phone
At ~320 CSS px verify no essential action disappears and no horizontal page overflow appears.

### Q-PUB-004 Portada short-height/landscape
Verify the accepted M-002 behavior; no content is silently clipped behind header/player.

### Q-PUB-005 Safe-area phone
Verify accepted M-001 behavior in WebKit/Safari-class environment with observable top/bottom inset.

### Q-PUB-006 Explore simple
Title-only, accent-insensitive, expected result-row semantics, bounded result scroll.

### Q-PUB-007 Explore advanced
Structured filters and sort; documentary year semantics preserved.

### Q-PUB-008 Article direct/deep-link
Real Blogger URL, readable content, no navigation corruption.

### Q-PUB-009 Article -> Portada
Return behavior works and protected player boundary is preserved.

### Q-PUB-010 About empty profile
Coherent fallback; no partial/blank surface.

### Q-PUB-011 About populated profile
Identity/social/resources render coherently; URL/image safety behavior is not weakened.

### Q-PUB-012 About first-open render
Evaluate M-003 preload/lazy strategy for visible flash/unstyled layout and reader critical-path consequences.

### Q-PUB-013 Player
Player remains independent, visible and not restyled/closed by ZenBlog.

### Q-PUB-014 Refresh/deep-link
Reload relevant routes/article without blank shell or mixed release assets.

## Admin/debug cases when affected or required for final smoke

### Q-ADM-001 Metadata
Open, edit/validate without changing protected v0.5 semantics.

### Q-ADM-002 Search Lab
Diagnostic search only; metadata is not written by Search Lab.

### Q-ADM-003 About Manager
Profile edit/save contract remains `zenSiteProfile.v1`.

### Q-ADM-004 Inspector
ON/OFF, exact node, modal, focus, href neutralization/restoration.

## Automated browser smoke

If canonicalized, the About smoke MUST:
- launch a real Chrome/Chromium binary;
- fail if no browser is available;
- use local deterministic fixture data;
- assert ready state and expected semantic sections;
- include at least one failure-path assertion if A-001 transactional rendering is under consideration;
- avoid external network dependency.

## Failure severity

P0 — corrupts Blogger anatomy/data/rollback ability.

P1 — blank/partial public route, broken navigation/article/player, security regression, major mobile unusability, release-mixing failure.

P2 — non-critical layout/accessibility regression with workaround or maintenance defect.

P3 — polish/non-blocking issue.

P0/P1 blocks VALIDATED/FROZEN.

## Evidence integrity

Screenshots are supporting evidence, not enough alone when the candidate SHA/XML cannot be identified.

A QA statement from another branch/version may guide reproduction but does not automatically validate the current candidate.
