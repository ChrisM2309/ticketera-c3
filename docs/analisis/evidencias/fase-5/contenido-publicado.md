# Contenido editorial inicial

Estado al 2026-11-10: **pendiente de publicación desde `/admin/contenido/`**. La migración `20261112100000_editorial_content.sql` está lista para aplicar, pero no se aplica a producción sin confirmación explícita. Por eso este registro no afirma que existan filas publicadas.

## Artículos

Estos cuatro borradores cubren las líneas editoriales previstas. Antes de publicar, el administrador debe completar el cuerpo con al menos 600 palabras, revisar la palabra clave del Excel y asociar los tipos de evento correspondientes.

| Tema | Slug propuesto | Título propuesto | Ruta al publicar | Estado |
|---|---|---|---|---|
| eventos | `como-elegir-un-evento-tecnologico` | Cómo elegir un evento tecnológico | `/blog/como-elegir-un-evento-tecnologico/` | Pendiente |
| cultura | `comunidades-y-cultura-tecnologica` | Comunidades y cultura tecnológica | `/blog/comunidades-y-cultura-tecnologica/` | Pendiente |
| fechas-mixtas | `preparar-tu-calendario-de-eventos` | Cómo preparar tu calendario de eventos | `/blog/preparar-tu-calendario-de-eventos/` | Pendiente |
| eventos | `formatos-para-aprender-y-conectar` | Formatos para aprender y conectar | `/blog/formatos-para-aprender-y-conectar/` | Pendiente |

Las descripciones SEO deben quedar entre 50 y 160 caracteres; no deben incluir cifras, testimonios, afiliaciones ni disponibilidad no comprobada.

## Textos de categoría

El administrador debe crear y publicar un texto de 150–250 palabras desde `/admin/contenido/categorias/[id]/` para cada tipo del Excel:

`/congresos/`, `/competencias/`, `/networking/`, `/workshops/`, `/bootcamps/`, `/concursos/`, `/webinars/`, `/conferencias/`, `/hackathons/`, `/meetups/`, `/charlas/` y `/ferias-tecnologicas/`.

Cada texto debe usar la palabra clave de su categoría, describir el tipo de experiencia sin prometer resultados y, si corresponde, añadir preguntas frecuentes verificables. La FAQ se renderiza como texto React y no se publica como JSON-LD.

## Calendario de publicación

No se asignan fechas ficticias. Tras definirlas el responsable, deben quedar antes del pico editorial de septiembre–octubre y anotarse aquí con fecha, slug y persona que publicó. La activación del interruptor SEO es una acción separada en `/admin/ajustes/`.
