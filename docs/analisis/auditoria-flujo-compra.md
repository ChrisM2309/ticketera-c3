# Auditoría del flujo de compra (CO-01)

**Fecha:** 2026-11-09 · **Tarea:** 2.1 de la Fase 2 (`docs/superpowers/plans/2026-11-09-fase-2-compra.md`) · **Base:** commit `b1324e9` en la rama `codex/fase-2-compra`.
**Referencias:** wireframes 01 a 05 (`docs/design/wireframes/`), brecha CO-01 y R-06 en `docs/analisis/2026-11-09-brechas-y-requerimientos.md`.
**Estado del sitio:** DEMO. El pago y el envío del boleto son simulados; no se cobra dinero ni se piden datos de tarjeta.

## 1. Método

- Compilación de producción (`npm run build`) y servidor local de producción en el puerto 3100 (`npm start -- -p 3100`).
- Navegador Chromium con la versión de Playwright del proyecto. Viewport de 375 × 812 px, sin zoom.
- Catálogo real, leído de forma anónima. La creación de la orden y su confirmación se respondieron en el navegador con una respuesta simulada, igual que `tests/e2e/purchase-flow.spec.ts`. **No se escribió ninguna orden en la base.**
- Un «toque» es un clic sobre un enlace o botón. Cuentan el ancla «Elegir entradas» y cada «+». Escribir en los campos no cuenta.
- Las posiciones son la distancia en píxeles CSS desde el borde superior de la página. Una pantalla «dentro del primer pliegue» quiere decir que el borde inferior del elemento cae antes de 812 px.
- Para las capturas visuales se citan las de la Fase 1 (390 px) en `docs/analisis/evidencias/fase-1/`.

## 2. Recorrido en 375 px

| Trayecto | Toques hasta el boleto | Dónde termina | Resultado |
|---|---|---|---|
| Pago demo aprobado (1 entrada General, $10.00 + comisión 5 %) | **8** (7 sin el ancla «Elegir entradas») | Pantalla «Orden confirmada» con «Ver mis boletos» | El boleto está un toque más allá |
| Pago demo rechazado | 7 | «Pago rechazado» con «Volver al inicio» | No hay reintento. El carrito se borra al crear la orden |
| Registro gratuito | **8** (7 sin el ancla) | «Orden confirmada» con «Ver mis boletos» | Igual que el pago aprobado, sin pasarela |
| Meta del PDF (diapositiva 17) | 4 desde la categoría | — | Brecha de 4 toques |

Ninguna pantalla del recorrido desborda horizontalmente: el ancho de la página es igual al del viewport (375 px) en todas.

## 3. Medidas por pantalla (375 px)

| Pantalla | Elemento | Posición (px) | Dentro del primer pliegue |
|---|---|---|---|
| Home | Primera tarjeta de evento | 514 | Sí (dos tarjetas empiezan dentro del pliegue) |
| Categoría Congresos | Tarjeta del evento DEMO | 1 802 | No |
| Ficha | Título | 272 a 317 | Sí |
| Ficha | Precio «Desde $10» y ancla «Elegir entradas» | 634 a 678 | Sí |
| Ficha | Sección del selector (`#entradas`) | 1 546 a 1 578 | No, 734 px debajo del pliegue |
| Ficha | Botón «Agregar una entrada» | 1 796 a 1 840 | No |
| Ficha | «Continuar al carrito» | 2 119 a 2 167 | No |
| Ficha | Agenda | 1 298 a 1 330 | No. Aparece antes que el selector |
| Ficha | Ponentes | no existe | — |
| Ficha | Comisión, total provisional, «Agregar al calendario», «Compartir» | no existen | — |
| Carrito | Total provisional | 1 052 a 1 076 | No |
| Carrito | «Continuar al checkout» | 1 168 a 1 216 | No |
| Checkout | Campos «Nombre completo» y «Correo electrónico» | 505 a 641 | Sí |
| Checkout | «Crear orden DEMO» | 661 a 709 | Sí |
| Checkout | Comisión DEMO | 861 a 881 | No, debajo del botón |
| Checkout | Total provisional | 906 a 930 | No, debajo del botón |
| Checkout | Campo de teléfono | no existe | — |
| Checkout | Inicio de sesión | solo en el pie (1 592 px); no hay enlace en el formulario | No |
| Pago | Aviso «Modo demostración: aquí no se cobrará dinero…» | 363 a 475 | Sí |
| Pago | «Simular pago aprobado» y «Simular pago rechazado» | 495 a 603 | Sí |
| Pago | Total verificado | 800 a 824 | No, debajo de los botones |
| Rechazado | «Volver al inicio» (sin «Reintentar») | 430 a 478 | Sí |
| Confirmada | «Ver mis boletos» | 475 a 523 | Sí |

## 4. Contraste con los wireframes 01 a 05

