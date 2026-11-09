# Producto: Ticketera C3

## Qué es

Un marketplace para descubrir, comprar y publicar eventos de tecnología en El Salvador. Es un proyecto académico con pagos simulados: se etiqueta como DEMO y no es un servicio oficial de C3.

## Qué debe lograr el visitante

Encontrar el evento que busca y poder comprarlo. Ese es el trabajo principal del sitio, de la portada a la entrada comprada, con el menor número de pasos posible.

## Personas

Son las dos personas compradoras del material del equipo. El sitio no excluye a nadie con interés en tecnología; estas dos guían las decisiones de diseño.

- **Diego, estudiante.** Busca entradas gratuitas o económicas. Valora la poca fricción y poder compartir la invitación.
- **Andrea, profesional junior.** Necesita agenda detallada, señales de confianza y precios claros antes de comprar.

Estas personas son material del equipo. Algunos de sus valores siguen pendientes de validar con entrevistas, así que no se presentan como investigación concluida (ver `docs/product/PRD.md`, sección 2).

## Carácter y tono

- **Profesional y sobrio.** Debe leerse como un sitio serio de venta de entradas, no como una maqueta de clase.
- **Eventos y datos primero.** Fecha, hora, lugar, modalidad y precio se leen de un vistazo. La decoración sirve a esos datos, no los compite.
- **Marca C3.** Navy, azul, violeta y turquesa. Títulos en Montserrat y texto en Poppins. Los tokens y reglas están en `docs/design/DESIGN.md`.
- **Guías de diseño.** La dirección visual y el detector de calidad están en [Guías de diseño](docs/design/DESIGN.md#guías-de-diseño).
- **Español directo.** Los botones dicen la acción. No hay exageraciones ni cifras que no existan.

## Requisitos que no cambian

Estos requisitos vienen de `AGENTS.md` y tienen prioridad sobre cualquier decisión visual:

- La etiqueta **DEMO** se muestra en la cabecera, el pie y el pago. El aspecto del sitio puede ser profesional, pero la etiqueta no se quita.
- No se afirma que existe una pasarela real ni que el sitio es un servicio oficial de C3.
- Los precios están en USD. No se piden datos de tarjeta.
- No hay credenciales en el repositorio.

## Referencias

Son patrones observados en sitios de eventos. No son copias.

- **Precio y fecha arriba en la ficha.** Los sitios de eventos más claros ponen el precio y la fecha antes de cualquier otra cosa. Fuente: [TicketSource, cómo crear un sitio de eventos que venda](https://www.ticketsource.com/blog/how-to-create-a-compelling-event-website-to-maximise-ticket-sales).
- **Listado por fecha con imagen, descripción y compra a la vista.** Un botón de compra claro junto a cada evento reduce el recorrido. Fuente: mismo artículo, ejemplo de Ledbury Poetry.
- **Tarjetas con datos clave.** Imagen, fecha, hora, tipo y lugar en cada tarjeta. Fuente: mismo artículo, ejemplo de Kino Kulture.
- **Pocos pasos para comprar.** Como en la decisión D-10, el comprador no necesita cuenta.

## Fuera de alcance

Ver `docs/product/PRD.md`, sección 1 y el apartado de fronteras. En resumen: sin cobros reales, sin pagos a organizadores, sin facturación electrónica ni reembolsos automáticos.
