# PRD — Ticketera C3 v1

**Fecha base:** 2026-11-02  
**Organización:** por tareas, áreas y prioridades, sin fechas asignadas  
**Naturaleza:** prototipo académico, NO producto real de C3.

## 1. Problema y propuesta

Un marketplace dedicado a descubrir eventos de tecnología en El Salvador y permitir que comunidades/organizadores los publiquen. El catálogo se ordena por intención de búsqueda y el flujo B2C prioriza compras de bajo esfuerzo, especialmente móvil. El modelo económico académico combina publicación gratis, comisión solo por entradas vendidas y servicios B2B adicionales presentados en la estrategia; los cobros de destacados y paquetes siguen siendo simulados.

## 2. Audiencias del material del equipo

- **Diego, estudiante:** busca entradas gratuitas o económicas; valora compartir invitación y baja fricción.
- **Andrea, profesional junior:** necesita agenda detallada, señales de confianza y claridad de precios.
- **Carlos, líder de comunidad:** quiere publicar sin cuota fija.
- **Gabriela, organización/empresa:** quiere datos de asistentes, menor no-show y potencial uso de QR.

Estas personas y sus porcentajes son material del equipo, con varios valores aún pendientes de validar mediante entrevistas. No presentarlos como investigación concluida.

## 3. Historias de usuario P0

| ID | Como | Necesito | Se acepta cuando |
|---|---|---|---|
| B-01 | visitante | ver eventos próximos | Home lista eventos DEMO ordenados y con precio/fecha/modalidad |
| B-02 | visitante | encontrar por categoría/tema | 12 categorías, filtros y rutas limpias |
| B-03 | visitante | decidir si comprar | ficha incluye agenda, hora, organizador, precio y tipo de boleto |
| B-04 | visitante | seleccionar entradas | carrito actualiza cantidad y calcula total en servidor |
| B-05 | visitante | registrarme gratis | orden cero confirmada sin cuenta ni pasarela |
| B-06 | visitante | comprar entrada de pago | elijo resultado de pago demo; se persiste orden y estado |
| B-07 | asistente | obtener boleto | confirmación protegida, QR individual y descarga/impresión |
| B-08 | visitante | usar el móvil | flujo usable desde viewport de celular, sin horizontal scroll |

### Cuenta de comprador (opcional)

La cuenta es opcional: la compra como invitado no cambia (D-37). Historias de la Fase 3 (CP-03, CP-04 y CP-08 del análisis):

| ID | Como | Necesito | Se acepta cuando |
|---|---|---|---|
| C-01 | comprador | crear una cuenta y recuperar mi contraseña | registro e inicio de sesión con Supabase Auth; «Olvidé mi contraseña» responde igual exista o no el correo; el perfil siempre es `buyer` |
| C-02 | comprador con cuenta | ver mis boletos y mis compras | «Mis boletos» lista solo mis órdenes, con su QR y su estado; sin sesión redirige a `/ingresar/` |
| C-03 | comprador | pagar con mis datos precargados y reclamar compras de invitado | el checkout precarga nombre y correo; una orden de invitado solo se liga si su correo coincide con el de la cuenta y tengo su enlace de confirmación |

## 4. Historias de usuario P1

| ID | Como | Necesito | Se acepta cuando |
|---|---|---|---|
| S-01 | organizador | iniciar sesión | autenticación segura mediante Supabase Auth |
| S-02 | organizador | proponer un evento | formulario guarda el evento pendiente de revisión, con precio/cupos |
| S-03 | organizador | ver estado de publicación | lista básica de eventos propios y registros agregados |
| A-01 | admin | publicar un evento pendiente | aprueba/rechaza; solo aprobados aparecen en catálogo |
| S-04 | organizador | destacar un evento | selecciona días, revisa el total calculado en servidor y elige un resultado de pago DEMO |
| S-05 | organizador | contratar un paquete empresarial | ve beneficios configurables, compra con pago DEMO y consulta días/eventos restantes |
| A-02 | admin | gestionar destacados y seguimientos | crea destacados manuales, revisa solicitudes pagadas y responde seguimientos |
| S-06 | organizador | registrar entradas por QR o código | solo mis eventos (o admin); orden confirmada; cada boleto se registra una vez, sin datos personales en pantalla |
| S-07 | organizador | consultar resultados del evento | emitidos, ingresos, subtotal y comisión agregados; no-show después del fin y con emitidos; cantidad y promedio de encuestas |
| S-08 | organizador con paquete | consultar y exportar el reporte superior | paquete `active` del dueño o admin; emisión diaria UTC y desglose por tipo, CSV sin datos de compradores |
| A-03 | admin | editar contenido y revisar métricas | blog y textos/FAQ de categorías con borrador/publicado; métricas agregadas solo admin |
| A-04 | admin | preparar la indexación | interruptor en `/admin/ajustes/`, apagado por defecto; páginas privadas excluidas incluso al encenderlo |

### Encuesta y analítica

El comprador con enlace válido de orden confirmada puede responder una encuesta DEMO una vez por orden: nota 1–5 y comentario opcional, sin pedir nombre ni correo adicionales. La invitación solo se registra en el outbox, dos horas después del fin del evento (o inicio si no hay fin). La apertura actual del formulario usa el inicio del evento; queda pendiente resolver esa diferencia con el objetivo post-evento (D-64).

