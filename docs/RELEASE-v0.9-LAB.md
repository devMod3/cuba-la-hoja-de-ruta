# ZenBlog v0.9 LAB release pin

The Blogger test theme must never mix GitHub Pages `main` assets with unmerged LAB code.

Current immutable asset commit:

`feaa8f561295204edbe1fa15d13a341899602fdd`

`blogger/theme.xml` is a deployable LAB shell pinned to that exact commit through jsDelivr. The pin covers public JS, public CSS, runtime loader, fallback favicon and social card. The radio player remains independently versioned and protected.

Reason: GitHub Pages publishes `main`; using `devmod3.github.io/cuba-la-hoja-de-ruta/...` from an unmerged LAB branch can combine a new XML shell with old assets and produce blank Home/About views.
