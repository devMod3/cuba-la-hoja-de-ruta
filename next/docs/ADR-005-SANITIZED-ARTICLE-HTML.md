# ADR-005 — HTML editorial sanitizado

**Estado:** Aceptado

El catálogo conserva HTML editorial, pero todo render público pasa por `@zenblog/content-renderer`. El paquete aplica una allowlist explícita y no depende de React/Next, de modo que su política es portable y testeable aisladamente.