La analítica propia requiere consentimiento previo tanto en navegador como en servidor; registra eventos con identificador seudónimo y ofrece totales al administrador. No implica analítica comercial avanzada ni resultados de tráfico o conversión ya medidos. Retención, rutas sensibles y cobertura de eventos admitidos requieren revisión (D-66).

### Simplificaciones B2B

Sin payout, calendario recurrente o facturación electrónica. La publicación de eventos es gratuita; los destacados por día y el paquete empresarial tienen precio configurable y cobro simulado, sin campos de tarjeta. La tarifa diaria y el precio anual quedan por definir por el responsable en `/admin/ajustes/`; los beneficios iniciales son supuestos DEMO configurables. La Fase 6 incorpora el reporte superior con CSV; actualmente el permiso comprueba `status = active`, sin fechas ni `advancedReport` de la instantánea (D-65).

## 5. Pantallas mínimas de la materia

1. **Home:** logo (sin enlace `Inicio`), 12 tipos de evento navegables, búsqueda, banner destacado, próximos eventos, categorías, gratuitos, CTA publicar, footer.
2. **Categoría:** breadcrumb, H1 basado en keyword, descripción, filtros de tema/modalidad/fecha/precio/ciudad, tarjetas y texto SEO inferior.
3. **Producto/evento:** breadcrumb, imagen, fecha, modalidad, organizador, entradas y CTA visible, agenda y ponentes, precio total y señales de confianza, relacionados.
4. **Carrito/pago:** selección, cantidades, precios, comisión visible, datos de invitado, acción de registro gratis o pago **demo**.
5. **Confirmación:** orden, QR/boletos, descarga, calendario, compartir en WhatsApp y relacionados cuando sea factible.

## 6. Funcionalidad y comportamiento

- `Event`: draft/pending/published/archived; categoría principal y tema; modalidad virtual/presencial; ubicación cuando aplica.
- `TicketType`: gratis o de pago, precio en centavos, cupo, cantidad por pedido, nombre y vigencia.
- `Cart`: guardar temporalmente en browser; totales definitivos recalculados al crear orden.
- `Order`: estado pendiente/confirmada/fallida/cancelada, email de comprador, partidas y totales inmutables.
- `Payment`: simulador interno, que permite aprobar/fallar únicamente vía handler de servidor.
- `Ticket`: uno por entrada confirmada, token QR no secuencial, posibilidad de recuperación segura.
- `Organizer`: tiene cuenta; propone y consulta sus eventos. `Admin` revisa.

**Restricción MVP:** para reducir complejidad, carrito para **un evento por compra**, con distintos tipos de boleto y cantidades. La interfaz debe explicitarlo. Marketplace multiproducto multi-evento queda fuera de v1.

## 7. Alcance deliberadamente excluido

- Cobros reales, tarjetas, webhooks externos, transferencias a vendedores, impuestos/facturación legal real.
- reembolsos, descuentos automáticos, reserva de asientos, niveles VIP especiales.
- 134 páginas vacías, analítica comercial avanzada y envío masivo de newsletters. Sí se incluyen la analítica propia con consentimiento y los reportes agregados del evento.

## 8. Requisitos no funcionales

- Interfaz en español, accesible por teclado, responsive, imágenes optimizadas.
- Metadata, URLs coherentes y datos estructurados en eventos donde correspondan.
- RLS, permisos separados, no exposición de secretos, inputs validados.
- SEO: renderizado en servidor, sitemap para URLs publicables y noindex donde corresponda.
- Comprobación por pruebas unitarias y E2E: compra gratis, aprobada y rechazada.

## 9. Entregables académicos fuera del código

**Rúbrica oficial:** nombre, modelo, propuesta de valor, buyer personas, dominio/hosting con precios, plataforma recomendada, wireframes de cinco pantallas, investigación, árbol de categorías, flujo, resultados de test, keyword research, estrategia SEO, canales, objetivos SMART, presupuesto publicitario, estrategia orgánica, proyección de visitas/conversiones/ventas/ticket promedio/ROAS, PPT y respaldos; exposición 15–20 min. No afirmar que investigación/entrevistas ya ocurrió si sigue pendiente.

**Guía equipo:** 8–10 eventos, checkout funcional, tres compras de prueba, QR, responsive, capturas competencia y video corto de respaldo. La guía pide sandbox externo; esta implementación solo simula pagos, por decisión informada del usuario. Si el equipo decide exigir el sandbox, es un cambio de alcance.

**Alcance de desarrollo revisado por el responsable:** el cierre conserva verificación técnica, documentos del sitio y capturas del sitio final; la activación tiene una lista manual mínima. Se retiran la conversión de wireframes a fotos, investigación UX, entregables de marketing, diapositivas y ensayo/presentación del trabajo de desarrollo. El equipo prepara sus entregables académicos; esta documentación no acredita su realización ni modifica la rúbrica.

## 10. Éxito

Un visitante puede completar el recorrido desde Home hasta QR; el estado persiste en Supabase y el vendedor puede proponer un evento aprobado por admin. La demostración en celular funciona, se registran las tres pruebas de compra y la presentación justifica las decisiones UX/SEO con los datos existentes del equipo.
