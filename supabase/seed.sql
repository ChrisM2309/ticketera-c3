-- Datos DEMO de Ticketera C3 (T03).
-- Todo es ficticio: eventos, organizadores, fechas, sedes y precios son supuestos de demostración.
-- Idempotente: cada insert usa la clave natural como conflicto.
-- No crea cuentas de Auth ni contraseñas; las cuentas de prueba llegan con T14.
-- Las páginas de organizador /claude/ y /copa/ del Excel no se siembran hasta verificar
-- sus nombres (docs/architecture/SEO_ROUTES.md, sección 2; docs/DECISIONS.md, D-18).

-- ---------------------------------------------------------------------------
-- Taxonomía: 12 tipos de evento, 4 temas y 3 ciudades (Excel, SEO_ROUTES.md)
-- ---------------------------------------------------------------------------

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
  ('location', 'san-salvador', 'San Salvador', null, null, 1),
  ('location', 'san-miguel', 'San Miguel', null, null, 2),
  ('location', 'santa-ana', 'Santa Ana', null, null, 3)
on conflict (kind, slug) do nothing;

-- ---------------------------------------------------------------------------
-- Organizadores DEMO (sin propietario: no hay cuentas de prueba en el seed)
-- ---------------------------------------------------------------------------

insert into public.organizers (slug, name, description, status) values
  ('organizador-demo-uno', 'Organizador DEMO Uno', 'Organizador ficticio para la demostración académica.', 'active'),
  ('organizador-demo-dos', 'Organizador DEMO Dos', 'Organizador ficticio para la demostración académica.', 'active')
on conflict (slug) do nothing;

-- ---------------------------------------------------------------------------
-- Diez eventos publicados (5 gratuitos, 5 de pago; 6 presenciales, 4 virtuales; 3 ciudades)
-- ---------------------------------------------------------------------------

insert into public.events (
  organizer_id, event_type_id, topic_id, location_id, slug, title, description, agenda,
  mode, venue, starts_at, ends_at, status, is_demo
) values
  (
    (select id from public.organizers where slug = 'organizador-demo-uno'),
    (select id from public.categories where kind = 'event_type' and slug = 'congresos'),
    (select id from public.categories where kind = 'topic' and slug = 'inteligencia-artificial'),
    (select id from public.categories where kind = 'location' and slug = 'san-salvador'),
    'congreso-demo-ia',
    'Congreso demo de IA',
    'Charlas y paneles sobre inteligencia artificial aplicada a productos y servicios. Evento ficticio: fecha, sede y precios son supuestos.',
    E'09:00 Bienvenida\n09:30 Panel: IA en la práctica\n11:00 Taller de datos\n14:00 Cierre',
    'presencial', 'Sede DEMO, San Salvador',
    '2027-03-13 21:00:00+00', '2027-03-13 23:30:00+00', 'published', true
  ),
  (
    (select id from public.organizers where slug = 'organizador-demo-uno'),
    (select id from public.categories where kind = 'event_type' and slug = 'hackathons'),
    (select id from public.categories where kind = 'topic' and slug = 'programacion'),
    null,
    'hackathon-demo-en-linea',
    'Hackathon demo en línea',
    'Equipos de cuatro personas construyen un prototipo en 48 horas. Evento ficticio de demostración.',
    E'Día 1: formación de equipos y reto\nDía 2: entrega y presentación de prototipos',
    'virtual', null,
    '2027-04-10 13:00:00+00', '2027-04-12 13:00:00+00', 'published', true
  ),
  (
    (select id from public.organizers where slug = 'organizador-demo-uno'),
    (select id from public.categories where kind = 'event_type' and slug = 'workshops'),
    (select id from public.categories where kind = 'topic' and slug = 'python'),
    (select id from public.categories where kind = 'location' and slug = 'santa-ana'),
    'workshop-demo-de-datos',
    'Workshop demo de datos',
    'Práctica guiada de limpieza y análisis de datos con Python. Evento ficticio; precios y sede son supuestos.',
    E'09:00 Introducción\n09:30 Práctica guiada\n12:00 Preguntas',
    'presencial', 'Sala DEMO, Santa Ana',
    '2027-04-24 15:00:00+00', '2027-04-24 19:00:00+00', 'published', true
  ),
  (
    (select id from public.organizers where slug = 'organizador-demo-uno'),
    (select id from public.categories where kind = 'event_type' and slug = 'bootcamps'),
    (select id from public.categories where kind = 'topic' and slug = 'cloud'),
    (select id from public.categories where kind = 'location' and slug = 'san-miguel'),
    'bootcamp-demo-cloud',
    'Bootcamp demo de cloud',
    'Programa intensivo sobre servicios en la nube. Evento ficticio; duración, sede y precios son supuestos.',
    E'Semana 1: fundamentos\nSemana 2: despliegues\nSemana 3: proyecto final',
    'presencial', 'Campus DEMO, San Miguel',
    '2027-05-08 13:00:00+00', '2027-05-29 22:00:00+00', 'published', true
  ),
  (
    (select id from public.organizers where slug = 'organizador-demo-uno'),
    (select id from public.categories where kind = 'event_type' and slug = 'competencias'),
    null,
    (select id from public.categories where kind = 'location' and slug = 'san-salvador'),
    'competencia-demo-robotica',
    'Competencia demo de robótica',
    'Equipos compiten con robots en un circuito de retos. Evento ficticio de demostración.',
    E'08:00 Registro\n09:00 Rondas clasificatorias\n16:00 Final',
    'presencial', 'Sede DEMO, San Salvador',
    '2027-06-05 14:00:00+00', '2027-06-05 20:00:00+00', 'published', true
  ),
  (
    (select id from public.organizers where slug = 'organizador-demo-dos'),
    (select id from public.categories where kind = 'event_type' and slug = 'webinars'),
    null,
    null,
    'webinar-demo-ciberseguridad',
    'Webinar demo de ciberseguridad',
    'Sesión en línea sobre buenas prácticas de seguridad para equipos pequeños. Evento ficticio.',
    E'18:00 Presentación\n18:45 Preguntas',
    'virtual', null,
    '2027-05-20 18:00:00+00', '2027-05-20 19:30:00+00', 'published', true
  ),
  (
    (select id from public.organizers where slug = 'organizador-demo-dos'),
    (select id from public.categories where kind = 'event_type' and slug = 'meetups'),
    (select id from public.categories where kind = 'topic' and slug = 'python'),
    (select id from public.categories where kind = 'location' and slug = 'san-salvador'),
    'meetup-demo-python',
    'Meetup demo de Python',
    'Encuentro informal para compartir proyectos en Python. Evento ficticio y gratuito.',
    E'17:00 Llegada\n17:15 Charlas relámpago\n18:30 Networking',
    'presencial', 'Espacio DEMO, San Salvador',
    '2027-03-27 23:00:00+00', '2027-03-28 01:00:00+00', 'published', true
  ),
  (
    (select id from public.organizers where slug = 'organizador-demo-dos'),
    (select id from public.categories where kind = 'event_type' and slug = 'conferencias'),
    (select id from public.categories where kind = 'topic' and slug = 'programacion'),
    null,
    'conferencia-demo-programacion',
    'Conferencia demo de programación',
    'Conferencia en línea sobre prácticas de desarrollo de software. Evento ficticio; precios son supuestos.',
    E'15:00 Keynote\n15:45 Dos charlas técnicas\n16:45 Cierre',
    'virtual', null,
    '2027-06-17 15:00:00+00', '2027-06-17 17:00:00+00', 'published', true
  ),
  (
    (select id from public.organizers where slug = 'organizador-demo-dos'),
    (select id from public.categories where kind = 'event_type' and slug = 'charlas'),
    (select id from public.categories where kind = 'topic' and slug = 'inteligencia-artificial'),
    (select id from public.categories where kind = 'location' and slug = 'santa-ana'),
    'charla-demo-ia',
    'Charla demo de inteligencia artificial',
    'Charla corta sobre casos de uso de IA en la vida diaria. Evento ficticio y gratuito.',
    E'16:00 Charla\n16:40 Preguntas',
    'presencial', 'Auditorio DEMO, Santa Ana',
    '2027-04-02 22:00:00+00', '2027-04-02 23:00:00+00', 'published', true
  ),
  (
    (select id from public.organizers where slug = 'organizador-demo-dos'),
    (select id from public.categories where kind = 'event_type' and slug = 'concursos'),
    (select id from public.categories where kind = 'topic' and slug = 'programacion'),
    null,
    'concurso-demo-programacion',
    'Concurso demo de programación',
    'Concurso en línea de resolución de problemas algorítmicos. Evento ficticio y gratuito.',
    E'14:00 Inicio\n18:00 Cierre y resultados',
    'virtual', null,
    '2027-07-01 14:00:00+00', '2027-07-01 22:00:00+00', 'published', true
  )
