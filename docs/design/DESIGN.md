# Diseño visual y UX — Ticketera C3

## Fuente de verdad

- **Design system base:** «C3» en Artifacts, `https://claude.ai/artifact/8fjePTGraHti2uetgUxmrY` (tokens en `project/tokens.json`, componentes CSS en `project/components/bundle.css`, reglas en `project/README.md`).
- **Canvas de T02:** `https://claude.ai/artifact/SPMN8ryjiHCN3bnuJnFGDw` (escritorio 1280 y móvil 390, con el sistema C3 copiado en `project/ds/c3/`).
- Si un valor de este documento contradice el design system, gana el design system y este documento se corrige.

Apariencia técnica, limpia y profesional, basada en el manual C3. Es un **prototipo académico**: no debe parecer un servicio oficial de C3.

## Tokens de marca

### Color (tema claro por defecto; oscuro disponible)

| Token | Claro | Oscuro | Uso |
|---|---|---|---|
| `fondo` | `#f3f6fa` | `#0f203e` | papel de la página (gris azulado claro para que las fotos destaquen) |
| `superficie` | `#ffffff` | `#17294a` | tarjetas, barras, campos |
| `superficie-sutil` | `#eaf0f8` | `#1f335a` | filas alternas, hover, filtros |
| `texto` | `#0f203e` | `#eaf0f8` | texto principal |
| `texto-suave` | `#475569` | `#a9b8d0` | descripciones, metadatos |
| `texto-inverso` | `#ffffff` | `#eaf0f8` | texto sobre rellenos fuertes |
| `borde` | `#d9e1ec` | `#2c3f63` | divisores |
| `borde-fuerte` | `#7c8ba0` | `#4a5f85` | bordes de campos (3:1) |
| `accion` | `#6548c7` | `#6e54cc` | acción de la línea Conecta (D-33): botón primario, CTA de compra, elementos interactivos |
| `accion-intensa` | `#5236b0` | `#55409f` | hover/activo de la acción |
| `enlace` | `#6548c7` | `#b9a8f0` | enlaces de texto |
| `foco` | `#6548c7` | `#b9a8f0` | anillo de foco, siempre visible |
| `compra` | — | — | retirado (D-33): el CTA de compra usa `accion` |
| `overlay-foto` | `rgba(15,32,62,0.86)` | `rgba(15,32,62,0.86)` | velo navy sobre fotos para legibilidad |
| `navy` | `#0f203e` | — | navegación, pie, bloques de marca |
| `compite` | `#205298` | — | línea Compite (azul) |
| `crea` | `#33beac` | — | línea Crea (turquesa); solo relleno de tarjetas y mosaicos de línea |
| `crea-texto` | `#0f766e` | `#4fd6c4` | turquesa legible como texto |
| `conecta` | `#4f5ba9` | — | línea Conecta (morado) |
| `compite-texto` / `conecta-texto` | `#205298` / `#4f5ba9` | `#6fa3e8` / `#9aa5ee` | trazo de icono de la línea; en oscuro alcanzan 3:1 sobre navy (D-58) |
| `exito` / `advertencia` / `error` | `#157a52` / `#9a5b00` / `#b83227` | `#4fd99e` / `#e8b15c` / `#f28b7e` | estados |
| `oro` / `plata` / `bronce` | `#c99700` / `#8b97a6` / `#a56a39` | `#e8c24d` / `#b9c4d2` / `#c98a57` | medallas (no usar en la plataforma de compra) |

### Tipografía

- **Montserrat** (`--font-titulo`): títulos, enlaces principales, botones, etiquetas.
- **Poppins** (`--font-texto`): cuerpo, formularios, metadatos.
- Escala: display 56/800 · h1 40/700 · h2 30/700 · h3 22/600 · cuerpo 16/400 (1.6) · cuerpo-sm 14/400 · leyenda 12/500. Botones y etiquetas en MAYÚSCULAS con tracking.

### Espaciado y forma

- Espaciado: 4 · 8 · 12 · 16 · 24 · 32 · 48 · 64 px (`--space-1` a `--space-10`).
- Radios: 6 px campos e inputs (`radius-sm`) · 12 px botones, tarjetas de evento y de categoría (`radius-md`) · 20 px módulos grandes y mockups · 999 px chips y píldoras (D-33).
- Sombras: `sombra-sm` (tarjetas, inputs, chips y bloques de resumen), `sombra-md` (solo elementos flotantes y menús), `sombra-lg` (modales). Sin sombra-tarjeta propia (D-33).

