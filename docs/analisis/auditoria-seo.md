# Auditoría SEO — Ticketera C3

**Fecha:** 2026-11-10 (America/El_Salvador). **Tarea:** 7.1, SEO-09.
**Sitio inspeccionado:** <https://demo.ticketera.c3.com.sv/>. Inspección pública de solo lectura mediante Firecrawl; indexación apagada.
**Referencias:** [plan de cierre](../superpowers/plans/2026-11-09-fase-7-cierre.md), [brechas y requerimientos](2026-11-09-brechas-y-requerimientos.md), especialmente R-08, DP-05, SEO-02, SEO-09 y SEO-14.

## Alcance y limitaciones

Se aplicó el skill disponible `seo-audit` de Firecrawl. Los skills `searchfit-seo:technical-seo` y `searchfit-seo:schema-markup` nombrados por el plan no están disponibles en esta sesión. Se revisaron títulos, descripciones, encabezados, canónicos, robots, enlaces internos, alternativas de imágenes y presencia de JSON-LD en el HTML devuelto; no se simula una validación externa de schema.

El plan pide un preview con base de pruebas, `indexing_enabled = true` y su propio `NEXT_PUBLIC_SITE_URL`. **Ese entorno no se levantó ni se auditó:** no se disponía de un preview aislado identificado con base de pruebas; crearlo y configurarlo requeriría acceso y cambios externos fuera de esta subtarea. La autorización actual limita el trabajo al sitio público y prohíbe activar indexación. No se buscaron credenciales ni se cambiaron ajustes, datos o despliegues. Esta muestra no certifica el comportamiento del modo indexable ni permite dar por completada la auditoría integral prevista originalmente.

La rama local al inicio era `codex/fase-6-checkin`, HEAD `aa50b52`. Las lecturas del código local son corroboración estática; **no prueban qué commit está desplegado**. Se entrega un archivo nuevo como diff utilizable en el checkout existente. Los cambios preexistentes de otros trabajos quedan fuera de este informe.

No se midieron tráfico, posiciones, backlinks, volumen de búsqueda, indexación real en Google, Lighthouse ni Core Web Vitals. No hubo compras, envío de formularios, acceso autenticado, cambios de indexación o migraciones. No se hizo un rastreo exhaustivo, una comprobación de todos los destinos enlazados ni una auditoría de rutas privadas (7.2). Un canónico declarado no prueba cuál seleccionará un buscador.

## Método y cobertura

Cada URL de la tabla se solicitó con `firecrawl_scrape`, `formats: ["markdown", "rawHtml", "links"]`, `onlyMainContent: false`, `maxAge: 0` y `toolDetail: "full"`. Se examinó el HTML, incluido el head, además del Markdown y los metadatos HTTP devueltos. Las rutas de categoría, evento y contenido se localizaron en los enlaces de la portada; no fue necesario usar `map`. Todas las rutas de esta tabla pertenecen al dominio indicado arriba.

| ID | Ruta solicitada | Resultado observado | Evidencia Firecrawl (`scrapeId`) |
|---|---|---|---|
| E1 | `/` | 200 HTML, título y descripción, H1 único, canonical propio, `noindex, nofollow` | `01a1c6eb-1554-772e-a114-c756ca25841e` |
| E2 | `/congresos/` | 200 HTML, dos eventos, H1 «Congresos», canonical propio, `noindex, nofollow` | `01a1c6eb-52ce-715c-8d20-45da600578a1` |
| E3 | `/congresos/inteligencia-artificial/congreso-demo-ia/` | 200 HTML, ficha publicada DEMO, H1, canonical propio, `noindex, nofollow` | `01a1c6eb-52a6-7108-b2be-7ab6f1fffc4d` |
| E4 | `/para-empresas/` | 200 HTML, H1 «Impulsa todos tus eventos», canonical propio, `noindex, nofollow` | `01a1c6eb-5208-7089-b851-091e2533c68b` |
| E5 | `/blog/` | 200 HTML, H1 «Blog de Ticketera C3», sin artículos publicados, `noindex, nofollow` | `01a1c6eb-5433-725c-99c8-fb1c82be521b` |
| E6 | `/privacidad/` | 200 HTML, H1 y secciones H2, sin canonical, `noindex, nofollow` | `01a1c6eb-5344-724e-a5c9-1aff3a9d3486` |
| E7 | `/terminos/` | 200 HTML, H1 y secciones H2, sin canonical, `noindex, nofollow` | `01a1c6eb-f435-71c9-b009-0f3d4843a948` |
| E8 | `/copa/` | 404 HTML, «Página no encontrada», metadatos `noindex, nofollow` y `noindex` | `01a1c6eb-f428-70ab-863f-c51d2ef081f3` |
| E9 | `/congresos/?ciudad=san-salvador` | 200 HTML, canonical y `og:url` a `/congresos/`, sin query | `01a1c6eb-f42d-76c7-8022-33b38b9867c9` |
| E10 | `/robots.txt` | 200, `text/plain; charset=utf-8`, `User-Agent: *` y `Disallow: /` | `01a1c6eb-5342-71aa-960a-4f4c5efb141e` |
| E11 | `/sitemap.xml` | 200 XML; `<urlset>` vacío, coherente con la indexación apagada | `01a1c6fa-6bbd-77d7-b9ff-f5a7d3183180` |

