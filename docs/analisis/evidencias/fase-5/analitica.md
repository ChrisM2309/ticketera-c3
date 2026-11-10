# Analítica propia DEMO

La aplicación mide únicamente después de que la persona acepta «Aceptar analítica». Los eventos definidos son:

| Evento | Uso académico |
|---|---|
| `page_view` | visitas a páginas públicas |
| `event_view` | reservado para vistas de ficha |
| `begin_checkout` | inicio del checkout |
| `purchase_confirmed` | conversión de una orden confirmada |
| `featured_purchased` | compra DEMO de destacado aprobada |
| `package_purchased` | compra DEMO del paquete aprobada |
| `check_in` | reservado para control de acceso |

No se guardan correo, IP ni agente de usuario. El identificador anónimo se crea solo al aceptar y se guarda en una cookie HTTP-only. El panel `/admin/metricas/` consulta el resumen mediante una función SQL exclusiva del administrador.
