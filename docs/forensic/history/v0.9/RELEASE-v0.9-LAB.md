# HISTORICAL — ZenBlog v0.9 LAB release pin

> **FOR FORENSIC REFERENCE ONLY.** This record describes a historical LAB release-pin state. It is not current release authority and does not define the canonical v0.9.2 release.
>
> Source snapshot: `aa372e1cc7982d1f8335d0d21760869c396b32c3`
> Original path: `docs/RELEASE-v0.9-LAB.md`
> Original blob SHA: `708cea975f668cf24414965404142bf49e773b43`

---

# ZenBlog v0.9 LAB release pin

The Blogger test theme must never mix GitHub Pages `main` assets with unmerged LAB code.

Current immutable asset commit:

`feaa8f561295204edbe1fa15d13a341899602fdd`

`blogger/theme.xml` is a deployable LAB shell pinned to that exact commit through jsDelivr. The pin covers public JS, public CSS, runtime loader, fallback favicon and social card. The radio player remains independently versioned and protected.

Reason: GitHub Pages publishes `main`; using `devmod3.github.io/cuba-la-hoja-de-ruta/...` from an unmerged LAB branch can combine a new XML shell with old assets and produce blank Home/About views.