on conflict (slug) do nothing;

-- ---------------------------------------------------------------------------
-- Tipos de entrada: 5 gratuitos y 5 de pago (precios en centavos USD)
-- ---------------------------------------------------------------------------

insert into public.ticket_types (event_id, name, price_cents, quantity_total, max_per_order) values
  ((select id from public.events where slug = 'congreso-demo-ia'), 'General', 1000, 150, 4),
  ((select id from public.events where slug = 'congreso-demo-ia'), 'Premium', 2500, 40, 2),
  ((select id from public.events where slug = 'hackathon-demo-en-linea'), 'Registro gratuito', 0, 200, 4),
  ((select id from public.events where slug = 'workshop-demo-de-datos'), 'General', 500, 30, 4),
  ((select id from public.events where slug = 'bootcamp-demo-cloud'), 'Reserva anticipada', 6500, 20, 2),
  ((select id from public.events where slug = 'bootcamp-demo-cloud'), 'General', 8000, 30, 2),
  ((select id from public.events where slug = 'competencia-demo-robotica'), 'Entrada general', 300, 150, 6),
  ((select id from public.events where slug = 'webinar-demo-ciberseguridad'), 'Registro gratuito', 0, 500, 10),
  ((select id from public.events where slug = 'meetup-demo-python'), 'Registro gratuito', 0, 80, 4),
  ((select id from public.events where slug = 'conferencia-demo-programacion'), 'Acceso en línea', 1200, 300, 5),
  ((select id from public.events where slug = 'conferencia-demo-programacion'), 'Acceso con grabación', 1800, 100, 2),
  ((select id from public.events where slug = 'charla-demo-ia'), 'Registro gratuito', 0, 60, 2),
  ((select id from public.events where slug = 'concurso-demo-programacion'), 'Registro gratuito', 0, 400, 4)
on conflict (event_id, name) do nothing;


-- ---------------------------------------------------------------------------
-- Árbol SEO del Excel (T05, SEO_ROUTES.md): 10 subtemas nuevos, 128 rutas y el organizador DEMO tres.
-- Las rutas de organizador /claude/ y /copa/ no se siembran (D-18). Las de modalidad y precio
-- se sirven con noindex hasta que tengan contenido (D-24).
-- ---------------------------------------------------------------------------

insert into public.categories (kind, slug, name, keyword, search_volume, sort_order) values
  ('topic', 'analisis-de-datos', 'Análisis de datos', null, null, 5),
  ('topic', 'ciberseguridad', 'Ciberseguridad', null, null, 6),
  ('topic', 'ciencia-de-datos', 'Ciencia de datos', null, null, 7),
  ('topic', 'desarrollo-web', 'Desarrollo web', null, null, 8),
  ('topic', 'devops', 'DevOps', null, null, 9),
  ('topic', 'ecommerce', 'E-commerce', null, null, 10),
  ('topic', 'fintech', 'Fintech', null, null, 11),
  ('topic', 'machine-learning', 'Machine learning', null, null, 12),
  ('topic', 'robotica', 'Robótica', null, null, 13),
  ('topic', 'startups', 'Startups', null, null, 14)
on conflict (kind, slug) do nothing;

insert into public.organizers (slug, name, description, status) values
  ('organizador-demo-tres', 'Organizador DEMO Tres', 'Organizador ficticio para la demostración académica.', 'active')
on conflict (slug) do nothing;