## Reglas de estilo

1. **Solo tokens.** Nunca escribir colores, tamaños ni radios literales en las pantallas: usar `var(--...)`. Excepción documentada: `#fff` dentro de `bundle.css` para texto sobre `accion`.
2. **Turquesa (`crea`) no es texto sobre fondo claro.** Como relleno, sí; como texto, `crea-texto`. Sobre navy, el turquesa sí se usa como texto.
3. **Un CTA de compra por vista.** El botón de compra usa `accion` con texto `texto-inverso` (variante `compra` de `Button`, D-33). El turquesa `crea` no es acción: es color de línea. En la barra navy, las acciones secundarias usan texto `texto-inverso`.
4. **Azul marino para navegación y acentos.** Header y pie en `navy`; el contenido, en claro (`fondo`/`superficie`).
5. **Logo y navegación.** El logotipo lleva al Home. El menú **no** contiene «Inicio». Las 12 categorías van en el orden del Excel (ver `docs/architecture/SEO_ROUTES.md`).
6. **Etiqueta DEMO visible.** `DEMO · Proyecto académico` en el header (badge `c3-badge--advertencia`), y en el pie y en el checkout. Los pagos se muestran como «Pago de demostración».
7. **Estados no solo por color.** Cada estado lleva texto o icono (`c3-badge` con etiqueta).
8. **Foco visible.** Nunca `outline: none` sin reemplazo. Las clases de `bundle.css` ya usan `foco` de 3 px.
9. **Contraste.** Texto 4.5:1 en ambos temas; controles y bordes 3:1. Texto blanco sobre `accion` (`#6548c7`, 6.35:1) y `texto-inverso` oscuro (`#eaf0f8`) sobre `accion` oscura (`#6e54cc`, 4.82:1) cumplen. Lo verifica `tests/unit/design-tokens.test.ts`.
10. **Sin emojis en UI.** Los iconos son SVG de trazo, `aria-hidden` cuando decoran.
11. **Sin degradados ni texturas sobre el logotipo.** Ni deformar ni recolorear el logo fuera de la paleta (ver «Uso del logotipo» del design system).
12. **Móvil primero.** Campos de 16 px mínimo para evitar zoom en iOS; áreas táctiles de 44 px; sin scroll horizontal en la página (solo en la barra de categorías, contenida en su propio contenedor).
13. **Iconos de `lucide-react`.** Los iconos salen de `lucide-react` mediante el componente `Icon` (Fase 1); no se escriben SVG a mano. Cómo se introducen: `docs/superpowers/plans/2026-11-09-fase-1-diseno-iconos.md`.

## Componentes (clases de `bundle.css`)

| Necesidad | Clase | Notas |
|---|---|---|
| Botón de compra | `Button variant="compra"` (acción de marca) | texto `texto-inverso` |
| Botón primario | `c3-btn c3-btn--primario` | formularios, publicar |
| Secundario / fantasma | `c3-btn--secundario`, `c3-btn--fantasma` | en navy, sobrescribir `--_fg` y `--_bd` |
| Campos | `c3-field`, `c3-label`, `c3-input`, `c3-help`, `c3-error-text` | `label[for]` obligatorio |
| Tarjeta de evento | `c3-card` + `c3-card--compite/crea/conecta` | franja superior por línea |
| Etiqueta de categoría | `c3-chip` + `c3-chip--compite/crea/conecta` | nombre visible, no solo color |
| Estado | `c3-badge` + tono | `--punto` opcional |
| Barra superior | `c3-nav`, `c3-nav__link`, `c3-nav__brand` | `aria-current="page"` en la sección activa |
| Pestañas, tabla, modal | `c3-tabs`, `c3-table-wrap`, `c3-modal` | modal con foco atrapado (implementación de la app) |

## Responsive y accesibilidad

- Breakpoint móvil obligatorio. En móvil el menú de categorías se abre desde un botón (`aria-expanded`, `aria-controls`); la barra horizontal de categorías solo scrollea dentro de su contenedor.
- Formularios con label visible, errores junto al campo y `aria-invalid="true"`.
- Teclado completo para selector de entradas, filtros y modales.

## Copy

- Español salvadoreño comprensible, tuteo: `Explorá eventos`, `Ver evento`, `Comprar entrada`, `Registrarme`, `Publicar evento`, `Tu entrada está confirmada`, `Pago de demostración`.
- Sin exageraciones ni cifras inventadas. Si un dato no existe, no se muestra (por ejemplo, «últimos 2 cupos» solo si es real).
- Sin emojis, sin signos de exclamación de marketing.

