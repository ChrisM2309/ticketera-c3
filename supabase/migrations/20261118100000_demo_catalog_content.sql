-- Catálogo DEMO adicional de eventos y contenido editorial.
-- Es aditivo: no borra ni actualiza filas del seed existente.
-- Las migraciones corren antes de supabase/seed.sql, por eso se asegura aquí la taxonomía mínima.

insert into public.categories (kind, slug, name, keyword, search_volume, sort_order) values
  ('event_type', 'congresos', 'Congresos', 'congreso', 40500, 1),
  ('event_type', 'competencias', 'Competencias', 'competencia', 27100, 2),
  ('event_type', 'networking', 'Networking', 'networking', 22200, 3),
  ('event_type', 'workshops', 'Workshops', 'workshop', 14800, 4),
  ('event_type', 'bootcamps', 'Bootcamps', 'bootcamp', 14800, 5),
  ('event_type', 'concursos', 'Concursos', 'concurso', 12100, 6),
  ('event_type', 'webinars', 'Webinars', 'webinar', 12100, 7),
  ('event_type', 'conferencias', 'Conferencias', 'conferencia', 9900, 8),
  ('event_type', 'hackathons', 'Hackathons', 'hackathon', 6600, 9),
  ('event_type', 'meetups', 'Meetups', 'meetup', 4400, 10),
  ('event_type', 'charlas', 'Charlas', 'charla', 2900, 11),
  ('event_type', 'ferias-tecnologicas', 'Ferias tecnológicas', 'feria tecnológica', 210, 12),
  ('topic', 'cloud', 'Cloud', null, null, 1),
  ('topic', 'inteligencia-artificial', 'Inteligencia artificial', null, null, 2),
  ('topic', 'programacion', 'Programación', null, null, 3),
  ('topic', 'python', 'Python', null, null, 4),
  ('topic', 'analisis-de-datos', 'Análisis de datos', null, null, 5),
  ('topic', 'ciberseguridad', 'Ciberseguridad', null, null, 6),
  ('topic', 'ciencia-de-datos', 'Ciencia de datos', null, null, 7),
  ('topic', 'desarrollo-web', 'Desarrollo web', null, null, 8),
  ('topic', 'devops', 'DevOps', null, null, 9),
  ('topic', 'ecommerce', 'E-commerce', null, null, 10),
  ('topic', 'fintech', 'Fintech', null, null, 11),
  ('topic', 'machine-learning', 'Machine learning', null, null, 12),
  ('topic', 'robotica', 'Robótica', null, null, 13),
  ('topic', 'startups', 'Startups', null, null, 14),
  ('location', 'san-salvador', 'San Salvador', null, null, 1),
  ('location', 'san-miguel', 'San Miguel', null, null, 2),
  ('location', 'santa-ana', 'Santa Ana', null, null, 3)
on conflict (kind, slug) do nothing;

insert into public.organizers (slug, name, description, status) values
  ('lumenbyte-labs', 'LumenByte Labs', 'Marca ficticia de innovación y prototipado creada para la demo académica; no representa una empresa real.', 'active'),
  ('nube-norte', 'Nube Norte', 'Marca ficticia de formación en tecnología creada para la demo académica; no representa una afiliación oficial.', 'active'),
  ('bitacora-digital', 'Bitácora Digital', 'Colectivo editorial ficticio de comunidades digitales creado para la demo académica.', 'active'),
  ('tropico-tech', 'Trópico Tech', 'Marca ficticia de encuentros tecnológicos creada para la demo académica; sus eventos son ilustrativos.', 'active'),
  ('senda-dev', 'Senda Dev', 'Comunidad ficticia de desarrollo y aprendizaje creada para la demo académica.', 'active')
on conflict (slug) do nothing;

