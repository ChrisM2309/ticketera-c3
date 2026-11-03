# Ticketera C3 — Design spec v1

**Estado:** alcance acordado; detalles de ingeniería implementables; cambios mediante ADR/decisiones.  
**Lecturas:** `docs/product/PRD.md`, `docs/architecture/SYSTEM.md`, `docs/architecture/DATA.md`, `docs/architecture/SEO_ROUTES.md`, `docs/design/DESIGN.md`.

## Problema

Se necesita una demostración académica convincente de marketplace de eventos tech con cinco pantallas de ecommerce y al menos dos actores. El trabajo debe priorizar decisiones de UX, SEO y mercadeo, pero el sitio debe tener un flujo funcional comprobable.

## Solución elegida

Next.js + TypeScript + Tailwind/shadcn, Supabase relacional y Vercel. Diez eventos académicos sembrados en base de datos. Comprador sin login; organizador con login; admin aprueba. Pago simulado en servidor que guarda órdenes, resultados de pago y tickets QR. Una compra contiene entradas de un solo evento para reducir el alcance.

## Alcance obligatorio

1. Home orientado a eventos y navegación por categorías basada en Excel.
2. Taxonomía por tipos, temas, ciudades y organizadores; rutas dinámicas con SEO.
3. Fichas con agenda, boletos, modalidad, detalles y CTA.
4. Carrito y checkout invitado con precios transparentes y resultados demo.
5. Confirmación con QR descargable.
6. Publicación mínima de organizador con aprobación admin.
7. Deploy, responsive, tres pruebas transaccionales y evidencias de exposición.

## Contratos de interfaz

Componentes principales: `SiteHeader`, `SiteFooter`, `EventCard`, `EventFilters`, `TicketSelector`, `CartSummary`, `AttendeeForm`, `DemoPaymentSelector`, `TicketCard`, `OrganizerEventForm`, `AdminReviewTable`.

Mantener la marca C3 **solo como estética académica**, con etiqueta clara de demostración.

## Datos y seguridad

Postgres con migraciones; tipos en centavos USD; RLS; mutaciones de órdenes en servidor y transacciones contra sobreventa. Tokens seguros para confirmación y QR. Ningún dato bancario real.

## Ruta de validación

Una persona navega evento gratuito y recibe un QR; otra simula pago aprobado y recibe QR; pago rechazado no genera boleto; organizador publica tras aprobación. Todo verificable en DB y en versión móvil.

## Trade-offs explícitos

- Sin pasarela externa para mantener el alcance mínimo; la guía del equipo recomienda sandbox, pero rúbrica oficial no lo exige.
- Sin login de asistentes para reducir fricción.
- Sin liquidaciones B2B, analytics avanzados ni correo transaccional obligatorio.
- Sin 134 landings vacías; dataset de arquitectura conservado, páginas indexables solo con inventario.
- Sin marketplace multi-evento por carrito en v1 (sí múltiples entradas del mismo evento).

## Siguientes pasos

Seguir `docs/superpowers/plans/implementation-backlog.md` por tareas y dependencias, verificar pruebas y actualizar estado/evidencia. Sin fechas asignadas ni funcionalidades improvisadas.
