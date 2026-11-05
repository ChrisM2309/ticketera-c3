# Sistema de marca C3 · valores globales

**Corte:** 5-nov-2026
**Alcance:** valores comunes a toda la marca C3, para reutilizarlos en otros proyectos. Excluye las vistas V01–V12 y los componentes de C3 Challenges (son referencia de ese proyecto).
**Fuente principal:** `diseno-claude/tokens/tokens.json` y `tokens.css`. Los valores que solo existen en `src/app/globals.css` se marcan como tales.

> **Nota:** el manual de marca que citan `tokens.json` y el update del 3-nov no está en el repositorio. En `src/` solo aparece `BrandMark.tsx`. Hay que obtenerlo para validar el logo y los colores oficiales.

---

## 1. Principios

1. **Tres líneas, tres colores principales.** Compite (azul), Crea (turquesa) y Conecta (morado). Cada una tiene base, variante de texto, variante para fondos oscuros, tinte y versión de impresión.
2. **Navy es la base.** Texto principal, cabeceras, pies y superficies oscuras.
3. **El color de línea clasifica; no decora.** Identifica el tipo de experiencia o de producto.
4. **Cada producto tiene su color de acción, y es una variante de su línea.** El botón primario, el enlace y el foco usan ese color. C3 Challenges es una app de Conecta, así que su acción es morada. Regla confirmada por el responsable el 5-nov-2026 para todos los productos.
5. **Los estados tienen color propio y llevan texto.** Éxito, advertencia, error e información nunca se pintan con un color de línea.
6. **Fondos claros y aire.** Blanco o neutros muy claros. Sin gradientes gratuitos, texturas ni emojis.
7. **Dos familias tipográficas.** Montserrat para títulos y etiquetas; Poppins para texto.

---

## 2. Color

### 2.1 Las tres líneas y sus variantes

| Variante | Compite | Crea | Conecta | Uso |
|---|---|---|---|---|
| **Base** | `#205298` | `#33beac` | `#4f5ba9` | Relleno, gráficos, identidad |
| **Texto** (sobre claro) | `#205298` · 7.72:1 | `#0f766e` · 5.47:1 | `#4f5ba9` · 6.17:1 | Texto sobre blanco |
| **Oscuro** (sobre navy) | `#6fa0dd` · 5.98:1 | `#4fd6c4` · 9.06:1 | `#9aa4e0` · 6.76:1 | Texto y acentos sobre navy |
| **Tinte** (fondo suave) | `#e9eff9` | `#e4f6f3` | `#eceefa` | Fondos de tarjeta de línea (en `globals.css`) |
| **Impresión** | `#2c519b` | `#46b8a8` | `#6d529e` | Versiones secundarias para impresión |

Los ratios son de texto sobre el fondo indicado (WCAG 2.x, cálculo propio).

**Reglas de uso:**

- **Crea base no es texto.** Sobre blanco da 2.31:1. Para texto, usar `crea-texto` (`#0f766e`).
- **Sobre relleno Crea, el texto es navy** (7.02:1). El blanco no alcanza.
- **Sobre navy, la base de Compite y Conecta no basta para gráficos** (2.10:1 y 2.62:1). Usar la variante oscura.
- **Como relleno con texto blanco**, Compite da 7.72:1 y Conecta 6.17:1.

### 2.2 Navy y neutros

| Token | Claro | Oscuro | Uso |
|---|---|---|---|
| `navy` | `#0f203e` | `#0f203e` | Base de marca; cabeceras, pies, texto principal |
| `sec-navy` | `#202a3f` | — | Impresión |
| `fondo` | `#ffffff` | `#0f203e` | Fondo de página |
| `superficie` | `#ffffff` | `#17294a` | Tarjetas, barras, contenedores |
| `superficie-sutil` | `#f6f8fb` | `#1f335a` | Filas alternas, hover, bloques de ayuda |
| `texto` | `#0f203e` | `#eaf0f8` | Texto principal |
| `texto-suave` | `#536178` | `#a9b8d0` | Descripciones y metadatos |
| `texto-inverso` | `#ffffff` | `#eaf0f8` | Texto sobre relleno fuerte |
| `borde` | `#dce3ed` | `#2c3f63` | Divisores y bordes de tarjeta |
| `borde-fuerte` | `#7c8ba0` | `#4a5f85` | Bordes de campos y controles |