Firecrawl devolvió contenido para las 11 URLs. En una lectura anterior, E11 falló en el proveedor y `curl.exe` no logró conectar; una segunda lectura Firecrawl del 2026-11-10 confirmó estado HTTP 200, tipo XML y un `urlset` vacío. El fallo anterior no se interpretó como fallo del sitio.

## Hallazgos priorizados

Estados: **pendiente** requiere acción o evidencia; **justificado** explica una exclusión deliberada o el aplazamiento autorizado, sin equivaler a una validación completa; **corregido** exige una corrección comprobada y su commit. Esta subtarea documental no corrige el sitio.

| Hallazgo | Gravedad | Archivo o ruta | Estado | Evidencia, impacto y acción verificable |
|---|---|---|---|---|
| A1. Falta auditar el modo indexable en un preview aislado | Alta para autorizar indexación; no es un defecto público demostrado | Preview pendiente; E1–E11 | Justificado el aplazamiento por el alcance autorizado; validación pendiente | No existe evidencia de un preview con base de pruebas en esta ejecución. Antes de activar indexación, auditar allí robots, sitemap, metadatos y los cinco schemas. No usar este informe como aprobación de activación. |
| A2. `/copa/` no sirve la página pública esperada | Media | `/copa/`; `src/features/catalog/organizers.ts` | Pendiente | E8 confirma 404 y `noindex`. El plan espera una página de organizador, no un 404. Revisar datos públicos/estado del organizador y despliegue con el responsable; no se puede atribuir a una migración sin evidencia. Verificar respuesta 200 y contenido DEMO; sin eventos, comprobar exclusión de indexación. No se encontró un enlace a `/copa/` en las páginas muestreadas; no se afirma un enlace roto del menú. |
| A3. Portada sin metadatos sociales explícitos | Media | `/`; `src/app/page.tsx` | Corregido en esta rama; despliegue pendiente | E1 mostró que el head público no contenía `og:*` ni `twitter:*`. `src/app/page.tsx` ahora define Open Graph y Twitter, además del título y descripción; las pruebas locales validan estos metadatos. No se ha desplegado ni reconsultado el cambio público, por lo que no se afirma corrección en producción ni efecto sobre ranking. |
| A5. Texto público de privacidad desactualizado | Media de contenido | `/privacidad/`; `src/features/legal/content.ts` | Pendiente | E6 dice «Cuando existan cuentas de comprador» y «Cuando se active el aviso de consentimiento» mientras la misma página muestra el aviso actual. Revisar el texto contra las funciones realmente desplegadas antes de indexar; comprobar de nuevo el contenido y sus afirmaciones. No es una conclusión legal ni una medición SEO. |
| A11. La agenda y el horario publicado de la ficha no coinciden | Media de contenido | `/congresos/inteligencia-artificial/congreso-demo-ia/` | Pendiente | E3 muestra una agenda de 09:00 a 14:00 y un horario del evento de 15:00 a 17:30. Pedir confirmación del organizador y alinear ambos datos; volver a comparar agenda, horario visible y JSON-LD cuando el preview indexable esté disponible. No se inventa el horario correcto. |
| A4. Legales sin canonical declarado | Baja | `/privacidad/`, `/terminos/`; sus `page.tsx` | Pendiente | E6/E7 tienen título, descripción y robots, pero no `<link rel="canonical">` en el HTML. Declarar URL absoluta propia y verificar host/barra final. No se observó un duplicado indexado. |
| A6. Encabezados de tarjetas saltan de H1 a H3 en portada | Baja | `/`; tarjetas destacadas | Pendiente | E1 presenta H1 y después títulos H3 de destacados antes del primer H2 («Próximos eventos»). Añadir un encabezado H2 de sección o ajustar el nivel. Verificar orden en el HTML; no se trata de un error de rastreo. |
| A7. El sitemap está vacío mientras la indexación está apagada | Informativo | `/sitemap.xml`; `src/app/sitemap.ts` | Justificado para el DEMO actual | E11 confirma 200 XML y `urlset` vacío. Coincide con el modo apagado observado en E1–E10 y con la configuración prevista. En el preview indexable, verificar URLs públicas absolutas, filtros y exclusión de privadas. |
| A8. Bloqueo de rastreo y `noindex` de la muestra | Alta si se quisiera publicar en buscadores; esperada en DEMO | E1–E10; `src/app/robots.ts` | Justificado | E10 bloquea todo el rastreo; E1–E9 excluyen indexación. Es coherente con DP-05 y la instrucción de mantener indexación apagada. `Disallow` regula rastreo y `noindex` regula indexación; uno no sustituye al otro ni demuestra retirada efectiva de Google. |
| A9. Sin JSON-LD servido en la muestra | Media antes de validar publicación | E1–E9; `src/lib/seo/jsonld.ts` | Justificado en modo apagado; validación pendiente | No aparecen scripts `application/ld+json` en el HTML recuperado. El código local condiciona WebSite, BreadcrumbList y Article al interruptor. No se certifican los schemas por leer sus constructores; ver matriz siguiente. |
| A10. Blog sin contenido de artículo auditable | Baja en DEMO | `/blog/`, `/blog/[slug]/` | Justificado para esta muestra; Article pendiente | E5 dice «Todavía no hay artículos publicados» y no enlaza fichas de artículos. No se inventó un slug ni se publicó contenido. Repetir la auditoría con un artículo aprobado en la base de pruebas. |