## Pantallas y bloques

### Home
Header (logo, badge DEMO, buscador, Publicar evento, Mis boletos, Carrito), barra de 12 categorías, hero con evento destacado y CTA, próximos eventos, bloque de gratuitos, CTA de organizador, pie con avisos de demostración.

### Categoría / subcategoría
Breadcrumb, H1 con keyword, 2–3 líneas SEO, chips de subtemas, filtros (fecha, modalidad, ciudad, gratis/de pago), tarjetas ordenadas por fecha, FAQ contextual. Estado vacío sin mentir sobre disponibilidad.

### Evento
Breadcrumb, portada, resumen (fecha, hora, lugar, organizador), selector de entradas y CTA por encima del pliegue, comisión visible, agenda, ponentes demo, relacionados.

### Carrito + checkout
Un evento por orden, varios tipos de entrada. Ítems, subtotal, comisión, total, nombre y correo obligatorios. Gratis: `Confirmar registro`. Pagado: selector `Simular pago aprobado / rechazado` y `Finalizar compra DEMO`. No se pide ni muestra tarjeta.

### Confirmación
Estado confirmado, número de orden no secuencial, una tarjeta por boleto con QR, descarga o impresión, compartir por WhatsApp, relacionados. En error: estado explícito y CTA `Reintentar`.

### Publicar evento / admin
Formulario de 2 pasos (información y entradas), vista previa y envío a revisión. Admin: tabla de pendientes con aprobar/rechazar. Organizador: lista de sus eventos y total de registros; sin estadísticas avanzadas.

## Reglas de calidad de interfaz (Impeccable)

Estas reglas salen de la skill `impeccable` del plugin de Impeccable (`pbakaus/impeccable`) y aplican a toda interfaz nueva o cambio visual. No definen la dirección visual: esa la marcan los tokens de marca y este documento.

- **Sin kicker ni etiqueta sobre títulos.** La categoría de un evento va debajo del título, como dato.
- **Sin bordes de color laterales.** `border-left` o `border-right` de más de 1 px no se usan en tarjetas, listas ni avisos. La perforación del boleto es de 1 px punteado.
- **Movimiento con intención.** No hay animación por tarjeta al pasar el cursor. El movimiento responde a una acción del usuario o marca un solo momento principal.
- **Sin efectos decorativos.** Nada de texto con degradado, sombras duras sin desenfoque ni cristal decorativo.
- **Precios limpios.** Montos enteros sin decimales (`Desde $10`). Decimales solo cuando existen (`$10.50`).
- **Copy sin tecnicismos.** Los botones dicen la acción; los errores dicen qué pasó y qué hacer. La UI no menciona bases de datos ni sistemas internos.
- **Selección y foco en la paleta.** La selección de texto usa `crea` y `navy` (en `globals.css`). El anillo de foco es siempre visible.
- **Revisión antes de dar por terminado un cambio de UI.** Revisar en escritorio y en móvil (375 px) y correr el detector sobre los archivos cambiados: `npx impeccable detect --json <archivos>` (instalado como devDependency, `impeccable@4.8.1`; imprime JSON, `[]` si no hay hallazgos; código de salida 2 = hay hallazgos, 1 = no se pudo analizar un archivo).
- **Contexto de producto.** Está en `PRODUCT.md` (raíz). Para rediseños o nuevas superficies, partir de ahí.

## Guías de diseño

- **`frontend-design` marca la dirección.** Esta skill guía el diseño visual intencionado: jerarquía, tipografía y decisiones deliberadas en lugar de plantillas genéricas. Se usa al construir o rehacer una pantalla.
- **Impeccable detecta y revisa.** Es el detector y la lista de comprobación de calidad; el comando está en «Reglas de calidad de interfaz (Impeccable)» (`npx impeccable detect --json <archivos>`).
- **Los tokens de marca mandan.** Los tokens y las reglas de este documento prevalecen siempre sobre ambas guías. Si una sugerencia choca con ellos, gana este documento.
- **Iconos.** Se introducen en la Fase 1, según `docs/superpowers/plans/2026-11-09-fase-1-diseno-iconos.md` (regla 13).

## Cómo se mantiene este documento

- Cambios de tokens: primero en el design system C3 (Artifacts), luego aquí y en `project/ds/c3/tokens.json` del canvas.
- Decisiones que cambien estas reglas: registrar en `docs/DECISIONS.md`.