`texto-suave` sobre blanco da 6.27:1. `borde-fuerte` sobre blanco da 3.47:1, lo que cumple el 3:1 de componentes.

### 2.3 Color de acción

La acción es la variante del producto. En C3 Challenges (Conecta):

| Token | Claro | Oscuro | Uso |
|---|---|---|---|
| `accion` | `#6548c7` | `#7a5fd6` | Botón primario, enlace, foco |
| `accion-intensa` | `#5236b0` | `#8f78e0` | Hover y estado activo |
| `action-tint` | `#efeafc` | — | Halo suave de elementos de acción (`globals.css`) |
| `action-line` | `#e4ddfb` | — | Borde suave de acción (`globals.css`) |
| `action-soft` | `#a996ec` | — | Acento secundario (`globals.css`) |

**Contraste:** texto blanco sobre `accion` = 6.35:1; sobre `accion-intensa` = 8.36:1. En oscuro, `#eaf0f8` sobre `#7a5fd6` = **4.13:1** (no cumple para texto normal), y sobre el hover oscuro = **3.09:1**. Hay que corregirlo antes de activar el modo oscuro.

**Por qué morado y no azul:** **(inferido)** el azul de acción anterior (`#205298`) era el mismo azul de la línea Compite. Un botón de ese color se leía como una categoría de catálogo. D11 del 4-nov-2026 fija la acción violeta. Con esta regla, cada producto usa el color de su propia línea.

**Pendiente:** si hay productos de Compite o de Crea, definir su variante de acción con el mismo método. No existe todavía.

### 2.4 Estados

| Estado | Claro | Fondo suave (`globals.css`) | Oscuro | Texto sobre fondo suave |
|---|---|---|---|---|
| Éxito | `#157a52` | `#e0f2ea` | `#4fd99e` | 4.59:1 |
| Advertencia | `#9a5b00` | `#fbefdd` | `#e8b15c` | 4.78:1 |
| Error | `#b83227` | `#fae6e3` | `#f28b7e` | 4.96:1 |
| Información | `#205298` | `#e3ecf8` | `#6fa0dd` | 6.47:1 |

Bloque de atención: tinte `advertencia-tinte` = `#fbf6ec` (`globals.css`).

**Conflicto:** `info` reutiliza el azul de Compite (`tokens.json`: `info = {compite}`). Eso contradice la regla de que un estado nunca usa color de línea. Hay que definir un `info` propio, o aceptar la excepción por escrito.

### 2.5 Reconocimiento

| Token | Claro | Oscuro |
|---|---|---|
| `oro` | `#c99700` | `#e8c24d` |
| `plata` | `#8b97a6` | `#b9c4d2` |
| `bronce` | `#a56a39` | `#c98a57` |

Texto navy sobre oro: 6.10:1. Se usan solo para medallas y reconocimientos. **Pendiente:** `tokens.json` define el oro como «percentil más alto de la temporada»; no está decidido si el sello representa percentil o puesto.

---

## 3. Tipografía

**Familias:** Montserrat (`--c3-font-titulo`) para títulos y etiquetas; Poppins (`--c3-font-texto`) para texto. Ambas se cargan de Google Fonts y tienen respaldo en `system-ui`.

