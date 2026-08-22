# Data Model — Spec 001 Release-Line Convergence

This specification does not introduce an application database model. The entities below are engineering/release records used to make state, evidence and disposition explicit.

## ReleaseBaseline

Represents a known source/deployment starting point.

Fields:
- `id`: stable human label;
- `sourceSha`: Git commit for source baseline;
- `releaseLabel`: documented product/release label if any;
- `assetIdentity`: GitHub Pages release key, immutable commit pin, or equivalent;
- `bloggerXmlSha256`: exact installed/exported XML hash when known;
- `evidenceLevel`: E0-E5;
- `state`: EXPERIMENT | CANDIDATE | VALIDATED | FROZEN | HISTORICAL;
- `capturedAt`;
- `notes`.

Invariant:
`sourceSha`, `assetIdentity`, and `bloggerXmlSha256` are distinct concepts and MUST NOT be conflated.

## CandidateDelta

Represents one bounded difference being considered for convergence.

Fields:
- `id`: e.g. M-001;
- `name`;
- `productionState`: present | absent | unknown;
- `canonicalMainState`: present | absent | different;
- `symptomOrBenefit`;
- `ownerFiles`;
- `protectedNeighbors`;
- `reproductionEvidence`;
- `regressionTest`;
- `accessibilityImpact`;
- `securityImpact`;
- `criticalPathImpact`;
- `decision`: KEEP | REJECT | ADJUST | DEFER | UNRESOLVED;
- `decisionEvidence`.

Invariant:
No CandidateDelta may enter product implementation while `decision=UNRESOLVED`.

## ReleaseEvidence

Represents one verifiable observation.

Fields:
- `type`: static | unit | browser | CI | BloggerManual | artifact | acceptance;
- `timestamp`;
- `environment`;
- `sourceSha`;
- `xmlSha256` when applicable;
- `scenario`;
- `result`: PASS | FAIL | NOT_RUN;
- `reference`: test/run/file/screenshot/note identifier;
- `notes`.

Evidence level mapping:
- E1 historical documentation;
- E2 current code/static tests;
- E3 automated behavioral/browser;
- E4 attributable real Blogger QA;
- E5 accepted/frozen manifest with rollback.

Invariant:
Evidence may support a higher state only when its environment and artifact identity are attributable.

## QACase

Fields:
- `id`;
- `surface`;
- `viewportClass`;
- `browserClass`;
- `preconditions`;
- `steps`;
- `expected`;
- `result`;
- `evidenceReference`.

Invariant:
A changed risk surface cannot silently remove its applicable QACases.

## ReleaseManifest

Fields:
- `releaseLabel`;
- `canonicalSourceSha`;
- `assetDeliveryIdentity`;
- `cacheReleaseKey`;
- `bloggerXmlSha256`;
- `spec`;
- `ciRun`;
- `browserSmoke`;
- `bloggerInstallDate`;
- `qaEvidence`;
- `acceptance`;
- `rollbackXmlSha256`;
- `rollbackSourceReference`;
- `knownDebt`;
- `historicalPrDispositions`.

Invariant:
Status cannot be FROZEN unless all mandatory manifest fields are attributable and acceptance is PASS.

## RollbackPoint

Fields:
- `artifactSha256`;
- `sourceReference`;
- `capturedAt`;
- `knownState`;
- `restorationProcedure`;
- `evidenceLevel`.

Current operational rollback:
- artifact SHA-256 `42b439df1c96915a2568fce9b0a243f26196281d2c9f8afca0bb7f786df114d8`;
- captured 2026-08-22 from active Blogger theme export.

## PRDisposition

Fields:
- `prNumber`;
- `classification`: ACTIVE | EXPERIMENT | CI_ONLY | SUPERSEDED | ARCHIVED | REJECTED | DEFERRED;
- `usefulEvidence`;
- `integrationAllowed`: boolean;
- `closureReason`;
- `closureCommitOrManifest`.

Invariant:
SUPERSEDED, CI_ONLY, ARCHIVED and EXPERIMENT PRs are never wholesale merge sources under Spec 001.

## State Transitions

```text
EXPERIMENT
   |
   | bounded evidence + accepted scope
   v
CANDIDATE
   |
   | automated gates + browser/Blogger QA
   v
VALIDATED
   |
   | Product Owner acceptance + manifest + rollback
   v
FROZEN
```

Failure at CANDIDATE/VALIDATED returns work to CANDIDATE or triggers rollback; it never advances by assumption.