insert into public.events (
  organizer_id, event_type_id, topic_id, location_id, slug, title, description, agenda,
  mode, venue, image_path, speakers, starts_at, ends_at, status, is_demo
) values
  (
    (select id from public.organizers where slug = 'lumenbyte-labs'),
    (select id from public.categories where kind = 'event_type' and slug = 'congresos'),
    (select id from public.categories where kind = 'topic' and slug = 'inteligencia-artificial'),
    (select id from public.categories where kind = 'location' and slug = 'san-salvador'),
    'cumbre-brujula-digital', 'Cumbre Brújula Digital',
    'Un encuentro para conversar sobre aprendizaje automático, productos digitales y las decisiones que convierten una idea en una herramienta útil. Evento ficticio para la demo académica.',
    E'09:00 Registro y café\n09:45 Panorama de modelos útiles\n11:30 Conversación: datos con propósito\n15:00 Laboratorio de casos',
    'presencial', 'Auditorio Horizonte, San Salvador', '/images/events/congresos-cumbre-brujula.jpg',
    '[{"name":"Mara Villalta","role":"Investigadora de productos de datos"},{"name":"Tomás Arévalo","role":"Diseñador de soluciones de aprendizaje automático"}]'::jsonb,
    '2026-09-19 15:00:00+00', '2026-09-19 23:00:00+00', 'published', true
  ),
  (
    (select id from public.organizers where slug = 'bitacora-digital'),
    (select id from public.categories where kind = 'event_type' and slug = 'congresos'),
    (select id from public.categories where kind = 'topic' and slug = 'ecommerce'), null,
    'congreso-codigo-abierto', 'Congreso Código Abierto',
    'Dos jornadas de conversaciones sobre comunidades, accesibilidad y herramientas web que pueden crecer con quienes las usan. Evento ficticio para la demo académica.',
    E'09:00 Apertura\n10:00 Keynote: construir en público\n13:30 Panel de comunidades\n16:00 Clínica de proyectos',
    'virtual', null, '/images/events/congresos-cumbre-brujula.jpg',
    '[{"name":"Irene Cañas","role":"Arquitecta de plataformas web"},{"name":"Julián Paz","role":"Facilitador de comunidades de software"}]'::jsonb,
    '2027-02-06 15:00:00+00', '2027-02-06 22:00:00+00', 'published', true
  ),
  (
    (select id from public.organizers where slug = 'senda-dev'),
    (select id from public.categories where kind = 'event_type' and slug = 'competencias'),
    (select id from public.categories where kind = 'topic' and slug = 'robotica'),
    (select id from public.categories where kind = 'location' and slug = 'san-miguel'),
    'reto-circuito-autonomo', 'Reto Circuito Autónomo',
    'Equipos estudiantiles resuelven un circuito de navegación con sensores, documentación y una presentación final. Evento ficticio para la demo académica.',
    E'08:00 Inscripción de equipos\n09:00 Revisión técnica\n13:00 Rondas de prueba\n16:30 Premiación',
    'presencial', 'Pabellón Innovar, San Miguel', '/images/events/competencias-reto-circuito.jpg',
    '[{"name":"Sofía Menjívar","role":"Mentora de robótica educativa"},{"name":"Álvaro Rivas","role":"Juez de prototipos autónomos"}]'::jsonb,
    '2026-10-31 14:00:00+00', '2026-10-31 22:00:00+00', 'published', true
  ),
  (
    (select id from public.organizers where slug = 'nube-norte'),
    (select id from public.categories where kind = 'event_type' and slug = 'competencias'),
    (select id from public.categories where kind = 'topic' and slug = 'inteligencia-artificial'), null,
    'liga-algoritmia-pacifico', 'Liga Algoritmia del Pacífico',
    'Una competencia en línea de problemas de lógica, estructuras de datos y optimización pensada para practicar en equipo. Evento ficticio para la demo académica.',
    E'13:00 Bienvenida\n13:30 Primera ronda\n16:00 Segunda ronda\n18:00 Resultados',
    'virtual', null, '/images/events/competencias-reto-circuito.jpg',
    '[{"name":"Nicolás Portillo","role":"Entrenador de programación competitiva"},{"name":"Camila Orantes","role":"Diseñadora de retos algorítmicos"}]'::jsonb,
    '2026-10-24 19:00:00+00', '2026-10-24 23:00:00+00', 'published', true
  ),
  (
    (select id from public.organizers where slug = 'bitacora-digital'),
    (select id from public.categories where kind = 'event_type' and slug = 'networking'),
    (select id from public.categories where kind = 'topic' and slug = 'python'),
    (select id from public.categories where kind = 'location' and slug = 'san-salvador'),
    'cafe-nodo-mujeres-datos', 'Café Nodo: Mujeres en Datos',
    'Una tarde de conversaciones pequeñas para compartir rutas de aprendizaje, proyectos y oportunidades entre personas que trabajan con datos. Evento ficticio para la demo académica.',
    E'17:30 Recepción\n18:00 Conversaciones relámpago\n19:00 Mesas por interés\n20:00 Cierre abierto',
    'presencial', 'Casa Nodo, San Salvador', '/images/events/networking-cafe-nodo.jpg',
    '[{"name":"Paola Coto","role":"Analista de datos y mentora"},{"name":"Lucía Guardado","role":"Líder de comunidad tecnológica"}]'::jsonb,
    '2026-11-21 23:30:00+00', '2026-11-22 02:00:00+00', 'published', true
  ),
  (
    (select id from public.organizers where slug = 'lumenbyte-labs'),
    (select id from public.categories where kind = 'event_type' and slug = 'networking'),
    (select id from public.categories where kind = 'topic' and slug = 'cloud'), null,
    'after-office-devops', 'After Office DevOps',
    'Un espacio informal para hablar de automatización, observabilidad y aprendizajes de equipos que mantienen servicios en movimiento. Evento ficticio para la demo académica.',
    E'18:00 Llegada\n18:30 Lightning talks\n19:30 Rondas de conversación\n20:30 Cierre',
    'virtual', null, '/images/events/networking-cafe-nodo.jpg',
    '[{"name":"Diego Lemus","role":"Ingeniero de plataformas"},{"name":"Regina Funes","role":"Especialista en confiabilidad"}]'::jsonb,
    '2027-02-18 00:00:00+00', '2027-02-18 03:00:00+00', 'published', true
  ),
  (
    (select id from public.organizers where slug = 'tropico-tech'),
    (select id from public.categories where kind = 'event_type' and slug = 'workshops'),
    (select id from public.categories where kind = 'topic' and slug = 'inteligencia-artificial'),
    (select id from public.categories where kind = 'location' and slug = 'santa-ana'),
    'mapa-datos-decisiones', 'Mapa de Datos para Decisiones',
    'Taller práctico para pasar de una pregunta confusa a un mapa de datos, una hipótesis y una visualización que ayude a conversar. Evento ficticio para la demo académica.',
    E'09:00 Pregunta inicial\n10:00 Mapa de fuentes\n12:00 Bocetos de visualización\n15:00 Presentación de hallazgos',
    'presencial', 'Aula Taller La Estación, Santa Ana', '/images/events/workshops-mapa-datos.jpg',
    '[{"name":"Valeria Rosales","role":"Facilitadora de investigación aplicada"},{"name":"Mateo Linares","role":"Diseñador de visualizaciones"}]'::jsonb,
    '2026-11-28 15:00:00+00', '2026-11-28 22:00:00+00', 'published', true
  ),
  (
    (select id from public.organizers where slug = 'senda-dev'),
    (select id from public.categories where kind = 'event_type' and slug = 'workshops'),
    (select id from public.categories where kind = 'topic' and slug = 'inteligencia-artificial'), null,
    'laboratorio-prototipos-ia', 'Laboratorio de Prototipos con IA',
    'Una sesión guiada para convertir un problema cotidiano en un prototipo pequeño, medible y responsable usando herramientas de inteligencia artificial. Evento ficticio para la demo académica.',
    E'10:00 Contexto y límites\n11:00 Ideas en parejas\n13:00 Prototipo rápido\n15:00 Retroalimentación',
    'virtual', null, '/images/events/workshops-mapa-datos.jpg',
    '[{"name":"Anaís Molina","role":"Diseñadora de experiencias con IA"},{"name":"Bruno Escobar","role":"Ingeniero de prototipos"}]'::jsonb,
    '2027-01-16 16:00:00+00', '2027-01-16 21:00:00+00', 'published', true
  ),
  (
    (select id from public.organizers where slug = 'nube-norte'),
    (select id from public.categories where kind = 'event_type' and slug = 'bootcamps'),
    (select id from public.categories where kind = 'topic' and slug = 'python'),
    (select id from public.categories where kind = 'location' and slug = 'san-miguel'),
    'ruta-python-automatiza', 'Ruta Python para Automatizar',
    'Cohorte intensiva para aprender Python creando pequeños scripts que resuelven tareas repetitivas de datos y oficina. Evento ficticio para la demo académica.',
    E'08:00 Fundamentos\n12:00 Funciones y archivos\nSemana 2: datos y APIs\nSemana 3: proyecto final',
    'presencial', 'Laboratorio Norte, San Miguel', '/images/events/bootcamps-ruta-python.jpg',
    '[{"name":"Marcos Salazar","role":"Instructor de Python aplicado"},{"name":"Elena Pineda","role":"Mentora de proyectos de automatización"}]'::jsonb,
    '2026-12-05 14:00:00+00', '2026-12-19 22:00:00+00', 'published', true
  ),
  (
    (select id from public.organizers where slug = 'lumenbyte-labs'),
    (select id from public.categories where kind = 'event_type' and slug = 'bootcamps'),
    (select id from public.categories where kind = 'topic' and slug = 'desarrollo-web'), null,
    'cohorte-cero-apps-web', 'Cohorte Cero: Apps Web',
    'Programa de cuatro semanas para pasar de una idea a una aplicación web pequeña, con sesiones de revisión y una demo final. Evento ficticio para la demo académica.',
    E'Semana 1: idea y estructura\nSemana 2: interfaz\nSemana 3: datos y pruebas\nSemana 4: demo final',
    'virtual', null, '/images/events/bootcamps-ruta-python.jpg',
    '[{"name":"Carla Abarca","role":"Desarrolladora frontend"},{"name":"Simón Herrera","role":"Mentor de producto digital"}]'::jsonb,
    '2027-03-01 00:00:00+00', '2027-03-29 03:00:00+00', 'published', true
  ),
  (
    (select id from public.organizers where slug = 'bitacora-digital'),
    (select id from public.categories where kind = 'event_type' and slug = 'concursos'),
    (select id from public.categories where kind = 'topic' and slug = 'programacion'),
    (select id from public.categories where kind = 'location' and slug = 'san-salvador'),
    'premios-prisma-visualizacion', 'Premios Prisma de Visualización',
    'Concurso de narrativas visuales con datos abiertos y una exposición final para conversar sobre cómo se construye una historia clara. Evento ficticio para la demo académica.',
    E'09:00 Recepción de proyectos\n10:00 Revisión del jurado\n14:00 Galería abierta\n17:00 Premiación',
    'presencial', 'Galería Prisma, San Salvador', '/images/events/concursos-premios-prisma.jpg',
    '[{"name":"Gabriela Mena","role":"Editora de visualización pública"},{"name":"Óscar Beltrán","role":"Jurado invitado de proyectos de datos"}]'::jsonb,
    '2027-02-27 15:00:00+00', '2027-02-27 23:00:00+00', 'published', true
  ),
  (
    (select id from public.organizers where slug = 'tropico-tech'),
    (select id from public.categories where kind = 'event_type' and slug = 'concursos'),
    (select id from public.categories where kind = 'topic' and slug = 'ciberseguridad'), null,
    'desafio-llave-abierta', 'Desafío Llave Abierta',
    'Retos introductorios de seguridad, análisis y buenas prácticas para equipos que quieren aprender a pensar como defensores. Evento ficticio para la demo académica.',
    E'14:00 Inicio del reto\n15:00 Primera ronda\n17:30 Revisión de soluciones\n18:30 Resultados',
    'virtual', null, '/images/events/concursos-premios-prisma.jpg',
    '[{"name":"Renata Flores","role":"Analista de seguridad defensiva"},{"name":"Hugo Marroquín","role":"Diseñador de laboratorios de seguridad"}]'::jsonb,
    '2026-09-12 20:00:00+00', '2026-09-12 23:00:00+00', 'published', true
  ),
  (
    (select id from public.organizers where slug = 'nube-norte'),
    (select id from public.categories where kind = 'event_type' and slug = 'webinars'),
    (select id from public.categories where kind = 'topic' and slug = 'ciberseguridad'), null,
    'senales-de-nube', 'Señales de Seguridad',
    'Webinar para ordenar conceptos de cloud, despliegues y costos antes de elegir una arquitectura para un proyecto pequeño. Evento ficticio para la demo académica.',
    E'18:00 Bienvenida\n18:15 Mapa de servicios\n19:00 Decisiones frecuentes\n19:30 Preguntas',
    'virtual', null, '/images/events/webinars-senales-nube.jpg',
    '[{"name":"Fabián Reyes","role":"Arquitecto de soluciones cloud"},{"name":"Natalia Cruz","role":"Consultora de operaciones digitales"}]'::jsonb,
    '2026-12-10 00:00:00+00', '2026-12-10 02:00:00+00', 'published', true
  ),
  (
    (select id from public.organizers where slug = 'senda-dev'),
    (select id from public.categories where kind = 'event_type' and slug = 'webinars'),
    (select id from public.categories where kind = 'topic' and slug = 'inteligencia-artificial'), null,
    'ia-con-criterio', 'IA con Criterio',
    'Conversación en línea sobre oportunidades, límites y preguntas útiles antes de incorporar inteligencia artificial a un proyecto académico. Evento ficticio para la demo académica.',
    E'12:00 Contexto\n12:20 Casos de uso\n13:00 Riesgos y preguntas\n13:30 Cierre',
    'virtual', null, '/images/events/webinars-senales-nube.jpg',
    '[{"name":"Mónica Ibarra","role":"Investigadora de ética tecnológica"},{"name":"Raúl Navas","role":"Product manager de herramientas de IA"}]'::jsonb,
    '2026-10-29 18:00:00+00', '2026-10-29 20:00:00+00', 'published', true
  ),
  (
    (select id from public.organizers where slug = 'lumenbyte-labs'),
    (select id from public.categories where kind = 'event_type' and slug = 'conferencias'),
    (select id from public.categories where kind = 'topic' and slug = 'inteligencia-artificial'),
    (select id from public.categories where kind = 'location' and slug = 'san-salvador'),
    'plataformas-que-aprenden', 'Plataformas que Aprenden',
    'Conferencia sobre datos, experimentación y diseño de productos que mejoran con retroalimentación real, sin perder de vista a las personas. Evento ficticio para la demo académica.',
    E'09:00 Apertura\n10:00 Ponencia principal\n12:00 Panel de producto\n15:00 Conversaciones técnicas',
    'presencial', 'Teatro del Centro, San Salvador', '/images/events/conferencias-plataformas.jpg',
    '[{"name":"Ariadna Solís","role":"Líder de plataformas de datos"},{"name":"Gabriel Ponce","role":"Investigador de sistemas adaptativos"}]'::jsonb,
    '2027-03-20 15:00:00+00', '2027-03-20 23:00:00+00', 'published', true
  ),
  (
    (select id from public.organizers where slug = 'bitacora-digital'),
    (select id from public.categories where kind = 'event_type' and slug = 'conferencias'),
    (select id from public.categories where kind = 'topic' and slug = 'ciberseguridad'), null,
    'diseno-para-diez', 'Diseño para Diez',
    'Conferencia breve sobre cómo diseñar productos web pequeños, entendibles y listos para recibir retroalimentación desde el primer día. Evento ficticio para la demo académica.',
    E'09:00 Registro\n10:00 Charla principal\n11:30 Casos de interfaz\n13:00 Preguntas',
    'virtual', null, '/images/events/conferencias-plataformas.jpg',
    '[{"name":"Nora Escalante","role":"Diseñadora de producto"},{"name":"Esteban Quijano","role":"Desarrollador de interfaces"}]'::jsonb,
    '2026-10-03 15:00:00+00', '2026-10-03 19:00:00+00', 'published', true
  ),
  (
    (select id from public.organizers where slug = 'tropico-tech'),
    (select id from public.categories where kind = 'event_type' and slug = 'hackathons'),
    (select id from public.categories where kind = 'topic' and slug = 'inteligencia-artificial'),
    (select id from public.categories where kind = 'location' and slug = 'santa-ana'),
    'hackeo-verde-48h', 'Hackeo Verde 48H',
    'Maratón de prototipos para imaginar herramientas digitales que ayuden a comunidades a cuidar recursos y tomar mejores decisiones. Evento ficticio para la demo académica.',
    E'Día 1: reto y equipos\nDía 2: mentorías\nDía 3: demos y jurado',
    'presencial', 'Fábrica Creativa, Santa Ana', '/images/events/hackathons-hackeo-verde.jpg',
    '[{"name":"Teresa Amaya","role":"Mentora de innovación cívica"},{"name":"Leonardo Peña","role":"Facilitador de hackathons"}]'::jsonb,
    '2027-01-23 14:00:00+00', '2027-01-25 20:00:00+00', 'published', true
  ),
  (
    (select id from public.organizers where slug = 'senda-dev'),
    (select id from public.categories where kind = 'event_type' and slug = 'hackathons'),
    (select id from public.categories where kind = 'topic' and slug = 'inteligencia-artificial'), null,
    'ciudad-abierta-hackathon', 'Ciudad Abierta Hackathon',
    'Hackathon en línea para crear prototipos con datos públicos, mapas y preguntas del territorio. Evento ficticio para la demo académica.',
    E'08:00 Apertura\n09:00 Formación de equipos\nDía 2: mentorías\nDía 3: presentaciones',
    'virtual', null, '/images/events/hackathons-hackeo-verde.jpg',
    '[{"name":"Mauro Cea","role":"Especialista en datos abiertos"},{"name":"Isabel Paredes","role":"Mentora de prototipos cívicos"}]'::jsonb,
    '2026-08-15 14:00:00+00', '2026-08-17 20:00:00+00', 'published', true
  ),
  (
    (select id from public.organizers where slug = 'nube-norte'),
    (select id from public.categories where kind = 'event_type' and slug = 'meetups'),
    (select id from public.categories where kind = 'topic' and slug = 'fintech'),
    (select id from public.categories where kind = 'location' and slug = 'san-salvador'),
    'python-al-parque', 'Python al Parque',
    'Encuentro de comunidad con proyectos cortos, preguntas de principiante y charlas relámpago para aprender en compañía. Evento ficticio para la demo académica.',
    E'17:00 Llegada\n17:30 Proyectos relámpago\n18:30 Preguntas\n19:00 Conversación abierta',
    'presencial', 'Plaza del Árbol, San Salvador', '/images/events/meetups-python-parque.jpg',
    '[{"name":"Daniela Araujo","role":"Organizadora de comunidad Python"},{"name":"Pablo Chacón","role":"Desarrollador y speaker relámpago"}]'::jsonb,
    '2026-11-14 23:00:00+00', '2026-11-15 02:00:00+00', 'published', true
  ),
  (
    (select id from public.organizers where slug = 'lumenbyte-labs'),
    (select id from public.categories where kind = 'event_type' and slug = 'meetups'),
    (select id from public.categories where kind = 'topic' and slug = 'inteligencia-artificial'), null,
    'marea-emprende', 'Marea Emprende',
    'Meetup para compartir ideas de producto, primeras ventas y aprendizajes de quienes están construyendo proyectos pequeños. Evento ficticio para la demo académica.',
    E'18:00 Bienvenida\n18:30 Historias de cinco minutos\n19:30 Mesas de ideas\n20:30 Cierre',
    'virtual', null, '/images/events/meetups-python-parque.jpg',
    '[{"name":"César Méndez","role":"Fundador de producto digital"},{"name":"Jimena Duarte","role":"Mentora de emprendimiento"}]'::jsonb,
    '2027-02-11 00:00:00+00', '2027-02-11 03:00:00+00', 'published', true
  ),
  (
    (select id from public.organizers where slug = 'tropico-tech'),
    (select id from public.categories where kind = 'event_type' and slug = 'charlas'),
    (select id from public.categories where kind = 'topic' and slug = 'ciberseguridad'), null,
    'cinco-minutos-ciberhigiene', 'Cinco Minutos de Ciberhigiene',
    'Charla corta con hábitos concretos para cuidar cuentas, dispositivos y equipos de estudio sin convertir la seguridad en un misterio. Evento ficticio para la demo académica.',
    E'18:00 Bienvenida\n18:15 Cinco hábitos\n18:45 Preguntas\n19:00 Cierre',
    'virtual', null, '/images/events/charlas-ciberhigiene.jpg',
    '[{"name":"Rocío Valle","role":"Educadora en seguridad digital"},{"name":"Andrés Córdova","role":"Consultor de respuesta a incidentes"}]'::jsonb,
    '2026-10-15 00:00:00+00', '2026-10-15 01:30:00+00', 'published', true
  ),
  (
    (select id from public.organizers where slug = 'senda-dev'),
    (select id from public.categories where kind = 'event_type' and slug = 'charlas'),
    (select id from public.categories where kind = 'topic' and slug = 'inteligencia-artificial'),
    (select id from public.categories where kind = 'location' and slug = 'san-salvador'),
    'vida-secreta-api', 'La Vida Secreta de una API',
    'Una charla visual sobre solicitudes, errores y contratos que hacen que una API sea comprensible para quien la usa. Evento ficticio para la demo académica.',
    E'16:00 Introducción\n16:20 Viaje de una solicitud\n17:00 Errores útiles\n17:30 Preguntas',
    'presencial', 'Aula Abierta, San Salvador', '/images/events/charlas-ciberhigiene.jpg',
    '[{"name":"Elías Fuentes","role":"Ingeniero backend"},{"name":"María José Zepeda","role":"Documentadora técnica"}]'::jsonb,
    '2027-01-09 22:00:00+00', '2027-01-10 00:00:00+00', 'published', true
  ),
  (
    (select id from public.organizers where slug = 'bitacora-digital'),
    (select id from public.categories where kind = 'event_type' and slug = 'ferias-tecnologicas'), null,
    (select id from public.categories where kind = 'location' and slug = 'san-miguel'),
    'expo-futuro-local', 'Expo Futuro Local',
    'Feria de proyectos, comunidades y demostraciones para conocer ideas tecnológicas nacidas en aulas y talleres de la zona oriental. Evento ficticio para la demo académica.',
    E'09:00 Apertura\n11:00 Recorrido de proyectos\n14:00 Demostraciones\n17:00 Cierre',
    'presencial', 'Centro de Convenciones Marea, San Miguel', '/images/events/ferias-expo-futuro.jpg',
    '[{"name":"Elisa Ponce","role":"Curadora de proyectos estudiantiles"},{"name":"Mauricio Linares","role":"Coordinador de exhibiciones"}]'::jsonb,
    '2027-03-06 15:00:00+00', '2027-03-06 23:00:00+00', 'published', true
  ),
  (
    (select id from public.organizers where slug = 'tropico-tech'),
    (select id from public.categories where kind = 'event_type' and slug = 'ferias-tecnologicas'), null,
    (select id from public.categories where kind = 'location' and slug = 'santa-ana'),
    'feria-tecno-creativa', 'Feria Tecno Creativa',
    'Feria de prototipos, arte digital y herramientas creadas por estudiantes para resolver problemas cercanos. Evento ficticio para la demo académica.',
    E'09:00 Montaje abierto\n11:00 Recorrido de stands\n14:00 Talleres breves\n17:00 Cierre',
    'presencial', 'Patio Creativo, Santa Ana', '/images/events/ferias-expo-futuro.jpg',
    '[{"name":"Julia Menéndez","role":"Gestora de proyectos creativos"},{"name":"Óliver Ramos","role":"Facilitador de prototipado"}]'::jsonb,
    '2026-09-26 15:00:00+00', '2026-09-26 23:00:00+00', 'published', true
  )
