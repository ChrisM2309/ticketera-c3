# Arquitectura SEO y navegación

## Fuente

`Avance 2 - proyecto mercadeo.xlsx`, pestaña `ARQUITECTURA ` y material del equipo. La fuente contempla 134 rutas: 1 Home, 21 páginas primer nivel (12 tipos, 4 temas, 3 ubicaciones, 2 organizadores), 36 temas anidados y 76 modalidades/precio anidados.

## 1. Las 12 categorías de tipos de evento (menú primario)

| Orden | Slug | Keyword principal | Búsquedas/mes (Excel) |
|---|---|---|---:|
| 1 | `/congresos/` | congreso | 40,500 |
| 2 | `/competencias/` | competencia | 27,100 |
| 3 | `/networking/` | networking | 22,200 |
| 4 | `/workshops/` | workshop | 14,800 |
| 5 | `/bootcamps/` | bootcamp | 14,800 |
| 6 | `/concursos/` | concurso | 12,100 |
| 7 | `/webinars/` | webinar | 12,100 |
| 8 | `/conferencias/` | conferencia | 9,900 |
| 9 | `/hackathons/` | hackathon | 6,600 |
| 10 | `/meetups/` | meetup | 4,400 |
| 11 | `/charlas/` | charla | 2,900 |
| 12 | `/ferias-tecnologicas/` | feria tecnológica | 210 |

Empates se resuelven según el orden del Excel. Valores aportados por el equipo; no asumir vigencia de volumen en producción.

## 2. Páginas de primer nivel complementarias

**Temas:** `/cloud/`, `/inteligencia-artificial/`, `/programacion/`, `/python/`.

**Ubicaciones:** `/san-miguel/`, `/san-salvador/`, `/santa-ana/`.

**Organizadores:** el Excel contempla `/claude/` y `/copa/`; las páginas se generan para organizadores activos con slug válido y enlazan desde sus fichas de evento. Todas llevan `noindex` y quedan fuera del sitemap. No atribuir afiliaciones oficiales al contenido DEMO.

**No** mezclar estas nueve páginas con los 12 tipos del menú primario; deben estar en navegación secundaria, filtros o footer.

## 3. Slugs de subcategorías y modalidades

Ejemplos tomados de la pestaña:

- `/congresos/inteligencia-artificial/`
- `/congresos/ciberseguridad/`
- `/congresos/ecommerce/`
- `/competencias/robotica/`
- `/networking/cloud/`
- `/bootcamps/analisis-de-datos/`
- `/bootcamps/ciencia-de-datos/`
- `/concursos/programacion/`

Un tema anidado puede tener `/virtual/`, `/presencial/` o `/gratis/`, **solo cuando exista en el árbol para esa ruta**. Las 76 modalidades no son nuevas categorías de evento.

## 4. Ficha del evento

`/[categoria]/[tema]/[evento]/` (ej. `/congresos/inteligencia-artificial/congreso-demo-ia/`). No introducir prefijos como `/products/` o `/events/` en la ruta pública si se ha decidido respetar esa estructura.

**Precaución:** tercera sección `/virtual/`, `/presencial/`, `/gratis/` ya se usa para landing de modalidad/precio. Son slugs reservados; nunca permitir que un evento use un slug igual a ellos. El resolvedor de rutas consulta la taxonomía antes de interpretar un segmento como evento.

Implementación vigente: catch-all `src/app/[...segments]/page.tsx` para catálogo, organizadores y fichas, con verificación en DB y `notFound()` para inexistentes. Las rutas fijas de compra, cuenta, panel, administración y confirmaciones tienen precedencia. Publicar un evento se hace en `/panel/eventos/nuevo/`; no existe una página `/publicar/`.

## 5. Metadatos y datos estructurados

- Home: title/H1 vinculados a 'boletos para El Salvador' + eventos tecnológicos; meta description sin afirmaciones no respaldadas.
- Categoría: title, H1 y texto introductorio con keyword del Excel; filtros aplicables y contenido contextual.
- Evento: title específico, imagen, fecha y lugar/modo; JSON-LD `Event` con información realmente almacenada.
- Ciudad, modalidad/precio y organizadores: `noindex` y sin sitemap incluso con inventario; categorías y temas vacíos también quedan fuera.
- Checkout, confirmaciones, panel y rutas de autenticación: `noindex`; enlaces a orden bajo token privado.
- `sitemap.xml` y `robots.txt`, canonical por URL limpia y trailing slash consistente.
- `site_settings.indexing_enabled` gobierna la indexación (apagado por defecto): apagado genera `Disallow: /`, sitemap vacío, metadatos `noindex` y omite JSON-LD. Encendido habilita solo las páginas elegibles. La etiqueta DEMO sigue visible y no gobierna el interruptor (D-63).
- JSON-LD implementado: `WebSite` en Home y `Organization` en la página de organizador, `BreadcrumbList` en la navegación correspondiente, `Event` en fichas elegibles y `Article` en artículos publicados. Su existencia en código no acredita validación remota ni resultados de búsqueda.