| Estilo | Familia | Tamaño | Peso | Interlineado | Uso |
|---|---|---|---|---|---|
| display | Montserrat | 56 px | 800 | 1.0 | Portadas y titulares grandes |
| h1 | Montserrat | 40 px | 700 | 1.1 | Título de página |
| h2 | Montserrat | 30 px | 700 | 1.2 | Subtítulo de sección |
| h3 | Montserrat | 22 px | 600 | 1.3 | Título de tarjeta |
| etiqueta | Montserrat | 13 px | 700 | 1.2 | MAYÚSCULAS, tracking 0.08 em |
| cuerpo-lg | Poppins | 18 px | 400 | 1.6 | Entradilla |
| cuerpo | Poppins | 16 px | 400 | 1.6 | Texto base |
| cuerpo-sm | Poppins | 14 px | 400 | 1.5 | Texto de apoyo |
| leyenda | Poppins | 12 px | 500 | 1.4 | Metadatos y pies |

**Notas:**

- **Tracking de etiqueta:** el token dice 0.08 em; la implementación usa 0.12 em. Hay que unificarlo.
- **Botones:** el README pide Montserrat en MAYÚSCULAS; la implementación usa Poppins 600 en frase normal. Pendiente.
- **Tamaños intermedios:** la escala no incluye 15, 17 ni 26 px, que la implementación necesita en móvil. Pendiente decidir si se amplía.

---

## 4. Espaciado y layout

**Escala base de 4 px** (`tokens.css`): 4, 8, 12, 16, 24, 32, 48 y 64 px (`--c3-space-1` a `--c3-space-10`). No hay 28 ni 40.

**Nota:** la implementación no usa estas variables. Escribe píxeles sueltos, algunos fuera de escala (14, 18, 20, 28 px).

**Layout de referencia** (`globals.css`):

- Margen lateral de página: `clamp(16px, 4vw, 48px)`.
- Ancho máximo de contenido: 1440 px.
- Validar siempre en 390 px y en 1280 px (AGENTS §4).

---

## 5. Radios

| Token | Valor | Uso |
|---|---|---|
| `radius-sm` | 6 px | Chips y campos (según `tokens.json`) |
| `radius-md` | 12 px | Botones y tarjetas estándar |
| `radius-lg` | 20 px | Módulos grandes (sin uso en la implementación) |
| `radius-pill` | 999 px | Píldoras, chips y avatares |
| `radius-card` | 18 px | Tarjetas (solo `globals.css`) |
| `radius-block` | 22 px | Bloques grandes (solo `globals.css`) |

**Pendiente:** los campos usan 12 px en la implementación, aunque `tokens.json` los asigna a `radius-sm` (6 px). Decidir cuál vale. Y llevar `radius-card` y `radius-block` a `tokens.json`.

---

## 6. Sombras

| Token | Valor | Uso |
|---|---|---|
| `sombra-sm` | `0 1px 2px rgba(15,32,62,.08)` | Elevación mínima |
| `sombra-md` | `0 6px 16px rgba(15,32,62,.12)` | Tarjetas y menús flotantes (sin uso aún) |
| `sombra-lg` | `0 16px 40px rgba(15,32,62,.16)` | Modales y elementos destacados |
| `shadow-soft` | `0 6px 22px rgba(15,32,62,.07)` | Tarjetas (solo `globals.css`) |
| `shadow-action` | `0 8px 20px rgba(101,72,199,.25)` | Botón primario: halo del color de acción (solo `globals.css`) |

Las sombras de marca están tintadas en navy. La de acción usa el color de acción. **Pendiente:** el README dice «sin sombras en tarjetas»; la implementación usa `shadow-soft`. Decidir.

---

## 7. Movimiento

No hay tokens de movimiento. En la implementación:

- Transiciones de 0.15 s en botones.
- Rotación decorativa de 30 s en la órbita de marca (portada y páginas de línea).
- Esqueleto de carga con shimmer.

Todas las animaciones respetan `prefers-reduced-motion`. Regla de marca (update): la animación no debe retrasar la lectura ni la demo.

---

## 8. Foco y accesibilidad

