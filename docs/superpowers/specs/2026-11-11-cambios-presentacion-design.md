# Cambios del sitio para la presentación

## Objetivo y alcance

Preparar la experiencia de compra y la presentación del marketplace académico DEMO. Se incluyen los puntos 1–11 del pedido, en el orden imprescindible, importante y opcional; el dominio (punto 12) queda fuera. La implementación corresponde a otro agente después de la revisión de este diseño y el plan.

## Decisiones de diseño propuestas

- **Comisión:** nuevas órdenes: 6 % del subtotal más $0.50 por boleto, a cargo del organizador; el comprador paga exactamente el subtotal de entradas. Cálculo entero en servidor, redondeando el 6 % al centavo por orden. El responsable confirmó que el componente fijo también aplica a boletos gratuitos; se registra como comisión del organizador, sin cobro automático ni deuda exigible. Ejemplos: dos entradas de $10 → comprador $20, comisión $2.20; dos gratis → comprador $0, comisión $1.00. En mezclas se cuentan todas las unidades. No inventar un sistema de liquidación.
- Conservar órdenes previas, sus totales y comisiones; distinguir comisión histórica cobrada al comprador de la nueva comisión al organizador. Órdenes pendientes anteriores mantienen sus importes incluso tras el despliegue. La confirmación, idempotencia y Wompi usan el total histórico de cada orden.
- **Evento de prueba:** retirar «CONGRESO DE IA 2027!!!» de la selección pública y destacados sin borrar órdenes ni evidencia histórica; preferir archivarlo mediante la vía administrativa y verificar el remoto antes de modificar datos.
- **Home:** comprobar imágenes reales en destacado y próximos, escritorio y móvil. Si falla una portada remota, mostrar un respaldo local de categoría; nunca presentar imágenes rotas o bloques vacíos.
- **Contacto y voz:** usar `competitivecodingclub.sv@gmail.com`, `+503 6963-9295` y enlaces `mailto:`/`tel:+50369639295`; sustituir voseo por tuteo en la interfaz y metadatos, conservando citas y registros históricos.
- **Wompi:** el responsable indica que ya quedó activado; documentar ese estado como declaración del responsable y diferenciar evidencia comprobada de lo no verificado. No volver a activar, probar cobros ni exponer credenciales. Corregir contradicciones de documentos vigentes; conservar decisiones históricas con nota aclaratoria.
- **Confianza:** debajo del selector mostrar métodos efectivamente habilitados para el flujo sandbox y enlace a política de reembolso existente, sin prometer reembolsos ni marcas de tarjeta no verificadas. Añadir `includes_certificate` booleano, `false` por defecto, gestionable por organizador y visible solo cuando sea verdadero; no inferir certificados de texto o categoría.
- **Confirmación:** recomendar hasta tres eventos publicados, futuros y distintos del comprado, priorizando tema y categoría, sin prometer cantidad mínima si no existen. Ofrecer suscripción solo mediante mecanismo real configurado; si no existe, enlazar a un correo de contacto con asunto explícito, sin afirmar que ya se ha suscrito.
- **Medición externa:** fuera del alcance actual por decisión del responsable. No integrar GA4 ni Meta Pixel, no solicitar IDs y no dejar trabajo de instalación pendiente. Se conserva la analítica propia existente con saneamiento de rutas privadas; no se envían datos a terceros.
- **Opcional: código de orden:** código corto único y persistente generado en servidor, distinto del UUID y token; se muestra en confirmación y comprobante sin cambiar rutas ni autorización. Migrar órdenes existentes con unicidad y mantener código estable entre reintentos; no exponer tokens.
- **Opcional: Tema:** filtro GET combinable con los demás en páginas de categoría; solo temas de la taxonomía, conservar canónicos y parámetros válidos. No crear rutas vacías.

## Restricciones y validación

Español de tú; USD en centavos; DEMO visible; RLS y validación en servidor. No cambiar dominio ni historial transaccional. No asumir datos de certificado, política ni resultado de Wompi. Pruebas DB y unitarias cubren comisión, redondeo, gratis, reintentos, históricos y filtros; E2E cubre compra y presentación. Verificación en vivo exige acceso a despliegue y datos, y debe registrarse separada de pruebas locales.

## Panel de eventos del organizador

- Añadir botones para editar y archivar cada evento del organizador, reutilizando el formulario de publicación y validando autenticación, rol y propiedad en servidor/RPC.
- La edición actualiza datos descriptivos (título, descripción, agenda, fechas, modalidad, ubicación, tipo/tema, portada, ponentes y certificado). Los tipos de entrada, precios y cupos no se modifican desde esta acción para conservar las condiciones asociadas a órdenes y boletos existentes.
- Si se edita un evento publicado, vuelve a estado `pending` para que la administración revise los cambios antes de exponerlos en el catálogo.
- «Eliminar» se implementa como archivo lógico: cambia `events.status` a `archived`, deja de aparecer públicamente y conserva evento, tipos de entrada, órdenes, pagos y boletos. No ejecutar `DELETE` físico ni cambiar tablas transaccionales.
- La autorización se comprueba en la RPC con `auth.uid()` y `owns_event`; negar usuarios sin sesión y organizadores ajenos. Probar edición, rechazo de acceso, transición a revisión y conservación de filas al archivar.

## Alternativas

Se propone una sola especificación con tareas independientes, priorizadas y desplegables por etapas: facilita que otro agente las ejecute sin mezclar medición con pagos. La alternativa de cambiar solo textos y cálculos del navegador se descarta porque el servidor y la restricción SQL seguirían cobrando la comisión al comprador. Una sustitución retroactiva de montos se descarta para preservar el historial.
