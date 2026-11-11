alter table public.blog_posts
  add column if not exists cover_image_path text,
  add column if not exists author_name text;

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'blog_posts_cover_image_path_check') then
    alter table public.blog_posts
      add constraint blog_posts_cover_image_path_check
      check (cover_image_path is null or (cover_image_path ~ '^/images/[A-Za-z0-9._/-]+$' and cover_image_path not like '%..%' and cover_image_path not like '%//%'));
  end if;
  if not exists (select 1 from pg_constraint where conname = 'blog_posts_author_name_check') then
    alter table public.blog_posts
      add constraint blog_posts_author_name_check
      check (author_name is null or char_length(author_name) between 2 and 80);
  end if;
end;
$$;

insert into public.blog_posts (
  slug, title, description, body_md, keyword, topic, related_type_slugs, status, published_at, cover_image_path, author_name
) values
  (
    'beneficios-networking-eventos-tecnologicos',
    'Beneficios del networking en eventos tecnológicos',
    'Descubre cómo hacer networking en eventos tecnológicos para aprender, compartir proyectos y construir relaciones profesionales con intención.',
    $$# Beneficios del networking en eventos tecnológicos

Asistir a un evento tecnológico no consiste únicamente en escuchar una charla. Una conversación breve después de una ponencia puede ayudarte a encontrar una nueva perspectiva, una persona con quien practicar o una comunidad que siga aprendiendo contigo. El networking funciona mejor cuando parte de la curiosidad: pregunta qué está construyendo la otra persona, cuenta qué te interesa y escucha sin convertir el encuentro en un intercambio apresurado de tarjetas.

## Antes de llegar

Antes de llegar, elige una meta pequeña y concreta. Puede ser conocer a dos personas que trabajen con datos, pedir retroalimentación sobre un proyecto, encontrar una comunidad de Python o descubrir un [meetup](/meetups/) al que puedas volver. Una meta manejable evita que la experiencia se convierta en una lista de contactos y te ayuda a prestar atención a las conversaciones que sí te interesan.

Revisa el programa, la modalidad y los temas del evento. En una actividad presencial puedes identificar los espacios naturales para conversar: la fila de registro, una pausa, una mesa de trabajo o el cierre. En un encuentro virtual conviene probar el micrófono, escribir una presentación breve en el chat y reservar unos minutos para quedarte después de la sesión. Prepararse no significa memorizar un discurso; significa llegar con una pregunta y un proyecto que puedas explicar en dos frases.

## Cómo conversar sin forzar el encuentro

Una buena pregunta abre más puertas que una presentación demasiado larga. Puedes preguntar qué llevó a la otra persona al evento, qué parte del programa espera aprovechar o qué está aprendiendo en este momento. Cuando encuentres un punto en común, comparte algo propio y deja espacio para que la conversación avance. El objetivo no es demostrar que sabes más, sino descubrir si existe un interés compartido.

También puedes pedir permiso antes de continuar: “¿Te puedo escribir para compartirte este recurso?”. Si la respuesta es sí, anota el nombre y el tema que conversaron. Si la respuesta es no o la persona tiene prisa, agradécele el tiempo y sigue tu recorrido. El networking sano respeta los límites y no convierte cada saludo en una obligación profesional.

## Después del evento

El seguimiento debe ser breve y específico. Un mensaje que recuerde la charla, comparta un enlace relacionado o agradezca una recomendación resulta más útil que una invitación genérica. Si prometiste enviar una lectura o mostrar un prototipo, cumple en los días siguientes. Una relación profesional se construye con continuidad, no con una sola interacción.

Los [eventos de networking](/networking/) son útiles para estudiantes, personas que están cambiando de área y equipos que buscan nuevas perspectivas. Permiten comparar rutas de aprendizaje, conocer vocabulario del campo y observar cómo otras personas explican sus proyectos. Puedes revisar también [conferencias](/conferencias/) y [charlas](/charlas/) según el tipo de conversación que quieres tener.

En una demo académica como Ticketera C3, el objetivo no es prometer resultados ni presentar afiliaciones reales. La plataforma organiza información para que puedas descubrir eventos tecnológicos, escoger una actividad adecuada y llegar mejor preparado a una conversación que podría convertirse en aprendizaje compartido.$$,
    'networking en eventos tecnológicos', 'eventos', '{networking,meetups}', 'published', '2026-11-11 18:00:00+00', '/images/events/networking-cafe-nodo.jpg', 'Christopher Marroquin'
  ),
  (
    'como-aprovechar-hackathon',
    'Cómo aprovechar un hackathon para aprender',
    'Una guía práctica para elegir un reto, organizar un equipo y salir de un hackathon con aprendizaje y un prototipo presentable.',
    $$# Cómo aprovechar un hackathon para aprender

Un hackathon es una oportunidad para aprender haciendo, pero no necesitas llegar con una idea perfecta. Lo más importante es entender el reto, elegir un alcance que puedas explicar y organizar el tiempo en ciclos cortos. Un prototipo pequeño que resuelve una parte del problema suele enseñar más que una plataforma enorme que nunca llega a probarse.

## Elige un reto que puedas entender

Antes de inscribirte, lee el tema, la modalidad, la duración y las reglas sobre datos o herramientas. Pregúntate qué te gustaría practicar: investigación, diseño, programación, presentación o coordinación. Un [hackathon](/hackathons/) puede tener un enfoque de inteligencia artificial, datos abiertos, robótica o impacto comunitario, pero el aprendizaje depende de que el reto sea compatible con el tiempo que tienes disponible.

Cuando empiece la actividad, convierte el reto en una pregunta sencilla. En lugar de decir “vamos a transformar la educación”, intenta definir qué persona necesita qué ayuda y en qué momento. Esa frase se puede revisar con otras personas y funciona como brújula cuando el equipo empieza a acumular ideas. Si el problema no se puede explicar en un minuto, todavía necesita conversación.

## Forma un equipo complementario

Empieza por formar un equipo con habilidades diferentes. Alguien puede investigar, otra persona diseñar la experiencia y otra construir la primera versión. No es necesario que cada integrante tenga un título técnico; también hacen falta quienes sepan preguntar, ordenar información, probar un flujo y contar la historia del proyecto.

Acuerden una definición de terminado antes de escribir demasiado código. Decidan qué pantalla, experimento o demostración debe funcionar al final y qué ideas quedan fuera por ahora. Revisen el avance después de cada bloque y nombren una persona que cuide el tiempo. La coordinación reduce el trabajo duplicado y permite que todos entiendan qué decisión viene después.

## Prototipa, prueba y presenta

Durante las horas de trabajo, reserven tiempo para probar con una persona que no conozca el proyecto. Esa conversación revela dónde se pierde la explicación y qué parte de la propuesta necesita menos texto. Si usan datos o servicios externos, documenten sus supuestos y no presenten como hecho aquello que todavía es una hipótesis.

Al final, una demo clara cuenta tres cosas: el problema, el flujo principal y lo que aprendió el equipo. Muestra la parte que funciona, reconoce las limitaciones y explica qué construirías después. No hace falta esconder los errores; una reflexión honesta demuestra que el equipo observó el proceso y puede tomar mejores decisiones en la siguiente iteración.

Puedes buscar [hackathons](/hackathons/) y [competencias](/competencias/) en Ticketera C3 para comparar fecha, modalidad y tipo de entrada antes de registrarte. Los eventos de esta plataforma son parte de una demo académica y sus pagos están simulados, pero la ficha de cada actividad puede ayudarte a planear una experiencia de aprendizaje concreta.$$,
    'cómo aprovechar un hackathon', 'eventos', '{hackathons,competencias}', 'published', '2026-11-11 18:05:00+00', '/images/events/hackathons-hackeo-verde.jpg', 'Fiorella Guzman'
  ),
  (
    'elegir-evento-tecnologico',
    'Cómo elegir el evento tecnológico ideal',
    'Aprende a elegir entre workshop, bootcamp, charla o conferencia según tu tiempo, objetivo de aprendizaje y forma de participar.',
    $$# Cómo elegir el evento tecnológico ideal

La mejor actividad tecnológica depende de lo que quieres hacer después. Una [charla](/charlas/) suele ser una buena puerta de entrada cuando buscas una idea concreta en poco tiempo. Una [conferencia](/conferencias/) reúne varias perspectivas y ayuda a entender un tema más amplio. Si quieres practicar con acompañamiento, un [workshop](/workshops/) te da un espacio para construir algo durante la sesión.

## Empieza por tu objetivo

Antes de filtrar eventos, completa esta frase: “Después de asistir quiero…”. Tal vez quieres entender un concepto, practicar una herramienta, conocer una comunidad, presentar un proyecto o encontrar una ruta de formación. El objetivo te ayuda a distinguir entre una actividad para escuchar y otra que exige participar, entregar un ejercicio o reservar varias fechas.

Los [bootcamps](/bootcamps/) requieren más compromiso porque distribuyen el aprendizaje en varias sesiones. Un workshop puede tener un resultado más inmediato, mientras que una conferencia puede darte contexto y vocabulario para seguir investigando. Ningún formato es superior en todos los casos; la elección correcta depende de tu tiempo, tu nivel actual y la energía que puedes dedicar después del evento.

## Revisa los detalles prácticos

Antes de registrarte, revisa la fecha, el horario, la modalidad, la ciudad cuando sea presencial y el tipo de entrada. Si el evento es virtual, comprueba cómo recibirás el enlace y si necesitas instalar alguna herramienta. Si es presencial, calcula el traslado y revisa si el espacio permite trabajar con laptop, tomar notas o participar en mesas.

También conviene mirar el perfil de los ponentes y la agenda. Una descripción clara debe decir qué temas se cubrirán, qué conocimientos previos se esperan y cuánto tiempo ocupará cada parte. Si la ficha no responde una pregunta importante, escríbele al organizador o elige una actividad cuya información sea más completa. Comparar no es desconfiar: es cuidar tu tiempo y tus expectativas.

## Elige una primera experiencia

También es válido comenzar por un evento gratuito. La experiencia te ayuda a conocer tu ritmo y a descubrir qué temas quieres explorar. Lleva una pregunta, una forma sencilla de tomar notas y un plan para revisar lo aprendido después. Si al terminar puedes explicar una idea nueva o definir tu siguiente paso, la actividad ya tuvo valor.

En Ticketera C3 los eventos son parte de una demo académica y los pagos están simulados. La información de cada ficha sirve para comparar opciones con claridad: categorías, fechas, modalidad, organizador, entradas y eventos relacionados. Puedes empezar con una [charla](/charlas/), avanzar a un [workshop](/workshops/) y después buscar un [bootcamp](/bootcamps/) cuando quieras una experiencia más extensa.$$,
    'elegir eventos tecnológicos', 'eventos', '{charlas,conferencias,workshops,bootcamps}', 'published', '2026-11-11 18:10:00+00', '/images/events/workshops-mapa-datos.jpg', 'Roberto Polanco'
  ),
  (
    'tomar-notas-charla-tecnologica',
    'Cómo tomar notas y vivir una charla tecnológica',
    'Una guía práctica para escuchar mejor, tomar notas útiles y convertir una charla tecnológica en un siguiente paso concreto.',
    $$# Cómo tomar notas y vivir una charla tecnológica

Una charla tecnológica puede dejar muchas ideas en poco tiempo. Entre conceptos nuevos, ejemplos, preguntas y enlaces, es fácil salir con varias páginas de apuntes que después no vuelves a mirar. Tomar notas no significa transcribir cada frase: significa elegir qué merece una segunda lectura y qué acción te gustaría probar.

## Antes de sentarte

Lee la descripción de la actividad y escribe una pregunta que quieras responder. Puede ser “¿para qué sirve esta herramienta?”, “¿qué problema resuelve este enfoque?” o “¿qué tendría que aprender para intentarlo?”. Llegar con una pregunta convierte la escucha en una búsqueda y te ayuda a reconocer cuándo la ponencia está conectando con tu objetivo.

Prepara un formato sencillo. Divide la hoja o el documento en tres partes: ideas, dudas y próximos pasos. En una [charla](/charlas/) presencial puedes llevar una libreta; en una actividad virtual puedes usar un documento compartido. Lo importante es que el método no compita con la atención. Si una diapositiva ya contiene una definición, anota la consecuencia o el ejemplo que te resultó más claro.

## Durante la charla

Escucha las frases que cambian tu forma de entender el tema. Anota una idea con tus propias palabras y agrega un ejemplo. Si aparece un término desconocido, escríbelo en la lista de dudas y continúa; detenerte a buscar todo en el momento puede hacer que pierdas la explicación principal. También registra el nombre de las herramientas, libros o proyectos que quieras investigar más adelante.

Participar no tiene que significar hablar todo el tiempo. Puedes hacer una pregunta concreta al final, compartir una observación en el chat o comentar con otra persona durante la pausa. Si no quieres intervenir públicamente, conversa después con alguien del público y pregunta qué parte le pareció más útil. Una actividad tecnológica se vive mejor cuando alternas atención individual y conversación.

## Después de salir

Reserva diez minutos para limpiar tus notas. Escribe tres frases: qué aprendí, qué todavía no entiendo y qué voy a probar. Luego elige un único siguiente paso para la semana: leer la documentación, recrear un ejemplo, compartir la idea con tu equipo o buscar un [workshop](/workshops/) relacionado. Una acción pequeña convierte una charla interesante en aprendizaje acumulado.

Si la ponencia te llevó a un tema más amplio, revisa [conferencias](/conferencias/) o actividades de la misma comunidad. Guarda tus notas con la fecha y el nombre del evento para que puedas volver a ellas. En Ticketera C3 el contenido y los pagos son DEMO, pero la agenda, la modalidad y los eventos relacionados te ayudan a planear cómo participar con intención.$$,
    'cómo aprovechar una charla tecnológica', 'eventos', '{charlas,conferencias,workshops}', 'published', '2026-11-11 18:15:00+00', '/images/events/conferencias-plataformas.jpg', 'Oscar Pleites'
  ),
  (
    'romper-hielo-networking',
    'Cómo romper el hielo en un evento de networking',
    'Ideas sencillas para iniciar conversaciones, hacer preguntas naturales y sacar plática en un evento de networking tecnológico.',
    $$# Cómo romper el hielo en un evento de networking

Romper el hielo en un evento de networking no requiere una frase ingeniosa ni una personalidad extrovertida. Basta con reconocer que varias personas llegaron por una razón parecida y empezar desde ese contexto compartido. Una pregunta sencilla sobre la actividad suele sentirse más natural que una presentación que intenta resumir toda tu trayectoria.

## Encuentra el momento adecuado

Las pausas, la fila de registro, una mesa compartida y el cierre son momentos cómodos para saludar. Observa si la persona parece disponible y evita interrumpir una conversación muy concentrada. Puedes acercarte con una presentación breve: tu nombre, qué te interesa y qué esperas aprender en el evento. Después, haz una pregunta y escucha la respuesta.

Frases como “¿qué te trajo a este [meetup](/meetups/)?”, “¿qué parte de la agenda esperas?” o “¿has participado antes en eventos de [networking](/networking/)?”, abren una conversación sin exigir una respuesta perfecta. Si la persona responde con detalle, toma ese punto como una invitación. Si responde corto, agradece y deja la puerta abierta sin insistir.

## Saca plática con curiosidad

La conversación mejora cuando alternas preguntas y algo propio. Después de escuchar, comparte una experiencia relacionada: un curso que estás tomando, una herramienta que probaste o una duda que llevas al evento. No necesitas tener un proyecto terminado. Decir “estoy explorando este tema y quiero entender por dónde empezar” puede generar una conversación más honesta que enumerar habilidades.

También puedes preguntar por el camino de la otra persona: qué aprendió recientemente, qué recurso recomienda o qué le habría gustado saber cuando comenzó. Evita convertir la charla en una entrevista y presta atención a las señales. Si ambos tienen tiempo, profundiza; si la conversación ya cumplió su ciclo, ciérrala con amabilidad: “Me gustó hablar contigo; voy a saludar a otras personas y nos vemos luego”.

## De la conversación al seguimiento

Antes de pedir un contacto, explica por qué te gustaría continuar: compartir un enlace, enviar una pregunta o seguir una comunidad. Si la otra persona acepta, anota el nombre y el tema que conversaron. Un mensaje posterior puede ser tan simple como “fue interesante hablar sobre APIs en el evento; te comparto el recurso que mencioné”. El seguimiento específico demuestra que escuchaste.

No todas las conversaciones deben convertirse en una relación profesional. A veces el resultado es una recomendación, una nueva palabra para investigar o la confianza para volver a asistir. Puedes practicar en una actividad pequeña y después explorar [conferencias](/conferencias/), [charlas](/charlas/) o [meetups](/meetups/) con mayor comodidad.

El networking funciona mejor cuando se basa en respeto, curiosidad y reciprocidad. En la demo académica de Ticketera C3 puedes comparar fecha, modalidad y categoría antes de elegir dónde participar. Lleva una pregunta, escucha con atención y recuerda que sacar plática no es impresionar a todo el mundo: es encontrar una conversación que valga la pena continuar.$$,
    'romper el hielo en networking', 'eventos', '{networking,meetups,conferencias}', 'published', '2026-11-11 18:20:00+00', '/images/events/meetups-python-parque.jpg', 'Christopher Marroquin'
  )
on conflict (slug) do update set
  title = excluded.title,
  description = excluded.description,
  body_md = excluded.body_md,
  keyword = excluded.keyword,
  topic = excluded.topic,
  related_type_slugs = excluded.related_type_slugs,
  status = excluded.status,
  published_at = coalesce(public.blog_posts.published_at, excluded.published_at),
  cover_image_path = excluded.cover_image_path,
  author_name = excluded.author_name,
  updated_at = now();
