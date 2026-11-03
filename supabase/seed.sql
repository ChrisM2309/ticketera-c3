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