insert into public.seo_routes (path, kind, keyword, search_volume, is_indexable, sort_order) values
  ('/congresos/', 'event_type', 'congreso', 40500, true, 1),
  ('/congresos/inteligencia-artificial/', 'subtopic', 'congreso ia', 30, true, 2),
  ('/congresos/inteligencia-artificial/virtual/', 'modality', 'congreso de inteligencia artificial virtual', null, false, 3),
  ('/congresos/inteligencia-artificial/presencial/', 'modality', 'congreso de inteligencia artificial presencial', null, false, 4),
  ('/congresos/ciberseguridad/', 'subtopic', 'congreso ciberseguridad', 10, true, 5),
  ('/congresos/ciberseguridad/virtual/', 'modality', 'congreso de ciberseguridad virtual', null, false, 6),
  ('/congresos/ciberseguridad/presencial/', 'modality', 'congreso de ciberseguridad presencial', null, false, 7),
  ('/congresos/ecommerce/', 'subtopic', 'congreso de ecommerce', 10, true, 8),
  ('/congresos/ecommerce/virtual/', 'modality', 'congreso de ecommerce virtual', null, false, 9),
  ('/congresos/ecommerce/presencial/', 'modality', 'congreso de ecommerce presencial', null, false, 10),
  ('/competencias/', 'event_type', 'competencia', 27100, true, 11),
  ('/competencias/inteligencia-artificial/', 'subtopic', 'competencia de ia', 10, true, 12),
  ('/competencias/inteligencia-artificial/virtual/', 'modality', 'competencia de inteligencia artificial virtual', null, false, 13),
  ('/competencias/inteligencia-artificial/presencial/', 'modality', 'competencia de inteligencia artificial presencial', null, false, 14),
  ('/competencias/robotica/', 'subtopic', 'competencia de rob�tica', 20, true, 15),
  ('/competencias/robotica/virtual/', 'modality', 'competencia de rob�tica virtual', null, false, 16),
  ('/competencias/robotica/presencial/', 'modality', 'competencia de rob�tica presencial', null, false, 17),
  ('/networking/', 'event_type', 'networking', 22200, true, 18),
  ('/networking/cloud/', 'subtopic', 'networking cloud', 90, true, 19),
  ('/networking/cloud/virtual/', 'modality', 'networking de cloud virtual', null, false, 20),
  ('/networking/cloud/presencial/', 'modality', 'networking de cloud presencial', null, false, 21),
  ('/networking/python/', 'subtopic', 'networking python', 90, true, 22),
  ('/networking/python/virtual/', 'modality', 'networking de python virtual', null, false, 23),
  ('/networking/python/presencial/', 'modality', 'networking de python presencial', null, false, 24),
  ('/networking/inteligencia-artificial/', 'subtopic', 'networking ia', 50, true, 25),
  ('/networking/inteligencia-artificial/virtual/', 'modality', 'networking de inteligencia artificial virtual', null, false, 26),
  ('/networking/inteligencia-artificial/presencial/', 'modality', 'networking de inteligencia artificial presencial', null, false, 27),
  ('/workshops/', 'event_type', 'workshop', 14800, true, 28),
  ('/workshops/inteligencia-artificial/', 'subtopic', 'workshop ia', 20, true, 29),
  ('/workshops/inteligencia-artificial/virtual/', 'modality', 'workshop de inteligencia artificial virtual', null, false, 30),
  ('/workshops/inteligencia-artificial/presencial/', 'modality', 'workshop de inteligencia artificial presencial', null, false, 31),
  ('/bootcamps/', 'event_type', 'bootcamp', 14800, true, 32),
  ('/bootcamps/programacion/', 'subtopic', 'bootcamp programaci�n', 260, true, 33),
  ('/bootcamps/programacion/virtual/', 'modality', 'bootcamp de programaci�n virtual', null, false, 34),
  ('/bootcamps/programacion/presencial/', 'modality', 'bootcamp de programaci�n presencial', null, false, 35),
  ('/bootcamps/programacion/gratis/', 'modality', 'bootcamp programaci�n gratis', 40, false, 36),
  ('/bootcamps/inteligencia-artificial/', 'subtopic', 'bootcamp ia', 90, true, 37),
  ('/bootcamps/inteligencia-artificial/virtual/', 'modality', 'bootcamp de inteligencia artificial virtual', null, false, 38),
  ('/bootcamps/inteligencia-artificial/presencial/', 'modality', 'bootcamp de inteligencia artificial presencial', null, false, 39),
  ('/bootcamps/inteligencia-artificial/gratis/', 'modality', 'bootcamp inteligencia artificial gratis', 10, false, 40),
  ('/bootcamps/analisis-de-datos/', 'subtopic', 'bootcamp an�lisis de datos', 170, true, 41),
  ('/bootcamps/analisis-de-datos/virtual/', 'modality', 'bootcamp de an�lisis de datos virtual', null, false, 42),
  ('/bootcamps/analisis-de-datos/presencial/', 'modality', 'bootcamp de an�lisis de datos presencial', null, false, 43),
  ('/bootcamps/analisis-de-datos/gratis/', 'modality', 'bootcamp an�lisis de datos gratis', 20, false, 44),
  ('/bootcamps/ciberseguridad/', 'subtopic', 'bootcamp ciberseguridad', 70, true, 45),
  ('/bootcamps/ciberseguridad/virtual/', 'modality', 'bootcamp de ciberseguridad virtual', null, false, 46),
  ('/bootcamps/ciberseguridad/presencial/', 'modality', 'bootcamp de ciberseguridad presencial', null, false, 47),
  ('/bootcamps/ciberseguridad/gratis/', 'modality', 'bootcamp ciberseguridad gratis', 10, false, 48),
  ('/bootcamps/python/', 'subtopic', 'bootcamp python', 70, true, 49),
  ('/bootcamps/python/virtual/', 'modality', 'bootcamp de python virtual', null, false, 50),
  ('/bootcamps/python/presencial/', 'modality', 'bootcamp de python presencial', null, false, 51),
  ('/bootcamps/python/gratis/', 'modality', 'bootcamp python gratis', 10, false, 52),
  ('/bootcamps/ciencia-de-datos/', 'subtopic', 'bootcamp ciencia de datos', 50, true, 53),
  ('/bootcamps/ciencia-de-datos/virtual/', 'modality', 'bootcamp de ciencia de datos virtual', null, false, 54),
  ('/bootcamps/ciencia-de-datos/presencial/', 'modality', 'bootcamp de ciencia de datos presencial', null, false, 55),
  ('/bootcamps/ciencia-de-datos/gratis/', 'modality', 'bootcamp ciencia de datos gratis', 10, false, 56),
  ('/bootcamps/desarrollo-web/', 'subtopic', 'bootcamp desarrollo web', 50, true, 57),
  ('/bootcamps/desarrollo-web/virtual/', 'modality', 'bootcamp de desarrollo web virtual', null, false, 58),
  ('/bootcamps/desarrollo-web/presencial/', 'modality', 'bootcamp de desarrollo web presencial', null, false, 59),
  ('/bootcamps/desarrollo-web/gratis/', 'modality', 'bootcamp desarrollo web gratis', 10, false, 60),
  ('/bootcamps/devops/', 'subtopic', 'bootcamp devops', 40, true, 61),
  ('/bootcamps/devops/virtual/', 'modality', 'bootcamp de devops virtual', null, false, 62),
  ('/bootcamps/devops/presencial/', 'modality', 'bootcamp de devops presencial', null, false, 63),
  ('/bootcamps/devops/gratis/', 'modality', 'bootcamp devops gratis', 10, false, 64),
  ('/bootcamps/machine-learning/', 'subtopic', 'bootcamp machine learning', 20, true, 65),
  ('/bootcamps/machine-learning/virtual/', 'modality', 'bootcamp de machine learning virtual', null, false, 66),
  ('/bootcamps/machine-learning/presencial/', 'modality', 'bootcamp de machine learning presencial', null, false, 67),
  ('/bootcamps/machine-learning/gratis/', 'modality', 'bootcamp machine learning gratis', 10, false, 68),
  ('/bootcamps/cloud/', 'subtopic', 'bootcamp cloud', 10, true, 69),
  ('/bootcamps/cloud/virtual/', 'modality', 'bootcamp de cloud virtual', null, false, 70),
  ('/bootcamps/cloud/presencial/', 'modality', 'bootcamp de cloud presencial', null, false, 71),
  ('/concursos/', 'event_type', 'concurso', 12100, true, 72),
  ('/concursos/robotica/', 'subtopic', 'concurso de rob�tica', 110, true, 73),
  ('/concursos/robotica/virtual/', 'modality', 'concurso de rob�tica virtual', null, false, 74),
  ('/concursos/robotica/presencial/', 'modality', 'concurso de rob�tica presencial', null, false, 75),
  ('/concursos/programacion/', 'subtopic', 'concurso de programaci�n', 40, true, 76),
  ('/concursos/programacion/virtual/', 'modality', 'concurso de programaci�n virtual', null, false, 77),
  ('/concursos/programacion/presencial/', 'modality', 'concurso de programaci�n presencial', null, false, 78),
  ('/concursos/inteligencia-artificial/', 'subtopic', 'concurso de ia', 10, true, 79),
  ('/concursos/inteligencia-artificial/virtual/', 'modality', 'concurso de inteligencia artificial virtual', null, false, 80),
  ('/concursos/inteligencia-artificial/presencial/', 'modality', 'concurso de inteligencia artificial presencial', null, false, 81),
  ('/concursos/startups/', 'subtopic', 'concurso de startups', 10, true, 82),
  ('/concursos/startups/virtual/', 'modality', 'concurso de startups virtual', null, false, 83),
  ('/concursos/startups/presencial/', 'modality', 'concurso de startups presencial', null, false, 84),
  ('/concursos/ciberseguridad/', 'subtopic', 'concurso ciberseguridad', 10, true, 85),
  ('/concursos/ciberseguridad/virtual/', 'modality', 'concurso de ciberseguridad virtual', null, false, 86),
  ('/concursos/ciberseguridad/presencial/', 'modality', 'concurso de ciberseguridad presencial', null, false, 87),
  ('/webinars/', 'event_type', 'webinar', 12100, true, 88),
  ('/webinars/inteligencia-artificial/', 'subtopic', 'webinar ia', 20, true, 89),
  ('/webinars/inteligencia-artificial/virtual/', 'modality', 'webinar de inteligencia artificial virtual', null, false, 90),
  ('/webinars/inteligencia-artificial/presencial/', 'modality', 'webinar de inteligencia artificial presencial', null, false, 91),
  ('/webinars/ciberseguridad/', 'subtopic', 'webinar ciberseguridad', 20, true, 92),
  ('/webinars/ciberseguridad/virtual/', 'modality', 'webinar de ciberseguridad virtual', null, false, 93),
  ('/webinars/ciberseguridad/presencial/', 'modality', 'webinar de ciberseguridad presencial', null, false, 94),
  ('/conferencias/', 'event_type', 'conferencia', 9900, true, 95),
  ('/conferencias/inteligencia-artificial/', 'subtopic', 'conferencia inteligencia artificial', 30, true, 96),
  ('/conferencias/inteligencia-artificial/virtual/', 'modality', 'conferencia de inteligencia artificial virtual', null, false, 97),
  ('/conferencias/inteligencia-artificial/presencial/', 'modality', 'conferencia de inteligencia artificial presencial', null, false, 98),
  ('/conferencias/ciberseguridad/', 'subtopic', 'conferencia ciberseguridad', 10, true, 99),
  ('/conferencias/ciberseguridad/virtual/', 'modality', 'conferencia de ciberseguridad virtual', null, false, 100),
  ('/conferencias/ciberseguridad/presencial/', 'modality', 'conferencia de ciberseguridad presencial', null, false, 101),
  ('/hackathons/', 'event_type', 'hackathon', 6600, true, 102),
  ('/hackathons/inteligencia-artificial/', 'subtopic', 'hackathon ia', 20, true, 103),
  ('/hackathons/inteligencia-artificial/virtual/', 'modality', 'hackathon de inteligencia artificial virtual', null, false, 104),
  ('/hackathons/inteligencia-artificial/presencial/', 'modality', 'hackathon de inteligencia artificial presencial', null, false, 105),
  ('/meetups/', 'event_type', 'meetup', 4400, true, 106),
  ('/meetups/fintech/', 'subtopic', 'meetup fintech', 20, true, 107),
  ('/meetups/fintech/virtual/', 'modality', 'meetup de fintech virtual', null, false, 108),
  ('/meetups/fintech/presencial/', 'modality', 'meetup de fintech presencial', null, false, 109),
  ('/meetups/inteligencia-artificial/', 'subtopic', 'meetup ia', 10, true, 110),
  ('/meetups/inteligencia-artificial/virtual/', 'modality', 'meetup de inteligencia artificial virtual', null, false, 111),
  ('/meetups/inteligencia-artificial/presencial/', 'modality', 'meetup de inteligencia artificial presencial', null, false, 112),
  ('/charlas/', 'event_type', 'charla', 2900, true, 113),
  ('/charlas/inteligencia-artificial/', 'subtopic', 'charla ia', 30, true, 114),
  ('/charlas/inteligencia-artificial/virtual/', 'modality', 'charla de inteligencia artificial virtual', null, false, 115),
  ('/charlas/inteligencia-artificial/presencial/', 'modality', 'charla de inteligencia artificial presencial', null, false, 116),
  ('/charlas/inteligencia-artificial/gratis/', 'modality', 'charla ia gratis', 10, false, 117),
  ('/charlas/ciberseguridad/', 'subtopic', 'charla ciberseguridad', 10, true, 118),
  ('/charlas/ciberseguridad/virtual/', 'modality', 'charla de ciberseguridad virtual', null, false, 119),
  ('/charlas/ciberseguridad/presencial/', 'modality', 'charla de ciberseguridad presencial', null, false, 120),
  ('/ferias-tecnologicas/', 'event_type', 'feria tecnol�gica', 210, true, 121),
  ('/cloud/', 'topic', 'boletos cloud', 10, true, 122),
  ('/inteligencia-artificial/', 'topic', 'registro de ia', 10, true, 123),
  ('/programacion/', 'topic', 'registro programaci�n', 20, true, 124),
  ('/python/', 'topic', 'entradas python', 10, true, 125),
  ('/san-miguel/', 'location', 'entradas san miguel', 140, true, 126),
  ('/san-salvador/', 'location', 'boletos san salvador', 50, true, 127),
  ('/santa-ana/', 'location', 'concurso santa ana', 10, true, 128)