- **Foco de teclado:** anillo de 3 px en `foco` (claro `#6548c7`, oscuro `#b9a8f0`) con desfase de 2 px. No se elimina nunca.
- **Tamaño táctil mínimo:** 44 px. Botones y campos miden 46 px.
- **Estado siempre con texto.** El color solo no basta.
- **Contraste:** todo el tema claro que usa la implementación cumple AA. El tema oscuro falla en el botón primario (sección 2.3).
- **Pendiente:** auditoría con herramienta. No está hecha; los ratios de este documento son cálculos propios.

---

## 9. Modo oscuro

Los tokens oscuros existen en `tokens.css` y `tokens.json` (`[data-theme="oscuro"]`). **Ningún componente activa `data-theme`**, y la página fuerza `color-scheme: light`. Hoy el modo oscuro no se puede ver.

**Pendiente:** activarlo (corrigiendo el botón primario) o retirarlo de los tokens.

---

## 10. Reglas de uso

- **Línea:** clasifica, no decora. La implementación usa `conecta` como fondo de avatares, lo que contradice la regla.
- **Crea:** nunca como texto sobre fondo claro.
- **Acción:** solo botón primario, enlace, foco y paso actual.
- **Estados:** con texto y sin color de línea (ver `info`, sección 2.4).
- **Oro, plata y bronce:** solo reconocimiento. La implementación usa el oro como acento de un contador de atención, lo que contradice la regla.
- **Gradientes:** no se usan. Excepción: la órbita decorativa de la portada tiene un degradado radial sutil. Decidir si se acepta.
- **Voz:** «tú» (decisión del 4-nov-2026).

---

## 11. Dónde está cada cosa

| Archivo | Qué es | Estado |
|---|---|---|
| `diseno-claude/tokens/tokens.json` | Fuente principal, claro y oscuro | Vigente. Falta añadir variantes por línea, tintes, radios de tarjeta y sombras |
| `diseno-claude/tokens/tokens.css` | Mismos valores como `--c3-*` | Vigente |
| `src/app/globals.css` (líneas 1–30) | Valores derivados: fondos de estado, tintes, radios y sombras extra | Vigente, pero fuera de `tokens.json` |
| `diseno-claude/README.md`, `vistas/`, `index.html`, `fuente-canvas/` | Referencia de C3 Challenges | **Versión anterior**: usan el azul `#205298` como acción. No usar como referencia de color |
| `docs/UPDATE-2026-11-03-demo-integral.md` §0.6 | Identidad visual | Usa nombres antiguos (`--c3-blue`, `--c3-violet`, `--surface-soft`) |
| Manual de marca | Fuente de los colores oficiales | **No está en el repositorio** |

---

## 12. Decisiones pendientes para cerrar el sistema de marca

1. **Regla confirmada (5-nov-2026):** la acción de cada producto es una variante de su línea. Falta definir la variante de Compite y de Crea si esos productos existen (sección 2.3).
2. **Añadir a `tokens.json` las variantes por línea:** base, texto, oscuro, tinte, impresión y acción. Nombres propuestos: `compite`, `compite-texto`, `compite-oscuro`, `compite-tinte`, `compite-impresion`, `compite-accion`, y lo mismo para `crea` y `conecta`.
3. **Color de `info`:** propio, o excepción aceptada.
4. **Botones:** Poppins en frase normal (implementación) o Montserrat en mayúsculas (README).
5. **Campos:** radio de 6 px o de 12 px.
6. **Modo oscuro:** activar (corrigiendo el botón) o retirar.
7. **Tokenizar** los fondos de estado, los tintes, `radius-card`, `radius-block` y las sombras de la implementación.
8. **Escalas:** adoptar en la implementación las de espaciado y tipografía, o retirarlas.
9. **Tokens de movimiento:** añadirlos o no.
10. **Tracking de etiqueta:** 0.08 em o 0.12 em.
11. **Auditoría de contraste** con herramienta.
12. **Obtener el manual de marca y los canvas vigentes**, que no están en el repositorio.
