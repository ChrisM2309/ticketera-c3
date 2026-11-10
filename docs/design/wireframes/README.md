# Wireframes de las cinco pantallas (WF-01)

Wireframes de baja fidelidad del flujo de compra: Home, categoría, evento, carrito y pago, y confirmación. El contenido obligatorio de cada pantalla viene del PDF del proyecto (diapositiva 12) y del requisito R-07 de `docs/analisis/2026-11-09-brechas-y-requerimientos.md`. La prueba que verifica los archivos es `tests/unit/wireframes.test.ts`.

## Cómo leer los archivos

- Cada SVG tiene dos tablas de dibujo: `movil` (375 × 812) y `escritorio` (1280 × 800).
- Son cajas grises, texto de marcador y anotaciones que empiezan con «Nota:». No llevan colores de marca: la baja fidelidad se lee en grises y el color no clasifica nada aquí.
- Todos los datos son ejemplos DEMO: títulos, fechas, horas, ponentes, precios y códigos no son reales. Los montos aparecen como `$XX.XX`.
- `06-flujo-movil.svg` no usa tablas de dibujo: muestra cinco pantallas de 375 × 812 px a escala 1:1 en una fila, con flechas numeradas, y los cinco estados en la fila inferior.
- Se abren en cualquier navegador o visor de SVG. El fondo es transparente.

## Índice

| Archivo | Pantalla | Ruta | Persona principal | Palabra clave SEO |
|---|---|---|---|---|
| [01-home.svg](01-home.svg) | Home | `/` | Diego y Andrea | «boletos para El Salvador» con eventos tecnológicos |
| [02-categoria.svg](02-categoria.svg) | Categoría (ejemplo: Congresos) | `/congresos/` | Andrea y Diego | «congreso» |
| [03-evento.svg](03-evento.svg) | Ficha de evento (ejemplo) | `/congresos/inteligencia-artificial/congreso-demo-ia/` | Andrea | Ninguna genérica: el title usa el nombre del evento |
| [04-carrito-pago.svg](04-carrito-pago.svg) | Carrito y pago | `/carrito/`, `/checkout/` | Diego y Andrea | Ninguna: `noindex` |
| [05-confirmacion.svg](05-confirmacion.svg) | Confirmación con boleto | Enlace privado con token | Diego | Ninguna: `noindex` |
| [06-flujo-movil.svg](06-flujo-movil.svg) | Flujo móvil de 4 clics con cinco estados | Recorrido de Home a boleto (sin ruta propia) | Diego y Andrea | Ninguna: recorrido de uso |

Personas del material del equipo (PRD y análisis): **Diego**, universitario tech (19–22), busca entradas gratis o económicas y quiere compartir la invitación; **Andrea**, profesional junior (24–30), necesita agenda detallada y precios claros. Sus porcentajes y frenos siguen pendientes de validar con entrevistas; no se presentan como investigación concluida.

## 1. Home (`01-home.svg`)

- **Persona:** Diego busca el filtro «Gratis» al primer vistazo. Andrea ve «Desde $XX.XX» en cada tarjeta.
- **Qué muestra:** en móvil, buscador, las 12 categorías en cuadrícula, filtros rápidos y tres tarjetas de evento dentro de los primeros 812 px. En escritorio, cabecera con logo, franja de categorías, cuatro tarjetas y una franja «Gratis esta semana».
- **Reglas:** el logo lleva al Home y el menú no tiene «Inicio». La cabecera muestra la etiqueta DEMO.
- **SEO:** title y H1 con «boletos para El Salvador» y eventos tecnológicos. La meta description no lleva cifras sin respaldo.

## 2. Categoría (`02-categoria.svg`)

- **Ejemplo:** la ruta `/congresos/`. Las otras once categorías siguen el mismo patrón.
- **Persona:** Andrea compara agenda y precio en cada fila. Diego filtra por «Gratis».
- **Qué muestra:** H1 «Congresos de tecnología», texto introductorio de 1–2 líneas, filtros de tema, fecha, precio y ciudad, y un bloque de destacados de la categoría antes de la lista. En móvil, los filtros se abren en una hoja con el botón «Filtros».
- **Temas:** solo Cloud, Inteligencia artificial, Programación y Python tienen ruta propia (SEO_ROUTES, sección 2). Los demás temas se filtran sin URL.
- **Ciudades:** San Salvador, San Miguel y Santa Ana, las tres ubicaciones del PDF.
- **SEO:** palabra clave «congreso» en el H1 y el texto introductorio (SEO_ROUTES, sección 1).

