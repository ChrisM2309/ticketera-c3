# T07 — Ficha del evento y selección de entradas

## Intención

Permitir que una persona que llega desde el catálogo entienda un evento publicado y seleccione tipos y cantidades de entrada sin introducir una ruta pública paralela ni datos ficticios.

## Alcance

- Resolver fichas como `/<tipo>/<evento>/` o `/<tipo>/<tema>/<evento>/` dentro del catch-all actual.
- Dar prioridad al árbol `seo_routes` antes de interpretar una URL como ficha.
- Leer la ficha, entradas, organizador, agenda y eventos relacionados desde Supabase con el cliente público `anon`.
- Mostrar estado finalizado para eventos pasados, sin compra y con `noindex`.
- Mostrar la selección de entradas con límites visibles de cupo y máximo por orden; recalcular/revalidar en servidor mediante un contrato reutilizable para T08/T09.
- Emitir JSON-LD `Event` únicamente cuando `siteConfig.isDemo` sea `false`.

## No alcance

- Crear o confirmar órdenes, modificar inventario o emitir boletos; pertenecen a T08–T12.
- Añadir fotografías, ponentes, URLs o textos que no existan en la base de datos.
- Crear landings estáticas para las 134 rutas.

## Restricciones y decisiones

- Se conserva `src/app/[...segments]/page.tsx` como único resolvedor público; primero se intenta `resolveCatalogRoute` y solo después se busca una ficha.
- La consulta pública filtra `events.status = 'published'`; un evento no publicado es indistinguible de una ruta inexistente para el visitante.
- La ficha no filtra por fecha en la consulta: los eventos pasados publicados se pueden leer para mostrar su estado final, pero no se pueden comprar ni indexar.
- La validación usa cupo disponible (`quantity_total - quantity_sold`) y `max_per_order`; los totales enviados desde el navegador no son fuente de verdad.
- La UI es móvil primero, usa tokens y componentes existentes, sin kicker, bordes laterales gruesos, animación decorativa ni emojis.

## Enfoques considerados

1. **Catch-all actual + detalle server/client separado (elegido).** Mantiene la precedencia del árbol, evita duplicar metadata/rutas y deja el selector interactivo aislado.
2. **Ruta física de evento.** Aísla la ficha, pero compite con el catch-all y duplica la resolución de categorías, temas y canónicos.
3. **Ficha totalmente cliente.** Simplifica el selector, pero expone más datos, debilita SEO y no respeta la lectura pública server-first.

## Resultado esperado

Las rutas válidas de ficha renderizan información real y una selección accesible. Las URLs del árbol siguen renderizando catálogo; las fichas pasadas o agotadas explican por qué no se puede comprar; rutas inexistentes responden 404.