No se confirmó un defecto de gravedad alta sin justificar en la muestra pública. **Esto no cierra A1:** la verificación integral del plan y la autorización técnica de indexación siguen pendientes. Los hallazgos medios/bajos permanecen abiertos; ninguno se marca como corregido sin evidencia.

## Comprobaciones por plantilla

- **Metadatos:** E1–E7 y E9 tienen título y descripción no vacíos acordes con su función y `lang="es-SV"`. Categoría, ficha y empresas incorporan Open Graph y Twitter; la ficha incluye nombre, fecha y ciudad en el título. E5 devuelve título de blog; no se usa la extensión del título como diagnóstico automático de truncamiento en buscadores. Las ausencias específicas se registran en A3/A4.
- **Canónicos:** E1–E4 declaran su ruta absoluta sobre el dominio DEMO y con barra final. E9 elimina la query en canonical y `og:url`. Esto prueba el filtro muestreado, no todos los filtros, redirecciones ni la exclusión del sitemap.
- **Contenido:** la ficha E3 contiene fecha, hora, modalidad, sede DEMO, organizador, dos tipos de entrada, descripción y agenda. La discrepancia de 09:00–14:00 en la agenda y 15:00–17:30 en el horario principal se registra en A11, pendiente de confirmar con el organizador antes de publicar contenido indexable. E4 declara precio por definir, beneficios y acceso mediante cuenta de organizador; no se inventa una tarifa ni una conversión.
- **Enlazado:** E1 enlaza las 12 categorías, la ficha E3, `/para-empresas/`, `/blog/` y legales. E2 enlaza tema y ficha; E3 enlaza categoría/tema, ubicación y un evento relacionado. Los destinos E2–E7 recuperados confirman disponibilidad de esa muestra. El resto de enlaces no se comprobó individualmente; no hay conclusión de ausencia global de enlaces rotos u orfandad.
- **Imágenes:** la portada de E3 tiene `alt="Portada de Congreso demo de IA"`. Las imágenes ilustrativas de tarjetas usan `alt=""` junto al título enlazado y la etiqueta «Imagen ilustrativa»; se justifica como decoración redundante en la muestra. El logo tiene `alt=""` dentro de un enlace con `aria-label="Ticketera C3, ir al inicio"`. No se declaró ausencia de alt a partir de la representación simplificada de Markdown, ni se hizo una auditoría completa de accesibilidad.
- **404:** E8 devuelve estado 404 real según Firecrawl y `noindex`; no se trata de un soft 404 observado. Falta la página de organizador esperada, como recoge A2.

## Datos estructurados: evidencia y validación pendiente

