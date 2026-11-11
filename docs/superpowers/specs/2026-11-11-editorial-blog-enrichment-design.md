# Diseño: enriquecimiento editorial del blog DEMO

## Intención

Hacer que los artículos del blog se perciban como contenido terminado para la demo: la palabra clave SEO debe ser visible, los enlaces internos deben renderizarse como enlaces reales, cada artículo debe tener portada y autor, y el catálogo editorial debe crecer a cinco artículos con textos más útiles.

## Alcance

- Conservar los tres slugs existentes y ampliar sus cuerpos en español.
- Agregar dos artículos: uno sobre tomar/aprovechar una charla tecnológica y otro sobre romper el hielo en networking.
- Mostrar en el listado y en la ficha: portada local, tema, palabra clave, autor y fecha.
- Permitir enlaces internos Markdown seguros como `[/charlas/]` sin abrir protocolos externos inseguros.
- Reutilizar fotografías locales ya acreditadas en `public/images/events/`; no depender de imágenes remotas.
- Añadir una migración idempotente que agregue `cover_image_path` y `author_name`, actualice los cinco artículos y preserve los registros existentes.

## No alcance

- No crear cuentas Auth para autores DEMO ni cambiar `author_id`.
- No borrar artículos, imágenes, seed ni ilustraciones.
- No convertir el Markdown en un editor HTML ni permitir HTML arbitrario.

## Enfoques considerados

1. **Solo contenido Markdown:** sumar texto e imágenes como sintaxis dentro del cuerpo. Se descarta porque el parser actual no soporta imágenes y no produciría una portada ni una autoría consistente.
2. **Metadatos editoriales nativos (elegido):** columnas `cover_image_path` y `author_name`, consultas tipadas, portada en las tarjetas y ficha, keyword/byline visibles, y parser seguro para rutas internas. Encaja con Supabase y deja el modelo listo para futuros artículos.
3. **URLs externas o CMS:** depender de imágenes remotas o de otro sistema. Se descarta por fragilidad en la demo, licencias y alcance innecesario.

## Decisiones de implementación

- Los cinco autores visibles serán Christopher Marroquin, Fiorella Guzman, Roberto Polanco y Oscar Pleites; uno puede repetirse en el quinto artículo.
- Las portadas usarán rutas locales existentes con créditos en `public/images/CREDITOS.md`.
- El parser permitirá `https://` y rutas internas que empiecen por un solo `/`, sin `//`, `..`, protocolos ni HTML.
- La ficha mostrará `Palabra clave SEO: ...`, `Por ...` y la fecha formateada en español.
- El JSON-LD de Article incorporará autor e imagen cuando existan.

## Criterios de aceptación

- Los enlaces internos de los cinco artículos ya no muestran corchetes ni paréntesis.
- Los cinco artículos publicados tienen keyword, cuerpo de al menos 200 caracteres, autor y portada local válida.
- El listado y la ficha muestran una imagen por artículo; una imagen inválida no rompe la página.
- Hay pruebas RED→GREEN para enlaces internos, metadata editorial y conteo/validez de los cinco artículos.
