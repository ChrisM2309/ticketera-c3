# Catálogo DEMO, imágenes y artículos Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Agregar un catálogo DEMO realista de 24 eventos, fotos locales con licencia documentada y tres artículos SEO sin borrar ni modificar el seed existente.

**Architecture:** La migración `20261118100000_demo_catalog_content.sql` será autosuficiente respecto a la taxonomía mínima, porque las migraciones corren antes de `supabase/seed.sql`; usará claves naturales y conflictos idempotentes para agregar eventos, entradas y contenido editorial. Las fotos vivirán en `public/images/events/`, y el resolver de portadas aceptará esa carpeta antes de caer a ilustraciones o stock.

**Tech Stack:** PostgreSQL/Supabase migrations, PGlite/Vitest, Next.js/TypeScript, Sharp para inspección de imágenes, Pexels/Unsplash con créditos en Markdown.

**Spec:** `docs/superpowers/specs/2026-11-11-catalogo-demo-contenido-design.md`

## Global Constraints

- No borrar ni editar los eventos, entradas, organizadores, órdenes o ilustraciones existentes.
- Mantener las 12 categorías y el orden del Excel; no crear categorías nuevas.
- Las migraciones se ejecutan antes de `supabase/seed.sql`; no depender de filas que solo crea el seed.
- Todos los eventos nuevos quedan `published`, `is_demo = true` y con al menos un tipo de entrada.
- Eventos presenciales llevan ciudad y sede; eventos virtuales no llevan ciudad ni sede.
- Los artículos publicados tienen palabra clave, `published_at`, descripción entre 50 y 160 caracteres y cuerpo Markdown de al menos 200 caracteres.
- No guardar credenciales, datos de compradores, números de tarjeta ni afirmaciones de afiliación real.
- Mantener las ilustraciones de `public/images/tipos/` y los fallbacks de stock intactos.

## Review Focus

- Migración aplicada desde cero antes del seed: la taxonomía mínima debe existir y las 24 filas deben insertarse sin FK inválida; prueba en `tests/db/schema.test.ts`.
- Reejecución de migración/seed: no debe duplicar organizadores, eventos, entradas ni artículos; prueba de idempotencia en `tests/db/schema.test.ts`.
- Cobertura de categorías y rutas SEO: exactamente dos slugs nuevos por cada tipo, y cada tema usado debe tener ruta `seo_routes`; prueba de distribución en `tests/db/schema.test.ts`.
- Estados temporales y modalidad: debe haber eventos pasados, próximos/futuros, 12 presenciales y 12 virtuales; prueba de fechas y restricciones en `tests/db/schema.test.ts`.
- Seguridad de portadas: `/images/events/` se acepta, rutas locales no permitidas se rechazan y la portada sigue usando fallback cuando no hay imagen; prueba en `tests/unit/image-paths.test.ts`.

---

### Task 1: Preparar y documentar las fotos locales

**Files:**
- Create: `public/images/events/*.jpg` — 12 fotos web optimizadas, reutilizables entre eventos relacionados.
- Modify: `public/images/CREDITOS.md` — tabla con archivo, descripción, autor, URL de página fuente, licencia y fecha de descarga.
- Modify: `src/features/catalog/images.ts` — permitir `/images/events/` como carpeta local aprobada.
- Modify: `tests/unit/image-paths.test.ts` — cubrir aceptación de una foto de evento y rechazo de una carpeta local no autorizada.

**Interfaces:**
- Consumes: páginas de fuente Pexels/Unsplash y licencia vigente de cada fuente.
- Produces: paths locales `/images/events/<slug>.jpg` que la migración puede guardar en `events.image_path`.

- [ ] **Step 1: Confirmar fuentes y descargar 12 fotos**

  Elegir fotos sin texto de marca ni apariencia de evento oficial, priorizando auditorios, ponencias, computadoras, trabajo colaborativo, hackathon y feria. Descargar versiones suficientemente grandes para tarjetas pero razonables para Git; no usar URLs remotas en la base.

- [ ] **Step 2: Registrar créditos**

  Añadir cada archivo a `public/images/CREDITOS.md` sin reemplazar los créditos existentes. Indicar que son imágenes ilustrativas para eventos ficticios y que los nombres de eventos no describen a las personas fotografiadas.

