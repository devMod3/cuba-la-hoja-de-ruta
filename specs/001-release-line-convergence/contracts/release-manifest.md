# Contract — ZenBlog Release Manifest

A release is not FROZEN until one manifest satisfies this contract.

## Required fields

```text
Release label:
Status: CANDIDATE | VALIDATED | FROZEN
Spec:
Canonical source SHA:
Asset delivery identity:
Cache/release key:
Blogger XML SHA-256:
Blogger installation date/time:
CI workflow/run:
Automated test result:
Browser smoke result:
Real Blogger QA result:
Product Owner acceptance:
Rollback XML SHA-256:
Rollback source/reference:
Known debt:
Historical PR dispositions:
```

## Field rules

### Canonical source SHA
Must be a full Git commit SHA. Branch names are insufficient.

### Asset delivery identity
Must identify what browser clients actually fetch. Examples:
- immutable Git commit pin;
- explicitly documented versioned artifact path.

A mutable branch name alone is invalid.

### Cache/release key
Must be coherent across the active public dependency graph when query-key versioning is used.

### Blogger XML SHA-256
Must be calculated from the exact candidate XML before/at installation. After Blogger export/serialization, an exported hash may differ; record the relationship rather than claiming byte equality.

### CI workflow/run
Must identify an actual completed run and result for the candidate source SHA.

### Browser smoke
Must state PASS/FAIL/NOT_APPLICABLE with exact test/reference. A silently skipped browser is not PASS.

### Real Blogger QA
Must refer to the QA Evidence contract and include attributable candidate source/XML identity.

### Acceptance
FROZEN requires explicit Product Owner acceptance. CI/merge cannot substitute.

### Rollback
Must identify an exact recoverable XML artifact/hash and source reference.

## Freeze rule

FROZEN is permitted only when:

```text
CI = PASS
AND required browser smoke = PASS
AND Blogger QA = PASS
AND Product Owner acceptance = PASS
AND rollback artifact is known
AND no unresolved P0/P1 release blocker remains
```

## Current pre-change rollback

As of 2026-08-22:

```text
SHA-256:
42b439df1c96915a2568fce9b0a243f26196281d2c9f8afca0bb7f786df114d8

Meaning:
Exact Blogger theme exported from the current active deployment before Spec 001 product convergence changes.
```