| Tipo requerido | Evidencia disponible | Resultado / siguiente comprobación |
|---|---|---|
| `Event` | E3 no sirve JSON-LD en esta inspección | No validado. En preview indexable comprobar JSON parseable, fechas/zona, modalidad/sede y ofertas frente a la ficha visible, y validar con una herramienta de schema/resultados enriquecidos. |
| `BreadcrumbList` | E2/E3 muestran migas visibles, sin JSON-LD; existe constructor local | No validado en HTML indexable. Verificar posiciones y URL de cada nivel, incluido el actual. |
| `WebSite` | E1 sin JSON-LD; `src/app/page.tsx` lo condiciona a `indexingEnabled` | Ausencia justificada en modo apagado. En preview verificar URL del sitio y destino de búsqueda. |
| `Organization` | E8 es 404; existe constructor local con sufijo DEMO | No validado. Recuperar página pública en base de pruebas y comprobar identidad, URL y marcado DEMO sin inventar afiliaciones. |
| `Article` | E5 no tiene artículos; constructor y ruta dinámica locales | No validado. Usar artículo publicado de pruebas y contrastar título, URL, fechas y contenido visible. |

La presencia de constructores locales no demuestra elegibilidad para resultados enriquecidos, despliegue ni aceptación por un buscador. No se ejecutaron Rich Results Test ni Schema Markup Validator sobre un preview inexistente.

## Verificaciones y reproducción

Paths leídos: el plan y análisis enlazados al inicio; `src/app/page.tsx`, `src/app/layout.tsx`, `src/app/robots.ts`, `src/app/sitemap.ts`; `src/app/{privacidad,terminos,blog}/page.tsx`; `src/app/blog/[slug]/page.tsx`; `src/lib/seo/{jsonld,indexing,metadata}.ts`; `src/features/catalog/organizers.ts`; `src/components/catalog/breadcrumbs.tsx`; `tests/unit/{seo-jsonld,seo-metadata}.test.ts`. Son lecturas locales, no evidencia de despliegue. Único path creado: `docs/analisis/auditoria-seo.md`.

| Comando o herramienta ejecutada | Resultado y alcance |
|---|---|
| `git status --short`, `git branch --show-current`, `git log -1 --format='%h %s'` | Checkout existente con cambios ajenos previos; rama y HEAD indicados arriba. No se hizo push ni PR. |
| `Get-Content docs/superpowers/plans/2026-11-09-fase-7-cierre.md` y `Get-Content docs/analisis/2026-11-09-brechas-y-requerimientos.md`; `rg -n 'SEO-09\|SEO-14\|SEO-15\|DP-11\|DP-16' docs/analisis/2026-11-09-brechas-y-requerimientos.md` | Lectura de alcance, restricciones y criterios. |
| `firecrawl_scrape` con los parámetros y las 11 URLs de cobertura | Diez respuestas de origen observables y un fallo del proveedor; IDs y estados registrados arriba. |
| `curl.exe --silent --show-error --max-time 30 --include https://demo.ticketera.c3.com.sv/sitemap.xml` | Exit 1; error de conexión curl (7). Sin confirmación HTTP del sitemap. |
| Comprobación local de UTF-8, BOM, U+FFFD, CRLF, tablas y secciones del documento; `git diff --no-index --check -- /dev/null docs/analisis/auditoria-seo.md` | PASS: UTF-8 sin BOM ni U+FFFD, finales CRLF, tablas consistentes y enlaces relativos a documentos existentes; comprobación de whitespace sin errores. Verifica el artefacto documental, no el sitio. |

No se añaden pruebas que repliquen este texto ni se ejecuta una suite de aplicación para atribuirle cobertura SEO remota. No se cambió código. Para reproducir la auditoría, repetir los GET de la tabla con los mismos parámetros sin sesión autenticada y comparar HTML/metadata; cualquier cambio posterior requiere fechar evidencia nueva.

## Actualización posterior de configuración y código

El 2026-11-10, tras observar que el ajuste persistido de indexación estaba activado mientras el dominio servía `Disallow: /` y `noindex`, el responsable autorizó apagarlo. Se cambió únicamente `site_settings.indexing_enabled` a `false` mediante actualización condicional y lectura de verificación; se confirmó que quedó apagado. No se modificaron los ajustes de precios ni se aplicaron migraciones. La verificación pública posterior volvió a mostrar HTTP 200, `Disallow: /` y `noindex, nofollow` (Firecrawl: robots `01a1c713-ec75-743a-80eb-970281ba6c65`, portada `01a1c713-ec94-711b-a437-5aaec3ea8d7e`). Una lectura de `/para-empresas/` (Firecrawl `01a1c717-560f-762e-86bc-a7386ffc99c0`) confirmó que el precio anual está configurado y se muestra; no se copia el importe aquí.

La corrección de metadatos sociales de portada está implementada en el código de esta rama y verificada en pruebas locales; queda pendiente de despliegue y de nueva lectura del dominio. El ajuste de indexación permanecerá apagado en esta fase. Estos cambios no alteran la limitación A1: sin preview con base aislada no hay auditoría indexable completa ni aprobación para activar indexación.