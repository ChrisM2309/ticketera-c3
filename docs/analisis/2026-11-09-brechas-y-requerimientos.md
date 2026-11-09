# Brechas, requerimientos nuevos y tareas — Ticketera C3

**Fecha:** 2026-11-09
**Base:** `master` en `a791f38` (incluye la PR #29, bloque C de imágenes).
**Estado de este documento:** análisis con decisiones tomadas el 2026-11-09 (sección 7). Sigue sin código ni migraciones. El plan de implementación se escribe por área a partir de esta versión.
**Fuentes:**
1. `en proceso Ticketera C3 - proyecto.pdf` (28 diapositivas, "Lo que falta y dónde va" + las cinco secciones de la presentación). Es la referencia de lo que debe estar construido.
2. Documentos base del repositorio: `README.md`, `AGENTS.md`, `PRODUCT.md`, `docs/**`.
3. Código actual (`src/`, `supabase/`, `tests/`, `scripts/`, `public/`), revisado en `master`.

---

## 0. Cómo leer este documento

- **Estados:** `HECHO` · `PARCIAL` · `FALTA` · `DECIDIR` (depende de una decisión del equipo o del responsable). En la sección 8, `HECHO (decisión)` significa que la decisión está tomada, pero la tarea de código sigue pendiente.
- **Identificadores:**
  - `R-xx` requerimientos nuevos (mensaje del 2026-11-09).
  - `DP-xx` decisiones (todas resueltas en la sección 7; quedan algunos montos y datos pendientes, marcados ahí).
  - `T-xx` tareas del backlog de T01–T23 ya existente (no se renumera).
  - Las tareas nuevas usan prefijos por área: `DI` diseño e iconos, `CP` cuentas y perfiles, `CO` compra, `BM` ingresos (destacados y paquetes), `CI` check-in y post-evento, `WF` wireframes, `SEO`, `CT` contenido y administración editorial, `TX` taxonomía y datos, `MK` marketing y métricas, `LG` privacidad y consentimiento, `IM` imágenes, `UX` investigación y testeo, `DM` dominio, hosting y costos, `DOC` documentación.
- **Prioridad:** `P0` necesario para la demostración y la entrega; `P1` esperado por la presentación o el PDF; `P2` opcional; `P-A` entrega académica.
- **Regla de honestidad:** ningún dato de entrevistas, testeos, métricas, precios de dominio o cifras de proyección se inventa. Lo que no existe se marca como `FALTA` o como supuesto.

---

## 1. Contexto y objetivos

### 1.1 Qué es

Ticketera C3 es un marketplace académico para descubrir, comprar y publicar eventos tecnológicos en El Salvador. Tiene dos lados:

- **Asistentes (B2C):** descubren, filtran, compran (gratis o con pago simulado) y reciben un boleto con QR.
- **Organizadores (B2B):** publican eventos, pagan para destacarlos o contratan un paquete para empresas, y consultan resultados.

El sitio es **DEMO**: los pagos son simulados y el sitio no es un servicio oficial de C3.

### 1.2 Objetivos de esta fase

| # | Objetivo | Medida de éxito |
|---|---|---|
| O-1 | Cerrar la brecha entre lo que dice el PDF y lo que existe | Matriz de la sección 4 completa, sin filas sin estado |
| O-2 | Definir los requerimientos nuevos (cuentas, destacados, paquetes, iconos, wireframes, SEO, contenido) | Sección 3 con R-01 a R-11 aprobados |
| O-3 | Tener una lista de tareas ordenada por dependencias, con criterios de terminado | Sección 8 con tareas, prioridad y dependencia |
| O-4 | Dejar resueltas las decisiones que bloquean el plan | Sección 7 con DP-01 a DP-21 resueltas |
| O-5 | Actualizar los documentos base para que describan el estado real | Lista DOC de la sección 8 |

### 1.3 Fuera de alcance de este documento

- Implementar cualquier tarea de la sección 8.
- Ejecutar el plan de Superpowers. Eso ocurre después de esta versión, por área.
- Cobros reales, pasarelas externas y envío real de correo. Todo se simula (DP-10 y DP-12); si cambia, se implementa entonces.

---

## 2. Situación actual y situación deseada por área

Resumen. El detalle de cada punto está en las secciones 4 y 5.

| Área | Situación actual (repositorio) | Situación deseada (PDF y requerimientos) | Brecha |
|---|---|---|---|
| Modelo de negocio | Publicación gratis + comisión demo 5 % (supuesto). Destacado solo por administrador, sin cobro (D-35). Sin paquetes empresas | Publicación gratis, comisión por boleto, **destacado pagado por día**, **paquete empresas anual con beneficios** | `FALTA` cobro de destacado y paquete (R-04) |
| Compradores | Compra invitada (D-10). Sin cuenta ni perfil. «Mis boletos» salió del menú (T17) | Cuenta opcional con perfil (universidad), «Mis boletos», check-in con QR, «encontrar la entrada ya comprada» (prueba de usabilidad, tarea 3) | `FALTA` cuentas de comprador y perfiles (R-05) |
| Organizadores | Login, publicación con revisión, panel con conteo de boletos (T14–T16) | Perfil público de organizador (Copa Salvadoreña), reporte post-evento, paquete empresas | `PARCIAL` (sin reporte, sin página pública, sin paquete; el panel no edita ni borra; el vínculo organizador–usuario se asigna a mano en base) |
| Administrador | Aprueba y rechaza eventos, lista órdenes, marca destacados (D-35) | Panel de destacados (pagados y manuales), escribir contenido: blog, textos de categoría, páginas de organizador (R-10) | `FALTA` panel de destacados unificado y editor de contenido |
| Catálogo y taxonomía | 12 categorías, 4 temas con ruta, 3 ubicaciones, 128 rutas en `seo_routes`, filtros, resolvedor | 134 URLs en 4 niveles, 2 páginas de organizador | `PARCIAL` (organizadores no sembrados; 14 temas en base pero 4 con ruta propia; 36 vs 33 subtemas; búsqueda no incluye temas; ver sección 5) |
| Ficha del evento | Agenda en texto libre, organizador, precio, cupo por tipo, estado agotado, relacionados, JSON-LD Event fuera de demo; sin ponentes ni calendario ni compartir | Agenda y ponentes visibles, caja de compra sin scroll en móvil, agregar al calendario, compartir | `PARCIAL` (ponentes, calendario y compartir faltan) |
| Compra | Carrito de un evento, checkout de invitado, pago demo aprobado/rechazado/gratis, E2E real (T08–T13) | Flujo de 4 clics; total claro sin cargos sorpresa; flujo de pago simulado más completo | `PARCIAL` (refinar, ver R-06) |
| Boleto y post-compra | Confirmación por enlace, QR por boleto, descarga e impresión (T12) | Boleto por correo y WhatsApp (simulado), agregar al calendario, compartir, recordatorio 24 h, encuesta post-evento | `FALTA` envío simulado, calendario, compartir, recordatorio; `PARCIAL` check-in (columna `checked_in_at` sin escritor); `FALTA` recuperar boleto sin cuenta |
| Iconos y diseño | Tokens C3, Montserrat/Poppins. Iconos SVG escritos a mano en cinco componentes; `lucide-react` está en `package.json` sin ningún import en `src/`. Reglas Impeccable en DESIGN.md (la herramienta no está instalada) | Iconos de color que distingan secciones (home, barras, categorías) con `lucide-react`; Impeccable instalado | `FALTA` sistema de iconos (R-01); Impeccable por instalar |
| Wireframes | Solo mencionados en el PDF; el repositorio no tiene wireframes (T20 pendiente) | Wireframes de las cinco pantallas, flujo móvil y comparación con el sitio | `FALTA` (R-07) |
| SEO técnico | Metadatos por ruta, sitemap y robots que bloquean todo en demo, `noindex` en vacíos, canonical, trailing slash | Todo listo para indexar; activación con un botón cuando se pida en Search Console; datos estructurados Event, sitemap, velocidad móvil, enlazado interno | `PARCIAL` (falta el interruptor de activación, SEO-15); sitemap sin URLs de eventos; `robots` lista rutas que no existen; JSON-LD solo Event; Open Graph solo en fichas |
| SEO de contenido | Sin blog. Sin textos de categoría verificados. Sin páginas de organizador | Artículos escritos por administradores (eventos, cultura, fechas mixtas), textos por categoría, páginas de organizador | `FALTA` (R-08, R-10, R-11) |
| Marketing y métricas | Sin analítica (excluida en PRD). Canales, presupuesto y proyección solo en el PDF | Analítica necesaria con texto de privacidad; canales por persona, objetivos SMART, $2,800 en 4 canales, captación orgánica, proyección | `FALTA` analítica, privacidad y documento de marketing |
| Imágenes | Stock con créditos (9 fotos) e ilustraciones de stock | Mantener stock con créditos e imágenes propias; buscar más y hacer varias | `PARCIAL` |
| Investigación UX | Sin entrevistas, sin benchmark documentado, sin test de usabilidad (T19 pendiente) | 5 entrevistas con citas, 7 competidores documentados, test de 5 usuarios × 3 tareas | `FALTA` (contenido de equipo, no de código) |
| Dominio y hosting | Producción en `demo.ticketera.c3.com.sv` (T18). Dominio final decidido: `ticketera.c3.com.sv` | Dominio definido, precios de dominio y hosting, costo de plataforma | `FALTA` precios (pendientes de DP-17); dominio final pendiente de activar |
| Entregables académicos | PDF de 28 diapositivas con cifras y pendientes; backlog T19–T22 pendiente | PDF sin pendientes, capturas al final, video de respaldo, cifras consistentes en el documento | `PARCIAL` |

---

## 3. Requerimientos nuevos (mensaje del 2026-11-09)

Cada requerimiento se traduce a una o varias tareas de la sección 8. Las decisiones de la sección 7 ya resuelven los puntos abiertos.

### R-01 · Iconos en todas las partes, con color

**Pedido:** agregar iconos en distintas partes (home, barras, etc.) y usar color para distinguir secciones. Conseguir una librería.

**Situación:** `lucide-react` está en `package.json` pero no se importa en ningún archivo de `src/`. Los iconos actuales son SVG escritos a mano en cinco componentes (buscar, carrito, navegación de categorías, controles del carrusel, selector de entradas). No hay un sistema de iconos definido. Las reglas de DESIGN.md dicen «los iconos son SVG de trazo, `aria-hidden` cuando decoran» (regla 10).

**Decisión (DP-08):** usar `lucide-react` y agregarlo en cada componente donde haga falta.

**Propuesta:**
- Un icono por cada tipo de evento (12), por tema (4), por ubicación (3), y por acción (carrito, cuenta, buscar, publicar, calendario, compartir, QR, precio, fecha, modalidad).
- Color por línea de C3 y por estado, con tokens (no colores literales). Siempre acompañado de texto (regla 7 de DESIGN.md).
- Tareas: DI-00 a DI-07.

**Límite:** D-33 fija que el color de línea clasifica y no decora (DP-07). Los iconos de color deben respetar esa regla.

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

**Lo que dice el repositorio:** PRD §4 «Simplificaciones B2B: sin cobro del organizador…». Contradice al PDF.

**Decisión (DP-02 y DP-03):** el destacado se cobra **por día**: el organizador elige los días y paga la tarifa diaria por cada uno. El paquete empresas incluye multieventos, seguimiento personalizado de la ticketera, destacados con descuento o gratis y reporte de datos superior, entre otros beneficios. Todo el cobro es **simulado** con el mismo `DemoPaymentProvider` (DEMO_PAYMENT.md). Tareas BM-01 a BM-09.

### R-05 · Perfiles de compradores, login y perfiles

**Pedido:** si se quieren perfiles para compradores, hay que hacer login y perfiles.

**Situación:** D-10 y PRD §7 excluyen «autenticación de comprador». T14 implementó Supabase Auth solo para organizador y administrador.

**Lo que dice el PDF:** diapositiva 7, «Asistentes calificados: perfil, universidad y check-in con QR». Diapositiva 18, tarea de usabilidad 3: «Encontrar la entrada ya comprada», que sin cuenta solo se resuelve con el enlace del correo.

**Decisión (DP-01):** cuenta **opcional**. La primera compra puede hacerse sin cuenta, pero se recomienda crearla. La cuenta agrega «Mis boletos», datos precargados y seguimiento. Tareas CP-01 a CP-09.

### R-06 · Flujo de compra: refinar y simular lo que falta

**Pedido:** el flujo de compra hay que refinarlo y luego agregar detalle. Hay features que por lo menos hay que simular.

**Lo que existe:** flujo de 4 pasos hasta la confirmación (Home → categoría → evento → carrito → checkout → confirmación), con E2E real (T13).

**Lo que pide el PDF (diapositiva 12):**
- Home: eventos y categorías en la primera pantalla.
- Categoría: H1 con la keyword, filtros de tema, fecha, precio y ciudad.
- Evento: agenda y ponentes visibles; caja de compra sin hacer scroll.
- Carrito y pago: sin crear cuenta; total claro, sin cargos sorpresa.
- Confirmación: boleto con QR **por correo y WhatsApp**; agregar al calendario y compartir.

**Decisión (DP-10 y DP-12):** todo se simula, pero con un flujo de pago **más completo**: resumen, método de pago simulado (sin datos de tarjeta), procesamiento, resultado (aprobado o rechazado), comprobante descargable e historial en «Mis boletos». El envío del boleto es simulado y, si cambia más adelante, se implementa entonces.

**Features simuladas (sin envío real):**
- Envío del boleto por correo y WhatsApp → tabla de salida (`outbox`) visible como «Te enviamos el boleto a…» (simulado).
- Recordatorio 24 h antes → mismo mecanismo, programado, sin job real.
- Check-in con QR en un panel del organizador (DP-14).
- Encuesta post-evento y reporte del organizador.

**Features reales (sin proveedor externo):**
- Agregar al calendario (archivo `.ics` generado en servidor con solo título, fecha y lugar).
- Compartir por WhatsApp (enlace `wa.me` con título y fecha, sin datos del comprador).

Tareas CO-01 a CO-13.

### R-07 · Wireframes completos

**Pedido:** agregar todo lo de wireframe.

**Situación:** no hay wireframes en el repositorio (T20 pendiente). El PDF pide cinco pantallas, flujo móvil y una comparación «del wireframe al sitio» con capturas (diapositiva 13), que se tomarán al final (DP-18).

**Propuesta:** wireframes de baja fidelidad en `docs/design/wireframes/` (SVG o HTML), uno por pantalla, en móvil y escritorio; más las pantallas nuevas de cuentas, panel y administración. Tareas WF-01 a WF-05.

### R-08 · Categorías y temas

**Pedido:** revisar que estén todas las categorías y temas que se mencionan.

**Resultado:** las 12 categorías, los 4 temas (Cloud, Inteligencia artificial, Programación, Python) y las 3 ubicaciones (San Salvador, San Miguel, Santa Ana) coinciden con la diapositiva 16 y con `seo_routes`. La base tiene 14 temas, pero solo 4 tienen ruta propia (DP-21). Solo la Copa Salvadoreña se siembra como organizador (DP-11). La diferencia 134 vs 129 queda en la sección 5. Tareas TX-01 a TX-07.

### R-09 · Revisar si el flujo existe y si se puede refinar

**Resultado:** el flujo **existe de punta a punta** en producción (compra gratis, aprobada y rechazada, T13 y T11). Se puede refinar en lo siguiente:
- Pasos y clics (4 pasos de la diapositiva 17).
- Visibilidad del total y la comisión antes del botón final (la comisión aparece en el carrito; revisar la ficha y el móvil).
- Estados de error y agotado en la ficha.
- Post-compra (boleto por correo simulado, calendario, compartir, historial).

Ver CO-01 a CO-03 y CO-13.

### R-10 · Estrategia de optimización: lo que pide el documento

**Pedido:** agregar cada cosa que dice la estrategia: datos estructurados, habilitar robots, mejorar sitemaps, escribir contenido, artículos de blog importantes, páginas de organizadores, función de administrador para escribir.

**Lo que dice el PDF (diapositivas 20–22 y 27):**
- On-page: title, meta y H1 con la keyword del Excel; URLs limpias; texto por categoría con variantes de la keyword.
- Técnico: datos estructurados Event con fecha y precio; sitemap; velocidad móvil; enlazado interno; modalidades con noindex si no hay eventos.
- Contenido: blog de 4–6 artículos para búsquedas informativas, calendario según los picos de sep–oct; páginas de organizador para la Copa Salvadoreña.
- Captación: una página por evento, tema y ciudad; blog; redes; comunidad y alianzas.

**Decisiones (DP-05, DP-13, DP-11):** todo queda listo para indexar y se activa con un botón cuando se pida en Search Console. Los administradores escriben el blog desde el editor, con temas de eventos, cultura y fechas mixtas que apoyen el SEO. Solo se crea la página de la Copa Salvadoreña.

**Situación:** el técnico está en buena parte hecho (T06, T07). Falta el interruptor de activación, el contenido, el editor de administración y las páginas de organizador.

Tareas SEO-01 a SEO-15, CT-01 a CT-08.

### R-11 · Mejorar el SEO

**Pedido:** mejorar mucho el SEO, seguir lo que indique el documento, darle forma y buenas prácticas.

**Propuesta:** auditoría con el skill de SEO disponible antes de editar (`searchfit-seo:seo-audit` y `technical-seo`) y luego las tareas SEO-01 a SEO-15. Cada cambio se verifica con el sitio real (`NEXT_PUBLIC_IS_DEMO=false`), no solo en demo. No se prometen posiciones ni tráfico.

---

## 4. Comparación PDF vs. repositorio (diapositiva por diapositiva)

Leyenda: `HECHO` · `PARCIAL` · `FALTA` · `DECIDIR`.

| Dia. | Lo que dice el PDF | Estado en el repositorio | Tarea o decisión |
|---|---|---|---|
| 1 | Portada con integrantes | No aplica al código. Falta la portada en el repositorio | DOC-05 |
| 2 | Lo que falta: dominio, buyer personas, sitio, investigación, testeos, precios | Pendientes de este documento | Secciones 5–8 |
| 3 | Estructura de la presentación (5 secciones) | No aplica al código | DOC-05 |
| 4 | Definición: nombre, qué es, modelo | `HECHO` en PRD y PRODUCT.md. Las cifras de alianzas (6+ universidades, 10+ empresas) no tienen respaldo en el repositorio | DOC-01 (no afirmar cifras sin evidencia) |
| 5 | Nace en Competitive Coding Club; Copa Salvadoreña, hackathons, ICPC | `HECHO` como contexto. Página de la Copa permitida (DP-11) | CT-06, TX-03 |
| 6 | Modelo B2C + B2B; comisión por boleto; publicación destacada a precio fijo; paquete empresas anual | Comisión demo (5 %, supuesto) `HECHO`. Destacado solo por admin sin cobro (D-35). Paquete empresas `FALTA` | BM-01 a BM-09, DP-02, DP-03 |
| 7 | Propuesta de valor: solo tech, publicar gratis, comisión solo por venta, perfil y check-in con QR, entrada accesible | Solo tech y publicar gratis `HECHO`. Perfil y check-in `FALTA`. Filtro de gratis y bajo costo `HECHO` | CP, CI |
| 8 | Dominio, hosting y plataforma (precios `$ __`); requisitos: URLs SEO, cobrar en línea en El Salvador, datos Event | Plataforma `HECHO` (Next.js + Supabase, Vercel). Precios `FALTA`. «Cobrar en línea» se resuelve como cobro simulado (DP-10) | DM-01 a DM-04 |
| 9 | Buyer personas: 2 compran (Diego, Andrea), 2 publican (Gabriela, Carlos) | Diego y Andrea en PRD y PRODUCT.md. Gabriela y Carlos solo en el PRD §2 sin ficha completa. Canales y porcentajes sin validar | UX-05 |
| 10 | Lineamientos: navy, azul, violeta, turquesa; Montserrat y Poppins; nodos circulares; fondos navy con brillo; fotos reales; botón de compra turquesa | Colores y fuentes `HECHO` (D-14, D-33). **Resuelto (DP-07):** se mantiene D-33 (violeta, sin gradientes); el PDF se corrige. Los nodos circulares no están | DP-07, DOC-05 |
| 11 | Estilo gráfico: nodos del logo, tarjetas claras, fotos reales, botón turquesa | Tarjetas claras `HECHO`. Nodos `FALTA`. Fotos: stock con créditos (`CREDITOS.md`) `PARCIAL` | DP-07, DI-03, IM-01 |
| 12 | Wireframes del flujo móvil: Home, Categoría, Evento, Carrito y pago, Confirmación | Pantallas construidas `HECHO` en su mayoría. Wireframes `FALTA`. Sin «Agregar al calendario», sin «Compartir», sin boleto por correo/WhatsApp `FALTA` | WF-01, WF-02, CO-05, CO-06, CO-04 |
| 13 | Del wireframe al sitio: capturas de 5 pantallas; link del sitio y plataforma | Sitio `HECHO` (demo.ticketera.c3.com.sv). Capturas `FALTA`, se toman al final (DP-18). Link final: `ticketera.c3.com.sv` (DP-06) | WF-04, IM-03, DM-01 |
| 14 | Estudio UX: investigación, árbol de categorías, flujo, testeos | Árbol y flujo `HECHO` en código y `seo_routes`. Documentación visual `FALTA` | WF-05, UX-04 |
| 15 | Desk research: Eventbrite, Luma, Meetup, Fever, Boletia, Passline, Tuboleta. Entrevistas a 5 personas | Desk research `FALTA` en el repositorio (solo una referencia en PRODUCT.md). Entrevistas `FALTA` | UX-01, UX-02 |
| 16 | Árbol: 12 tipos con volúmenes; 4 temas; 3 ubicaciones; organizadores (Copa, comunidades) | 12, 4 y 3 `HECHO` (verificado en `seed.sql`). Organizador Copa `FALTA` (se siembra con DP-11) | TX-01 a TX-03 |
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
| 28 | Proyección 2027: ventas por mes; 31,590 visitas; 872 conversiones (2.8 %); $11,769; ticket promedio $27; ROAS 1.8x | Documento `FALTA`. Cifras se mantienen (DP-15) con riesgos registrados (sección 5.1) | MK-04 |
| 29 | Cierre: «Compite. Crea. Conecta.» y ticketera.sv | `HECHO` como eslogan en el sitio. Dominio final `ticketera.c3.com.sv` (DP-06), activación pendiente | DM-01, SEO-15 |

---

## 5. Inconsistencias detectadas

### 5.1 Cifras del PDF

Las cifras se mantienen tal como están en el documento (DP-15). Las inconsistencias se registran como riesgo para la presentación; no se cambian.

| # | Dato | Problema | Acción |
|---|---|---|---|
| I-01 | 872 conversiones con ticket promedio $27 y ventas de $11,769 | $11,769 / 872 = $13.50, no $27. Con $27 se implican 436 compras, no 872 | DP-15: cifras se mantienen; riesgo registrado en MK-04 |
| I-02 | ROAS 1.8x (diapositiva 28) frente a 2.0x en junio (diapositiva 25) | Dos cifras distintas para el mismo indicador. La del 1.8x no coincide con $11,769 / $2,800 = 4.2x | DP-15: cifras se mantienen; riesgo registrado en MK-04 |
| I-03 | «Las ventas se duplican» con 1,332 → 2,779 | 2.09x en el periodo; coherente, pero el periodo y el mes de inicio no están rotulados en el gráfico | MK-04 |
| I-04 | 134 URLs (diapositivas 20–21) | El árbol tiene 1 + 19 + 33 + 76 = 129 en `seo_routes` (128 + Home). Sin organizadores (2). Temas nivel 2: 36 en el Excel, 33 en la base | TX-02 |
| I-05 | «Mis boletos» (menú) | Sale del menú desde T17; la tarea de usabilidad 3 la requiere | CP-03 |
| I-06 | Ventas por mes «2027» en el PDF | Sitio aún en demo; las cifras son proyección, no resultado. Debe rotularse | MK-04 |

### 5.2 Documentos del repositorio

| # | Documento | Problema | Acción |
|---|---|---|---|
| I-07 | `README.md` | Dice «Este paquete NO contiene una aplicación Next.js ya desarrollada» y «Estado: planificación lista»; ya no es cierto | DOC-01 |
| I-08 | `docs/README.md` (índice) | No lista `PRODUCT.md`, `design/SISTEMA-VISUAL-C3-2026-11.md`, los planes de 2026-11-04 a 06 ni `DECISIONS.md` completo | DOC-01 |
| I-09 | `docs/design/DESIGN.md` §Impeccable | «Falta `PRODUCT.md`»; el archivo existe en la raíz. La herramienta Impeccable no está instalada (T08) | DI-00, DI-01 |
| I-10 | `docs/testing/ACCEPTANCE.md` | Casillas sin marcar en criterios ya cumplidos (p. ej., logo lleva al Home, 12 tipos en orden). Solo T08 aparece como cumplido en el checklist | DOC-02 |
| I-11 | `docs/product/PRD.md` §7 | Excluye «autenticación de comprador», «envío masivo», «analítica avanzada» y reembolsos; contradice R-05, R-06 y DP-04 | DOC-03 |
| I-12 | `docs/product/PRD.md` §4 | «Sin cobro del organizador» contradice el destacado pagado y el paquete (R-04) | DOC-03 |
| I-13 | `docs/architecture/DATA.md` | Propone `checked_in_at` pero dice que el check-in «puede quedar fuera de v1»; la tabla `profiles` del modelo no coincide con lo implementado (roles en `profiles`, perfil de comprador ausente) | DOC-04 |
| I-14 | `docs/architecture/SEO_ROUTES.md` §2 | Organizadores `/claude/` y `/copa/` como páginas de primer nivel. Resuelto: solo `/copa/` (DP-11) | TX-03, DOC-04 |
| I-15 | `docs/DECISIONS.md` D-25 | `robots.txt` bloquea todo en demo. Resuelto: todo listo para indexar y activación con botón (DP-05) | SEO-02, SEO-15 |
| I-16 | `docs/design/DESIGN.md` regla 3 | El botón de compra es violeta (`accion`, D-33). El PDF pide turquesa (diapositiva 10). Resuelto: se mantiene violeta (DP-07) | DOC-05 |
| I-17 | `docs/design/DESIGN.md` reglas 4 y 10 | Sin gradientes ni órbitas (D-33). El PDF pide «fondos navy con brillo turquesa y violeta» y nodos circulares. Resuelto: se mantiene D-33 (DP-07) | DOC-05 |
| I-18 | `docs/testing/ACCEPTANCE.md` y backlog | Backlog marca T10 «En curso» y T17/T18 como terminados, pero ACCEPTANCE deja pendientes de T10 (concurrencia real) y de T17 (CSP, `owner_user_id` visible) | DOC-02 |
| I-19 | `docs/checkout/DEMO_PAYMENT.md` | Sigue siendo la política correcta. Resuelto: todo cobro simulado (DP-10); el PDF pide «cobrar en línea» | DM-04 |
| I-20 | `docs/product/PRD.md` §3 y `PRODUCT.md` | Las personas de PRD y PRODUCT.md no coinciden con las cuatro del PDF (faltan Gabriela y Carlos como personas completas) | UX-05 |
| I-21 | Dominio | El PDF menciona `ticketera.c3.com.sv`, `ticketera.sv` y el repositorio `demo.ticketera.c3.com.sv`. Resuelto: `ticketera.c3.com.sv` (DP-06); el sitio está en el subdominio de demo | DM-01 |

### 5.3 Diseño y código

| # | Elemento | Problema | Acción |
|---|---|---|---|
| I-22 | Iconos | No hay sistema de iconos definido ni por sección | DI-02 a DI-04, DI-07 |
| I-23 | Páginas de organizador | Sin rutas `/organizadores/…` | CT-06 |
| I-24 | Editor de administración | Sin edición de contenido (solo aprobación y destacados) | CT-03, BM-08 |
| I-25 | Blog | Sin rutas, tabla ni contenido | CT-02 a CT-05 |
| I-26 | Perfil de comprador | Sin tabla, sin login, sin pantalla «Mis boletos» | CP-02 a CP-04 |
| I-27 | Check-in | Sin pantalla. La columna `tickets.checked_in_at` existe, pero nada la escribe | CI-01 |
| I-28 | `src/app/robots.ts` y `src/lib/seo/indexing.ts` | La lista de rutas privadas incluye `/mis-boletos/` y `/publicar/`, que no tienen ruta | SEO-12 |
| I-29 | `supabase/seed.sql` | **Corregido en la Fase 0 (tarea 0.3; eran 19 apariciones, no una).** Una palabra clave tenía un carácter roto («registro programaci[U+FFFD]n») por codificación | TX-05 |
| I-30 | `package.json` | `lucide-react` instalado y sin uso; los iconos están escritos a mano | DI-07 |
| I-31 | `src/features/catalog/search.ts` | El buscador no busca por tema, aunque el texto de ayuda dice «temas» | TX-06 |
| I-32 | Esquema de órdenes | El estado `cancelled` existe y tiene etiqueta, pero nada lo escribe | CO-12 |
| I-33 | Creación de órdenes | Un doble clic en «Continuar» puede crear dos órdenes pendientes; la idempotencia solo existe en la confirmación | CO-11 |
| I-34 | Autenticación | Sin registro de comprador ni de organizador (las cuentas se crean con scripts), sin recuperación de contraseña. El inicio de sesión es solo para personal | CP-08, CP-09 |
| I-35 | Taxonomía | La base tiene 14 temas; solo 4 tienen ruta propia (los de la presentación). Resuelto: se mantienen 4 (DP-21) | TX-07 |
| I-36 | JSON-LD | Solo `Event`. Faltan `BreadcrumbList`, `WebSite` y `Organization` | SEO-14 |
| I-37 | Open Graph | Solo en fichas de evento; faltan en home y catálogo | SEO-13 |
| I-38 | Administración | Sin editor de contenido ni panel de destacados. Las categorías y `seo_routes` se escriben solo por base de datos, sin pantalla. El motivo de rechazo no existe | CT-03, BM-08 |

---

## 6. Necesidades y objetivos por persona

Las cuatro personas vienen del PDF (diapositiva 9). Sus porcentajes y frenos son **material del equipo a validar con entrevistas**; no se presentan como investigación concluida.

| Persona | Necesidad | Lo que la frena | Qué debe existir |
|---|---|---|---|
| Diego, universitario tech (19–22) | Entradas gratis o baratas; compartir la invitación | Ir solo; el precio | Filtro de gratis, compartir por WhatsApp, precio claro |
| Andrea, profesional junior (24–30) | Agenda detallada, precios claros | Agendas vagas | Agenda y ponentes visibles, total sin sorpresas, calendario |
| Gabriela, talento y employer branding (28–38) | Datos de asistentes, menos no-show, QR | No-shows | Check-in QR, reporte post-evento, paquete empresas |
| Carlos, líder de comunidad (25–35) | Publicar sin cuota fija | Cuotas fijas | Publicación gratis, comisión solo por venta, destacado opcional por día |

---

## 7. Decisiones (DP), tomadas el 2026-11-09

Las respuestas son del responsable del proyecto. La columna «Pendiente de confirmar» lista lo que aún falta para ejecutar la tarea (montos, datos o una interpretación a revisar).

| ID | Tema | Decisión (2026-11-09) | Implicación en el plan | Pendiente de confirmar |
|---|---|---|---|---|
| DP-01 | Cuentas de comprador | Cuenta opcional. La primera compra puede hacerse sin cuenta, pero es mejor crearla | La compra de invitado no cambia (CO-03). La cuenta da «Mis boletos», datos precargados y seguimiento. CP-02 a CP-04 siguen igual | — |
| DP-02 | Destacado pagado | Cobro por día. Se fija una tarifa diaria y el organizador selecciona los días | BM-02 guarda días, tarifa diaria y total en centavos. BM-03 usa un selector de días en el panel | Monto de la tarifa diaria |
| DP-03 | Paquete empresas | Sí. Incluye, entre otros: opciones multieventos, seguimiento personalizado de la ticketera, eventos destacados con descuento o gratis, reporte de datos superior | BM-05 con esa lista de beneficios; compra simulada; prioridad P1 | Precio anual y cantidades de cada beneficio |
| DP-04 | Analítica | Sí, es necesaria. Agregar el texto de privacidad | MK-01 y MK-02 aprobados. Nuevas LG-01 (texto de privacidad) y LG-02 (consentimiento antes de medir) | — |
| DP-05 | Indexación | Dejar todo listo para indexar. Solo falta pedirlo en Search Console; se activa con un botón dentro de unos días | SEO-02 deja todo armado. SEO-15 agrega el interruptor, apagado por defecto. El sitio demo sigue sin indexar hasta activarlo | Confirmar que el botón vive en el panel de administración (propuesta) |
| DP-06 | Dominio | `ticketera.c3.com.sv`. Por ahora el sitio vive en el subdominio de demo | DM-01 y SEO-11 usan ese dominio. Los canónicos y el sitemap se calculan con él al activar | — |
| DP-07 | Estilo de acción y fondos | Opción (a): mantener D-33 (violeta de acción, sin gradientes, fotos de stock) | DI-03 y WF-01 con violeta. El PDF se corrige en DOC-05 | — |
| DP-08 | Librería de iconos | `lucide-react`, y agregarla en cada componente donde haga falta | DI-02, DI-04 y DI-07 cubren todos los componentes; los SVG escritos a mano se migran | — |
| DP-09 | Guía de frontend | Agregar Impeccable e instalarlo para revisar el diseño. Usar la guía `frontend-design` | DI-00 (instalar Impeccable) y DI-01 (documentar la guía y la herramienta) | Instalación pendiente de ejecutar |
| DP-10 | Cobro en línea | Simular todo, con un flujo más completo, siempre simulado | CO-13 (flujo de pago simulado completo); CO-03 y BM-03 lo usan. DM-04 declara el cobro como simulado | — |
| DP-11 | Organizadores del Excel | Con la Copa Salvadoreña está bien; con terceros no | TX-03 y CT-06 solo con `/copa/`. `/claude/` queda fuera | — |
| DP-12 | Envío del boleto | Simulado. Puede cambiar más adelante; se implementa si hace falta | CO-04 con tabla de salida; sin proveedor de correo ni WhatsApp | — |
| DP-13 | Blog | Lo escriben los administradores del sitio desde el editor. Temas: eventos, cultura y fechas mixtas, que apoyen el SEO | CT-03 con campos SEO (título, meta, palabra clave). CT-05: contenido inicial escrito por administradores | Número de artículos: 4 como mínimo (PDF); no confirmado |
| DP-14 | Check-in | Opción (a): página de check-in del organizador con QR | CI-01 aprobado | — |
| DP-15 | Cifras de proyección | Se mantienen las cifras del documento | MK-04 documenta fuente y supuestos sin cambiar valores. I-01 e I-02 quedan registradas como riesgo para la presentación | — |
| DP-16 | Comisión demo | 5 % por ahora; el equipo lo cambiará o no más adelante | Sin cambios en DEMO_PAYMENT.md (supuesto de 5 %) | — |
| DP-17 | Costos de plataforma | «Pásamelo»: se espera que el responsable entregue los datos de costos | DM-02 queda pendiente de esos datos. No se inventan precios | Confirmar si se esperaba que yo buscara cotizaciones |
| DP-18 | Formato de wireframes y capturas | Las capturas y fotos finales se suben al final, cuando todo esté terminado | WF-04, IM-03 y DOC-05 se hacen al final | Formato de wireframes: no hubo respuesta explícita. Se usa la recomendación (SVG o HTML en el repo, PNG para el PDF) |
| DP-19 | Imágenes | Mantener stock con créditos e imágenes propias; seguir buscando más y hacer varias | IM-01 (buscar stock con licencia), IM-02 (ilustraciones propias, varias), IM-03 (fotos y capturas finales) | — |
| DP-20 | Destacados | Solo «destacado», con un lado administrativo que gestione los destacados pagados y los manuales. En cada categoría (p. ej., `/congresos/`) salen los destacados de esa categoría | BM-08 (panel único de destacados) y BM-09 (bloque por categoría). En la portada se elimina la distinción entre destacado «editorial» y «pagado» | — |
| DP-21 | Temas | Los 4 de la presentación con ruta propia; el resto como filtro o subtema | TX-07 aplicado: cloud, inteligencia artificial, programación y python con ruta propia | — |

---

## 8. Lista de tareas (orden por área y dependencias)

Cada tarea tiene: **ID**, **qué hacer**, **prioridad**, **depende de**, **criterio de terminado** y **tipo** (`Código`, `Doc`, `Equipo` = tarea del equipo, no del código).
Estado inicial de todas: `Pendiente`, salvo que se indique `HECHO` o `HECHO (decisión)`.

### Área DI · Diseño, iconos y guía de frontend

| ID | Qué hacer | Pri. | Depende de | Criterio de terminado | Tipo |
|---|---|---|---|---|---|
| DI-00 | Instalar Impeccable (herramienta de revisión de diseño) en el proyecto, sin cambiar el sitio | P0 | DP-09 | Herramienta instalada y ejecutable; comando documentado en DESIGN.md | Código |
| DI-01 | Documentar la guía `frontend-design` y el uso de Impeccable en DESIGN.md; corregir afirmaciones falsas (PRODUCT.md existe) | P0 | DP-09, DI-00 | DESIGN.md referencia ambas guías y no contiene afirmaciones falsas | Doc |
| DI-02 | Definir el mapa de iconos con `lucide-react`: tipo de evento, tema, ubicación, acción y estado | P0 | DP-08 | Tabla de iconos en DESIGN.md; ningún icono sin etiqueta accesible | Doc |
| DI-03 | Iconos de color por línea de C3 y por tipo de evento (12) en chips, tarjetas y menú | P1 | DI-02, DP-07 | Contraste AA; el texto acompaña al color; prueba de render | Código |
| DI-04 | Iconos en cada componente donde haga falta: cabecera, pie, menú móvil, filtros, tarjetas, fichas, checkout, panel y administración | P1 | DI-02 | Áreas táctiles de 44 px; `aria-hidden` en decorativos; prueba en 375 px | Código |
| DI-05 | Revisión visual: capturas antes y después a 390 y 1280 px; revisión con Impeccable | P1 | DI-00, DI-03, DI-04 | Capturas en la carpeta de evidencias; sin desbordamiento horizontal; Impeccable sin hallazgos | Código |
| DI-06 | Modo oscuro global y token `info` (pendientes de D-33) | P2 | DP-07 | Decisión registrada; pruebas de contraste | Código |
| DI-07 | Migrar los SVG escritos a mano a `lucide-react` en los cinco componentes y retirar los que queden sin uso | P0 | DI-02 | Un solo sistema de iconos en el código; sin SVG duplicados | Código |

### Área CP · Cuentas de comprador y perfiles

| ID | Qué hacer | Pri. | Depende de | Criterio de terminado | Tipo |
|---|---|---|---|---|---|
| CP-01 | Cuenta opcional (DP-01) | P0 | — | **HECHO (decisión)**; registrada en DECISIONS.md con DOC-06 | Equipo |
| CP-02 | Migración: `profiles` con rol `buyer`, nombre, universidad (opcional), consentimiento; `orders.buyer_user_id` (nullable) | P1 | CP-01 | Migración nueva en `supabase/migrations/`; pruebas RLS en `tests/db`; un usuario lee y edita solo su perfil | Código |
| CP-03 | Registro e inicio de sesión de comprador (Supabase Auth, mismo flujo de T14), página «Mis boletos» con historial de compras | P1 | CP-02 | Sin sesión redirige a `/ingresar/`; «Mis boletos» lista solo las órdenes propias con su QR y su historial | Código |
| CP-04 | Checkout con sesión: datos precargados; la orden queda ligada a la cuenta; la compra invitada sigue igual | P1 | CP-03, CO-03 | Pruebas de servidor: totales siguen calculándose en servidor; compra invitada sin cambios | Código |
| CP-05 | Perfil de comprador: universidad y preferencias de correo (consentimiento para newsletter, simulado) | P2 | CP-02, LG-02 | Opt-in registrado; sin envío real | Código |
| CP-06 | Actualizar PRD §7 y DATA.md con perfiles y `buyer_user_id` | P1 | CP-01 | Documentos corregidos | Doc |
| CP-07 | Pruebas: acceso a «Mis boletos» de otro usuario falla; anon no lee `profiles` | P1 | CP-02 | Pruebas en `tests/db` | Código |

### Área CO · Compra refinada

| ID | Qué hacer | Pri. | Depende de | Criterio de terminado | Tipo |
|---|---|---|---|---|---|
| CO-01 | Auditoría del flujo contra los wireframes: pasos, fricciones, total y comisión visibles | P0 | WF-01 | Lista de fricciones con capturas; decisión sobre cada una | Doc |
| CO-02 | Ficha: agenda y ponentes visibles arriba; caja de compra visible sin scroll en 375 px; «desde» con precio mínimo; estados agotado y finalizado | P0 | CO-01 | Prueba E2E en 375 px; el primer tipo de entrada se ve sin scroll | Código |
| CO-03 | Checkout en una pantalla en móvil: datos, resumen, comisión y botón con monto («Confirmar registro» / «Pagar $X» con «Pago de demostración») | P0 | CO-01 | Sin pasos extra; errores anunciados; prueba E2E | Código |
| CO-04 | Boleto por correo y WhatsApp simulado: tabla `outbox`; la confirmación muestra a dónde se envió (simulado) | P1 | DP-12, CO-03 | Filas en `outbox` por orden; etiqueta «Simulado»; sin envío externo | Código |
| CO-05 | «Agregar al calendario»: `.ics` generado en servidor con título, fechas y lugar | P1 | — | Archivo válido (prueba unitaria del formato); sin datos del comprador | Código |
| CO-06 | «Compartir por WhatsApp» con enlace `wa.me` (título y fecha; sin datos personales) | P1 | — | Prueba unitaria del enlace; sin enlace a órdenes | Código |
| CO-07 | Recordatorio 24 h antes: entrada programada en `outbox` (simulado) | P2 | CO-04 | Fila creada con fecha correcta; sin job real; etiqueta «Simulado» | Código |
| CO-08 | Estados de error: sin cupo al confirmar, evento cerrado, error del servidor; reintento claro | P1 | CO-03 | Pruebas de servidor y E2E | Código |
| CO-09 | Actualizar E2E: los tres escenarios (gratis, aprobado, rechazado) con el flujo refinado, en escritorio y 375 px | P1 | CO-02 a CO-08, CO-13 | `purchase-flow.spec.ts` y `purchase-flow-real.spec.ts` verdes | Código |
| CO-10 | Actualizar DEMO_PAYMENT.md y SYSTEM.md con el flujo final | P1 | CO-09 | Documentos corregidos | Doc |
| CO-13 | Flujo de pago simulado completo (DP-10): resumen de compra, método simulado sin datos de tarjeta, procesamiento, resultado (aprobado o rechazado), comprobante descargable e historial en «Mis boletos» | P1 | CO-03 | Todos los pasos marcados «Simulado»; sin campos de tarjeta; pruebas E2E de cada resultado | Código |

### Área BM · Ingresos: destacados por día y paquetes empresas

| ID | Qué hacer | Pri. | Depende de | Criterio de terminado | Tipo |
|---|---|---|---|---|---|
| BM-01 | Destacado por día y paquete con beneficios (DP-02, DP-03) | P0 | — | **HECHO (decisión)**. Pendiente: monto de la tarifa diaria y precio anual (datos del responsable) | Equipo |
| BM-02 | Tabla `featured_purchases` (evento, organizador, días seleccionados, tarifa diaria en centavos, total en centavos, fecha de inicio, estado `pending/approved/rejected`); RLS | P1 | BM-01 | Migración y pruebas en `tests/db`; total = días × tarifa | Código |
| BM-03 | Flujo del organizador: elegir días en un calendario → total por días → pago simulado (aprobado o rechazado, CO-13) → queda en revisión del administrador (BM-08) | P1 | BM-02, CO-13 | Rechazado no destaca; aprobado queda en cola; selección de días valida fechas futuras; pruebas | Código |
| BM-04 | Portada: destacados aprobados (pagados o manuales) con etiqueta «Destacado»; sin duplicar eventos en la portada | P1 | BM-08 | Un evento no aparece dos veces; etiqueta visible | Código |
| BM-05 | Paquete empresas anual (`/para-empresas/`) con multieventos, seguimiento personalizado de la ticketera, destacados con descuento o gratis y reporte de datos superior; compra simulada | P1 | BM-01, CO-13 | Sin datos personales de asistentes; compra simulada; `noindex` mientras sea demo | Código |
| BM-06 | Panel del organizador: historial de destacados y paquetes (estado, días, total simulado) | P1 | BM-03 | Solo los propios; prueba de rol | Código |
| BM-07 | Actualizar PRD §4, SYSTEM.md, DATA.md, DEMO_PAYMENT.md | P1 | BM-01 | Documentos corregidos | Doc |
| BM-08 | Panel administrativo de destacados: una sola lista de destacados pagados y manuales, con origen, días, vigencia y estado; aprobar, rechazar, ordenar; el administrador crea los manuales (DP-20) | P1 | BM-02 | Solo administrador; prueba de rol; un destacado manual y uno pagado se ven igual en la lista | Código |
| BM-09 | Bloque de destacados por categoría: cada `/congresos/`, `/competencias/`… y sus subtemas muestran los destacados de esa categoría; sin bloque si no hay destacados | P1 | BM-08 | Prueba de consulta por categoría; el sitemap no cambia | Código |

### Área CI · Check-in y post-evento

| ID | Qué hacer | Pri. | Depende de | Criterio de terminado | Tipo |
|---|---|---|---|---|---|
| CI-01 | Página de check-in del organizador: escanear o escribir el código del boleto y marcar `checked_in_at` una sola vez (DP-14, aprobado) | P1 | — | Un boleto no se marca dos veces; el organizador solo ve sus eventos; sin datos personales en pantalla | Código |
| CI-02 | Reporte post-evento para el organizador: boletos emitidos, check-ins, no-show (%) | P1 | CI-01 | Solo agregados; RLS del organizador; prueba | Código |
| CI-03 | Encuesta post-evento simulada (formulario sin envío real) | P2 | CI-02 | Respuestas guardadas por evento; sin datos personales obligatorios | Código |

### Área WF · Wireframes

| ID | Qué hacer | Pri. | Depende de | Criterio de terminado | Tipo |
|---|---|---|---|---|---|
| WF-01 | Wireframes de baja fidelidad de las cinco pantallas (Home, Categoría, Evento, Carrito y pago, Confirmación), móvil y escritorio | P0 | DP-18 | Cinco archivos en `docs/design/wireframes/`; anotaciones de SEO y UX | Código/Doc |
| WF-02 | Flujo móvil completo de 4 clics con estados: vacío, agotado, error, pago rechazado, gratis | P0 | WF-01 | Un solo archivo navegable o secuencia numerada | Doc |
| WF-03 | Wireframes de pantallas nuevas: login y perfil de comprador, «Mis boletos», panel del organizador (publicar, destacar por día, check-in), administración (destacados, aprobación, contenido) | P1 | CP-01, BM-08, CI-01 | Un wireframe por pantalla nueva | Doc |
| WF-04 | Capturas «Del wireframe al sitio» (cinco pantallas, diapositiva 13), al final (DP-18) | P-A | CO-09, DI-05 y todo lo visible | Cinco capturas con fecha; comparación lado a lado | Doc |
| WF-05 | Documentar cada pantalla: buyer persona, keyword SEO, competencia, hallazgo de usabilidad | P1 | UX-03, WF-01 | `docs/design/WIREFRAMES.md` con una sección por pantalla | Doc |

### Área SEO · SEO técnico

| ID | Qué hacer | Pri. | Depende de | Criterio de terminado | Tipo |
|---|---|---|---|---|---|
| SEO-01 | Indexación y dominio final (DP-05, DP-06) | P0 | — | **HECHO (decisión)**. Pendiente: confirmar el mecanismo del botón (SEO-15) | Equipo |
| SEO-02 | Configuración lista para indexar: `robots.txt` y `sitemap.xml` según el interruptor de SEO-15; `noindex` en lo que no se publica | P0 | SEO-01 | Probado con la variable en false y con el interruptor apagado y encendido; `robots.txt` y `sitemap.xml` revisados | Código |
| SEO-03 | Sitemap completo: home, 12 categorías, subcategorías con eventos, fichas publicadas, organizadores, blog | P0 | SEO-02, CT-04, CT-06 | Sitemap sin rutas vacías ni de modalidad sin eventos; prueba unitaria | Código |
| SEO-04 | Datos estructurados: `Event` (fecha, precio USD, disponibilidad, modalidad, lugar, organizador), `BreadcrumbList` en las páginas con migas, `WebSite` con búsqueda si `/buscar` la usa | P0 | SEO-02 | Validación con la herramienta de datos estructurados; solo datos almacenados | Código |
| SEO-05 | Metadatos por plantilla: title y meta con la keyword del Excel; H1; canonical; Open Graph; límites de longitud | P0 | — | Prueba unitaria de plantillas; revisión de títulos | Código |
| SEO-06 | Textos por categoría: 150–250 palabras con variantes de la keyword, sin cifras inventadas (vía CT-02 y CT-03) | P1 | CT-02, CT-03 | Textos publicados por categoría | Código/Doc |
| SEO-07 | Enlazado interno: categorías en el pie, tema y ciudad desde cada ficha, enlaces desde artículos a categorías | P1 | CT-04 | Auditoría de enlaces sin huérfanas | Código |
| SEO-08 | Rendimiento móvil: LCP, imágenes con `sizes`, fuentes con `next/font`; presupuesto y medición | P1 | DI-05 | Lighthouse o equivalente en 375 px registrado | Código |
| SEO-09 | Auditoría SEO completa con el skill de SEO y registro de hallazgos | P1 | SEO-02 a SEO-08 | Informe en `docs/analisis/` con hallazgos cerrados o justificados | Doc |
| SEO-10 | Verificación de URLs: trailing slash, 404 con `noindex`, redirecciones, canonical en filtros | P1 | — | Pruebas E2E de rutas | Código |
| SEO-11 | Registro en Search Console y envío del sitemap de `ticketera.c3.com.sv` cuando se active el botón | P1 | SEO-15, DM-01 | Captura con fecha; el responsable hace el registro | Equipo |
| SEO-15 | Interruptor de indexación en el panel de administración (propuesta de DP-05): estado guardado en base, sin redeploy, apagado por defecto; al activarlo cambian `robots` y `sitemap` y se registra quién y cuándo | P0 | SEO-02 | Solo administrador; apagado en demo; pruebas de rol y de robots y sitemap con el interruptor en ambos estados | Código |

### Área CT · Contenido y administración editorial

| ID | Qué hacer | Pri. | Depende de | Criterio de terminado | Tipo |
|---|---|---|---|---|---|
| CT-01 | Blog escrito por administradores; temas: eventos, cultura y fechas mixtas, con foco en SEO (DP-13) | P0 | — | **HECHO (decisión)**. Pendiente: número de artículos (4 como mínimo, según PDF) | Equipo |
| CT-02 | Tablas `editorial_pages` (intro y preguntas frecuentes por categoría o tema) y `blog_posts` (slug, título, meta, cuerpo, estado, fecha, palabra clave, tema); RLS: público lee publicados | P1 | — | Migración y pruebas en `tests/db`; solo publicados se leen con anon | Código |
| CT-03 | Editor del administrador en `/admin/contenido/`: crear, editar, previsualizar y publicar artículos y textos de categoría, con campos SEO y temas; validación en servidor y markdown seguro | P1 | CT-02 | Sin HTML arbitrario; solo administrador; pruebas de rol y de validación | Código |
| CT-04 | Blog público: `/blog/` y `/blog/[slug]/`, con migas, `Article` en datos estructurados y enlaces a categorías | P1 | CT-02 | Solo artículos publicados; sitemap incluye los publicados | Código |
| CT-05 | Contenido inicial: 4 artículos mínimos escritos por administradores en el editor (CT-03), según los temas de DP-13 y antes de sep–oct | P1 | CT-01, CT-04 | Artículos publicados; sin cifras inventadas; revisión del equipo | Equipo |
| CT-06 | Página de la Copa Salvadoreña en `/organizadores/copa/`, con descripción, eventos publicados y `Organization` marcado DEMO (DP-11) | P1 | TX-03 | Solo eventos publicados; `noindex` si no hay eventos | Código |
| CT-07 | Administrador edita perfil de organizador (nombre, descripción, enlace) desde CT-03 | P2 | CT-06 | Pruebas de rol | Código |
| CT-08 | Documentar la función de administración de contenido en DATA.md y SYSTEM.md | P1 | CT-03 | Documentos corregidos | Doc |

### Área TX · Taxonomía y datos

| ID | Qué hacer | Pri. | Depende de | Criterio de terminado | Tipo |
|---|---|---|---|---|---|
| TX-01 | Verificar 12 categorías, 4 temas y 3 ubicaciones contra la diapositiva 16 | P0 | — | **HECHO**: coincide con `seed.sql` y `SEO_ROUTES.md` | Doc |
| TX-02 | Conciliar 134 vs 129 y 36 vs 33 subtemas: corregir el Excel o documentar la diferencia | P1 | — | Tabla de conciliación en SEO_ROUTES.md | Doc |
| TX-03 | Sembrar el organizador DEMO «Copa Salvadoreña» (`/copa/`). `/claude/` no se siembra (DP-11) | P1 | — | Organizador en seed; etiquetado DEMO; sin afirmar afiliación | Código |
| TX-04 | Revisar cobertura de eventos DEMO por categoría y por pico de sep–oct; ferias tecnológicas sin eventos sigue `noindex` | P1 | — | Tabla de cobertura en DOC | Doc |

### Área MK · Marketing y métricas

| ID | Qué hacer | Pri. | Depende de | Criterio de terminado | Tipo |
|---|---|---|---|---|---|
| MK-01 | Analítica necesaria (DP-04): definir los eventos a medir (visitas, registros, compras, paquetes, check-ins) | P1 | DP-04 | **HECHO (decisión)**; lista de eventos documentada | Doc |
| MK-02 | Instrumentar eventos de conversión sin datos personales, solo después del consentimiento (LG-02) | P1 | MK-01, LG-02, CO-09 | Eventos documentados; no se mide sin aceptar | Código |
| MK-03 | Documento de marketing: buyer personas con canales (porcentajes marcados como estimados), objetivos SMART, inversión de $2,800 por canal, captación orgánica en cuatro frentes, calendario de redes | P1 | UX-05, CT-01 | `docs/analisis/MARKETING.md`; cada cifra con fuente o marcada como supuesto | Doc |
| MK-04 | Documentar la proyección (diapositiva 28) con su fuente y supuestos, sin cambiar las cifras (DP-15); registrar I-01 e I-02 como riesgo | P1 | DP-15 | Nota de supuestos y riesgos en MARKETING.md | Doc |
| MK-05 | Campañas pagadas: no se ejecutan sin presupuesto real; se documenta el plan | P2 | MK-03 | Plan documentado; sin gasto | Doc |

### Área LG · Privacidad y consentimiento

| ID | Qué hacer | Pri. | Depende de | Criterio de terminado | Tipo |
|---|---|---|---|---|---|
| LG-01 | Texto de privacidad: qué datos se recogen (cuenta, compra, analítica), para qué, cuánto tiempo se guardan, derechos y contacto de la demo | P0 | MK-01 | Texto aprobado por el responsable; enlazado en el pie y en el checkout | Doc |
| LG-02 | Banner de consentimiento para la analítica: sin medición hasta aceptar; la elección queda guardada | P1 | LG-01 | Prueba: sin consentimiento no se envía ningún evento de medición | Código |
| LG-03 | Aviso de DEMO y términos de uso: pagos simulados, sin cobros reales, sin servicio oficial de C3 | P1 | — | Texto en el pie y en el checkout; revisión del responsable | Doc |

### Área IM · Imágenes

| ID | Qué hacer | Pri. | Depende de | Criterio de terminado | Tipo |
|---|---|---|---|---|---|
| IM-01 | Buscar más fotos de stock con licencia libre (varias por línea y por tipo de evento); registrar fuente, autor y licencia en `public/images/CREDITOS.md` | P1 | DP-19 | Cada imagen nueva con crédito; sin personas identificables | Equipo |
| IM-02 | Ilustraciones propias: varias por tipo de evento (12) y por tema, sin personas identificables; marcadas como ilustración | P1 | DI-02 | Ilustraciones en `public/images/tipos/`; crédito propio registrado | Código/Equipo |
| IM-03 | Subir fotos y capturas finales al terminar todo (DP-18) | P-A | Todo lo visible | Fotos y capturas en la carpeta de entrega; fechas registradas | Equipo |

### Área DM · Dominio, hosting y costos

| ID | Qué hacer | Pri. | Depende de | Criterio de terminado | Tipo |
|---|---|---|---|---|---|
| DM-01 | Dominio final `ticketera.c3.com.sv` (DP-06): apuntar el dominio a Vercel cuando se active (SEO-15); el sitio sigue en el subdominio de demo hasta entonces | P0 | SEO-15 | Dominio final en la presentación y en README; DNS configurado | Equipo |
| DM-02 | Cotizar y completar la tabla de costos: dominio por año, hosting por mes, plan de Supabase y de Vercel | P1 | DP-17 | Tabla con fuente y fecha de cada precio; sin precios inventados | Equipo |
| DM-03 | Verificar el plan de hosting que pide el PDF («Vercel básico») frente al plan usado | P1 | DM-02 | Nota en DOC | Equipo |
| DM-04 | Declarar en la presentación que todo cobro es simulado (DP-10) | P0 | DP-10 | Frase en la diapositiva de plataforma | Doc |

### Área DOC · Documentación

| ID | Qué hacer | Pri. | Depende de | Criterio de terminado | Tipo |
|---|---|---|---|---|---|
| DOC-01 | Actualizar README (estado real), `docs/README.md` (índice completo) y la fecha de corte de cada documento | P0 | — | Índice con todos los documentos; README sin afirmaciones falsas | Doc |
| DOC-02 | Actualizar ACCEPTANCE.md (casillas reales) y el backlog (estado de T10, T17, T18) | P0 | — | Casillas coinciden con la evidencia registrada | Doc |
| DOC-03 | Actualizar PRD (§3 con personas, §4, §7) según las decisiones DP-01 a DP-04 | P0 | DP-01 a DP-04 | PRD sin exclusiones contradictorias | Doc |
| DOC-04 | Actualizar DATA.md (perfiles, destacados por día, paquetes, outbox, check-in, blog, contenido, interruptor de indexación) y SEO_ROUTES.md (blog, organizador Copa, empresas) | P1 | DP-01 a DP-20 | Tablas y rutas listadas | Doc |
| DOC-05 | Actualizar la presentación: portada, capturas (IM-03), cifras tal como están con sus riesgos (sección 5.1), precios de DM-02, nota de estilo (DP-07) | P-A | MK-04, DM-02, WF-04, IM-03 | PDF sin pendientes «FALTA» | Equipo |
| DOC-06 | Registrar las decisiones DP-01 a DP-21 en `docs/DECISIONS.md` con su resultado (sección 7 como fuente) | P0 | — | Filas D-37 en adelante | Doc |
| DOC-07 | Plan de implementación por área (superpowers writing-plans), uno por bloque, con esta versión como base | P0 | DOC-06 | Un plan por bloque con criterios | Doc |
| DOC-08 | Lista de rutas nuevas y su estado (indexable o no) | P1 | DOC-04 | Tabla en SEO_ROUTES.md | Doc |

### Tareas añadidas tras el inventario de código

| ID | Qué hacer | Pri. | Depende de | Criterio de terminado | Tipo |
|---|---|---|---|---|---|
| TX-05 | Corregir la palabra clave del seed con carácter roto («registro programaci…») y revisar la codificación de los textos del seed | P0 | — | El seed se reproduce sin caracteres rotos; prueba que lo verifica | Código |
| TX-06 | Incluir los temas en la búsqueda, o quitar la palabra «temas» del texto de ayuda | P2 | — | Prueba unitaria de `search.ts` | Código |
| TX-07 | Aplicar DP-21: 4 temas con ruta propia; los demás, solo como filtro o subtema; revisar `seo_routes` | P1 | DP-21 | Rutas de temas según DP-21; pruebas de resolución | Código |
| SEO-12 | Corregir `robots.ts`: quitar `/mis-boletos/` y `/publicar/` y listar solo rutas privadas reales | P0 | SEO-02 | Prueba unitaria de `robots` | Código |
| SEO-13 | Open Graph y título en home y catálogo (hoy solo en fichas) | P1 | SEO-05 | Metadatos verificados por ruta | Código |
| SEO-14 | `BreadcrumbList` y `WebSite` en datos estructurados; `Organization` solo con datos reales o marcados DEMO | P1 | SEO-04 | Validación de datos estructurados | Código |
| CP-08 | Registro de comprador y recuperación de contraseña (hoy no existen) | P1 | CP-02 | Registro y recuperación probados; sin cambios en la compra de invitado | Código |
| CP-09 | Alta de organizadores: hoy `owner_user_id` se asigna a mano en base. **Sin decisión todavía** (no está en DP-01 a DP-21) | P0 | — | Decisión pendiente; después, un organizador se vincula sin tocar la base; prueba de rol | Equipo/Código |
| CO-11 | Deduplicar la creación de órdenes con una clave de idempotencia en el checkout | P1 | CO-03 | Un reintento devuelve la misma orden; prueba de servidor | Código |
| CO-12 | Estado `cancelled` sin escritor: usarlo (cancelar orden pendiente) o retirarlo del esquema | P2 | — | Decisión registrada y esquema o flujo alineados | Doc/Código |

### Tareas ya existentes que este análisis retoma

| ID | Estado en backlog | Acción en este análisis |
|---|---|---|
| T10 | En curso (concurrencia real pendiente) | Sin cambio de alcance; prueba con dos conexiones cuando haya Postgres local o Supabase local |
| T14 y T15 | Terminado | Se extienden con CP (cuentas de comprador) y BM (destacados por día) |
| T16 | Terminado | Se extiende con CT-03 (editor) y BM-08 (panel de destacados) |
| T19 | Pendiente | Se divide en UX-01, UX-02 y UX-03 |
| T20 | Pendiente | Se divide en WF-01 a WF-05 |
| T21 | Pendiente | Se divide en SEO-09, MK-03, MK-04 |
| T22 | Pendiente | Se divide en DOC-05 y WF-04 |

---

## 9. Orden sugerido (sin fechas)

El orden respeta dependencias. Las tareas de equipo corren en paralelo al código.

**Pendientes de respuesta antes de ejecutar lo que dependa de ellos:** monto de la tarifa diaria (BM-01), precio anual del paquete (BM-01), costos (DM-02 con DP-17), mecanismo del botón de indexación (SEO-15), número de artículos (CT-01) y alta de organizadores (CP-09, sin decisión).

1. **Base sin esperas:** DOC-06 (registrar decisiones), DOC-01, DOC-02, TX-05, SEO-12, DI-00 (instalar Impeccable), DI-01, LG-01, LG-03, TX-03 (Copa).
2. **Diseño y wireframes:** DI-02, DI-07 (migración a lucide), WF-01, WF-02, IM-01, IM-02.
3. **Compra refinada (núcleo):** CO-01 a CO-03, CO-13, CO-05, CO-06, luego CO-04 y CO-08, y CO-11.
4. **Cuentas de comprador:** CP-02, CP-03, CP-04, CP-07, CP-08. Luego WF-03.
5. **Ingresos:** BM-02, BM-08 (panel de destacados), BM-03, BM-04, BM-09, BM-06, BM-05.
6. **Contenido y SEO:** CT-02, CT-03, CT-04, CT-06, TX-07, SEO-02, SEO-15, SEO-03 al final de las páginas nuevas, SEO-04, SEO-05, SEO-13, SEO-14, SEO-06, SEO-07, MK-01, LG-02, MK-02.
7. **Post-evento:** CI-01, CI-02.
8. **Cierre:** CO-09, DI-03, DI-04, DI-05, SEO-08, SEO-09, SEO-10, UX-03, WF-04, WF-05, MK-03, MK-04, DOC-04, DOC-05 (con IM-03 al final), DOC-07, SEO-11 y DM-01 cuando se active el botón.

---

## 10. Bitácora

Registro cronológico de este análisis y de decisiones. Cada entrada incluye lo hecho, la evidencia y lo que queda abierto.

| Fecha | Acción | Evidencia | Abierto |
|---|---|---|---|
| 2026-11-09 | Se pasó a `master` y se actualizó con `origin/master` (fast-forward de 12 commits, a `a791f38`) | `git log --oneline -1` en `master` | — |
| 2026-11-09 | Se leyó el PDF «en proceso Ticketera C3 - proyecto», 28 diapositivas; texto extraído con `pdftotext` | Secciones 3, 4 y 5 de este documento | Diapositivas con imágenes y gráficos (diapositivas 4, 10, 20, 26–28) se revisaron por su texto y sus cifras, no por su diseño |
| 2026-11-09 | Se revisaron los documentos base: README, AGENTS, PRODUCT, PRD, SYSTEM, DATA, SEO_ROUTES, DESIGN, DEMO_PAYMENT, ACCEPTANCE, DECISIONS, backlog, planes 2026-11-02 a 06 | Sección 5.2 | Documentos de especificación de 2026-11-02 (`specs/`) no revisados a fondo |
| 2026-11-09 | Revisión del código con un agente de solo lectura: rutas, auth, catálogo, compra, boletos, organizador, admin, SEO, diseño, correo, analítica | Secciones 2 y 5.3 | Lectura estática del código; no se ejecutaron pruebas ni build |
| 2026-11-09 | Se crearon `docs/analisis/` y este documento en la rama `docs/analisis-brechas-2026-11` | Commit `9e95c78` | — |
| 2026-11-09 | Requerimientos nuevos (R-01 a R-11) registrados a partir del mensaje del responsable | Sección 3 | — |
| 2026-11-09 | Se incorporó el inventario de código: 11 tablas con RLS; sin registro de comprador ni de organizador; `lucide-react` sin uso; `robots` con rutas inexistentes; seed con carácter roto; 14 temas en base frente a 4 en la presentación; creación de órdenes sin deduplicar | Secciones 2, 5.3 y 8 (tareas añadidas) | Verificar en código antes de tomar decisiones de implementación |
| 2026-11-09 | Se tomaron las 21 decisiones (DP-01 a DP-21). Se actualizaron las secciones 2, 3, 4, 5, 7, 8, 9 y 10. Áreas nuevas: LG (privacidad), IM (imágenes). Tareas nuevas: DI-00, CO-13, BM-08, BM-09, SEO-15, LG-01 a LG-03, IM-01 a IM-03 | Sección 7 | Ver «Pendiente de confirmar» en la sección 7 y la lista de la sección 9 |
| 2026-11-09 | Interpretaciones a revisar: DP-17 («pásamelo»), DP-18 (formato de wireframes sin respuesta explícita), mecanismo del botón de indexación (SEO-15) y alta de organizadores (CP-09, sin decisión) | Sección 7 y tareas marcadas | Confirmación del responsable |
| 2026-11-09 | Instalación de Impeccable (DI-00) y ejecución de cualquier tarea de código | — | Pendiente: no se ejecutó en este cambio, que es solo documental |
