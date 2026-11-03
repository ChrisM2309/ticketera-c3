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

**Organizadores:** `/claude/`, `/copa/` (slugs exactamente como en el Excel; usar como datos académicos, verificar nombres visibles antes de mostrar como entidades reales).

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

Implementación sugerida: catch-all `src/app/(marketplace)/[...segments]/page.tsx` para rutas públicas SEO, con verificación en DB y `notFound()` para inexistentes. Rutas fijas `/checkout/`, `/carrito/`, `/publicar/`, `/admin/`, `/mis-boletos/` y confirmaciones fuera de catch-all, con precedencia de estáticas.

## 5. Metadatos y datos estructurados

- Home: title/H1 vinculados a 'boletos para El Salvador' + eventos tecnológicos; meta description sin afirmaciones no respaldadas.
- Categoría: title, H1 y texto introductorio con keyword del Excel; filtros aplicables y contenido contextual.
- Evento: title específico, imagen, fecha y lugar/modo; JSON-LD `Event` con información realmente almacenada.
- Modalidad/precio sin eventos: `noindex` y sin sitemap hasta tener inventario.
- Checkout, confirmaciones, panel y rutas de autenticación: `noindex`; enlaces a orden bajo token privado.
- `sitemap.xml` y `robots.txt`, canonical por URL limpia y trailing slash consistente.
- No indexar como eventos **reales** los diez ejemplos ficticios; mantener marca DEMO.

## 6. Navegación

Logo clicable vuelve al Home; no 'Inicio' en menú. Menú compacto con 12 categorías ordenadas, buscador; 'Publicar evento', carrito y 'Mis boletos'. En móvil, drawer o desplegable de categorías y filtros accesibles.

## 7. Estrategia de generación

Crear un sistema de rutas y plantillas a partir de taxonomía. Mantener 134 entradas en dataset/documentación si así se desea, pero no servir páginas indexables vacías ni duplicadas. Para la entrega bastan 12 categorías y al menos 2–3 subcategorías pobladas, con los ejemplos que se usen en el flujo de compra.