on conflict (slug) do nothing;

insert into public.ticket_types (event_id, name, price_cents, quantity_total, max_per_order) values
  ((select id from public.events where slug = 'cumbre-brujula-digital'), 'Acceso general', 0, 180, 4),
  ((select id from public.events where slug = 'congreso-codigo-abierto'), 'Pase virtual', 1800, 500, 5),
  ((select id from public.events where slug = 'reto-circuito-autonomo'), 'Entrada general', 500, 120, 4),
  ((select id from public.events where slug = 'reto-circuito-autonomo'), 'Pase mentor', 1200, 25, 2),
  ((select id from public.events where slug = 'liga-algoritmia-pacifico'), 'Registro gratuito', 0, 300, 4),
  ((select id from public.events where slug = 'cafe-nodo-mujeres-datos'), 'Registro gratuito', 0, 80, 2),
  ((select id from public.events where slug = 'after-office-devops'), 'Entrada general', 600, 120, 4),
  ((select id from public.events where slug = 'after-office-devops'), 'Acceso con grabación', 900, 100, 2),
  ((select id from public.events where slug = 'mapa-datos-decisiones'), 'Cupo de taller', 500, 35, 2),
  ((select id from public.events where slug = 'laboratorio-prototipos-ia'), 'Registro gratuito', 0, 150, 3),
  ((select id from public.events where slug = 'ruta-python-automatiza'), 'Cupo regular', 4500, 28, 1),
  ((select id from public.events where slug = 'ruta-python-automatiza'), 'Cupo con materiales', 6500, 12, 1),
  ((select id from public.events where slug = 'cohorte-cero-apps-web'), 'Cupo anticipado', 6500, 20, 1),
  ((select id from public.events where slug = 'premios-prisma-visualizacion'), 'Registro gratuito', 0, 100, 2),
  ((select id from public.events where slug = 'desafio-llave-abierta'), 'Entrada general', 200, 180, 4),
  ((select id from public.events where slug = 'senales-de-nube'), 'Registro gratuito', 0, 300, 6),
  ((select id from public.events where slug = 'ia-con-criterio'), 'Registro gratuito', 0, 300, 6),
  ((select id from public.events where slug = 'plataformas-que-aprenden'), 'Entrada general', 2200, 240, 4),
  ((select id from public.events where slug = 'plataformas-que-aprenden'), 'Pase laboratorio', 3500, 60, 2),
  ((select id from public.events where slug = 'diseno-para-diez'), 'Registro gratuito', 0, 400, 8),
  ((select id from public.events where slug = 'hackeo-verde-48h'), 'Registro gratuito', 0, 80, 1),
  ((select id from public.events where slug = 'ciudad-abierta-hackathon'), 'Inscripción por equipo', 500, 50, 1),
  ((select id from public.events where slug = 'python-al-parque'), 'Registro gratuito', 0, 90, 3),
  ((select id from public.events where slug = 'marea-emprende'), 'Entrada general', 400, 140, 3),
  ((select id from public.events where slug = 'marea-emprende'), 'Pase mentoría', 900, 30, 1),
  ((select id from public.events where slug = 'cinco-minutos-ciberhigiene'), 'Registro gratuito', 0, 220, 4),
  ((select id from public.events where slug = 'vida-secreta-api'), 'Entrada general', 250, 70, 2),
  ((select id from public.events where slug = 'expo-futuro-local'), 'Entrada general', 300, 500, 6),
  ((select id from public.events where slug = 'expo-futuro-local'), 'Pase explorador', 800, 80, 2),
  ((select id from public.events where slug = 'feria-tecno-creativa'), 'Registro gratuito', 0, 350, 5),
  ((select id from public.events where slug = 'congreso-codigo-abierto'), 'Pase con sesión grabada', 2600, 120, 2),
  ((select id from public.events where slug = 'desafio-llave-abierta'), 'Pase con laboratorio', 500, 50, 2)