on conflict (path) do update set
  kind = excluded.kind,
  keyword = excluded.keyword,
  search_volume = excluded.search_volume,
  is_indexable = excluded.is_indexable,
  sort_order = excluded.sort_order;

-- Ajuste: el tema debe existir en el árbol del Excel para el tipo del evento (seo_routes).
update public.events set topic_id = null
where slug in ('hackathon-demo-en-linea', 'workshop-demo-de-datos', 'meetup-demo-python', 'conferencia-demo-programacion');

-- ---------------------------------------------------------------------------
-- Cuarenta eventos ficticios adicionales (50 en total con el seed de T03).
-- Cada combinación tipo + tema existe en el árbol del Excel; sin tema cuando el tipo no tiene ese tema.
-- ---------------------------------------------------------------------------

insert into public.events (
  organizer_id, event_type_id, topic_id, location_id, slug, title, description, agenda,
  mode, venue, starts_at, ends_at, status, is_demo
) values
  (
    (select id from public.organizers where slug = 'organizador-demo-uno'),
    (select id from public.categories where kind = 'event_type' and slug = 'congresos'), (select id from public.categories where kind = 'topic' and slug = 'ciberseguridad'), (select id from public.categories where kind = 'location' and slug = 'san-miguel'),
    'congreso-demo-ciberseguridad', 'Congreso demo de ciberseguridad',
    'Charlas sobre defensa de sistemas y respuesta a incidentes. Evento ficticio de demostración.',
    E'09:00 Bienvenida\n09:30 Panel: amenazas comunes\n14:00 Cierre',
    'presencial', 'Sede DEMO, San Miguel',
    '2027-01-22 15:00:00+00', '2027-01-22 18:00:00+00', 'published', true
  ),
  (
    (select id from public.organizers where slug = 'organizador-demo-dos'),
    (select id from public.categories where kind = 'event_type' and slug = 'congresos'), (select id from public.categories where kind = 'topic' and slug = 'ecommerce'), null,
    'congreso-demo-ecommerce', 'Congreso demo de e-commerce',
    'Estrategias de venta en línea, pagos y logística para tiendas pequeñas. Evento ficticio de demostración.',
    E'09:00 Apertura\n10:00 Panel: pagos y confianza\n15:00 Cierre',
    'virtual', null,
    '2027-02-19 15:00:00+00', '2027-02-19 18:00:00+00', 'published', true
  ),
  (
    (select id from public.organizers where slug = 'organizador-demo-tres'),
    (select id from public.categories where kind = 'event_type' and slug = 'competencias'), (select id from public.categories where kind = 'topic' and slug = 'inteligencia-artificial'), (select id from public.categories where kind = 'location' and slug = 'santa-ana'),
    'competencia-demo-ia', 'Competencia demo de inteligencia artificial',
    'Competencia por equipos con retos de clasificación y análisis de datos. Evento ficticio de demostración.',
    E'14:00 Registro de equipos\n15:00 Retos\n18:00 Resultados',
    'presencial', 'Sede DEMO, Santa Ana',
    '2027-02-26 20:00:00+00', '2027-02-26 23:00:00+00', 'published', true
  ),
  (
    (select id from public.organizers where slug = 'organizador-demo-uno'),
    (select id from public.categories where kind = 'event_type' and slug = 'networking'), (select id from public.categories where kind = 'topic' and slug = 'cloud'), null,
    'networking-demo-cloud', 'Networking demo de cloud',
    'Encuentro para profesionales interesados en servicios de nube. Evento ficticio de demostración.',
    E'18:00 Bienvenida\n18:30 Rondas de conversación\n20:00 Cierre',
    'virtual', null,
    '2027-03-06 00:00:00+00', '2027-03-06 03:00:00+00', 'published', true
  ),
  (
    (select id from public.organizers where slug = 'organizador-demo-dos'),
    (select id from public.categories where kind = 'event_type' and slug = 'networking'), (select id from public.categories where kind = 'topic' and slug = 'inteligencia-artificial'), (select id from public.categories where kind = 'location' and slug = 'san-salvador'),
    'networking-demo-ia', 'Networking demo de inteligencia artificial',
    'Espacio de contactos entre personas que trabajan con inteligencia artificial. Evento ficticio de demostración.',
    E'18:00 Bienvenida\n18:30 Presentaciones cortas\n20:00 Networking libre',
    'presencial', 'Sede DEMO, San Salvador',
    '2027-03-13 00:00:00+00', '2027-03-13 03:00:00+00', 'published', true
  ),
  (
    (select id from public.organizers where slug = 'organizador-demo-tres'),
    (select id from public.categories where kind = 'event_type' and slug = 'networking'), (select id from public.categories where kind = 'topic' and slug = 'python'), (select id from public.categories where kind = 'location' and slug = 'san-miguel'),
    'networking-demo-python', 'Networking demo de Python',
    'Reunión de personas que programan en Python. Evento ficticio de demostración.',
    E'18:00 Bienvenida\n18:30 Mesas por nivel\n20:00 Cierre',
    'presencial', 'Sede DEMO, San Miguel',
    '2027-03-27 00:00:00+00', '2027-03-27 03:00:00+00', 'published', true
  ),
  (
    (select id from public.organizers where slug = 'organizador-demo-uno'),
    (select id from public.categories where kind = 'event_type' and slug = 'workshops'), (select id from public.categories where kind = 'topic' and slug = 'inteligencia-artificial'), null,
    'workshop-demo-ia-aplicada', 'Workshop demo de IA aplicada',
    'Taller práctico para aplicar modelos de lenguaje en tareas de oficina. Evento ficticio de demostración.',
    E'10:00 Introducción\n11:00 Práctica guiada\n13:00 Cierre',
    'virtual', null,
    '2027-04-09 16:00:00+00', '2027-04-09 19:00:00+00', 'published', true
  ),
  (
    (select id from public.organizers where slug = 'organizador-demo-dos'),
    (select id from public.categories where kind = 'event_type' and slug = 'bootcamps'), (select id from public.categories where kind = 'topic' and slug = 'analisis-de-datos'), (select id from public.categories where kind = 'location' and slug = 'san-salvador'),
    'bootcamp-demo-analisis-de-datos', 'Bootcamp demo de análisis de datos',
    'Formación intensiva en limpieza, visualización y análisis de datos. Evento ficticio de demostración.',
    E'08:00 Módulo 1\n12:00 Módulo 2\n16:00 Proyecto final',
    'presencial', 'Sede DEMO, San Salvador',
    '2027-05-03 14:00:00+00', '2027-05-03 17:00:00+00', 'published', true
  ),
  (
    (select id from public.organizers where slug = 'organizador-demo-tres'),
    (select id from public.categories where kind = 'event_type' and slug = 'bootcamps'), (select id from public.categories where kind = 'topic' and slug = 'ciberseguridad'), null,
    'bootcamp-demo-ciberseguridad-gratis', 'Bootcamp demo de ciberseguridad gratuito',
    'Introducción gratuita a la seguridad de cuentas y redes. Evento ficticio de demostración.',
    E'18:00 Bienvenida\n19:00 Módulo 1\n21:00 Cierre',
    'virtual', null,
    '2027-05-18 00:00:00+00', '2027-05-18 03:00:00+00', 'published', true
  ),
  (
    (select id from public.organizers where slug = 'organizador-demo-uno'),
    (select id from public.categories where kind = 'event_type' and slug = 'bootcamps'), (select id from public.categories where kind = 'topic' and slug = 'ciencia-de-datos'), (select id from public.categories where kind = 'location' and slug = 'santa-ana'),
    'bootcamp-demo-ciencia-de-datos', 'Bootcamp demo de ciencia de datos',
    'Preparación para proyectos de datos con estadística y Python. Evento ficticio de demostración.',
    E'08:00 Estadística\n12:00 Python para datos\n16:00 Proyecto',
    'presencial', 'Sede DEMO, Santa Ana',
    '2027-06-07 14:00:00+00', '2027-06-07 17:00:00+00', 'published', true
  ),
  (
    (select id from public.organizers where slug = 'organizador-demo-dos'),
    (select id from public.categories where kind = 'event_type' and slug = 'bootcamps'), (select id from public.categories where kind = 'topic' and slug = 'desarrollo-web'), null,
    'bootcamp-demo-desarrollo-web', 'Bootcamp demo de desarrollo web',
    'Construcción de sitios web con HTML, CSS y JavaScript. Evento ficticio de demostración.',
    E'18:00 Módulo 1\n20:00 Módulo 2\n21:30 Cierre',
    'virtual', null,
    '2027-06-22 00:00:00+00', '2027-06-22 03:00:00+00', 'published', true
  ),
  (
    (select id from public.organizers where slug = 'organizador-demo-tres'),
    (select id from public.categories where kind = 'event_type' and slug = 'bootcamps'), (select id from public.categories where kind = 'topic' and slug = 'devops'), (select id from public.categories where kind = 'location' and slug = 'san-salvador'),
    'bootcamp-demo-devops', 'Bootcamp demo de DevOps',
    'Introducción a integración continua y automatización de despliegues. Evento ficticio de demostración.',
    E'08:00 Contenedores\n12:00 Pipelines\n16:00 Cierre',
    'presencial', 'Sede DEMO, San Salvador',
    '2027-07-12 14:00:00+00', '2027-07-12 17:00:00+00', 'published', true
  ),
  (
    (select id from public.organizers where slug = 'organizador-demo-uno'),
    (select id from public.categories where kind = 'event_type' and slug = 'bootcamps'), (select id from public.categories where kind = 'topic' and slug = 'inteligencia-artificial'), null,
    'bootcamp-demo-inteligencia-artificial', 'Bootcamp demo de inteligencia artificial',
    'Formación en modelos de aprendizaje automático y uso responsable de IA. Evento ficticio de demostración.',
    E'18:00 Módulo 1\n20:00 Módulo 2\n21:30 Cierre',
    'virtual', null,
    '2027-07-27 00:00:00+00', '2027-07-27 03:00:00+00', 'published', true
  ),
  (
    (select id from public.organizers where slug = 'organizador-demo-dos'),
    (select id from public.categories where kind = 'event_type' and slug = 'bootcamps'), (select id from public.categories where kind = 'topic' and slug = 'machine-learning'), (select id from public.categories where kind = 'location' and slug = 'san-miguel'),
    'bootcamp-demo-machine-learning', 'Bootcamp demo de machine learning',
    'Entrenamiento de modelos supervisados y evaluación de resultados. Evento ficticio de demostración.',
    E'08:00 Teoría\n12:00 Laboratorio\n16:00 Cierre',
    'presencial', 'Sede DEMO, San Miguel',
    '2027-08-09 14:00:00+00', '2027-08-09 17:00:00+00', 'published', true
  ),
  (
    (select id from public.organizers where slug = 'organizador-demo-tres'),
    (select id from public.categories where kind = 'event_type' and slug = 'bootcamps'), (select id from public.categories where kind = 'topic' and slug = 'programacion'), null,
    'bootcamp-demo-programacion-gratis', 'Bootcamp demo de programación gratuito',
    'Primeros pasos en lógica de programación, sin costo. Evento ficticio de demostración.',
    E'18:00 Lógica\n19:30 Ejercicios\n21:00 Cierre',
    'virtual', null,
    '2027-08-24 00:00:00+00', '2027-08-24 03:00:00+00', 'published', true
  ),
  (
    (select id from public.organizers where slug = 'organizador-demo-uno'),
    (select id from public.categories where kind = 'event_type' and slug = 'bootcamps'), (select id from public.categories where kind = 'topic' and slug = 'python'), (select id from public.categories where kind = 'location' and slug = 'san-salvador'),
    'bootcamp-demo-python', 'Bootcamp demo de Python',
    'Programación en Python desde cero con proyectos cortos. Evento ficticio de demostración.',
    E'08:00 Sintaxis\n12:00 Funciones\n16:00 Proyecto',
    'presencial', 'Sede DEMO, San Salvador',
    '2027-09-06 14:00:00+00', '2027-09-06 17:00:00+00', 'published', true
  ),
  (
    (select id from public.organizers where slug = 'organizador-demo-dos'),
    (select id from public.categories where kind = 'event_type' and slug = 'concursos'), (select id from public.categories where kind = 'topic' and slug = 'ciberseguridad'), null,
    'concurso-demo-ciberseguridad', 'Concurso demo de ciberseguridad',
    'Retos de seguridad en línea para estudiantes. Evento ficticio de demostración.',
    E'14:00 Inicio\n16:00 Retos\n18:00 Resultados',
    'virtual', null,
    '2027-09-20 20:00:00+00', '2027-09-20 23:00:00+00', 'published', true
  ),
  (
    (select id from public.organizers where slug = 'organizador-demo-tres'),
    (select id from public.categories where kind = 'event_type' and slug = 'concursos'), (select id from public.categories where kind = 'topic' and slug = 'inteligencia-artificial'), (select id from public.categories where kind = 'location' and slug = 'santa-ana'),
    'concurso-demo-ia', 'Concurso demo de inteligencia artificial',
    'Concurso de ideas con modelos de inteligencia artificial. Evento ficticio de demostración.',
    E'09:00 Presentación de ideas\n13:00 Jurado\n16:00 Premiación',
    'presencial', 'Sede DEMO, Santa Ana',
    '2027-10-04 15:00:00+00', '2027-10-04 18:00:00+00', 'published', true
  ),
  (
    (select id from public.organizers where slug = 'organizador-demo-uno'),
    (select id from public.categories where kind = 'event_type' and slug = 'concursos'), (select id from public.categories where kind = 'topic' and slug = 'robotica'), (select id from public.categories where kind = 'location' and slug = 'san-salvador'),
    'concurso-demo-robotica', 'Concurso demo de robótica',
    'Competencia de robots con retos de seguimiento de línea. Evento ficticio de demostración.',
    E'09:00 Registro\n10:00 Pruebas\n16:00 Premiación',
    'presencial', 'Sede DEMO, San Salvador',
    '2027-10-18 15:00:00+00', '2027-10-18 18:00:00+00', 'published', true
  ),
  (
    (select id from public.organizers where slug = 'organizador-demo-dos'),
    (select id from public.categories where kind = 'event_type' and slug = 'concursos'), (select id from public.categories where kind = 'topic' and slug = 'startups'), null,
    'concurso-demo-startups', 'Concurso demo de startups',
    'Presentación de proyectos emprendedores ante un panel. Evento ficticio de demostración.',
    E'15:00 Inicio\n16:00 Presentaciones\n18:00 Resultados',
    'virtual', null,
    '2027-11-01 21:00:00+00', '2027-11-02 00:00:00+00', 'published', true
  ),
  (
    (select id from public.organizers where slug = 'organizador-demo-tres'),
    (select id from public.categories where kind = 'event_type' and slug = 'webinars'), (select id from public.categories where kind = 'topic' and slug = 'inteligencia-artificial'), null,
    'webinar-demo-ia', 'Webinar demo de inteligencia artificial',
    'Sesión en línea sobre usos prácticos de la inteligencia artificial. Evento ficticio de demostración.',
    E'12:00 Bienvenida\n12:15 Presentación\n13:00 Preguntas',
    'virtual', null,
    '2027-02-04 18:00:00+00', '2027-02-04 21:00:00+00', 'published', true
  ),
  (
    (select id from public.organizers where slug = 'organizador-demo-uno'),
    (select id from public.categories where kind = 'event_type' and slug = 'conferencias'), (select id from public.categories where kind = 'topic' and slug = 'ciberseguridad'), (select id from public.categories where kind = 'location' and slug = 'san-salvador'),
    'conferencia-demo-ciberseguridad', 'Conferencia demo de ciberseguridad',
    'Conferencias sobre protección de datos y cumplimiento. Evento ficticio de demostración.',
    E'09:00 Inauguración\n10:30 Charla principal\n15:00 Mesa de expertos',
    'presencial', 'Sede DEMO, San Salvador',
    '2027-02-11 15:00:00+00', '2027-02-11 18:00:00+00', 'published', true
  ),
  (
    (select id from public.organizers where slug = 'organizador-demo-dos'),
    (select id from public.categories where kind = 'event_type' and slug = 'conferencias'), (select id from public.categories where kind = 'topic' and slug = 'inteligencia-artificial'), null,
    'conferencia-demo-ia', 'Conferencia demo de inteligencia artificial',
    'Conferencia en línea sobre evaluación de modelos y ética de datos. Evento ficticio de demostración.',
    E'10:00 Inicio\n11:00 Charla principal\n14:00 Preguntas',
    'virtual', null,
    '2027-03-25 16:00:00+00', '2027-03-25 19:00:00+00', 'published', true
  ),
  (
    (select id from public.organizers where slug = 'organizador-demo-tres'),
    (select id from public.categories where kind = 'event_type' and slug = 'hackathons'), (select id from public.categories where kind = 'topic' and slug = 'inteligencia-artificial'), (select id from public.categories where kind = 'location' and slug = 'san-miguel'),
    'hackathon-demo-ia', 'Hackathon demo de inteligencia artificial',
    'Hackathon de 24 horas en equipos de hasta cuatro personas. Evento ficticio de demostración.',
    E'08:00 Registro\n09:00 Inicio del reto\n08:00 Entrega',
    'presencial', 'Sede DEMO, San Miguel',
    '2027-04-17 14:00:00+00', '2027-04-17 17:00:00+00', 'published', true
  ),
  (
    (select id from public.organizers where slug = 'organizador-demo-uno'),
    (select id from public.categories where kind = 'event_type' and slug = 'meetups'), (select id from public.categories where kind = 'topic' and slug = 'fintech'), (select id from public.categories where kind = 'location' and slug = 'san-salvador'),
    'meetup-demo-fintech', 'Meetup demo de fintech',
    'Charla breve sobre pagos digitales y billeteras electrónicas. Evento ficticio de demostración.',
    E'18:00 Bienvenida\n18:30 Charla\n19:30 Preguntas',
    'presencial', 'Sede DEMO, San Salvador',
    '2027-05-28 00:00:00+00', '2027-05-28 03:00:00+00', 'published', true
  ),
  (
    (select id from public.organizers where slug = 'organizador-demo-dos'),
    (select id from public.categories where kind = 'event_type' and slug = 'meetups'), (select id from public.categories where kind = 'topic' and slug = 'inteligencia-artificial'), null,
    'meetup-demo-ia', 'Meetup demo de inteligencia artificial',
    'Encuentro en línea para compartir proyectos de inteligencia artificial. Evento ficticio de demostración.',
    E'19:00 Bienvenida\n19:20 Proyectos\n20:30 Cierre',
    'virtual', null,
    '2027-06-11 01:00:00+00', '2027-06-11 04:00:00+00', 'published', true
  ),
  (
    (select id from public.organizers where slug = 'organizador-demo-tres'),
    (select id from public.categories where kind = 'event_type' and slug = 'charlas'), (select id from public.categories where kind = 'topic' and slug = 'ciberseguridad'), (select id from public.categories where kind = 'location' and slug = 'san-miguel'),
    'charla-demo-ciberseguridad', 'Charla demo de ciberseguridad',
    'Charla sobre contraseñas, autenticación y hábitos seguros. Evento ficticio de demostración.',
    E'18:00 Bienvenida\n18:20 Charla\n19:20 Preguntas',
    'presencial', 'Sede DEMO, San Miguel',
    '2027-08-17 00:00:00+00', '2027-08-17 03:00:00+00', 'published', true
  ),
  (
    (select id from public.organizers where slug = 'organizador-demo-uno'),
    (select id from public.categories where kind = 'event_type' and slug = 'ferias-tecnologicas'), null, (select id from public.categories where kind = 'location' and slug = 'san-salvador'),
    'feria-demo-tecnologia', 'Feria demo de tecnología',
    'Stands de empresas y comunidades tecnológicas, con demostraciones. Evento ficticio de demostración.',
    E'09:00 Apertura\n12:00 Demostraciones\n17:00 Cierre',
    'presencial', 'Sede DEMO, San Salvador',
    '2027-11-13 15:00:00+00', '2027-11-13 18:00:00+00', 'published', true
  ),
  (
    (select id from public.organizers where slug = 'organizador-demo-dos'),
    (select id from public.categories where kind = 'event_type' and slug = 'ferias-tecnologicas'), null, (select id from public.categories where kind = 'location' and slug = 'santa-ana'),
    'feria-demo-tecnologia-occidente', 'Feria demo tecnológica de occidente',
    'Feria regional con stands de comunidades y estudiantes. Evento ficticio de demostración.',
    E'09:00 Apertura\n13:00 Exposiciones\n17:00 Cierre',
    'presencial', 'Sede DEMO, Santa Ana',
    '2027-12-04 15:00:00+00', '2027-12-04 18:00:00+00', 'published', true
  ),
  (
    (select id from public.organizers where slug = 'organizador-demo-tres'),
    (select id from public.categories where kind = 'event_type' and slug = 'congresos'), null, null,
    'congreso-demo-en-linea', 'Congreso demo en línea',
    'Congreso en línea con sesiones generales de tecnología. Evento ficticio de demostración.',
    E'09:00 Inicio\n10:00 Sesiones\n16:00 Cierre',
    'virtual', null,
    '2027-09-12 15:00:00+00', '2027-09-12 18:00:00+00', 'published', true
  ),
  (
    (select id from public.organizers where slug = 'organizador-demo-uno'),
    (select id from public.categories where kind = 'event_type' and slug = 'webinars'), null, null,
    'webinar-demo-productividad-digital', 'Webinar demo de productividad digital',
    'Herramientas digitales para organizar el trabajo y el estudio. Evento ficticio de demostración.',
    E'12:00 Bienvenida\n12:20 Herramientas\n13:00 Preguntas',
    'virtual', null,
    '2027-04-22 18:00:00+00', '2027-04-22 21:00:00+00', 'published', true
  ),
  (
    (select id from public.organizers where slug = 'organizador-demo-dos'),
    (select id from public.categories where kind = 'event_type' and slug = 'conferencias'), null, (select id from public.categories where kind = 'location' and slug = 'san-salvador'),
    'conferencia-demo-liderazgo-tecnologico', 'Conferencia demo de liderazgo tecnológico',
    'Conferencia sobre liderazgo en equipos de tecnología. Evento ficticio de demostración.',
    E'09:00 Bienvenida\n10:00 Charla principal\n12:00 Cierre',
    'presencial', 'Sede DEMO, San Salvador',
    '2027-07-29 15:00:00+00', '2027-07-29 18:00:00+00', 'published', true
  ),
  (
    (select id from public.organizers where slug = 'organizador-demo-tres'),
    (select id from public.categories where kind = 'event_type' and slug = 'hackathons'), null, (select id from public.categories where kind = 'location' and slug = 'san-salvador'),
    'hackathon-demo-datos-abiertos', 'Hackathon demo de datos abiertos',
    'Hackathon de 48 horas para crear proyectos con datos abiertos. Evento ficticio de demostración.',
    E'08:00 Registro\n09:00 Inicio\n08:00 Entrega',
    'presencial', 'Sede DEMO, San Salvador',
    '2027-10-30 14:00:00+00', '2027-10-30 17:00:00+00', 'published', true
  ),
  (
    (select id from public.organizers where slug = 'organizador-demo-uno'),
    (select id from public.categories where kind = 'event_type' and slug = 'meetups'), null, (select id from public.categories where kind = 'location' and slug = 'santa-ana'),
    'meetup-demo-comunidad-tecnologica', 'Meetup demo de comunidad tecnológica',
    'Encuentro para conocer comunidades tecnológicas de la zona. Evento ficticio de demostración.',
    E'18:00 Bienvenida\n18:30 Presentaciones\n20:00 Cierre',
    'presencial', 'Sede DEMO, Santa Ana',
    '2027-03-19 00:00:00+00', '2027-03-19 03:00:00+00', 'published', true
  ),
  (
    (select id from public.organizers where slug = 'organizador-demo-dos'),
    (select id from public.categories where kind = 'event_type' and slug = 'charlas'), null, null,
    'charla-demo-carreras-tecnologia', 'Charla demo sobre carreras en tecnología',
    'Charla en línea sobre perfiles y formación en tecnología. Evento ficticio de demostración.',
    E'18:00 Bienvenida\n18:20 Charla\n19:20 Preguntas',
    'virtual', null,
    '2027-04-30 00:00:00+00', '2027-04-30 03:00:00+00', 'published', true
  ),
  (
    (select id from public.organizers where slug = 'organizador-demo-tres'),
    (select id from public.categories where kind = 'event_type' and slug = 'workshops'), null, (select id from public.categories where kind = 'location' and slug = 'san-salvador'),
    'workshop-demo-diseno-de-producto', 'Workshop demo de diseño de producto',
    'Taller práctico para entender necesidades de usuarios y prototipar. Evento ficticio de demostración.',
    E'09:00 Investigación\n11:00 Prototipos\n15:00 Cierre',
    'presencial', 'Sede DEMO, San Salvador',
    '2027-06-28 15:00:00+00', '2027-06-28 18:00:00+00', 'published', true
  ),
  (
    (select id from public.organizers where slug = 'organizador-demo-uno'),
    (select id from public.categories where kind = 'event_type' and slug = 'networking'), null, (select id from public.categories where kind = 'location' and slug = 'san-miguel'),
    'networking-demo-emprendedores', 'Networking demo para emprendedores',
    'Encuentro para emprendedores que buscan clientes, aliados e inversión. Evento ficticio de demostración.',
    E'18:00 Bienvenida\n18:30 Rondas de contactos\n20:00 Cierre',
    'presencial', 'Sede DEMO, San Miguel',
    '2027-05-14 00:00:00+00', '2027-05-14 03:00:00+00', 'published', true
  ),
  (
    (select id from public.organizers where slug = 'organizador-demo-dos'),
    (select id from public.categories where kind = 'event_type' and slug = 'competencias'), null, null,
    'competencia-demo-programacion-en-linea', 'Competencia demo de programación en línea',
    'Competencia en línea de resolución de problemas de programación. Evento ficticio de demostración.',
    E'14:00 Inicio\n15:00 Retos\n18:00 Resultados',
    'virtual', null,
    '2027-08-30 20:00:00+00', '2027-08-30 23:00:00+00', 'published', true
  ),
  (
    (select id from public.organizers where slug = 'organizador-demo-tres'),
    (select id from public.categories where kind = 'event_type' and slug = 'concursos'), null, null,
    'concurso-demo-ideas-tecnologicas', 'Concurso demo de ideas tecnológicas',
    'Concurso de ideas con presentación en línea de siete minutos. Evento ficticio de demostración.',
    E'15:00 Inicio\n16:00 Presentaciones\n18:00 Resultados',
    'virtual', null,
    '2027-10-09 21:00:00+00', '2027-10-10 00:00:00+00', 'published', true
  ),
  (
    (select id from public.organizers where slug = 'organizador-demo-dos'),
    (select id from public.categories where kind = 'event_type' and slug = 'bootcamps'), null, (select id from public.categories where kind = 'location' and slug = 'san-miguel'),
    'bootcamp-demo-fundamentos-digitales', 'Bootcamp demo de fundamentos digitales',
    'Formación inicial en herramientas digitales, datos y seguridad básica. Evento ficticio de demostración.',
    E'08:00 Herramientas\n12:00 Datos\n16:00 Cierre',
    'presencial', 'Sede DEMO, San Miguel',
    '2027-09-27 14:00:00+00', '2027-09-27 17:00:00+00', 'published', true
  )