- [ ] **Step 3: Escribir la prueba de rutas localmente permitidas**

  Añadir a `tests/unit/image-paths.test.ts` una expectativa para `/images/events/cumbre-brujula-digital.jpg` y otra que compruebe que `/images/uploads/foto.jpg` devuelve `null`.

- [ ] **Step 4: Permitir la carpeta en `publicImagePath`**

  Extender `allowedLocalPrefixes` en `src/features/catalog/images.ts` sin cambiar los prefijos de ilustraciones o stock.

- [ ] **Step 5: Verificar assets**

  Ejecutar la prueba enfocada y comprobar que los 12 archivos existen, son JPEG legibles y no son archivos de cero bytes.

### Task 2: Crear la migración de catálogo y contenido

**Files:**
- Create: `supabase/migrations/20261118100000_demo_catalog_content.sql` — taxonomía mínima, cinco organizadores, 24 eventos, 32 entradas y tres artículos publicados.

**Interfaces:**
- Consumes: esquema vigente de `categories`, `organizers`, `events`, `ticket_types` y `blog_posts`; paths de Task 1.
- Produces: 24 nuevos slugs, dos por cada tipo de evento, con distribución 12 gratuitos/12 de pago, 12 presenciales/12 virtuales y fechas entre agosto de 2026 y marzo de 2027.

- [ ] **Step 1: Definir el inventario natural de eventos**

  Usar estos dos slugs por categoría, manteniendo títulos y descripciones en español:

  - `congresos`: `cumbre-brujula-digital`, `congreso-codigo-abierto`.
  - `competencias`: `reto-circuito-autonomo`, `liga-algoritmia-pacifico`.
  - `networking`: `cafe-nodo-mujeres-datos`, `after-office-devops`.
  - `workshops`: `mapa-datos-decisiones`, `laboratorio-prototipos-ia`.
  - `bootcamps`: `ruta-python-automatiza`, `cohorte-cero-apps-web`.
  - `concursos`: `premios-prisma-visualizacion`, `desafio-llave-abierta`.
  - `webinars`: `senales-de-nube`, `ia-con-criterio`.
  - `conferencias`: `plataformas-que-aprenden`, `diseno-para-diez`.
  - `hackathons`: `hackeo-verde-48h`, `ciudad-abierta-hackathon`.
  - `meetups`: `python-al-parque`, `marea-emprende`.
  - `charlas`: `cinco-minutos-ciberhigiene`, `vida-secreta-api`.
  - `ferias-tecnologicas`: `expo-futuro-local`, `feria-tecno-creativa`.

- [ ] **Step 2: Asegurar taxonomía y organizadores**

  Insertar con `ON CONFLICT (kind, slug) DO NOTHING` los 12 tipos, 14 temas y tres ubicaciones requeridos por las combinaciones del catálogo; después insertar cinco organizadores con slugs `lumenbyte-labs`, `nube-norte`, `bitacora-digital`, `tropico-tech` y `senda-dev`, todos sin `owner_user_id` y con descripción de marca ficticia DEMO.

- [ ] **Step 3: Insertar los 24 eventos con datos completos**

  Guardar título creativo, descripción sin promesas no verificadas, agenda, `mode`, sede si corresponde, `starts_at`, `ends_at`, `image_path`, `speakers`, `status = 'published'` e `is_demo = true`. Repartir fechas pasadas, cercanas y futuras; usar solo combinaciones presentes en `seo_routes`. Usar `ON CONFLICT (slug) DO NOTHING` para no reemplazar contenido existente.

- [ ] **Step 4: Insertar 32 tipos de entrada**

  Crear entradas con nombres variados, precios entre 0 y 9500 centavos, cupos positivos y `max_per_order` entre 1 y 6. Usar `ON CONFLICT (event_id, name) DO NOTHING`; no establecer `quantity_sold` ni tocar inventario existente.

- [ ] **Step 5: Insertar los tres artículos publicados**

  Crear `beneficios-networking-eventos-tecnologicos`, `como-aprovechar-hackathon` y `elegir-evento-tecnologico`. Cada uno tendrá título válido, descripción SEO, palabra clave específica, tema `eventos`, cuerpo Markdown de más de 200 caracteres y `related_type_slugs` válidos. Usar `published_at` fijo y `ON CONFLICT (slug) DO UPDATE` solo para el contenido de esos slugs.