on conflict (event_id, name) do nothing;

insert into public.blog_posts (
  slug, title, description, body_md, keyword, topic, related_type_slugs, status, published_at
) values
  (
    'beneficios-networking-eventos-tecnologicos',
    'Beneficios del networking en eventos tecnológicos',
    'Descubre cómo hacer networking en eventos tecnológicos para aprender, compartir proyectos y construir relaciones profesionales con intención.',
    $$# Beneficios del networking en eventos tecnológicos

Asistir a un evento tecnológico no consiste únicamente en escuchar una charla. Una conversación breve después de una ponencia puede ayudarte a encontrar una nueva perspectiva, una persona con quien practicar o una comunidad que siga aprendiendo contigo. El networking funciona mejor cuando parte de la curiosidad: pregunta qué está construyendo la otra persona, cuenta qué te interesa y escucha sin convertir el encuentro en un intercambio apresurado de tarjetas.

Antes de llegar, elige una meta pequeña. Puede ser conocer a dos personas que trabajen con datos, pedir retroalimentación sobre un proyecto o descubrir un **[meetup](/meetups/)** al que puedas volver. Durante el evento, toma notas de nombres y temas, y después envía un mensaje corto que recuerde la conversación. Una relación profesional se construye con continuidad, no con una sola interacción.

Los **[eventos de networking](/networking/)** también son útiles para estudiantes y personas que están cambiando de área. Permiten comparar rutas de aprendizaje, conocer vocabulario del campo y observar cómo otras personas explican sus proyectos. En una demo académica como Ticketera C3, el objetivo no es prometer resultados, sino facilitar encuentros informados alrededor de intereses tecnológicos reales.$$,
    'networking en eventos tecnológicos', 'eventos', '{networking,meetups}', 'published', '2026-11-11 18:00:00+00'
  ),
  (
    'como-aprovechar-hackathon',
    'Cómo aprovechar un hackathon para aprender',
    'Una guía práctica para elegir un reto, organizar un equipo y salir de un hackathon con aprendizaje y un prototipo presentable.',
    $$# Cómo aprovechar un hackathon para aprender

Un hackathon es una oportunidad para aprender haciendo, pero no necesitas llegar con una idea perfecta. Lo más importante es entender el reto, elegir un alcance que puedas explicar y organizar el tiempo en ciclos cortos. Un prototipo pequeño que resuelve una parte del problema suele enseñar más que una plataforma enorme que nunca llega a probarse.

Empieza por formar un equipo con habilidades complementarias. Alguien puede investigar, otra persona diseñar la experiencia y otra construir la primera versión. Acuerden una definición de terminado y revisen el avance después de cada bloque. Si usan datos o servicios externos, documenten sus supuestos y no presenten como hecho aquello que todavía es una hipótesis.

Durante las horas de trabajo, reserven tiempo para probar con una persona que no conozca el proyecto. Esa conversación revela dónde se pierde la explicación. Al final, una demo clara debe contar el problema, mostrar el flujo principal y explicar qué aprendió el equipo. Puedes buscar **[hackathons](/hackathons/)** en Ticketera C3 y comparar modalidad, fecha y tipo de entrada antes de registrarte.$$,
    'cómo aprovechar un hackathon', 'eventos', '{hackathons,competencias}', 'published', '2026-11-11 18:05:00+00'
  ),
  (
    'elegir-evento-tecnologico',
    'Cómo elegir el evento tecnológico ideal',
    'Aprende a elegir entre workshop, bootcamp, charla o conferencia según tu tiempo, objetivo de aprendizaje y forma de participar.',
    $$# Cómo elegir el evento tecnológico ideal

La mejor actividad tecnológica depende de lo que quieres hacer después. Una **[charla](/charlas/)** suele ser una buena puerta de entrada cuando buscas una idea concreta en poco tiempo. Una **[conferencia](/conferencias/)** reúne varias perspectivas y ayuda a entender un tema más amplio. Si quieres practicar con acompañamiento, un **[workshop](/workshops/)** te da un espacio para construir algo durante la sesión.

Los **[bootcamps](/bootcamps/)** requieren más compromiso porque distribuyen el aprendizaje en varias sesiones. Antes de comprar, revisa la fecha, la modalidad, la ciudad cuando sea presencial y el tipo de entrada. Pregúntate cuánto tiempo puedes reservar, qué conocimientos previos tienes y qué evidencia de aprendizaje te gustaría conservar: notas, un prototipo o una conversación con la comunidad.

También es válido comenzar por un evento gratuito. La experiencia te ayuda a conocer tu ritmo y a descubrir qué temas quieres explorar. En Ticketera C3 los eventos son parte de una demo académica y los pagos están simulados; la información de cada ficha sirve para comparar opciones con claridad.$$,
    'elegir eventos tecnológicos', 'eventos', '{charlas,conferencias,workshops,bootcamps}', 'published', '2026-11-11 18:10:00+00'
  )
on conflict (slug) do update set
  title = excluded.title,
  description = excluded.description,
  body_md = excluded.body_md,
  keyword = excluded.keyword,
  topic = excluded.topic,
  related_type_slugs = excluded.related_type_slugs,
  status = excluded.status,
  published_at = excluded.published_at,
  updated_at = now();
