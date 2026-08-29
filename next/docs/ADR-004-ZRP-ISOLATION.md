# ADR-004 — Aislamiento de ZRP

**Estado:** Aceptado

ZRP permanece detrás de `@zenblog/zrp-adapter` y su integración en la aplicación se limita al composition root de Web. Ningún refactor general debe modificar su contrato o comportamiento incidentalmente.
