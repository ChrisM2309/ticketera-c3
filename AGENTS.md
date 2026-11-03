# AGENTS.md — Ticketera C3

## Qué construimos

**Ticketera C3** es un marketplace **académico** para descubrir, comprar y publicar eventos tecnológicos en El Salvador. Toma el estilo visual de C3, pero **no es un producto ni servicio oficial de C3**.

Hay tres roles:
- **Comprador:** explora eventos, filtra, selecciona entradas, compra como invitado y recibe boletos QR.
- **Organizador:** inicia sesión, propone un evento con tipos de entrada y consulta su estado.
- **Administrador:** revisa y aprueba eventos. Solo los publicados aparecen en el catálogo.

El pago es **simulado**, pero las órdenes, sus estados y los boletos se guardan realmente en Supabase. No hay cobros reales ni captura de números de tarjeta.

## Stack y estructura

- **Web:** Next.js App Router, TypeScript estricto, Tailwind CSS y shadcn/ui.
- **Backend:** Route Handlers/Server Actions de Next.js y Supabase (PostgreSQL, Auth, Storage).
- **Deploy:** Vercel con dominio existente; no comprar uno nuevo.
- **Idioma:** español. **Moneda:** USD (montos almacenados en centavos enteros).

Ubicación esperada del código:

```text
src/app/               rutas, páginas y acciones de servidor
src/components/        UI compartida y layouts
src/features/catalog/  categorías, búsqueda, filtros y eventos
src/features/checkout/ carrito, órdenes y pago demo
src/features/ticketing/ confirmaciones y boletos QR
src/features/organizers/ publicación y administración mínima
src/lib/supabase/      clientes de Supabase server/browser
src/lib/seo/           metadatos, sitemap, resolvedor de URLs
supabase/migrations/   estructura SQL versionada y permisos
supabase/seed.sql      eventos y organizaciones DEMO
tests/                 pruebas automatizadas
```

## Documentos de referencia

1. `README.md`: alcance y puesta en marcha.
2. `docs/product/PRD.md`: historias de usuario y requisitos.
3. `docs/superpowers/plans/implementation-backlog.md`: **fuente de verdad de las tareas, prioridades, dependencias y progreso**.
4. `docs/architecture/{SYSTEM,DATA,SEO_ROUTES}.md`: arquitectura, base de datos, rutas.
5. `docs/design/DESIGN.md`: tokens de C3 y pantallas.
6. `docs/checkout/DEMO_PAYMENT.md` y `docs/testing/ACCEPTANCE.md`: pagos demo y validación.

Los documentos pueden ampliarse conforme se implemente. Registrar decisiones que cambien el alcance en `docs/DECISIONS.md`. Requisitos del usuario y rúbrica oficial prevalecen sobre suposiciones del plan.

## Cómo trabajar

1. **Elegir una tarea disponible** del backlog: sus dependencias deben estar completas. Seguir P0 antes de ampliar P1/P2; las tareas independientes pueden avanzar en paralelo sin editar los mismos archivos.
2. **Leer los documentos relacionados** y revisar el estado de Git antes de editar. Para cambios importantes, definir primero una especificación/plan pequeño siguiendo Superpowers cuando esté disponible.
3. **Implementar de forma incremental** y añadir pruebas para la lógica importante. No crear páginas, APIs, bibliotecas o funcionalidades ajenas al alcance sin justificarlo.
4. **Verificar de verdad**: ejecutar los comandos disponibles (`lint`, `typecheck`, `test`, `build` y E2E cuando corresponda). No afirmar que algo funciona si no se ha probado.
5. **Actualizar el backlog**: marcar completada solo la tarea que pasó sus criterios; registrar resultado, evidencia y bloqueos. No calcular avance por días ni fechas.

Estas reglas son compartidas por Codex, Claude Code y cualquier agente que trabaje en el repositorio.

## Reglas técnicas y de producto

- Los **precios, comisiones y cupos se validan en servidor**; nunca confiar en el total del navegador.
- Confirmar una orden y emitir sus boletos de manera **atómica e idempotente**: sin sobreventa ni duplicados tras reintentos.
- La compra gratuita confirma sin pasarela; un pago demo rechazado no emite boletos ni consume inventario.
- Tokens de QR y enlaces de confirmación no deben ser predecibles ni revelar datos personales.
- Habilitar RLS; los organizadores solo acceden a sus propios eventos y el rol admin se comprueba en servidor.
- No exponer secretos (`service_role`, contraseñas, credenciales) al cliente, al repositorio ni en documentación. Validar entradas en servidor.
- Usar los **slugs y el orden de las 12 categorías del Excel**. No crear las 134 páginas vacías: servir rutas útiles desde plantillas dinámicas.
- El logo lleva al Home; no añadir «Inicio» al menú. Mostrar eventos desde la primera pantalla y mantener el checkout simple en móvil.
- Estilo C3: navy `#0F203E`, azul `#205298`, violeta `#4F5BA9`, turquesa `#33BEAC`; Montserrat y Poppins. Etiquetar claramente el sitio y los pagos como **DEMO**.
- No inventar entrevistas, métricas, estadísticas, afiliaciones ni pruebas de usuarios. SEO y marketing deben basarse en los documentos o en evidencia registrada.

## Definición de terminado

Una tarea está terminada cuando cumple sus criterios de aceptación, tiene las pruebas pertinentes ejecutadas y sus cambios quedan documentados. La aplicación está lista para la demostración cuando se puede recorrer **Home → categoría → evento → carrito → checkout → orden → boleto QR**, tanto gratis como con pago demo aprobado/rechazado; y existe un flujo mínimo de publicación/aprobación de eventos. La entrega académica se valida aparte en el backlog.

<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