| Wireframe | Lo que pide | Lo que hay hoy | Estado |
|---|---|---|---|
| 01 Home | Tres tarjetas en el primer pliegue; filtro «Gratis» | Dos tarjetas dentro del pliegue; la primera a 514 px; filtros presentes | Parcial |
| 02 Categoría | H1, filtros en hoja con botón «Filtros», destacados antes de la lista | Ciudad, modalidad y precio como listas completas; sin botón «Filtros»; la lista empieza a 1 802 px | No cumple |
| 03 Evento | Caja de compra sin scroll; total y comisión antes del botón; agenda y ponentes; calendario y compartir | Caja a 1 546 px; sin total ni comisión; sin ponentes; sin calendario ni compartir; agenda antes de la caja | No cumple |
| 04 Carrito y pago | Invitado por defecto e inicio de sesión opcional; total antes del botón; botón de pago en el primer desplazamiento; resultados DEMO | Total a 1 052 px y botón a 1 168 px en el carrito; el total queda debajo del botón en datos y en pago; sin inicio de sesión; resultados DEMO presentes con el aviso | Parcial |
| 05 Confirmación | Boleto con QR; envío simulado por correo y WhatsApp; calendario y compartir | QR y descarga existen; faltan envío simulado, calendario y compartir | Parcial |
| 06 Flujo móvil | 4 toques; estados vacío, agotado, error, rechazado y gratis; el rechazo conserva el carrito | 8 toques; el rechazo no ofrece reintento y el carrito se pierde | No cumple |

## 5. Fricciones y decisiones

Cada fricción tiene una decisión: `Resolver en 2.x` o `Descartar` con su motivo.

