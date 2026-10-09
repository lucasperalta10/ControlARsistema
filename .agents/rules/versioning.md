# Regla de Versionado del Sistema ControlAR

Cada vez que se realicen cambios pequeños, ajustes o correcciones de errores (fixes), se debe incrementar la versión del sistema agregando o avanzando el sufijo alfanumérico (ejemplo: de `v1.0.5` a `v1.0.5b`, `v1.0.5c`, etc.).

Archivos donde se debe reflejar la versión de forma sincronizada:
1. `backend/package.json` (`"version"`)
2. `frontend/package.json` (`"version"`)
3. `backend/src/controllers/sistemaController.js` (`sistema.version`)
4. `frontend/src/components/layout/Header.jsx` (`<span className="header-brand-badge">`)
5. `frontend/src/pages/AcercaDe.jsx` (`Versión ...`)
6. `README.md` (`# ControlAR v...`)
7. `docs/funcionamiento_del_sistema.md` (`**Versión del Sistema:** ...`)
