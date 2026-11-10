# Evidencias visuales — sitio final

Capturas generadas el 2026-11-10 desde el build local de cierre, a partir de datos DEMO. Cada pantalla se capturó en viewport móvil (390 × 844) y escritorio (1280 × 900). Se cerró el aviso de consentimiento antes de capturar. No se enviaron formularios ni se crearon órdenes durante esta captura.

- `01-home-desktop.png` — 561 KB.
- `01-home-movil.png` — 495 KB.
- `02-categoria-desktop.png` — 206 KB.
- `02-categoria-movil.png` — 212 KB.
- `03-evento-desktop.png` — 325 KB.
- `03-evento-movil.png` — 216 KB.
- `04-carrito-desktop.png` — 128 KB.
- `04-carrito-movil.png` — 115 KB.
- `05-checkout-desktop.png` — 139 KB.
- `05-checkout-movil.png` — 115 KB.

La confirmación final queda pendiente: la corrida real creó una orden DEMO, pero el entorno remoto rechazó registrar la notificación del boleto por una restricción del outbox. No se conserva un token de confirmación; no se repitió la compra. Consultar `docs/testing/ACCEPTANCE.md` y resolver/aplicar las migraciones F6 autorizadas antes de completar esa captura.