| # | Fricción | Dónde | Evidencia (captura) | Decisión |
|---|---|---|---|---|
| F-01 | Dos tarjetas en el primer pliegue; wireframe 01 pide tres | Home (`src/app/page.tsx`) | [home-390.png](evidencias/fase-1/home-390.png); tabla 3: primera tarjeta a 514 px | Descartar: el catálogo ya se ve desde la primera pantalla (AGENTS.md) y la cuadrícula de categorías es parte del wireframe. Se mide de nuevo en 2.12 |
| F-02 | Filtros como listas completas antes de los resultados; no hay botón «Filtros» | Categoría (`src/components/catalog/catalog-filters.tsx`) | [categoria-390.png](evidencias/fase-1/categoria-390.png); tabla 3: lista a 1 802 px | Descartar: el filtrado en hoja no está en el plan de la Fase 2 y no afecta a la compra. Queda como pendiente de catálogo |
| F-03 | El selector de entradas queda a 1 546 px y «Continuar al carrito» a 2 119 px | Ficha (`src/features/catalog/event-detail.tsx`) | [ficha-390.png](evidencias/fase-1/ficha-390.png); tabla 3. El ancla «Elegir entradas» sí se ve a 634 px | Resolver en 2.3: orden móvil con resumen, selector y agenda; portada más baja para que el selector entre en el pliegue |
| F-04 | En móvil, la agenda va antes del selector | Ficha (`event-detail.tsx`) | Tabla 3: agenda a 1 298 px, selector a 1 546 px | Resolver en 2.3, con el mismo cambio de orden que F-03 |
| F-05 | No hay sección de ponentes | Ficha; datos del evento (`src/features/catalog/types.ts`) | [ficha-390.png](evidencias/fase-1/ficha-390.png): sin sección | Resolver en 2.2 (dato y formulario) y 2.3 (sección `SpeakersList`) |
| F-06 | El selector no muestra total provisional ni nota de comisión; solo «N entradas seleccionadas» | Ficha (`src/components/catalog/ticket-selector.tsx`) | Código del selector; tabla 3: sin texto «Comisión» en la ficha | Resolver en 2.3: total provisional y nota de comisión encima del botón. El total final sigue calculándose en el servidor |
| F-07 | El estado agotado existe por entrada («Agotada») y deshabilita el selector, pero no hay etiqueta «Agotado» en la ficha y el botón «Continuar al carrito» solo queda atenuado | Ficha (`ticket-selector.tsx`, líneas 41 a 47, 95 a 97 y 146 a 157) | Código; no medido en vivo | Resolver en 2.3: etiqueta «Agotado» visible, sin botón de compra y prueba E2E de un evento agotado |
| F-08 | Faltan «Agregar al calendario» y «Compartir» | Ficha | Tabla 3: no existen | Resolver en 2.9 (calendario) y 2.10 (WhatsApp) |
| F-09 | No hay opción de iniciar sesión en la ficha, el carrito ni el checkout. «Ingresar» solo aparece en el menú y en el pie | Ficha, carrito y checkout | Tabla 3: el único enlace «Ingresar» visible en el recorrido está en el pie (3 281 px en la ficha, 1 592 px en el checkout) | Descartar: la cuenta de comprador es la Fase 3 (CP-01 a CP-04) y DP-01 deja la compra de invitado sin cambios. Se reabre en la Fase 3 |
| F-10 | El total del carrito queda a 1 052 px y el botón de pago a 1 168 px; el wireframe 04 pide el botón en el primer desplazamiento con el total encima | Carrito (`src/components/checkout/cart-page.tsx`) | [carrito-390.png](evidencias/fase-1/carrito-390.png); tabla 3 | Resolver en 2.4: desglose (subtotal, comisión y total) encima del botón, y el botón muestra el monto |
| F-11 | Tres pantallas antes del pago (carrito, datos y pago) y 8 toques hasta el boleto, frente a 4 del PDF | Carrito, checkout y pago | Tabla 2 | Resolver en 2.4 y 2.5: datos, resumen y botón en una pantalla, y el resultado sin paso extra. La meta de 4 toques exige fusionar más pantallas; la decisión sobre la meta se registra en `docs/DECISIONS.md` al cerrar la 2.12 |
| F-12 | «Crear orden DEMO» queda arriba del total y de la comisión | Checkout (`src/components/checkout/checkout-page.tsx`) | [checkout-390.png](evidencias/fase-1/checkout-390.png); tabla 3: botón a 661 px, comisión a 861 px, total a 906 px | Resolver en 2.4: desglose encima del botón |
| F-13 | El botón dice «Crear orden DEMO» y no muestra el monto ni «pago de demostración» | Checkout | [checkout-390.png](evidencias/fase-1/checkout-390.png) | Resolver en 2.4: etiqueta con monto («Pagar $X · pago de demostración») |
| F-14 | No hay campo de WhatsApp (opcional en el wireframe 04) | Checkout | Tabla 3: el campo no existe | Resolver en 2.6 (teléfono opcional con validación en servidor) |
| F-15 | Doble envío: la única guarda es el estado de React (`isSubmitting`). Un doble toque antes del re-render o un reintento sin respuesta puede crear otra orden pendiente | Checkout (`submitOrder`); ruta `POST /api/checkout/orders`; ver I-33 en el análisis de brechas | Código de `checkout-page.tsx` | Resolver en 2.6: clave `request_id` para que el reintento devuelva la misma orden |
| F-16 | Los botones de resultado no muestran monto; «Total verificado» queda debajo de los botones | Pago (`src/components/checkout/payment-step.tsx`) | Tabla 3: botones a 495 a 603 px; total a 800 px. La captura de la Fase 1 no cubre este paso | Resolver en 2.5 (panel reutilizable con resumen encima y etiqueta «Pago de demostración») y en 2.4 (monto) |
| F-17 | El texto mezcla voseo y tuteo: «Elegí el resultado…» y «…que quieres simular». El aviso exacto sí está | Pago (`payment-step.tsx`) | Código; tabla 3 (aviso a 363 px) | Resolver en 2.5: texto único en voseo y aviso exacto de la Fase 2 |
| F-18 | Pago rechazado sin reintento: solo «Volver al inicio». El carrito se borra al crear la orden, así que el comprador vuelve a elegir entradas | Rechazado (`payment-step.tsx`, `checkout-page.tsx`) | Tabla 3: `localStorage` vacío tras crear la orden. La captura de la Fase 1 no cubre este paso | Resolver en 2.5 (comprobante rechazado con «Reintentar»), 2.6 (reintento con el mismo `request_id`) y 2.11 (estados de error). El carrito se conserva hasta el pago aprobado |
| F-19 | La confirmación no tiene «Agregar al calendario», «Compartir» ni registro de envío simulado | Confirmación (`src/app/confirmacion/[orderId]/[token]/page.tsx`) | [confirmacion-390.png](evidencias/fase-1/confirmacion-390.png) (solo «Orden confirmada») | Resolver en 2.7 (envío simulado), 2.9 y 2.10 |
| F-20 | Después de aprobar el pago hace falta un toque más («Ver mis boletos») para llegar al boleto | Pago confirmado (`payment-step.tsx`) | Tabla 2 y tabla 3 | Resolver en 2.5: comprobante en el mismo paso y enlace directo al boleto |
| F-21 | Página del boleto con QR sin medir a 375 px | Confirmación (`page.tsx`) | Sin captura: una orden simulada devuelve «Página no encontrada» | Resolver en 2.12: medir el boleto a 375 px con una orden de prueba fuera de producción |

## 6. Decisiones que afectan el alcance

- **Meta de 4 toques del PDF.** Con la estructura actual el recorrido completo son 8 toques desde la categoría. Llegar a 4 exige fusionar carrito, datos y resultado de pago. Esa decisión no se toma aquí: se propone registrarla en `docs/DECISIONS.md` al cerrar la 2.12 con la cifra medida.

## 7. Límites de esta auditoría

- El boleto con QR no se midió: sin una orden real en la base, la página responde «Página no encontrada». No se crearon órdenes reales para medirlo.
- El estado agotado se evaluó en el código. No se midió con un evento agotado.
- Cada escenario se recorrió una vez. Las cifras describen el recorrido, no el comportamiento de usuarios: no hay pruebas con personas.
- Las capturas de 375 px de esta sesión no se guardaron en el repositorio. Las capturas citadas son de la Fase 1 (390 px).
