# Brechas, requerimientos nuevos y tareas — Ticketera C3

**Fecha:** 2026-11-09
**Base:** `master` en `a791f38` (incluye la PR #29, bloque C de imágenes).
**Estado de este documento:** análisis. No contiene cambios de código, migraciones ni planes de implementación. El plan se escribe después de responder las decisiones de la sección 7.
**Fuentes:**
1. `en proceso Ticketera C3 - proyecto.pdf` (28 diapositivas, "Lo que falta y dónde va" + las cinco secciones de la presentación). Es la referencia de lo que debe estar construido.
2. Documentos base del repositorio: `README.md`, `AGENTS.md`, `PRODUCT.md`, `docs/**`.
3. Código actual (`src/`, `supabase/`, `tests/`, `scripts/`, `public/`), revisado en `master`.

---

## 0. Cómo leer este documento

- **Estados:** `HECHO` · `PARCIAL` · `FALTA` · `DECIDIR` (depende de una decisión del equipo o del responsable).
- **Identificadores:**
  - `R-xx` requerimientos nuevos (mensaje del 2026-11-09).
  - `DP-xx` decisiones pendientes.
  - `T-xx` tareas del backlog de T01–T23 ya existente (no se renumera).
  - Las tareas nuevas usan prefijos por área: `DI` diseño e iconos, `CP` cuentas y perfiles, `CO` compra, `BM` ingresos (destacados y paquetes), `CI` check-in y post-evento, `WF` wireframes, `SEO`, `CT` contenido y administración editorial, `TX` taxonomía y datos, `MK` marketing y métricas, `UX` investigación y testeo, `DM` dominio, hosting y costos, `DOC` documentación.
- **Prioridad:** `P0` necesario para la demostración y la entrega; `P1` esperado por la presentación o el PDF; `P2` opcional.
- **Regla de honestidad:** ningún dato de entrevistas, testeos, métricas, precios de dominio o cifras de proyección se inventa. Lo que no existe se marca como `FALTA` o como supuesto.

---

## 1. Contexto y objetivos

### 1.1 Qué es

Ticketera C3 es un marketplace académico para descubrir, comprar y publicar eventos tecnológicos en El Salvador. Tiene dos lados:

- **Asistentes (B2C):** descubren, filtran, compran (gratis o con pago demo) y reciben un boleto con QR.
- **Organizadores (B2B):** publican eventos, pagan para destacarlos o contratan un paquete para empresas, y consultan resultados.

El sitio es **DEMO**: los pagos son simulados y el sitio no es un servicio oficial de C3.

### 1.2 Objetivos de esta fase

| # | Objetivo | Medida de éxito |
|---|---|---|
| O-1 | Cerrar la brecha entre lo que dice el PDF y lo que existe | Matriz de la sección 4 completa, sin filas sin estado |
| O-2 | Definir los requerimientos nuevos (cuentas, destacados, paquetes, iconos, wireframes, SEO, contenido) | Sección 3 con R-01 a R-11 aprobados |
| O-3 | Tener una lista de tareas ordenada por dependencias, con criterios de terminado | Sección 8 con tareas, prioridad y dependencia |
| O-4 | Dejar listas las decisiones que bloquean el plan | Sección 7 con DP-xx respondidas |
| O-5 | Actualizar los documentos base para que describan el estado real | Lista DOC de la sección 8 |

### 1.3 Fuera de alcance de este documento

- Implementar cualquier tarea de la sección 8.
- Ejecutar el plan de Superpowers. Eso ocurre después de aprobar las decisiones.
- Cobros reales, pasarelas externas, envío real de correo (ver DP-10 y DP-12).

---

## 2. Situación actual y situación deseada por área

Resumen. El detalle de cada punto está en las secciones 4 y 5.

| Área | Situación actual (repositorio) | Situación deseada (PDF y requerimientos) | Brecha |
|---|---|---|---|
| Modelo de negocio | Publicación gratis + comisión demo 5 % (supuesto). Destacado solo por administrador, sin cobro (D-35). Sin paquetes empresas | Publicación gratis, comisión por boleto, **publicación destacada a precio fijo por evento**, **paquete empresas anual con datos y QR** | `FALTA` cobro de destacado y paquete (R-04) |
| Compradores | Compra invitada (D-10). Sin cuenta ni perfil. «Mis boletos» salió del menú (T17) | Perfil con universidad, check-in con QR, «encontrar la entrada ya comprada» (prueba de usabilidad, tarea 3) | `FALTA` cuentas de comprador y perfiles (R-05) |
| Organizadores | Login, publicación con revisión, panel con conteo de boletos (T14–T16) | Perfil público, página propia (Copa Salvadoreña, comunidades), reporte post-evento, paquete empresas | `PARCIAL` (sin reporte, sin página pública, sin paquete; el panel no edita ni borra; el vínculo organizador–usuario se asigna a mano en base) |
| Administrador | Aprueba y rechaza eventos, lista órdenes, marca destacados (D-35) | Escribir contenido: blog, textos de categoría, páginas de organizador (R-10) | `FALTA` editor de contenido |
| Catálogo y taxonomía | 12 categorías, 4 temas, 3 ubicaciones, 128 rutas en `seo_routes`, filtros, resolvedor | 134 URLs en 4 niveles, 2 páginas de organizador | `PARCIAL` (organizadores no sembrados; 14 temas en base pero 4 con ruta propia; 36 vs 33 subtemas; búsqueda no incluye temas; ver sección 5) |
| Ficha del evento | Agenda en texto libre, organizador, precio, cupo por tipo, estado agotado, relacionados, JSON-LD Event fuera de demo; sin ponentes ni calendario ni compartir | Agenda y ponentes visibles, caja de compra sin scroll en móvil, agregar al calendario, compartir | `PARCIAL` (calendario y compartir faltan) |
| Compra | Carrito de un evento, checkout de invitado, pago demo aprobado/rechazado/gratis, E2E real (T08–T13) | Flujo de 4 clics; total claro sin cargos sorpresa; checkout simple en móvil | `PARCIAL` (refinar, ver R-06) |
| Boleto y post-compra | Confirmación por enlace, QR por boleto, descarga e impresión (T12) | Boleto por correo y WhatsApp, agregar al calendario, compartir, recordatorio 24 h, encuesta post-evento | `FALTA` envío simulado, calendario, compartir, recordatorio; `PARCIAL` check-in (columna `checked_in_at` sin escritor); `FALTA` recuperar boleto sin cuenta |
| Iconos y diseño | Tokens C3, Montserrat/Poppins. Iconos SVG escritos a mano en cinco componentes; `lucide-react` está en `package.json` sin ningún import en `src/`. Reglas Impeccable en DESIGN.md (la herramienta no está instalada) | Iconos de color que distingan secciones (home, barras, categorías) | `FALTA` sistema de iconos (R-01). Verificar uso real |
| Wireframes | Solo mencionados en el PDF; el repositorio no tiene wireframes (T20 pendiente) | Wireframes de las cinco pantallas, flujo móvil y comparación con el sitio | `FALTA` (R-07) |
| SEO técnico | Metadatos por ruta, sitemap y robots que bloquean todo en demo, `noindex` en vacíos, canonical, trailing slash | Datos estructurados Event, sitemap, robots habilitado, velocidad móvil, enlazado interno | `PARCIAL` (depende de DP-05); sitemap sin URLs de eventos; `robots` lista rutas que no existen; JSON-LD solo Event; Open Graph solo en fichas |
| SEO de contenido | Sin blog. Sin textos de categoría verificados. Sin páginas de organizador | 4–6 artículos antes de los picos de sep–oct, textos por categoría, páginas de organizador | `FALTA` (R-08, R-10, R-11) |
| Marketing y métricas | Sin analítica (excluida en PRD). Canales, presupuesto y proyección solo en el PDF | Canales por persona, objetivos SMART, $2,800 en 4 canales, captación orgánica, proyección | `FALTA` documento de marketing y medición |
| Investigación UX | Sin entrevistas, sin benchmark documentado, sin test de usabilidad (T19 pendiente) | 5 entrevistas con citas, 7 competidores documentados, test de 5 usuarios × 3 tareas | `FALTA` (contenido de equipo, no de código) |
| Dominio y hosting | Producción en `demo.ticketera.c3.com.sv` (T18). El PDF menciona `ticketera.c3.com.sv` y `ticketera.sv` | Dominio definido, precios de dominio y hosting, costo de plataforma | `DECIDIR` (DP-06) y `FALTA` precios |
| Entregables académicos | PDF de 28 diapositivas con cifras y pendientes; backlog T19–T22 pendiente | PDF sin pendientes, capturas, video de respaldo, cifras consistentes | `PARCIAL` |

---

## 3. Requerimientos nuevos (mensaje del 2026-11-09)

Cada requerimiento se traduce a una o varias tareas de la sección 8.

### R-01 · Iconos en todas las partes, con color

**Pedido:** agregar iconos en distintas partes (home, barras, etc.) y usar color para distinguir secciones. Conseguir una librería.

**Situación:** `lucide-react` está en `package.json` pero no se importa en ningún archivo de `src/`. Los iconos actuales son SVG escritos a mano en cinco componentes (buscar, carrito, navegación de categorías, controles del carrusel, selector de entradas). No hay un sistema de iconos definido. Las reglas de DESIGN.md dicen «los iconos son SVG de trazo, `aria-hidden` cuando decoran» (regla 10).

**Propuesta:**
- Librería base: `lucide-react` (ya instalada, trazo uniforme, licencia permisiva). Alternativas en DP-08.
- Un icono por cada tipo de evento (12), por tema (4), por ubicación (3), y por acción (carrito, cuenta, buscar, publicar, calendario, compartir, QR, precio, fecha, modalidad).
- Color por línea de C3 y por estado, con tokens (no colores literales). Siempre acompañado de texto (regla 7 de DESIGN.md).
- Tarea: DI-01 a DI-05.

**Límite:** D-33 fija que el color de línea clasifica y no decora. Los iconos de color deben respetar esa regla; ver DP-07.

### R-02 · Documentos base incompletos: actualizarlos

**Pedido:** los documentos base están incompletos; completarlos. Tomar lo importante como referencia o contexto.

**Situación:** hay inconsistencias concretas en los documentos (sección 5.2). Por ejemplo, `README.md` dice que el paquete «no contiene una aplicación Next.js» y `DESIGN.md` dice «falta PRODUCT.md», aunque ambos ya no son ciertos. `ACCEPTANCE.md` tiene casillas sin marcar en funciones que ya funcionan.

**Propuesta:** actualizar los documentos según la sección 8 (área DOC). Cada documento marca su fecha de corte.

### R-03 · Comparación entre lo que dice el PDF y lo construido

**Pedido:** lo que diga el PDF es lo que debe estar construido. Hacer la comparativa.

**Resultado:** la matriz completa está en la sección 4, diapositiva por diapositiva.

### R-04 · Dinero por destacado y paquetes empresas

**Pedido:** agregar lo que el PDF dice y el repositorio no tiene, como el cobro por destacado y los paquetes para empresas.

**Lo que dice el PDF:**
- Diapositiva 6: «Publicación destacada: precio fijo por evento» y «Paquete empresas: anual, con datos y QR».
- Diapositiva 7: «Publicar es gratis» y «comisión solo por venta, sin cuotas fijas».
- Diapositiva 25: objetivo de **4 paquetes B2B vendidos** a patrocinadoras de C3.

**Lo que dice el repositorio:** PRD §4 «Simplificaciones B2B: sin cobro del organizador, informes exportables, payout…». Esto contradice al PDF y hay que resolverlo (DP-02, DP-03).

**Propuesta:** cobro **simulado** con el mismo `DemoPaymentProvider` (DEMO_PAYMENT.md). El destacado pagado y el paquete no mueven dinero real. Tareas BM-01 a BM-07.

### R-05 · Perfiles de compradores, login y perfiles

**Pedido:** si se quieren perfiles para compradores, hay que hacer login y perfiles.

**Situación:** D-10 y PRD §7 excluyen «autenticación de comprador». T14 implementó Supabase Auth solo para organizador y administrador.

**Lo que dice el PDF:** diapositiva 7, «Asistentes calificados: perfil, universidad y check-in con QR». Diapositiva 18, tarea de usabilidad 3: «Encontrar la entrada ya comprada», que sin cuenta solo se resuelve con el enlace del correo.

**Propuesta:** cuenta **opcional** (DP-01). La compra como invitado se mantiene. La cuenta agrega «Mis boletos», datos precargados y perfil con universidad. Tareas CP-01 a CP-07.

### R-06 · Flujo de compra: refinar y simular lo que falta

**Pedido:** el flujo de compra hay que refinarlo y luego agregar detalle. Hay features que por lo menos hay que simular.

**Lo que existe:** flujo de 4 pasos hasta la confirmación (Home → categoría → evento → carrito → checkout → confirmación), con E2E real (T13).

**Lo que pide el PDF (diapositiva 12):**
- Home: eventos y categorías en la primera pantalla.
- Categoría: H1 con la keyword, filtros de tema, fecha, precio y ciudad.
- Evento: agenda y ponentes visibles; caja de compra sin hacer scroll.
- Carrito y pago: sin crear cuenta; total claro, sin cargos sorpresa.
- Confirmación: boleto con QR **por correo y WhatsApp**; agregar al calendario y compartir.

**Features a simular (no ejecutar envío real):**
- Envío del boleto por correo y WhatsApp → registro en una tabla de salida (`outbox`) visible como «Te enviamos el boleto a…» (DP-12).
- Recordatorio 24 h antes → mismo mecanismo, programado, sin job real.
- Check-in con QR en un panel del organizador (DP-14).
- Encuesta post-evento y reporte del organizador (R-04 y CI).

**Features reales (sin proveedor externo):**
- Agregar al calendario (archivo `.ics` generado en servidor con solo título, fecha y lugar).
- Compartir por WhatsApp (enlace `wa.me` con título y fecha, sin datos del comprador).

Tareas CO-01 a CO-10.

### R-07 · Wireframes completos

**Pedido:** agregar todo lo de wireframe.

**Situación:** no hay wireframes en el repositorio (T20 pendiente). El PDF pide cinco pantallas, flujo móvil y una comparación «del wireframe al sitio» con capturas (diapositiva 13), que hoy están sin tomar.

**Propuesta:** wireframes de baja fidelidad en `docs/design/wireframes/` (SVG o HTML), uno por pantalla, en móvil y escritorio; más las pantallas nuevas de cuentas, panel y administración. Formato en DP-18. Tareas WF-01 a WF-05.

### R-08 · Categorías y temas

**Pedido:** revisar que estén todas las categorías y temas que se mencionan.

**Resultado:** las 12 categorías, los 4 temas (Cloud, Inteligencia artificial, Programación, Python) y las 3 ubicaciones (San Salvador, San Miguel, Santa Ana) coinciden con la diapositiva 16 y con `seo_routes`. Quedan dos organizadores (`/claude/`, `/copa/`) sin sembrar (D-18) y la diferencia 134 vs 128 (sección 5). Tareas TX-01 a TX-04.

### R-09 · Revisar si el flujo existe y si se puede refinar

**Resultado:** el flujo **existe de punta a punta** en producción (compra gratis, aprobada y rechazada, T13 y T11). Se puede refinar en lo siguiente:
- Pasos y clics (4 pasos de la diapositiva 17).
- Visibilidad del total y la comisión antes del botón final (la comisión aparece en el carrito; revisar la ficha y el móvil).
- Estados de error y agotado en la ficha.
- Post-compra (boleto por correo simulado, calendario, compartir).

Ver CO-01 a CO-03.

### R-10 · Estrategia de optimización: lo que pide el documento

**Pedido:** agregar cada cosa que dice la estrategia: datos estructurados, habilitar robots, mejorar sitemaps, escribir contenido, artículos de blog importantes, páginas de organizadores, función de administrador para escribir.

**Lo que dice el PDF (diapositivas 20–22 y 27):**
- On-page: title, meta y H1 con la keyword del Excel; URLs limpias; texto por categoría con variantes de la keyword.
- Técnico: datos estructurados Event con fecha y precio; sitemap; velocidad móvil; enlazado interno; modalidades con noindex si no hay eventos.
- Contenido: blog de 4–6 artículos para búsquedas informativas, calendario según los picos de sep–oct; páginas de organizador para la Copa Salvadoreña.
- Captación: una página por evento, tema y ciudad; blog; redes; comunidad y alianzas.

**Situación:** el técnico está en buena parte hecho (T06, T07). Falta el contenido, el editor de administración, las páginas de organizador y la habilitación de robots en el sitio real (DP-05).

Tareas SEO-01 a SEO-11, CT-01 a CT-08.

### R-11 · Mejorar el SEO

**Pedido:** mejorar mucho el SEO, seguir lo que indique el documento, darle forma y buenas prácticas.

**Propuesta:** auditoría con el skill de SEO disponible antes de editar (`searchfit-seo:seo-audit` y `technical-seo`) y luego las tareas SEO-01 a SEO-11. Cada cambio se verifica con el sitio real (`NEXT_PUBLIC_IS_DEMO=false`), no solo en demo. No se prometen posiciones ni tráfico.

---

## 4. Comparación PDF vs. repositorio (diapositiva por diapositiva)

Leyenda: `HECHO` · `PARCIAL` · `FALTA` · `DECIDIR`.

| Dia. | Lo que dice el PDF | Estado en el repositorio | Tarea o decisión |
|---|---|---|---|
| 1 | Portada con integrantes | No aplica al código. Falta la portada en el repositorio | DOC-05 |
| 2 | Lo que falta: dominio, buyer personas, sitio, investigación, testeos, precios | Pendientes de este documento | Secciones 5–8 |
| 3 | Estructura de la presentación (5 secciones) | No aplica al código | DOC-05 |
| 4 | Definición: nombre, qué es, modelo | `HECHO` en PRD y PRODUCT.md. Las cifras de alianzas (6+ universidades, 10+ empresas) no tienen respaldo en el repositorio | DOC-01 (no afirmar cifras sin evidencia) |
| 5 | Nace en Competitive Coding Club; Copa Salvadoreña, hackathons, ICPC | `HECHO` como contexto. Sin página pública de la Copa (ver DP-11) | CT-06, DP-11 |
| 6 | Modelo B2C + B2B; comisión por boleto; publicación destacada a precio fijo; paquete empresas anual | Comisión demo (5 %, supuesto) `HECHO`. Destacado solo por admin sin cobro (D-35). Paquete empresas `FALTA` | BM-01 a BM-07, DP-02, DP-03 |
| 7 | Propuesta de valor: solo tech, publicar gratis, comisión solo por venta, perfil y check-in con QR, entrada accesible | Solo tech y publicar gratis `HECHO`. Perfil y check-in `FALTA`. Filtro de gratis y bajo costo `HECHO` | CP, CI |
| 8 | Dominio, hosting y plataforma (precios `$ __`); requisitos: URLs SEO, cobrar en línea en El Salvador, datos Event | Plataforma `HECHO` (Next.js + Supabase, Vercel). Precios `FALTA`. «Cobrar en línea» contradice la decisión de pago demo (D-03) | DM-01 a DM-04, DP-10 |
| 9 | Buyer personas: 2 compran (Diego, Andrea), 2 publican (Gabriela, Carlos) | Diego y Andrea en PRD y PRODUCT.md. Gabriela y Carlos solo en el PRD §2 sin ficha completa. Canales y porcentajes sin validar | UX-05 |
| 10 | Lineamientos: navy, azul, violeta, turquesa; Montserrat y Poppins; nodos circulares; fondos navy con brillo; fotos reales; botón de compra turquesa | Colores y fuentes `HECHO` (D-14, D-33). **Conflicto:** D-33 cambió el botón de compra a violeta y prohibió gradientes; los nodos circulares y las fotos reales no están (D-36 retiró las fotos con personas) | DP-07, DI-06 |
| 11 | Estilo gráfico: nodos del logo, tarjetas claras, fotos reales, botón turquesa | Tarjetas claras `HECHO`. Nodos `FALTA`. Fotos: stock con créditos (`CREDITOS.md`) `PARCIAL` | DP-07, DI-03 |
| 12 | Wireframes del flujo móvil: Home, Categoría, Evento, Carrito y pago, Confirmación | Pantallas construidas `HECHO` en su mayoría. Wireframes `FALTA`. Sin «Agregar al calendario», sin «Compartir», sin boleto por correo/WhatsApp `FALTA` | WF-01, WF-02, CO-05, CO-06, CO-04 |
| 13 | Del wireframe al sitio: capturas de 5 pantallas; link del sitio y plataforma | Sitio `HECHO` (demo.ticketera.c3.com.sv). Capturas `FALTA`. Link final depende de DP-06 | WF-04, DM-01 |
| 14 | Estudio UX: investigación, árbol de categorías, flujo, testeos | Árbol y flujo `HECHO` en código y `seo_routes`. Documentación visual `FALTA` | WF-05 |
| 15 | Desk research: Eventbrite, Luma, Meetup, Fever, Boletia, Passline, Tuboleta. Entrevistas a 5 personas | Desk research `FALTA` en el repositorio (solo una referencia en PRODUCT.md). Entrevistas `FALTA` | UX-01, UX-02 |
| 16 | Árbol: 12 tipos con volúmenes; 4 temas; 3 ubicaciones; organizadores (Copa, comunidades) | 12, 4 y 3 `HECHO` (verificado en `seed.sql`). Organizadores `FALTA` (D-18) | TX-01 a TX-03 |
| 17 | Flujo de 4 clics; flujo del organizador: publicar, revisar, publicado, reporte post-evento | Flujo de compra `HECHO`. Flujo del organizador `HECHO` hasta publicación. Reporte post-evento `FALTA` | CO-01, CI-02 |
| 18 | Test de usabilidad: 5 usuarios, 3 tareas, 3 métricas. Resultados `FALTA` | Sin resultados. La tarea 3 no tiene función de «Mis boletos» | UX-03, CP-03 |
| 19 | Sección SEO: keyword research y estrategia | `HECHO` en el documento SEO_ROUTES | — |
| 20 | Keyword research en El Salvador: volúmenes, pico de sep–oct, 134 URLs | Volúmenes en `SEO_ROUTES.md`. 128 rutas en base (no 134). Sin medición propia | TX-02, MK-04 |
| 21 | Arquitectura SEO: 134 URLs en 4 niveles | 1 + 19 + 33 + 76 = 129 en el árbol del repositorio, más organizadores sin sembrar | TX-02 |
| 22 | Estrategia on-page, técnico y contenido (blog, calendario, organizadores) | On-page `PARCIAL` (faltan textos por categoría). Técnico `PARCIAL`. Blog `FALTA`. Organizadores `FALTA` | SEO-04, SEO-05, CT-04, CT-06 |
| 23 | Sección de marketing: canales, inversión, captación | No aplica al código. Documento `FALTA` | MK-03 |
| 24 | Canales por buyer persona (porcentajes estimados, por validar) | `FALTA` documento. Los porcentajes deben marcarse como supuestos | MK-03, UX-05 |
| 25 | Objetivos SMART 6 meses: 31,590 visitas; 872 conversiones; 2.0x ROAS en junio; 4 paquetes B2B | Sin medición `FALTA`. Paquetes B2B `FALTA` | MK-01, BM-05 |
| 26 | Inversión $2,800: Meta $980, Google $840, TikTok $560, LinkedIn $420; ROAS por canal | Documento `FALTA`. Dato del profesor, no se modifica | MK-03 |
| 27 | Captación orgánica: SEO (página por evento, tema y ciudad; blog de 6 artículos), email (bienvenida, boleto, recordatorio 24 h, encuesta, newsletter), redes (lunes, miércoles, viernes), comunidad | SEO por evento `HECHO` (fichas). Blog `FALTA`. Email `FALTA` (simulado). Redes `FALTA` (plan). Comunidad `FALTA` | CT-04, CO-04, CO-07, MK-03 |
| 28 | Proyección 2027: ventas por mes; 31,590 visitas; 872 conversiones (2.8 %); $11,769; ticket promedio $27; ROAS 1.8x | Documento `FALTA`. Cifras inconsistentes (sección 5.1) | MK-04, DP-15 |
| 29 | Cierre: «Compite. Crea. Conecta.» y ticketera.sv | `HECHO` como eslogan en el sitio. Dominio por confirmar | DM-01, DP-06 |

---

## 5. Inconsistencias detectadas

### 5.1 Cifras del PDF

| # | Dato | Problema | Acción |
|---|---|---|---|
| I-01 | 872 conversiones con ticket promedio $27 y ventas de $11,769 | $11,769 / 872 = $13.50, no $27. Con $27 se implican 436 compras, no 872 | DP-15: definir si «conversión» incluye registros gratis y cómo se calcula el ticket promedio |
| I-02 | ROAS 1.8x (diapositiva 28) frente a 2.0x en junio (diapositiva 25) | Dos cifras distintas para el mismo indicador. La del 1.8x no coincide con $11,769 / $2,800 = 4.2x | DP-15: definir ROAS (ventas atribuidas a anuncios o ventas totales) |
| I-03 | «Las ventas se duplican» con 1,332 → 2,779 | 2.09x en el periodo; coherente, pero el periodo y el mes de inicio no están rotulados en el gráfico | MK-04 |
| I-04 | 134 URLs (diapositivas 20–21) | El árbol tiene 1 + 19 + 33 + 76 = 129 en `seo_routes` (128 + Home). Sin organizadores (2). Temas nivel 2: 36 en el Excel, 33 en la base | TX-02 |
| I-05 | «Mis boletos» (menú) | Sale del menú desde T17; la tarea de usabilidad 3 la requiere | CP-03 |
| I-06 | Ventas por mes «2027» en el PDF | Sitio aún en demo; las cifras son proyección, no resultado. Debe rotularse | MK-04 |

### 5.2 Documentos del repositorio

| # | Documento | Problema | Acción |
|---|---|---|---|
| I-07 | `README.md` | Dice «Este paquete NO contiene una aplicación Next.js ya desarrollada» y «Estado: planificación lista»; ya no es cierto | DOC-01 |
| I-08 | `docs/README.md` (índice) | No lista `PRODUCT.md`, `design/SISTEMA-VISUAL-C3-2026-11.md`, los planes de 2026-11-04 a 06 ni `DECISIONS.md` completo | DOC-01 |
| I-09 | `docs/design/DESIGN.md` §Impeccable | «Falta `PRODUCT.md`»; el archivo existe en la raíz. La herramienta Impeccable no está instalada (T08) | DI-01 |
| I-10 | `docs/testing/ACCEPTANCE.md` | Casillas sin marcar en criterios ya cumplidos (p. ej., logo lleva al Home, 12 tipos en orden). Solo T08 aparece como cumplido en el checklist | DOC-02 |
| I-11 | `docs/product/PRD.md` §7 | Excluye «autenticación de comprador», «envío masivo», «analítica avanzada» y reembolsos; contradice R-05 y R-06 | DOC-03 |
| I-12 | `docs/product/PRD.md` §4 | «Sin cobro del organizador» contradice el destacado pagado y el paquete (R-04) | DOC-03, DP-02 |
| I-13 | `docs/architecture/DATA.md` | Propone `checked_in_at` pero dice que el check-in «puede quedar fuera de v1»; la tabla `profiles` del modelo no coincide con lo implementado (roles en `profiles`, perfil de comprador ausente) | DOC-04 |
| I-14 | `docs/architecture/SEO_ROUTES.md` §2 | Organizadores `/claude/` y `/copa/` como páginas de primer nivel; D-18 no las siembra. Sin decisión sobre el nombre | DP-11 |
| I-15 | `docs/DECISIONS.md` D-25 | `robots.txt` bloquea todo en demo. El PDF pide «habilitar robots» (diapositiva 8 y pedido del 2026-11-09) | DP-05 |
| I-16 | `docs/design/DESIGN.md` regla 3 | El botón de compra es violeta (`accion`, D-33). El PDF pide turquesa (diapositiva 10) | DP-07 |
| I-17 | `docs/design/DESIGN.md` reglas 4 y 10 | Sin gradientes ni órbitas (D-33). El PDF pide «fondos navy con brillo turquesa y violeta» y nodos circulares | DP-07 |
| I-18 | `docs/testing/ACCEPTANCE.md` y backlog | Backlog marca T10 «En curso» y T17/T18 como terminados, pero ACCEPTANCE deja pendientes de T10 (concurrencia real) y de T17 (CSP, `owner_user_id` visible) | DOC-02 |
| I-19 | `docs/checkout/DEMO_PAYMENT.md` | Sigue siendo la política correcta, pero la diapositiva 8 pide «cobrar en línea» | DP-10 |
| I-20 | `docs/product/PRD.md` §3 y `PRODUCT.md` | Las personas de PRD y PRODUCT.md no coinciden con las cuatro del PDF (faltan Gabriela y Carlos como personas completas) | UX-05 |
| I-21 | Dominio | El PDF menciona `ticketera.c3.com.sv`, `ticketera.sv` y el repositorio `demo.ticketera.c3.com.sv` | DP-06 |

### 5.3 Diseño y código

| # | Elemento | Problema | Acción |
|---|---|---|---|
| I-22 | Iconos | No hay sistema de iconos definido ni por sección | DI-01 a DI-04 |
| I-23 | Páginas de organizador | Sin rutas `/organizadores/…` | CT-06 |
| I-24 | Editor de administración | Sin edición de contenido (solo aprobación y destacados) | CT-03 |
| I-25 | Blog | Sin rutas, tabla ni contenido | CT-02 a CT-05 |
| I-26 | Perfil de comprador | Sin tabla, sin login, sin pantalla «Mis boletos» | CP-02 a CP-04 |
| I-27 | Check-in | Sin pantalla. La columna `tickets.checked_in_at` existe, pero nada la escribe | CI-01 |
| I-28 | `src/app/robots.ts` y `src/lib/seo/indexing.ts` | La lista de rutas privadas incluye `/mis-boletos/` y `/publicar/`, que no tienen ruta | SEO-12 |
| I-29 | `supabase/seed.sql` | Una palabra clave tiene un carácter roto («registro programaci�n») por codificación | TX-05 |
| I-30 | `package.json` | `lucide-react` instalado y sin uso; los iconos están escritos a mano | DI-07, DP-08 |
| I-31 | `src/features/catalog/search.ts` | El buscador no busca por tema, aunque el texto de ayuda dice «temas» | TX-06 |
| I-32 | Esquema de órdenes | El estado `cancelled` existe y tiene etiqueta, pero nada lo escribe | CO-12 |
| I-33 | Creación de órdenes | Un doble clic en «Continuar» puede crear dos órdenes pendientes; la idempotencia solo existe en la confirmación | CO-11 |
| I-34 | Autenticación | Sin registro de comprador ni de organizador (las cuentas se crean con scripts), sin recuperación de contraseña. El inicio de sesión es solo para personal | CP-08, CP-09 |
| I-35 | Taxonomía | La base tiene 14 temas; solo 4 tienen ruta propia (los de la presentación). Las rutas de los otros 10 existen solo como subtemas, si los tienen | TX-07, DP-21 |
| I-36 | JSON-LD | Solo `Event`. Faltan `BreadcrumbList`, `WebSite` y `Organization` | SEO-14 |
| I-37 | Open Graph | Solo en fichas de evento; faltan en home y catálogo | SEO-13 |
| I-38 | Administración | Sin editor de contenido. Las categorías y `seo_routes` se escriben solo por base de datos, sin pantalla. El motivo de rechazo no existe | CT-03 |

---

## 6. Necesidades y objetivos por persona

Las cuatro personas vienen del PDF (diapositiva 9). Sus porcentajes y frenos son **material del equipo a validar con entrevistas**; no se presentan como investigación concluida.

| Persona | Necesidad | Lo que la frena | Qué debe existir |
|---|---|---|---|
| Diego, universitario tech (19–22) | Entradas gratis o baratas; compartir la invitación | Ir solo; el precio | Filtro de gratis, compartir por WhatsApp, precio claro |
| Andrea, profesional junior (24–30) | Agenda detallada, precios claros | Agendas vagas | Agenda y ponentes visibles, total sin sorpresas, calendario |
| Gabriela, talento y employer branding (28–38) | Datos de asistentes, menos no-show, QR | No-shows | Check-in QR, reporte post-evento, paquete empresas |
| Carlos, líder de comunidad (25–35) | Publicar sin cuota fija | Cuotas fijas | Publicación gratis, comisión solo por venta, destacado opcional |

---

## 7. Decisiones pendientes (DP)

Cada decisión incluye una recomendación. Las decisiones marcadas como **bloqueante** impiden empezar la tarea indicada.

| ID | Decisión | Opciones | Recomendación | Bloquea |
|---|---|---|---|---|
| DP-01 | Cuentas de comprador | (a) cuenta opcional, la compra invitada se mantiene; (b) cuenta obligatoria | (a): cumple D-10 y el PDF, y agrega «Mis boletos» | CP, CO-04 · **bloqueante** |
| DP-02 | Destacado pagado | (a) precio fijo por evento, cobro simulado; (b) solo gratis por admin | (a): monto y vigencia como supuesto, etiquetado «Destacado» | BM-02 a BM-04 · **bloqueante** |
| DP-03 | Paquete empresas | Qué incluye (eventos destacados, datos agregados, QR, reporte), precio anual, límites | Un paquete anual con precio supuesto y simulado; sin datos personales de asistentes | BM-05 · **bloqueante** |
| DP-04 | Analítica | (a) analítica con consentimiento y eventos de conversión; (b) ninguna | (a) mínimo, para medir los objetivos SMART; requiere texto de privacidad | MK-01, MK-02 |
| DP-05 | Indexación | (a) demo sigue `noindex`; configuración real lista para indexar; (b) indexar desde ya | (a): los 10/50 eventos son ficticios (D-25). Habilitar robots y sitemap en la configuración real y verificarlos | SEO-01, SEO-02 · **bloqueante** |
| DP-06 | Dominio final | `ticketera.c3.com.sv`, `ticketera.sv` o `demo.ticketera.c3.com.sv` | Confirmar con el responsable; la URL de la presentación debe coincidir con la real | DM-01, SEO-02 · **bloqueante** |
| DP-07 | Estilo de acción y fondos | (a) mantener D-33 (violeta, sin gradientes, fotos de stock); (b) volver al PDF (turquesa, brillo, fotos reales) | (a): D-33 ya la aprobó el responsable y el PDF no tiene fotos reales disponibles. Actualizar el PDF | DI-03, WF-01 · **bloqueante** |
| DP-08 | Librería de iconos | `lucide-react` (ya instalada); Phosphor; Tabler; Heroicons | `lucide-react`: ya está en el proyecto y su licencia es permisiva | DI-02 |
| DP-09 | Guía de frontend | Skill `frontend-design` disponible; Impeccable (no instalado) | Adoptar `frontend-design` como guía de dirección y mantener las reglas de DESIGN.md como lista de revisión | DI-01 · **bloqueante** |
| DP-10 | Cobro en línea | (a) pago demo (D-03); (b) pasarela real | (a). Declarar en la presentación que el cobro es simulado. (b) es cambio de alcance | DM-04 |
| DP-11 | Organizadores del Excel (`/claude/`, `/copa/`) | (a) nombres neutros de demo hasta verificar; (b) nombres reales | (a). Ninguna página debe implicar afiliación con la Copa o con un tercero | CT-06, TX-03 |
| DP-12 | Envío del boleto | (a) simulado con `outbox` visible; (b) correo real con proveedor | (a): no requiere proveedor ni dominio de correo. Si se pide correo real, es cambio de alcance | CO-04 |
| DP-13 | Blog | Quién escribe, cuántos artículos, temas y fechas | 4 artículos mínimos (PDF), escritos por el equipo a partir del keyword research, publicados antes de septiembre; sin testimonios | CT-01, CT-05 |
| DP-14 | Check-in | (a) página de check-in del organizador con QR; (b) solo en el PDF | (a): es la necesidad de Gabriela. Sin datos personales en la pantalla | CI-01 |
| DP-15 | Cifras de proyección | Definir conversión, ticket promedio y ROAS; rehacer el Excel | Usar las definiciones de la sección 5.1 y rotular todo como proyección | MK-04 |
| DP-16 | Comisión demo | 5 % (supuesto de DEMO_PAYMENT.md) u otro | Mantener 5 % marcado como supuesto | CO-01 |
| DP-17 | Costos de plataforma | Plan de Supabase y de Vercel; precios de dominio y hosting | Cotizar y anotar la fuente. No inventar precios | DM-02 |
| DP-18 | Formato de wireframes | SVG o HTML en el repositorio; Figma u otra herramienta | SVG o HTML en el repositorio, con exportación PNG para el PDF | WF-01 |
| DP-19 | Imágenes de eventos | Stock con créditos (actual); ilustraciones propias por tipo | Mantener stock con créditos; agregar ilustraciones por tipo solo si el equipo lo pide | DI-03 |
| DP-20 | Destacado editorial del administrador | Mantener el destacado manual (D-35) junto al pagado, o eliminarlo | Mantener; el pagado se muestra con etiqueta «Destacado pagado» y el editorial queda para el administrador | BM-04 |
| DP-21 | Temas en la base | (a) 4 temas con ruta propia (los de la presentación) y el resto solo como filtro o subtema; (b) las 14 rutas | (a): coincide con la presentación y con el árbol del Excel. Confirmar | TX-07 |

---

## 8. Lista de tareas (orden por área y dependencias)

Cada tarea tiene: **ID**, **qué hacer**, **prioridad**, **depende de**, **criterio de terminado** y **tipo** (`Código`, `Doc`, `Equipo` = tarea del equipo, no del código).
Estado inicial de todas: `Pendiente`, salvo que se indique `HECHO`.

### Área DI · Diseño, iconos y guía de frontend

| ID | Qué hacer | Pri. | Depende de | Criterio de terminado | Tipo |
|---|---|---|---|---|---|
| DI-01 | Adoptar `frontend-design` como guía; corregir DESIGN.md (PRODUCT.md existe; estado de Impeccable) | P0 | DP-09 | DESIGN.md referencia la guía y no contiene afirmaciones falsas | Doc |
| DI-02 | Elegir librería de iconos y definir el mapa icono → tipo de evento, tema, ubicación, acción y estado | P0 | DP-08 | Tabla de iconos en DESIGN.md; ningún icono sin etiqueta accesible | Doc |
| DI-03 | Iconos de color por línea de C3 y por tipo de evento (12) en chips, tarjetas y menú | P1 | DI-02, DP-07 | Contraste AA; el texto acompaña al color; prueba de render | Código |
| DI-04 | Iconos en barras: cabecera (buscar, cuenta, carrito, publicar), pie, menú móvil, filtros, pasos del checkout | P1 | DI-02 | Áreas táctiles de 44 px; `aria-hidden` en decorativos; prueba en 375 px | Código |
| DI-05 | Revisión visual: capturas antes y después a 390 y 1280 px; detector de calidad de interfaz | P1 | DI-03, DI-04 | Capturas en la carpeta de evidencias; sin desbordamiento horizontal | Código |
| DI-06 | Modo oscuro global y token `info` (pendientes de D-33) | P2 | DP-07 | Decisión registrada; pruebas de contraste | Código |

### Área CP · Cuentas de comprador y perfiles

| ID | Qué hacer | Pri. | Depende de | Criterio de terminado | Tipo |
|---|---|---|---|---|---|
| CP-01 | Decidir cuenta opcional o obligatoria | P0 | DP-01 | Decisión registrada en DECISIONS.md | Equipo |
| CP-02 | Migración: `profiles` con rol `buyer`, nombre, universidad (opcional), consentimiento; `orders.buyer_user_id` (nullable) | P1 | CP-01 | Migración nueva en `supabase/migrations/`; pruebas RLS en `tests/db`; un usuario lee y edita solo su perfil | Código |
| CP-03 | Registro e inicio de sesión de comprador (Supabase Auth, mismo flujo de T14), página «Mis boletos» | P1 | CP-02 | Sin sesión redirige a `/ingresar/`; «Mis boletos» lista solo las órdenes propias con su QR | Código |
| CP-04 | Checkout con sesión: datos precargados; la orden queda ligada a la cuenta; la compra invitada sigue igual | P1 | CP-03, CO-03 | Pruebas de servidor: totales siguen calculándose en servidor; compra invitada sin cambios | Código |
| CP-05 | Perfil de comprador: universidad y preferencias de correo (consentimiento para newsletter, simulado) | P2 | CP-02 | Opt-in registrado; sin envío real | Código |
| CP-06 | Actualizar PRD §7 y DATA.md con perfiles y `buyer_user_id` | P1 | CP-01 | Documentos corregidos | Doc |
| CP-07 | Pruebas: acceso a «Mis boletos» de otro usuario falla; anon no lee `profiles` | P1 | CP-02 | Pruebas en `tests/db` | Código |

### Área CO · Compra refinada

| ID | Qué hacer | Pri. | Depende de | Criterio de terminado | Tipo |
|---|---|---|---|---|---|
| CO-01 | Auditoría del flujo contra los wireframes: pasos, fricciones, total y comisión visibles | P0 | WF-01, DP-16 | Lista de fricciones con capturas; decisión sobre cada una | Doc |
| CO-02 | Ficha: agenda y ponentes visibles arriba; caja de compra visible sin scroll en 375 px; «desde» con precio mínimo; estados agotado y finalizado | P0 | CO-01 | Prueba E2E en 375 px; el primer tipo de entrada se ve sin scroll | Código |
| CO-03 | Checkout en una pantalla en móvil: datos, resumen, comisión y botón con monto («Confirmar registro» / «Pagar $X» con «Pago de demostración») | P0 | CO-01 | Sin pasos extra; errores anunciados; prueba E2E | Código |
| CO-04 | Boleto «por correo y WhatsApp» simulado: tabla `outbox`; la confirmación muestra a dónde se envió (simulado) | P1 | DP-12, CO-03 | Filas en `outbox` por orden; etiqueta «Simulado»; sin envío externo | Código |
| CO-05 | «Agregar al calendario»: `.ics` generado en servidor con título, fechas y lugar | P1 | — | Archivo válido (prueba unitaria del formato); sin datos del comprador | Código |
| CO-06 | «Compartir por WhatsApp» con enlace `wa.me` (título y fecha; sin datos personales) | P1 | — | Prueba unitaria del enlace; sin enlace a órdenes | Código |
| CO-07 | Recordatorio 24 h antes: entrada programada en `outbox` (simulado) | P2 | CO-04 | Fila creada con fecha correcta; sin job real; etiqueta «Simulado» | Código |
| CO-08 | Estados de error: sin cupo al confirmar, evento cerrado, error del servidor; reintento claro | P1 | CO-03 | Pruebas de servidor y E2E | Código |
| CO-09 | Actualizar E2E: los tres escenarios (gratis, aprobado, rechazado) con el flujo refinado, en escritorio y 375 px | P1 | CO-02 a CO-08 | `purchase-flow.spec.ts` y `purchase-flow-real.spec.ts` verdes | Código |
| CO-10 | Actualizar DEMO_PAYMENT.md y SYSTEM.md con el flujo final | P1 | CO-09 | Documentos corregidos | Doc |

### Área BM · Ingresos: destacados pagados y paquetes empresas

| ID | Qué hacer | Pri. | Depende de | Criterio de terminado | Tipo |
|---|---|---|---|---|---|
| BM-01 | Decidir destacado pagado y paquete empresas (precio supuesto, vigencia, qué incluye) | P0 | DP-02, DP-03 | Decisión registrada | Equipo |
| BM-02 | Tabla `featured_purchases` (evento, organizador, estado `pending/approved/rejected`, vigencia, importe en centavos); RLS | P1 | BM-01 | Migración y pruebas en `tests/db` | Código |
| BM-03 | Flujo del organizador: «Destacar mi evento» → pago demo (aprobado o rechazado con el proveedor demo) → queda en revisión del administrador | P1 | BM-02, CO-03 | Rechazado no destaca; aprobado queda en cola; pruebas | Código |
| BM-04 | Portada: destacados pagados aprobados con etiqueta «Destacado pagado»; el destacado editorial del administrador (D-35) se mantiene (DP-20) | P1 | BM-03, DP-20 | Un evento no aparece dos veces; etiqueta visible | Código |
| BM-05 | Paquete empresas anual: página de venta (`/para-empresas/`), compra simulada, panel con datos agregados | P2 | BM-01 | Sin datos personales; compra simulada; `noindex` si es demo | Código |
| BM-06 | Panel del administrador: revisar solicitudes de destacado y paquete | P1 | BM-03 | Aprobar o rechazar con prueba de rol | Código |
| BM-07 | Actualizar PRD §4, SYSTEM.md, DATA.md, DEMO_PAYMENT.md | P1 | BM-01 | Documentos corregidos | Doc |

### Área CI · Check-in y post-evento

| ID | Qué hacer | Pri. | Depende de | Criterio de terminado | Tipo |
|---|---|---|---|---|---|
| CI-01 | Página de check-in del organizador: escanear o escribir el código del boleto y marcar `checked_in_at` una sola vez | P1 | DP-14 | Un boleto no se marca dos veces; el organizador solo ve sus eventos; sin datos personales en pantalla | Código |
| CI-02 | Reporte post-evento para el organizador: boletos emitidos, check-ins, no-show (%) | P1 | CI-01 | Solo agregados; RLS del organizador; prueba | Código |
| CI-03 | Encuesta post-evento simulada (formulario sin envío real) | P2 | CI-02 | Respuestas guardadas por evento; sin datos personales obligatorios | Código |

### Área WF · Wireframes

| ID | Qué hacer | Pri. | Depende de | Criterio de terminado | Tipo |
|---|---|---|---|---|---|
| WF-01 | Wireframes de baja fidelidad de las cinco pantallas (Home, Categoría, Evento, Carrito y pago, Confirmación), móvil y escritorio | P0 | DP-18 | Cinco archivos en `docs/design/wireframes/`; anotaciones de SEO y UX | Código/Doc |
| WF-02 | Flujo móvil completo de 4 clics con estados: vacío, agotado, error, pago rechazado, gratis | P0 | WF-01 | Un solo archivo navegable o secuencia numerada | Doc |
| WF-03 | Wireframes de pantallas nuevas: login y perfil de comprador, «Mis boletos», panel del organizador (publicar, destacar, check-in), administración (aprobación, destacados, contenido) | P1 | CP-01, BM-01, CI-01 | Un wireframe por pantalla nueva | Doc |
| WF-04 | Capturas «Del wireframe al sitio» (cinco pantallas, diapositiva 13) | P1 | CO-09, DI-05 | Cinco capturas con fecha; comparación lado a lado | Doc |
| WF-05 | Documentar cada pantalla: buyer persona, keyword SEO, competencia, hallazgo de usabilidad | P1 | UX-03, WF-01 | `docs/design/WIREFRAMES.md` con una sección por pantalla | Doc |

### Área SEO · SEO técnico

| ID | Qué hacer | Pri. | Depende de | Criterio de terminado | Tipo |
|---|---|---|---|---|---|
| SEO-01 | Decidir indexación y dominio final | P0 | DP-05, DP-06 | Decisiones registradas | Equipo |
| SEO-02 | Configuración real (`NEXT_PUBLIC_IS_DEMO=false`): `robots.txt` con reglas y enlace al sitemap; verificar que solo se indexa lo publicable | P0 | SEO-01 | Prueba con la variable en false; `robots.txt` y `sitemap.xml` revisados | Código |
| SEO-03 | Sitemap completo: home, 12 categorías, subcategorías con eventos, fichas publicadas, organizadores, blog | P0 | SEO-02, CT-04, CT-06 | Sitemap sin rutas vacías ni de modalidad sin eventos; prueba unitaria | Código |
| SEO-04 | Datos estructurados: `Event` (fecha, precio USD, disponibilidad, modalidad, lugar, organizador), `BreadcrumbList` en todas las páginas con migas, `WebSite` con búsqueda si `/buscar` la usa | P0 | SEO-02 | Validación con la herramienta de datos estructurados; solo datos almacenados | Código |
| SEO-05 | Metadatos por plantilla: title y meta con la keyword del Excel; H1; canonical; Open Graph; límites de longitud | P0 | — | Prueba unitaria de plantillas; revisión de títulos | Código |
| SEO-06 | Textos por categoría: 150–250 palabras con variantes de la keyword, sin cifras inventadas (vía CT-02) | P1 | CT-02, CT-03 | Textos publicados por categoría | Código/Doc |
| SEO-07 | Enlazado interno: categorías en el pie, tema y ciudad desde cada ficha, enlaces desde artículos a categorías | P1 | CT-04 | Auditoría de enlaces sin huérfanas | Código |
| SEO-08 | Rendimiento móvil: LCP, imágenes con `sizes`, fuentes con `next/font`; presupuesto y medición | P1 | DI-05 | Lighthouse o equivalente en 375 px registrado | Código |
| SEO-09 | Auditoría SEO completa con el skill de SEO y registro de hallazgos | P1 | SEO-02 a SEO-08 | Informe en `docs/analisis/` con hallazgos cerrados o justificados | Doc |
| SEO-10 | Verificación de URLs: trailing slash, 404 con `noindex`, redirecciones, canonical en filtros | P1 | — | Pruebas E2E de rutas | Código |
| SEO-11 | Registro en Search Console y envío del sitemap (cuenta del responsable) | P2 | SEO-02, DM-01 | Captura con fecha | Equipo |

### Área CT · Contenido y administración editorial

| ID | Qué hacer | Pri. | Depende de | Criterio de terminado | Tipo |
|---|---|---|---|---|---|
| CT-01 | Decidir blog: autor, número de artículos, temas, fechas | P0 | DP-13 | Decisión registrada; calendario con fechas antes de sep | Equipo |
| CT-02 | Tablas `editorial_pages` (intro y preguntas frecuentes por categoría o tema) y `blog_posts` (slug, título, meta, cuerpo, estado, fecha, keyword); RLS: público lee publicados | P1 | — | Migración y pruebas en `tests/db`; solo publicados se leen con anon | Código |
| CT-03 | Editor del administrador en `/admin/contenido/`: crear, editar, previsualizar y publicar artículos y textos de categoría; validación en servidor y markdown seguro | P1 | CT-02 | Sin HTML arbitrario; solo administrador; pruebas de rol y de validación | Código |
| CT-04 | Blog público: `/blog/` y `/blog/[slug]/`, con migas, `Article` en datos estructurados y enlaces a categorías | P1 | CT-02 | Solo artículos publicados; sitemap incluye los publicados | Código |
| CT-05 | Redactar 4–6 artículos informativos a partir del keyword research (calendario antes de sep–oct) | P1 | CT-01, CT-04 | Artículos publicados; sin cifras inventadas; revisión del equipo | Equipo |
| CT-06 | Páginas de organizador: `/organizadores/[slug]/` con descripción, eventos publicados y `Organization` (solo con datos reales o marcados DEMO) | P1 | DP-11, TX-03 | Solo eventos publicados; `noindex` si no hay eventos | Código |
| CT-07 | Administrador edita perfil de organizador (nombre, descripción, enlace) desde CT-03 | P2 | CT-06 | Pruebas de rol | Código |
| CT-08 | Documentar la función de administración de contenido en DATA.md y SYSTEM.md | P1 | CT-03 | Documentos corregidos | Doc |

### Área TX · Taxonomía y datos

| ID | Qué hacer | Pri. | Depende de | Criterio de terminado | Tipo |
|---|---|---|---|---|---|
| TX-01 | Verificar 12 categorías, 4 temas y 3 ubicaciones contra la diapositiva 16 | P0 | — | **HECHO**: coincide con `seed.sql` y `SEO_ROUTES.md` | Doc |
| TX-02 | Conciliar 134 vs 129 y 36 vs 33 subtemas: corregir el Excel o documentar la diferencia | P1 | — | Tabla de conciliación en SEO_ROUTES.md | Doc |
| TX-03 | Sembrar organizadores DEMO de las páginas de organizador (`/copa/`, `/claude/` según DP-11) | P1 | DP-11 | Organizadores en seed; sin afirmar afiliación | Código |
| TX-04 | Revisar cobertura de eventos DEMO por categoría y por pico de sep–oct; ferias tecnológicas sin eventos sigue `noindex` | P1 | — | Tabla de cobertura en DOC | Doc |

### Área MK · Marketing y métricas

| ID | Qué hacer | Pri. | Depende de | Criterio de terminado | Tipo |
|---|---|---|---|---|---|
| MK-01 | Decidir analítica y lista de eventos a medir (visitas, registros, compras, paquetes) | P1 | DP-04 | Decisión y texto de privacidad | Equipo |
| MK-02 | Instrumentar conversiones sin datos personales (si se aprueba MK-01) | P2 | MK-01, CO-09 | Eventos documentados; consentimiento antes de medir | Código |
| MK-03 | Documento de marketing: buyer personas con canales (porcentajes marcados como estimados), objetivos SMART, inversión de $2,800 por canal, captación orgánica en cuatro frentes, calendario de redes | P1 | UX-05, CT-01 | `docs/analisis/MARKETING.md`; cada cifra con fuente o marcada como supuesto | Doc |
| MK-04 | Rehacer la proyección (diapositiva 28) con supuestos explícitos, definiciones de DP-15 y coherencia de cifras | P1 | DP-15 | Excel del equipo actualizado; cifras del PDF corregidas | Equipo |
| MK-05 | Campañas pagadas: no se ejecutan sin presupuesto real; se documenta el plan | P2 | MK-03 | Plan documentado; sin gasto | Doc |

### Área UX · Investigación y testeo

| ID | Qué hacer | Pri. | Depende de | Criterio de terminado | Tipo |
|---|---|---|---|---|---|
| UX-01 | Entrevistas a 5 personas (3 universitarios o juniors, 2–3 de RR. HH. o líderes de comunidad): guía, consentimiento y anonimización | P0 | — | 5 entrevistas realizadas; 3–5 hallazgos con cita textual y perfil anonimizado | Equipo |
| UX-02 | Benchmark de 7 plataformas (Eventbrite, Luma, Meetup, Fever, Boletia, Passline, Tuboleta) con capturas y URL con fecha | P0 | — | Tabla con capturas y fecha de cada una | Equipo |
| UX-03 | Test de usabilidad: 5 usuarios × 3 tareas (comprar workshop de IA; evento gratis en San Salvador; encontrar entrada comprada) con éxito, tiempo y errores | P1 | CO-09, CP-03, WF-01 | Resultados reales anonimizados; cambios aplicados o justificados | Equipo |
| UX-04 | Árbol de categorías y flujo de navegación documentados (diapositivas 16 y 17) | P1 | TX-01 | Diagrama en `docs/design/` | Doc |
| UX-05 | Completar las cuatro buyer personas (Diego, Andrea, Gabriela, Carlos) con canales, frenos y necesidades, marcando los porcentajes como por validar | P1 | UX-01 | Una ficha por persona; sin cifras sin fuente | Doc |

### Área DM · Dominio, hosting y costos

| ID | Qué hacer | Pri. | Depende de | Criterio de terminado | Tipo |
|---|---|---|---|---|---|
| DM-01 | Confirmar el dominio final y actualizar Vercel y DNS (dominio ya existente, no comprar uno nuevo) | P0 | DP-06 | Dominio final en la presentación y en README | Equipo |
| DM-02 | Cotizar y completar la tabla de precios: dominio por año, hosting por mes, plan de Supabase y de Vercel | P1 | DP-17 | Tabla con fuente y fecha de cada precio; sin precios inventados | Equipo |
| DM-03 | Verificar el plan de hosting que pide el PDF («Vercel básico») frente al plan usado | P1 | DM-02 | Nota en DOC | Equipo |
| DM-04 | Redactar en la presentación que el cobro es simulado (DP-10) | P0 | DP-10 | Frase en la diapositiva de plataforma | Doc |

### Área DOC · Documentación

| ID | Qué hacer | Pri. | Depende de | Criterio de terminado | Tipo |
|---|---|---|---|---|---|
| DOC-01 | Actualizar README (estado real), `docs/README.md` (índice completo) y la fecha de corte de cada documento | P0 | — | Índice con todos los documentos; README sin afirmaciones falsas | Doc |
| DOC-02 | Actualizar ACCEPTANCE.md (casillas reales) y el backlog (estado de T10, T17, T18) | P0 | — | Casillas coinciden con la evidencia registrada | Doc |
| DOC-03 | Actualizar PRD (§4, §7, §3 con personas) según las decisiones | P0 | DP-01, DP-02, DP-03 | PRD sin exclusiones contradictorias | Doc |
| DOC-04 | Actualizar DATA.md (perfiles, destacados, paquetes, outbox, check-in, blog, contenido) y SEO_ROUTES.md (blog, organizadores, empresas) | P1 | DP-01 a DP-14 | Tablas y rutas listadas | Doc |
| DOC-05 | Actualizar la presentación: portada, cifras corregidas (sección 5.1), capturas, precios de DM-02 | P-A | MK-04, DM-02, WF-04 | PDF sin pendientes «FALTA» | Equipo |
| DOC-06 | Registrar las decisiones DP-01 a DP-20 en `docs/DECISIONS.md` con su resultado | P0 | decisiones del equipo | Filas D-37 en adelante | Doc |
| DOC-07 | Plan de implementación por área (superpowers writing-plans), uno por bloque, después de aprobar las decisiones | P0 | DP bloqueantes | Un plan por bloque con criterios | Doc |
| DOC-08 | Lista de rutas nuevas y su estado (indexable o no) | P1 | DOC-04 | Tabla en SEO_ROUTES.md | Doc |

### Tareas añadidas tras el inventario de código

| ID | Qué hacer | Pri. | Depende de | Criterio de terminado | Tipo |
|---|---|---|---|---|---|
| DI-07 | Decidir el sistema de iconos: usar `lucide-react` (ya instalada, sin uso) o retirarla; si se usa, reemplazar los SVG escritos a mano en los cinco componentes | P0 | DP-08 | Un solo sistema de iconos en el código; sin dependencias sin uso | Código |
| TX-05 | Corregir la palabra clave del seed con carácter roto («registro programaci…») y revisar la codificación de los textos del seed | P0 | — | El seed se reproduce sin caracteres rotos; prueba que lo verifica | Código |
| TX-06 | Incluir los temas en la búsqueda, o quitar la palabra «temas» del texto de ayuda | P2 | — | Prueba unitaria de `search.ts` | Código |
| TX-07 | Decidir el tratamiento de los 14 temas de la base frente a los 4 de la presentación | P1 | DP-21 | Decisión registrada; rutas y filtros ajustados | Equipo |
| SEO-12 | Corregir `robots.ts`: quitar `/mis-boletos/` y `/publicar/` y listar solo rutas privadas reales | P0 | SEO-02 | Prueba unitaria de `robots` | Código |
| SEO-13 | Open Graph y título en home y catálogo (hoy solo en fichas) | P1 | SEO-05 | Metadatos verificados por ruta | Código |
| SEO-14 | `BreadcrumbList` y `WebSite` en datos estructurados; `Organization` solo con datos reales | P1 | SEO-04 | Validación de datos estructurados | Código |
| CP-08 | Registro de comprador y recuperación de contraseña (hoy no existen) | P1 | CP-02 | Registro y recuperación probados; sin cambios en la compra de invitado | Código |
| CP-09 | Decidir y construir el alta de organizadores (hoy `owner_user_id` se asigna a mano en base) | P0 | DP-01 | Un organizador se vincula sin tocar la base; prueba de rol | Equipo/Código |
| CO-11 | Deduplicar la creación de órdenes con una clave de idempotencia en el checkout | P1 | CO-03 | Un reintento devuelve la misma orden; prueba de servidor | Código |
| CO-12 | Estado `cancelled` sin escritor: usarlo (cancelar orden pendiente) o retirarlo del esquema | P2 | — | Decisión registrada y esquema o flujo alineados | Doc/Código |

### Tareas ya existentes que este análisis retoma

| ID | Estado en backlog | Acción en este análisis |
|---|---|---|
| T10 | En curso (concurrencia real pendiente) | Sin cambio de alcance; prueba con dos conexiones cuando haya Postgres local o Supabase local |
| T14 y T15 | Terminado | Se extienden con CP (cuentas de comprador) y BM (destacados pagados) |
| T16 | Terminado | Se extiende con CT-03 (editor) y BM-06 (solicitudes de destacado) |
| T19 | Pendiente | Se divide en UX-01, UX-02 y UX-03 |
| T20 | Pendiente | Se divide en WF-01 a WF-05 |
| T21 | Pendiente | Se divide en SEO-09, MK-03, MK-04 |
| T22 | Pendiente | Se divide en DOC-05 y WF-04 |

---

## 9. Orden sugerido (sin fechas)

El orden respeta dependencias. Las tareas de equipo corren en paralelo al código.

1. **Decisiones bloqueantes:** DP-01, DP-02, DP-03, DP-05, DP-06, DP-07, DP-09. Mientras tanto, DOC-01, DOC-02, TX-01 (hecho), TX-02, TX-05, SEO-12 (correcciones sin decisión), UX-01, UX-02, DM-02.
2. **Base de diseño y wireframes:** DI-01, DI-02, WF-01, WF-02 (con DP-08 y DP-18).
3. **Compra refinada (núcleo):** CO-01 a CO-03, CO-05, CO-06, luego CO-04 y CO-08 con DP-12.
4. **Cuentas de comprador:** CP-02, CP-03, CP-04, CP-07. Luego WF-03 para las pantallas nuevas.
5. **Ingresos:** BM-02 a BM-04 (destacado pagado), luego BM-05 (paquete) y BM-06.
6. **Contenido y SEO:** CT-02, CT-03, CT-04, CT-06, TX-03, SEO-02 a SEO-05, SEO-03 al final de las páginas nuevas.
7. **Post-evento:** CI-01, CI-02.
8. **Cierre:** CO-09, DI-05, SEO-08, SEO-09, WF-04, WF-05, UX-03, MK-03, MK-04, DOC-05, DOC-06, DOC-07.

---

## 10. Bitácora

Registro cronológico de este análisis y de decisiones. Cada entrada incluye lo hecho, la evidencia y lo que queda abierto.

| Fecha | Acción | Evidencia | Abierto |
|---|---|---|---|
| 2026-11-09 | Se pasó a `master` y se actualizó con `origin/master` (fast-forward de 12 commits, a `a791f38`) | `git log --oneline -1` en `master` | — |
| 2026-11-09 | Se leyó el PDF «en proceso Ticketera C3 - proyecto», 28 diapositivas; texto extraído con `pdftotext` | Secciones 3, 4 y 5 de este documento | Diapositivas con imágenes y gráficos (diapositivas 4, 10, 20, 26–28) se revisaron por su texto y sus cifras, no por su diseño |
| 2026-11-09 | Se revisaron los documentos base: README, AGENTS, PRODUCT, PRD, SYSTEM, DATA, SEO_ROUTES, DESIGN, DEMO_PAYMENT, ACCEPTANCE, DECISIONS, backlog, planes 2026-11-02 a 06 | Sección 5.2 | Documentos de especificación de 2026-11-02 (`specs/`) no revisados a fondo |
| 2026-11-09 | Revisión del código con un agente de solo lectura: rutas, auth, catálogo, compra, boletos, organizador, admin, SEO, diseño, correo, analítica | Sección 2 y 5.3 | Inventario integrado en las secciones 2, 5.3 y 8. Lectura estática del código; no se ejecutaron pruebas ni build |
| 2026-11-09 | Se crearon `docs/analisis/` y este documento en la rama `docs/analisis-brechas-2026-11` | Archivo nuevo | Sin commit (pendiente de confirmar) |
| 2026-11-09 | Requerimientos nuevos (R-01 a R-11) registrados a partir del mensaje del responsable | Sección 3 | Aprobación de R-01 a R-11 |
| 2026-11-09 | Se incorporó el inventario de código: 11 tablas con RLS; sin registro de comprador ni de organizador; `lucide-react` sin uso; `robots` con rutas inexistentes; seed con carácter roto; 14 temas en base frente a 4 en la presentación; creación de órdenes sin deduplicar | Secciones 2, 5.3 y 8 (tareas añadidas) | Verificar en código antes de tomar decisiones de implementación |
| — | Decisiones DP-01 a DP-21 | Sección 7 | Respuestas pendientes del responsable y del equipo |
