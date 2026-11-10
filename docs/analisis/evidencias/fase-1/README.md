# Evidencias visuales de la Fase 1 (DI-05)

Revisión de la Fase 1 (iconos, ilustraciones propias y portadas) sobre la compilación de producción: `npm run build` y `npm start` (puerto 3100), con el catálogo real de Supabase. Sitio y pagos son DEMO.

## Capturas

Página completa, 390 px (móvil) y 1280 px (escritorio), tomadas con Chromium (Playwright). Ninguna tiene desbordamiento horizontal (`scrollWidth - innerWidth = 0` en las 12).

| Pantalla | 390 px | 1280 px | Ruta |
|---|---|---|---|
| Home | [home-390.png](home-390.png) | [home-1280.png](home-1280.png) | `/` |
| Categoría | [categoria-390.png](categoria-390.png) | [categoria-1280.png](categoria-1280.png) | `/congresos/` |
| Ficha de evento | [ficha-390.png](ficha-390.png) | [ficha-1280.png](ficha-1280.png) | `/congresos/inteligencia-artificial/congreso-demo-ia/` |
| Carrito | [carrito-390.png](carrito-390.png) | [carrito-1280.png](carrito-1280.png) | `/carrito/` (2 entradas General) |
| Checkout | [checkout-390.png](checkout-390.png) | [checkout-1280.png](checkout-1280.png) | `/checkout/` |
| Confirmación | [confirmacion-390.png](confirmacion-390.png) | [confirmacion-1280.png](confirmacion-1280.png) | `/checkout/` tras «Simular pago aprobado» («Orden confirmada») |

Alcance de la confirmación: para no escribir órdenes de prueba en la base compartida, las llamadas `POST /api/checkout/orders` y `.../confirm/` se simularon en el navegador (igual que `tests/e2e/purchase-flow.spec.ts`). Por eso se capturó la pantalla «Orden confirmada» y no la página `/confirmacion/{orden}/{token}/` con los códigos QR, que exige una orden real. Esa página sí está cubierta por `purchase-flow-real.spec.ts` (con `REAL_PURCHASE=1`) y no cambió su lógica en esta fase, solo iconos y portada.

Lo que se ve en las capturas: cada tarjeta lleva su ilustración propia por tipo con la etiqueta «Imagen ilustrativa», iconos de calendario, hora, lugar, modalidad, organizador y precio siempre junto a su texto, iconos por tipo en las baldosas de categoría y en los filtros, y los pasos «Tus datos / Pago / Boletos» con marca de verificación y texto.

## Resultado del detector (Impeccable)

Comando de la tarea 0.5 (`docs/design/DESIGN.md`), sobre los 24 archivos de `src/` agregados o modificados desde el cierre de la Fase 0 (`git diff --name-only --diff-filter=AM 6b7e715 HEAD -- src`: páginas admin, panel, ingresar y confirmación, `globals.css`, filtros, tarjetas, baldosas, carrito, checkout, pago, cabecera, pie, navegación, `icon.tsx`, `event-detail.tsx`, `icons.ts`, `images.ts`, `navigation.ts`, entre otros):

```text
npx impeccable detect --json <los 24 archivos>
-> [] (código de salida 0, sin hallazgos)
```

Control negativo: sobre un archivo temporal fuera del repositorio con `border-l-4` y un degradado violeta, el mismo comando sí informa `side-tab`, así que el detector está activo. Se corrió también por separado sobre `src/app/confirmacion/[orderId]/[token]/page.tsx` (ruta con corchetes): `[]`. No hay hallazgos que justificar.

## Tamaño de descarga de una tarjeta, antes y después

Medido con la imagen de portada de una tarjeta de «Congresos» (tipo de la línea Conecta, que antes usaba la foto de stock `stock-salon-evento-01.jpg`), tal como la sirve `/_next/image` con `q=75` y `Accept: image/webp`. «Antes» es la foto de stock por línea que se mostraba a un evento sin imagen propia; «después» son las dos variantes de `congresos-{1|2}.webp`.

| Ancho solicitado | Antes (foto de stock) | Después (ilustración variante 1 / variante 2) |
|---|---|---|
| 640 px (móvil, medido en el navegador a 390 px) | 40 908 B (40 KB) | 5 744 B / 5 052 B (5.6 KB / 4.9 KB) |
| 828 px (escritorio, medido en el navegador a 1280 px) | 62 260 B (61 KB) | 7 412 B / 6 690 B (7.2 KB / 6.5 KB) |
| Archivo original en `public/` | 287 980 B (281 KB, JPG) | 18 366 B / 19 198 B (18 KB, WebP 1600x900) |

Reducción de la tarjeta servida: de 40 908 B a unos 5 400 B en móvil (cerca del 87 %) y de 62 260 B a unos 7 000 B en escritorio (cerca del 89 %). Las cifras de «antes» salen de pedir al mismo servidor la ruta de la foto de stock con los mismos parámetros que usa la tarjeta; las de «después» son las respuestas reales observadas al cargar `/congresos/`. Otras líneas varían: la foto de Compite (`stock-auditorio-01.jpg`) pesaba 38 808 B / 63 206 B y la de Crea (`stock-sala-conferencia-02.jpg`) 17 092 B / 24 074 B a 640 / 828 px. Las 24 ilustraciones suman 416 KB en disco.

## Observaciones fuera del alcance de la fase

- El logo blanco de la cabecera se pide con `w=3840` (`/brand/logo-principal-blanco.png`, 34 706 B servidos) en ambos tamaños de pantalla; es anterior a esta fase y conviene revisar su atributo `sizes`. No se modificó.
- La página `/confirmacion/{orden}/{token}/` con QR no se capturó (ver «Alcance de la confirmación»).
