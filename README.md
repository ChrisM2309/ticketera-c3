# Ticketera C3 — Base de planificación (proyecto académico)

> **Estado:** la aplicación Next.js está en producción en [demo.ticketera.c3.com.sv](https://demo.ticketera.c3.com.sv). Las tareas T01–T18 (T10 con la prueba de concurrencia real pendiente) y T23 del backlog están terminadas. Las nuevas áreas se documentan en [`docs/analisis/2026-11-09-brechas-y-requerimientos.md`](docs/analisis/2026-11-09-brechas-y-requerimientos.md) y se ejecutan según [`docs/superpowers/plans/2026-11-09-roadmap-nuevas-areas.md`](docs/superpowers/plans/2026-11-09-roadmap-nuevas-areas.md).

Ticketera C3 es un prototipo funcional de marketplace B2C/B2B para descubrir, comprar y publicar eventos tecnológicos en El Salvador. El estilo visual se basa en la identidad de Competitive Coding Club (C3), pero **no es una iniciativa ni servicio oficial de C3**.

## Decisiones

- **Frontend y backend web:** Next.js (App Router), TypeScript y Tailwind CSS; shadcn/ui para componentes.
- **Persistencia:** Supabase PostgreSQL, Auth y Storage. Las operaciones de compra son reales contra la base de datos; los cobros son **simulados**.
- **Despliegue:** Vercel + dominio propio ya existente (hoy en `demo.ticketera.c3.com.sv`; el dominio final `ticketera.c3.com.sv` está decidido pero aún no está activo; no comprar uno nuevo).
- **Asistentes:** compra invitada (sin cuenta). **Organizadores:** inicio de sesión y formulario básico de evento. **Administrador:** aprobación manual.
- **Agentes:** documentación general para Codex y Claude Code. Superpowers como metodología; instalación particular por herramienta fuera del repositorio.
- **Seguimiento:** backlog por funcionalidades y dependencias, sin planificación por días.

## Cómo se utiliza el paquete

1. Leer [AGENTS.md](AGENTS.md), que contiene las instrucciones operativas para cualquier agente.
2. Leer [PRD](docs/product/PRD.md) y [especificación de diseño](docs/superpowers/specs/2026-11-02-ticketera-design.md).
3. Revisar [arquitectura](docs/architecture/SYSTEM.md), [modelo de datos](docs/architecture/DATA.md) y [rutas SEO](docs/architecture/SEO_ROUTES.md).
4. Revisar [backlog de implementación](docs/superpowers/plans/implementation-backlog.md) y [criterios de prueba](docs/testing/ACCEPTANCE.md).
5. Inicializar el proyecto Next.js y agregar los documentos a su raíz. No sobrescribir documentación aprobada sin explicar el cambio.
6. Instalar Superpowers en el entorno de cada agente que se vaya a usar y comprobar que se encuentre activo.
7. Elegir tareas disponibles por dependencias, completar cada funcionalidad con sus pruebas y actualizar el estado del backlog. Investigación, wireframes y mercadeo pueden avanzar en paralelo.

## Prioridades de trabajo

- **P0:** catálogo, ficha, carrito, checkout, persistencia y QR, más despliegue y revisión.
- **P1:** publicación mínima del organizador y aprobación del administrador.
- **P-A:** entregables académicos (UX, wireframes, SEO, marketing y PPT); indispensables para la materia, aunque pueden producirse en paralelo.
- **P2:** mejoras no necesarias para demostrar el MVP.

No se asignan días ni duraciones. Se avanza según las dependencias y criterios de terminado de cada tarea.

## Fronteras

**Incluido:** catálogo, navegación SEO, filtros, evento, carrito, compra gratuita, pago simulado aprobado/rechazado, orden persistida, boletos QR, organizador básico, aprobación, metadatos SEO, despliegue.

**Excluido:** dinero real, tarjetas reales, payouts, facturas fiscales, reembolsos automáticos, cupones complejos, marketplace multi-moneda, analítica financiera, app nativa y 134 páginas vacías.

## Fuente de requerimientos

1. `Comercio Electronico - Proyecto Final (1).pdf` — rúbrica oficial: entregables de negocio, UX, SEO y mercadeo; no exige API de pago externa.
2. `Ticketera · Guía para construir el sitio web.pdf` — interpretación de construcción del equipo: 5 pantallas, carrito funcional, 3 compras de prueba, 8–10 eventos, QR, SEO.
3. `Ticketera_C3_Proyecto_final.pptx` — modelo B2B/B2C, buyer personas, alcance visual y estructura SEO.
4. `Avance 2 - proyecto mercadeo.xlsx` → pestaña `ARQUITECTURA ` — slugs y taxonomía: 1 Home + 21 páginas de primer nivel + 36 temas + 76 páginas de modalidad = 134 rutas propuestas.
5. `MANUAL DE MARCA C3 FINAL.pdf` — sistema cromático y tipografías.

Las cifras de keywords y buyer personas son datos del equipo académico (algunos declarados como estimaciones por validar). No presentarlas como resultados propios de medición técnica.

## Reglas de demostración

- Etiquetar sitio, eventos y pagos como **DEMO / Proyecto académico**.
- Nunca capturar números de tarjetas ni promover una transacción monetaria real.
- Las compras de demostración escriben órdenes y boletos en la base de datos para validar el funcionamiento.
- No afirmar que existe una integración de pasarela externa, porque no forma parte de esta primera versión.
- No afirmar que se realizaron entrevistas/testeos hasta guardar resultados genuinos.
