# Decisiones y supuestos — Registro inicial

| ID | Decisión | Estado | Justificación |
|---|---|---|---|
| D-01 | Next.js, TypeScript, Tailwind y shadcn/ui | Cerrada | Desarrollo rápido, App Router y SEO |
| D-02 | Supabase (Postgres/Auth/Storage) | Cerrada | Datos relacionales y flujo transaccional |
| D-03 | Pagos mediante simulador interno | Cerrada | Rúbrica oficial no exige API; priorizar checkout funcional |
| D-04 | NO afirmar que se usa sandbox externo | Cerrada | Guía del equipo propone sandbox; simulador interno es distinto |
| D-05 | Marketplace B2C/B2B mínimo | Cerrada | Comprador completo, organizador con formulario, admin aprobación |
| D-06 | Vercel + dominio propio ya existente | Cerrada | No comprar dominio nuevo |
| D-07 | Identidad visual C3; sitio académico no oficial | Cerrada | Uso de manual de marca, sin representación comercial |
| D-08 | Documentación neutral para Codex y Claude Code | Cerrada | `AGENTS.md` y Superpowers sin acoplamiento a un agente |
| D-09 | 12 categorías y 8–10 eventos demo | Cerrada | Guía de construcción y Excel |
| D-10 | Comprador invitado, organizador autenticado | Propuesta técnica | Minimizar fricción y preservar permisos de vendedor |
| D-11 | Comisión demostrativa configurable | Propuesta técnica | Fuentes no establecen porcentaje definitivo |
| D-12 | Correo transaccional externo no obligatorio v1 | Propuesta técnica | Garantizar boleto descargable y recuperable con enlace seguro; email opcional |
| D-13 | No publicar 134 páginas vacías | Cerrada | SEO: evitar contenido vacío, cumplir rutas mediante templates |

## Pendientes que no bloquean inicio

- Hostname exacto del dominio propio (necesario al configurar Vercel y DNS).
- Porcentaje de comisión académica (propuesta demo: `5 %`, configurable, marcado como **SUPUESTO**, no atribuir a C3).
- Eventos/imágenes específicos: usar 10 ejemplos ficticios identificados como demo, con precios y fechas de prueba.
- Disponibilidad de acceso a proyecto Supabase y Vercel del desarrollador; **jamás** escribir credenciales en documentación.
- Necesidad de enviar emails reales: por ahora la confirmación web y enlace seguro cumplen flujo principal; email externo es extra.

## Regla de prioridades

P0 = comprador + compra completa + QR + persistencia. P1 = experiencia vendedor/admin mínima. P2 = refinamientos, newsletter, analítica, envío de email y elementos extra.
