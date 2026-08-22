# ZenBlog v0.9 — Historical Evidence

This directory preserves LAB-era records required by Spec 001 so their evidence can survive branch/PR cleanup without being mistaken for current truth.

## Authority warning

These documents are **HISTORICAL**.

They MAY be used to:
- reconstruct intended historical gates;
- trace release-pin and QA assumptions;
- explain lineage and prior operational decisions.

They MUST NOT be used to claim:
- current Blogger deployment state;
- current candidate QA PASS;
- current CI PASS;
- Product Owner acceptance;
- canonical release identity.

Current source/deployment/release authority remains the live repository plus the current Spec 001 evidence and Release Manifest.

## Preserved records

### `QA-v0.9.md`

Historical 10-area Blogger smoke checklist.

Source snapshot: `aa372e1cc7982d1f8335d0d21760869c396b32c3`
Original blob SHA: `d8abd9ae2e93fe9a65ff4bf26f19887f2ac31987`

### `RELEASE-v0.9-LAB.md`

Historical immutable LAB release-pin record. It documents the rule against mixing unmerged LAB XML with mutable GitHub Pages `main` assets.

Source snapshot: `aa372e1cc7982d1f8335d0d21760869c396b32c3`
Original blob SHA: `708cea975f668cf24414965404142bf49e773b43`

### `STATUS-v0.9.md`

Historical hardening checkpoint listing what that LAB considered implemented and what still remained before stability.

Source snapshot: `aa372e1cc7982d1f8335d0d21760869c396b32c3`
Original blob SHA: `cb5c96691066bf6e7b804262b3a21fa41970dff7`

## Spec 001 disposition

Preservation of these records satisfies the evidence-preservation prerequisite for later classification/closure of historical PRs. It does **not** by itself authorize closing any PR or implementing any candidate delta.