## 3. Evento (`03-evento.svg`)

- **Persona:** Andrea revisa agenda, ponentes y total antes de comprar.
- **Qué muestra:** portada, título, fecha, lugar y organizador. La caja de compra queda dentro de los primeros 812 px en móvil, sin desplazarse, con botones de 44 px. Después siguen agenda y ponentes. En escritorio, la caja de compra va a la derecha, siempre visible.
- **Acciones:** «Agregar al calendario» genera un archivo `.ics` en el servidor con título, fecha y lugar. «Compartir» abre un enlace de WhatsApp sin datos del comprador.
- **SEO:** title específico con el nombre del evento, imagen, fecha y lugar; JSON-LD `Event` solo con datos guardados (SEO_ROUTES, sección 5). La ficha no usa una palabra clave genérica.

## 4. Carrito y pago (`04-carrito-pago.svg`)

- **Persona:** Diego y Andrea.
- **Compra sin cuenta:** «Continuar como invitado» es la opción por defecto. «Iniciar sesión» es opcional y no bloquea el pago (DP-01).
- **Total claro:** subtotal, comisión de servicio y total aparecen antes del botón de pago. No hay cargos después de pagar.
- **Pago de demostración:** se eligen los resultados «Resultado aprobado» o «Resultado rechazado». No se piden datos de tarjeta. El botón y el resumen llevan la etiqueta DEMO.
- **Reglas de datos:** un pago rechazado no emite boletos ni consume inventario. Precios y comisión se validan en el servidor, no en el navegador.
- **SEO:** sin palabra clave. Es una ruta privada con `noindex` (SEO_ROUTES, sección 4).

## 5. Confirmación (`05-confirmacion.svg`)

- **Persona:** Diego, que reenvía o comparte su entrada.
- **Qué muestra:** boleto con QR individual, código de orden, tipo de entrada y número de boleto. Descarga o impresión del boleto. El QR lleva un token no predecible y no muestra datos personales.
- **Envío simulado:** por correo y por WhatsApp. Queda un registro de salida «Te enviamos el boleto a…» y no sale ningún mensaje real.
- **Acciones:** agregar al calendario y compartir, con las mismas reglas de la ficha de evento.
- **SEO:** sin palabra clave. La confirmación lleva `noindex` y se abre con un enlace privado por token, no con el número de orden.

## 6. Flujo móvil con estados (`06-flujo-movil.svg`)

- **Persona:** Diego y Andrea, desde el móvil.
- **Qué muestra:** cinco pantallas en una fila (Home, categoría, evento, carrito y pago, confirmación) unidas por flechas numeradas: «4 clics hasta el boleto». En la fila inferior, los cinco estados: vacío, agotado, error, pago rechazado y gratis.
- **Estados:** vacío explica qué hacer sin mostrar error; agotado impide agregar la entrada al carrito; error ofrece «Reintentar» sin mostrar datos a medias; pago rechazado no emite boletos ni consume inventario y conserva el carrito; gratis confirma sin pasarela ni datos de tarjeta.
- **Clics:** se cuentan desde el Home, como pide el plan de la Fase 1. El plan de la Fase 2 habla de «4 clics desde la categoría»; esa medición queda para la verificación de esa fase.
- **SEO:** sin palabra clave propia. El recorrido reutiliza las rutas de las secciones 1 a 5, y las rutas privadas siguen con `noindex`.

## Pendientes y límites

- Este documento cubre WF-01 y WF-02. Las pantallas nuevas (WF-03) van en tareas siguientes. WF-05 documentará por pantalla el buyer persona, la keyword, la competencia y el hallazgo de usabilidad.
- Las capturas de «Del wireframe al sitio» (WF-04) se toman al final, cuando todo esté terminado (D-54, DP-18).
- Los volúmenes de búsqueda del Excel no se incluyen aquí. Son valores del equipo y no tienen vigencia garantizada.
