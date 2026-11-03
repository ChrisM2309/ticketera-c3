# Diseño visual y UX — Ticketera C3

## Principios

Apariencia técnica, limpia y profesional, basada en el manual C3. No confundir demostración académica con un servicio comercial de la organización.

## Tokens

| Token | Valor | Uso |
|---|---|---|
| `navy` | `#0F203E` | textos fuertes, navbar, fondo hero |
| `blue` | `#205298` | enlaces y elementos primarios |
| `violet` | `#4F5BA9` | badges/acentos secundarios |
| `teal` | `#33BEAC` | CTA de compra, estados elegidos |
| `font-heading` | Montserrat | títulos, enlaces principales y botones |
| `font-body` | Poppins | textos, labels y formularios |

Las combinaciones de colores deben pasar revisión de contraste. CTA turquesa con texto navy oscuro, no blanco por defecto. Evitar degradados sobre el logotipo, deformaciones y recoloraciones no autorizadas.

## Estructura visual

- Catalog-first: la primera pantalla presenta eventos y categoría/búsqueda, no historia institucional.
- Fotos grandes, cards de eventos con fecha, lugar/modalidad, nombre, organizador, precio; imagen optimizada.
- Superficies claras en catálogo y compra, navy para navegación y acentos.
- CTA de compra visible en la parte alta de la ficha y en móvil.
- Indicar `DEMO — proyecto académico` discretamente pero claramente en header/footer y checkout.

## Pantallas y bloques

### Home

Navbar logo, categorías, búsqueda, publicar, carrito/mis boletos. Hero con evento demo destacado y CTA; buscador por tipo/tema/ciudad/gratis; próximos 6–10 eventos; 12 categorías; bloque gratuitos; CTA organizador; footer con legales de demostración.

### Categoría/subcategoría

Breadcrumb, H1, 2–3 líneas SEO, chips por subtemas, panel filtros (fecha, modalidad, ciudad, gratis/de pago), cards ordenadas por fecha, texto y FAQ contextual. Estado vacío amigable sin mentir sobre eventos disponibles.

### Evento

Breadcrumb, cover, resumen con fecha/hora/lugar/organizador, CTA de tipos de boleto y cantidad por encima del fold, comisión visible, detalles de agenda, ponentes demo, relacionados. No mostrar 'últimos 2 cupos' si es falso.

### Carrito + checkout

El carrito de un solo evento permite múltiples tipos de ticket. Mostrar ítems, subtotal, comisión (configurable), total, nombre y correo obligatorios. Si es gratis: `Confirmar registro`. Si hay importe: selector `Simular pago aprobado / rechazado` y botón `Finalizar compra DEMO`. No mostrar ni pedir tarjeta real.

### Confirmación

Estado confirmado, número de orden público no secuencial, una tarjeta por boleto con QR, descarga/impresión, archivo de calendario si cabe en P1, compartir enlace público del evento por WhatsApp, relacionados. En error, estado explícito y CTA reintentar.

### Publicar evento / admin

Formulario básico 2 pasos (información + boletos), previsualización y enviar a revisión. Admin una tabla pendientes y aprobar. Dashboard organizador con lista y total de registros; nada de estadísticas avanzadas.

## Responsive y accesibilidad

Breakpoint móvil obligatorio. Formularios con label, errores próximos al campo, foco visible, botones táctiles amplios, sin scroll horizontal. No depender exclusivamente del color para estados. Teclado completo para selector de tickets/filtros/modales.

## Copy

Español salvadoreño comprensible: `Explorá eventos`, `Ver evento`, `Comprar entrada`, `Registrarme`, `Publicar evento`, `Tu entrada está confirmada`, `Pago de demostración`. Tono sobrio y sin exageraciones.