- [ ] **Step 6: Revisar SQL estáticamente**

  Confirmar que los 24 eventos tienen imagen y ponentes válidos, que los eventos virtuales no tienen ciudad/sede, que no se usan slugs reservados y que ninguna sentencia `delete` o actualización apunta a datos preexistentes.

### Task 3: Añadir pruebas de base de datos para el catálogo agregado

**Files:**
- Modify: `tests/db/schema.test.ts` — actualizar aserciones globales a 74 eventos, 88 entradas y 9 organizadores, y agregar cobertura del catálogo nuevo y de los tres artículos.
- Modify: `tests/db/rls.test.ts` — actualizar la expectativa de lectura pública de eventos publicados a 74.

**Interfaces:**
- Consumes: `createDatabase()` de `tests/db/helpers.ts`, que aplica todas las migraciones antes de `seed.sql`.
- Produces: pruebas que demuestran preservación de los 50 slugs existentes, cobertura exacta de los 24 nuevos y publicación segura del contenido.

- [ ] **Step 1: Escribir expectativas nuevas antes de implementar la migración**

  Añadir constantes con los 24 slugs y los 12 tipos; comprobar que cada tipo tiene exactamente dos eventos nuevos, que el total es 74, que la distribución es `36` gratuitos/`38` de pago y `41` presenciales/`33` virtuales, que al menos 4 eventos ya terminaron y que 24 tienen `image_path` bajo `/images/events/`.

- [ ] **Step 2: Añadir pruebas de entradas, ponentes y artículos**

  Comprobar que no hay eventos sin entradas activas, que los ponentes de los eventos nuevos son JSON válido y que los tres slugs de blog están publicados, tienen palabra clave y cuerpo de al menos 200 caracteres.

- [ ] **Step 3: Añadir prueba de preservación e idempotencia**

  Verificar que los slugs antiguos `congreso-demo-ia`, `hackathon-demo-en-linea` y `feria-demo-tecnologia` siguen presentes sin cambio de título. Ejecutar de nuevo el SQL de la migración y `seed.sql`, y comprobar `categories = 29`, `events = 74`, `ticket_types = 88`, `organizers = 9`, `seo_routes = 128` y `blog_posts = 3`.

- [ ] **Step 4: Actualizar RLS**

  Cambiar solo la expectativa de cantidad en `tests/db/rls.test.ts`; conservar las comprobaciones de que anon solo ve publicados y no puede escribir.

### Task 4: Integrar documentación y verificar la entrega

**Files:**
- Modify: `docs/superpowers/plans/implementation-backlog.md` — registrar una tarea de contenido DEMO completada solo con evidencia de pruebas.
- Modify: `docs/DECISIONS.md` — registrar que el catálogo adicional se agrega por migración idempotente y que las fotos nuevas son locales con créditos, si el cambio de alcance lo requiere.

**Interfaces:**
- Consumes: resultados de Tasks 1–3 y el diseño aprobado.
- Produces: backlog y decisiones alineados con el estado real del repo.

- [ ] **Step 1: Ejecutar la verificación enfocada**

  Run: `npm test -- --run tests/unit/image-paths.test.ts tests/db/schema.test.ts tests/db/rls.test.ts`

  Expected: PASS, con todas las expectativas de catálogo agregado en verde.

- [ ] **Step 2: Ejecutar la suite completa y checks de proyecto**

  Run: `npm test`; `npm run lint`; `npm run typecheck`; `npm run build`

  Expected: exit code 0 en los cuatro comandos.

- [ ] **Step 3: Revisar el diff final**

  Run: `git status --short`; `git diff --stat`; `git diff --check`

  Expected: solo archivos del diseño, plan, migración, pruebas, créditos, imágenes y backlog/decisiones; sin borrados de `supabase/seed.sql` ni `public/images/tipos/`.

- [ ] **Step 4: Actualizar backlog con evidencia**

  Anotar conteos finales, comandos ejecutados y cualquier limitación de conexión a Supabase remoto. No afirmar despliegue remoto si solo se verificó PGlite/local.

