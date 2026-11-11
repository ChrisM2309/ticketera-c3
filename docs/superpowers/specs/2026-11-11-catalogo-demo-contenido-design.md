# Catálogo DEMO, imágenes y artículos — Diseño

## Intención

Enriquecer la demo académica de Ticketera C3 sin borrar ni modificar el seed existente. La nueva capa debe hacer que el catálogo se sienta como un marketplace tecnológico realista: nombres variados de eventos y organizadores ficticios, ponentes plausibles, fotos locales y artículos SEO publicados.

## Objetivos

- Agregar 24 eventos publicados, dos por cada una de las 12 categorías de tipo de evento del Excel.
- Cubrir estados temporales útiles para la demo: eventos pasados, próximos inmediatos y futuros, manteniendo fechas fijas y reproducibles.
- Usar combinaciones de tipo/tema/ciudad que ya existen en `seo_routes`; conservar la regla de que los eventos virtuales no llevan ciudad ni sede.
- Asociar una imagen local a cada evento nuevo y mantener las 24 ilustraciones de `public/images/tipos/` como respaldo para eventos sin foto.
- Agregar tres artículos publicados con palabra clave, descripción SEO, cuerpo Markdown de más de 200 caracteres y enlaces a categorías existentes.
- Dejar una migración SQL aditiva e idempotente, apta para ejecutarse después del seed actual.

## No objetivos

- No reemplazar ni editar los 50 eventos actuales, sus entradas, organizadores, órdenes ni ilustraciones.
- No crear cuentas de Auth, contraseñas, pagos reales o datos de compradores.
- No inventar afiliaciones oficiales, métricas, entrevistas o eventos reales; los nuevos organizadores y eventos se marcarán como ficticios en sus descripciones y el sitio seguirá mostrando DEMO.
- No crear nuevas categorías ni modificar el árbol SEO del Excel.

## Restricciones

- SQL compatible con el esquema vigente: `events` exige categoría de tipo, `mode = presencial` exige ciudad, `mode = virtual` no admite sede ni ciudad, y los slugs no pueden ser `virtual`, `presencial` o `gratis`.
- Precios en centavos USD y cupos no negativos. Cada evento tendrá al menos un tipo de entrada.
- Los ponentes vivirán en `events.speakers` como JSON válido, con nombres y roles de 1–80 y 0–120 caracteres.
- Los artículos cumplirán la validación de `blog_posts`: título de 5–70 caracteres, descripción de 50–160, cuerpo de al menos 200 para publicar, palabra clave y `published_at`.
- Las fotos se descargarán de Pexels o Unsplash, se guardarán en `public/images/events/` con dimensiones web razonables y quedarán registradas en `public/images/CREDITOS.md` con autor, página fuente, licencia y fecha de descarga.

## Enfoques considerados

1. **Migración aditiva, assets locales y contenido editorial** — elegido. Agrega datos sin tocar el catálogo vigente, evita dependencias de red durante la demo y deja la atribución versionada junto al código.
2. **Rehacer el seed completo** — descartado porque puede romper órdenes, pruebas y referencias de la demo ya existente.
3. **Imágenes remotas por URL** — descartado para los eventos nuevos porque introduce hotlinking, cambios de terceros y fallos de red; las ilustraciones siguen siendo el fallback estable.

## Diseño elegido

### Migración de catálogo

Crear `supabase/migrations/20261118100000_demo_catalog_content.sql` con tres bloques:

1. Asegurar, con `ON CONFLICT DO NOTHING`, las filas de taxonomía que la migración necesita (los 12 tipos, los temas usados y las tres ciudades), porque las migraciones se ejecutan antes de `supabase/seed.sql`; después insertar cinco marcas ficticias de organizadores con descripciones explícitas de demo.
2. Insertar 24 eventos con slugs nuevos, títulos creativos, agendas, imágenes, 2–4 ponentes, precios mixtos y fechas distribuidas entre agosto de 2026 y marzo de 2027. Usar dos eventos por categoría, con al menos uno pasado o cercano en cada grupo donde sea útil para probar tarjetas de finalizado y próximos.
3. Insertar tipos de entrada mediante el slug del evento y publicar tres artículos mediante `INSERT ... ON CONFLICT (slug) DO UPDATE`, manteniendo contenido determinista y seguro para re-ejecución. Los eventos y entradas usarán `ON CONFLICT DO NOTHING`; ninguna sentencia tocará claves existentes.

La migración asignará `is_demo = true`, usará `status = 'published'` y enlazará únicamente categorías existentes. Todas las nuevas fotos tendrán un path local como `/images/events/...jpg`. Al asegurar la taxonomía, la migración también puede ejecutarse sobre una base recién migrada antes del seed sin depender de filas creadas por un archivo posterior.

### Imágenes

Agregar un conjunto compacto de fotos de conferencias, auditorios, programación, hackathons, trabajo colaborativo y ferias. Se reutilizará una foto por más de un evento cuando sea visualmente coherente; lo importante es que ningún evento nuevo quede sin `image_path`. Las ilustraciones actuales no se eliminan ni se cambian.

### Artículos

Publicar:

- beneficios de hacer networking en eventos tecnológicos;
- cómo aprovechar un hackathon para aprender y construir portafolio;
- cómo elegir entre workshop, bootcamp, charla y conferencia.

Cada artículo tendrá una palabra clave principal, subtítulos Markdown, enlaces internos a tipos de evento y lenguaje de orientación académica, sin afirmaciones no verificadas.

## Verificación

- Validar que la migración contiene 24 slugs nuevos, dos por cada tipo, 24 `image_path` no nulos y al menos un ticket por evento.
- Ejecutar pruebas de base de datos que apliquen todas las migraciones y esta migración sobre PGlite, comprobando restricciones, distribución de categorías, fechas, precios y artículos publicados.
- Ejecutar `npm test`, `npm run lint`, `npm run typecheck` y `npm run build`.
- Revisar el diff y confirmar que no hay borrados del seed, de `public/images/tipos/` ni de los créditos existentes.