on conflict (slug) do nothing;

insert into public.ticket_types (event_id, name, price_cents, quantity_total, max_per_order) values
  ((select id from public.events where slug = 'congreso-demo-ciberseguridad'), 'General', 1500, 150, 4),
  ((select id from public.events where slug = 'congreso-demo-ciberseguridad'), 'Premium', 3000, 40, 2),
  ((select id from public.events where slug = 'congreso-demo-ecommerce'), 'Acceso en línea', 900, 300, 5),
  ((select id from public.events where slug = 'competencia-demo-ia'), 'Registro gratuito', 0, 80, 2),
  ((select id from public.events where slug = 'networking-demo-cloud'), 'Registro gratuito', 0, 200, 4),
  ((select id from public.events where slug = 'networking-demo-ia'), 'Entrada general', 500, 120, 4),
  ((select id from public.events where slug = 'networking-demo-python'), 'Registro gratuito', 0, 90, 4),
  ((select id from public.events where slug = 'workshop-demo-ia-aplicada'), 'Acceso al taller', 700, 60, 2),
  ((select id from public.events where slug = 'bootcamp-demo-analisis-de-datos'), 'Cupo regular', 9500, 30, 1),
  ((select id from public.events where slug = 'bootcamp-demo-ciberseguridad-gratis'), 'Registro gratuito', 0, 250, 4),
  ((select id from public.events where slug = 'bootcamp-demo-ciencia-de-datos'), 'Cupo regular', 6000, 25, 1),
  ((select id from public.events where slug = 'bootcamp-demo-desarrollo-web'), 'Cupo general', 4500, 60, 2),
  ((select id from public.events where slug = 'bootcamp-demo-desarrollo-web'), 'Cupo con reserva', 3800, 20, 2),
  ((select id from public.events where slug = 'bootcamp-demo-devops'), 'Registro gratuito', 0, 40, 1),
  ((select id from public.events where slug = 'bootcamp-demo-inteligencia-artificial'), 'Cupo general', 7200, 50, 1),
  ((select id from public.events where slug = 'bootcamp-demo-machine-learning'), 'Cupo regular', 5800, 30, 1),
  ((select id from public.events where slug = 'bootcamp-demo-programacion-gratis'), 'Registro gratuito', 0, 300, 4),
  ((select id from public.events where slug = 'bootcamp-demo-python'), 'Cupo regular', 4000, 35, 1),
  ((select id from public.events where slug = 'concurso-demo-ciberseguridad'), 'Registro gratuito', 0, 150, 4),
  ((select id from public.events where slug = 'concurso-demo-ia'), 'Registro gratuito', 0, 100, 2),
  ((select id from public.events where slug = 'concurso-demo-robotica'), 'Entrada general', 250, 120, 6),
  ((select id from public.events where slug = 'concurso-demo-startups'), 'Entrada general', 150, 200, 4),
  ((select id from public.events where slug = 'webinar-demo-ia'), 'Registro gratuito', 0, 400, 10),
  ((select id from public.events where slug = 'conferencia-demo-ciberseguridad'), 'Acceso general', 1500, 200, 4),
  ((select id from public.events where slug = 'conferencia-demo-ia'), 'Acceso en línea', 900, 300, 5),
  ((select id from public.events where slug = 'hackathon-demo-ia'), 'Registro gratuito', 0, 120, 1),
  ((select id from public.events where slug = 'meetup-demo-fintech'), 'Registro gratuito', 0, 80, 2),
  ((select id from public.events where slug = 'meetup-demo-ia'), 'Registro gratuito', 0, 150, 2),
  ((select id from public.events where slug = 'charla-demo-ciberseguridad'), 'Registro gratuito', 0, 70, 2),
  ((select id from public.events where slug = 'feria-demo-tecnologia'), 'Entrada general', 300, 500, 6),
  ((select id from public.events where slug = 'feria-demo-tecnologia'), 'Pase VIP', 800, 60, 2),
  ((select id from public.events where slug = 'feria-demo-tecnologia-occidente'), 'Registro gratuito', 0, 300, 4),
  ((select id from public.events where slug = 'congreso-demo-en-linea'), 'Acceso en línea', 1000, 250, 5),
  ((select id from public.events where slug = 'webinar-demo-productividad-digital'), 'Registro gratuito', 0, 300, 4),
  ((select id from public.events where slug = 'conferencia-demo-liderazgo-tecnologico'), 'Registro gratuito', 0, 180, 3),
  ((select id from public.events where slug = 'hackathon-demo-datos-abiertos'), 'Inscripción por equipo', 500, 40, 1),
  ((select id from public.events where slug = 'meetup-demo-comunidad-tecnologica'), 'Registro gratuito', 0, 60, 2),
  ((select id from public.events where slug = 'charla-demo-carreras-tecnologia'), 'Registro gratuito', 0, 200, 2),
  ((select id from public.events where slug = 'workshop-demo-diseno-de-producto'), 'Entrada general', 600, 40, 2),
  ((select id from public.events where slug = 'networking-demo-emprendedores'), 'Entrada general', 400, 80, 2),
  ((select id from public.events where slug = 'competencia-demo-programacion-en-linea'), 'Registro gratuito', 0, 120, 4),
  ((select id from public.events where slug = 'concurso-demo-ideas-tecnologicas'), 'Entrada general', 200, 150, 2),
  ((select id from public.events where slug = 'bootcamp-demo-fundamentos-digitales'), 'Cupo regular', 5000, 30, 1)
on conflict (event_id, name) do nothing;