## 6. Navegación

Logo clicable vuelve al Home; no 'Inicio' en menú. Menú compacto con 12 categorías ordenadas, buscador; 'Publicar evento', carrito y 'Mis boletos'. En móvil, drawer o desplegable de categorías y filtros accesibles.

## 7. Estrategia de generación

Crear un sistema de rutas y plantillas a partir de taxonomía. Mantener 134 entradas en dataset/documentación si así se desea, pero no servir páginas indexables vacías ni duplicadas. Para la entrega bastan 12 categorías y al menos 2–3 subcategorías pobladas, con los ejemplos que se usen en el flujo de compra.

## 8. Rutas incorporadas y política SEO (DOC-08)

«Sí» indica elegibilidad cuando el administrador activa `indexing_enabled`, no una indexación realizada. Los canónicos se construyen con `NEXT_PUBLIC_SITE_URL`; los filtros apuntan a la ruta base sin parámetros. La activación del dominio final y Search Console son pasos manuales pendientes del responsable.

| Ruta | Indexable | Condición o acceso |
|---|---|---|
| `/blog/` | Sí | Listado público; actualmente puede mostrar un estado vacío |
| `/blog/[slug]/` | Sí | Solo artículos `published`; inexistentes o borradores responden 404 al público |
| `/[organizador]/` | No | Organizador activo con slug válido; muestra próximos eventos publicados |
| `/para-empresas/` | Sí | Beneficios públicos; contratación vinculada a organizador, pago DEMO |
| `/privacidad/` | Sí | Texto de datos y consentimiento de la demo |
| `/terminos/` | Sí | Condiciones de uso académico y pagos simulados |
| `/calendario/[id]/` | No | Descarga pública `.ics` de evento publicado; excluida por `/calendario/` |
| `/mis-boletos/` | No | Sesión de comprador; solo órdenes propias; `noindex` |
| `/cuenta/` | No | Sesión y perfil propio; `noindex` |
| `/registro/` | No | Alta de comprador; `noindex` |
| `/recuperar/` | No | Recuperación de contraseña; `/recuperar/nueva/` también lleva `noindex` |
| `/panel/destacar/[id]/` | No | Evento propio y publicado; `noindex` |
| `/panel/paquete/` | No | Paquetes y seguimientos del organizador; `noindex` |
| `/panel/eventos/[id]/checkin/` | No | Propietario o admin; validación de QR, sin datos personales; `noindex` |
| `/panel/eventos/[id]/reporte/` | No | Agregados del propietario o admin; `noindex` |
| `/panel/eventos/[id]/reporte/exportar/` | No | CSV superior; paquete `active` del propietario o admin; respuesta privada sin caché |
| `/admin/*` | No | Administración comprobada en servidor; páginas con `noindex` |
| `/confirmacion/[orderId]/[token]/encuesta/` | No | Token válido de orden confirmada; `noindex` |

`[id]` es notación documental: los directorios de calendario y destacar usan `[eventId]`; check-in y reporte usan `[id]`. `/admin/*` abarca `/admin/`, `/admin/organizadores/`, `/admin/destacados/`, `/admin/ajustes/`, `/admin/contenido/` (blog y categorías) y `/admin/metricas/`.

La lista `privatePaths` de `src/lib/seo/indexing.ts` excluye `/admin/`, `/api/`, `/buscar/`, `/calendario/`, `/carrito/`, `/checkout/`, `/confirmacion/`, `/cuenta/`, `/ingresar/`, `/mis-boletos/`, `/panel/`, `/recuperar/` y `/registro/` de robots y sitemap, incluidos sus descendientes. Las páginas HTML privadas además declaran `robots: { index: false, follow: false }`. `Disallow` evita rastreo, pero no garantiza retirar una URL ya indexada; tampoco sustituye autenticación ni validación del token. El calendario descarga datos públicos del evento, sin datos de compradores.
