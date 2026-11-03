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
| D-14 | Tokens C3 como variables CSS mapeadas con `@theme inline`; cabecera y pie en `data-theme="oscuro"`; texto de la etiqueta DEMO derivado por tema (`--sobre-advertencia`); fuentes con `next/font/google` | Cerrada | Aplica el design system C3 v2 sin hojas externas; la navegación navy usa el tema oscuro y la etiqueta DEMO cumple contraste en ambos temas |
| D-15 | Taxonomía en una sola tabla `categories` con `kind` (`event_type`, `topic`, `location`, `organizer`); sin tablas `topics` ni `seo_routes` en T03 | Cerrada | Evita duplicar los 21 registros de primer nivel. Las FKs compuestas `(id, kind)` impiden asignar una ciudad como tipo de evento. Las subcategorías y modalidades se resolverán en T05 |
| D-16 | Verificación de base de datos con PGlite en Vitest (`tests/db`), sin Docker | Cerrada | PGlite es Postgres real en WASM y corre en cualquier máquina. Supabase local (`supabase db reset`, `supabase test db`) queda como verificación adicional cuando Docker esté activo y se vincule un proyecto |
| D-17 | El seed no crea cuentas de Auth ni contraseñas; los organizadores DEMO no tienen propietario | Cerrada | Ninguna credencial en el repositorio. Las cuentas de prueba llegan con T14 |
| D-18 | No sembrar las páginas de organizador `/claude/` y `/copa/` del Excel | Propuesta técnica | Sus nombres pueden coincidir con marcas reales; SEO_ROUTES.md pide verificarlos antes de mostrarlos como entidades. Se activarán tras esa verificación |
| D-19 | El Home lee el catálogo con la clave pública `anon` por PostgREST, sin `service_role` en el cliente, y se regenera cada 60 s | Propuesta técnica | Cumple RLS: el público solo recibe eventos publicados. Sin variables de entorno la página muestra un estado de error en lugar de datos falsos |
| D-20 | Criterio de T04 ajustado: el Home con datos reales cuenta como terminado; los enlaces a rutas aún no construidas (categorías, fichas, buscador, `/publicar`, `/mis-boletos`, `/carrito`) quedan documentados y se resuelven en T05, T07, T14, T15 y T08 | Decisión del responsable del proyecto | Evita marcar como funcional una navegación que aún no existe. Cada tarea pendiente conserva su criterio original |
| D-22 | Rutas del catálogo con un resolvedor sobre la taxonomía: `src/app/[...segments]/page.tsx` sirve tipo (`/congresos/`), tema (`/cloud/`), ciudad (`/san-salvador/`) y tipo + tema (`/congresos/cloud/`); cualquier otro path responde 404. Los filtros de ciudad, modalidad, precio y fecha van en la URL (GET) y se aplican en memoria a hasta 200 eventos publicados y próximos. El tema va en la ruta, no en un parámetro. Un listado sin eventos muestra estado vacío. El canónico apunta a la ruta sin filtros | Propuesta técnica | SEO_ROUTES.md (secciones 2 y 4): el mismo resolvedor servirá a la ficha de T07. Con 10 eventos DEMO, filtrar en memoria es simple y verificable. Pendiente: pasar los filtros a PostgREST cuando el catálogo supere el límite, y sembrar los 36 temas anidados del Excel (hoy solo los 4 temas de primer nivel) con una migración aparte |
| D-23 | URLs con barra final: `trailingSlash: true` en `next.config.ts` | Propuesta técnica | SEO_ROUTES.md (sección 5) pide una forma de URL consistente. Sin esto, `/congresos/` redirige a `/congresos` (308) y los enlaces del menú y los canónicos apuntaban a redirecciones |

## Pendientes que no bloquean inicio

- Hostname exacto del dominio propio (necesario al configurar Vercel y DNS).
- Porcentaje de comisión académica (propuesta demo: `5 %`, configurable, marcado como **SUPUESTO**, no atribuir a C3).
- Eventos/imágenes específicos: usar 10 ejemplos ficticios identificados como demo, con precios y fechas de prueba.
- Disponibilidad de acceso a proyecto Supabase y Vercel del desarrollador; **jamás** escribir credenciales en documentación.
- Necesidad de enviar emails reales: por ahora la confirmación web y enlace seguro cumplen flujo principal; email externo es extra.

## Regla de prioridades

P0 = comprador + compra completa + QR + persistencia. P1 = experiencia vendedor/admin mínima. P2 = refinamientos, newsletter, analítica, envío de email y elementos extra.
