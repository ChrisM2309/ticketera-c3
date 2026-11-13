# Diseño: recordatorio de carrito y novedades de eventos DEMO

**Estado:** especificación propuesta; no implementada. Alcance solicitado: dos funciones sencillas y demostrables con el formato y cliente de Brevo existentes. Las decisiones de horario, plazo y límites siguientes son valores prácticos para la demo y se pueden ajustar antes de implementar.

## Contexto y alternativas

El carrito (`src/features/checkout/cart.ts`) vive en `localStorage`; al cerrar la página el servidor no sabe que existe. Brevo ya envía correos de boletos, mientras `notification_outbox` exige una orden y no sirve directamente para carritos sin orden ni para boletines. Las cuentas ya tienen `profiles.marketing_opt_in` y una casilla revocable en `/cuenta/`.

Se consideraron: (1) enviar inmediatamente al dejar el correo, sencillo pero no detecta abandono; (2) guardar solicitudes mínimas y revisarlas una vez al día, reutilizando Brevo, opción elegida para una demo real; (3) plataforma de campañas y colas con automatización completa, innecesaria para este alcance. No se construyen segmentación personalizada, estadísticas, campañas visuales ni una cola de reintentos.

## T28: recordatorio de carrito

En el carrito con selección, presentar una casilla desmarcada «Quiero recibir un recordatorio de esta selección por correo» y un correo para invitados; si hay sesión válida, precargar el correo de la cuenta, dejando explícita la aceptación. Un botón guarda la solicitud sin obligar a completar la compra. Indicar que se enviará un único recordatorio y que precios y disponibilidad pueden cambiar. No enviar por solo escribir el correo ni asumir consentimiento por tener cuenta. No se reserva inventario.

Guardar en servidor correo normalizado, evento, ids y cantidades de entradas, fecha de actualización, estado y un identificador aleatorio de solicitud; no guardar precios, token de orden ni datos de pago. La creación valida correo, selección, evento publicado, tipos pertenecientes al evento y límites actuales; la cuenta se identifica solo desde la sesión. La selección debe poder reconstruirse usando la URL existente de `/carrito/` con ids y cantidades, sin revelar correo en el enlace. Al abrirla se vuelven a consultar evento y disponibilidad. El navegador conserva un identificador secreto aleatorio y lo envía para actualizar o cancelar su solicitud; el servidor solo guarda su hash. La compra confirmada cancela solicitudes pendientes del mismo correo normalizado y evento creadas antes de la confirmación, incluidos invitados; no cancelar por una orden rechazada o pendiente. El vaciado explícito del carrito cancela la solicitud asociada; si se cambia evento se cancela la anterior. Una pestaña cerrada, almacenamiento bloqueado o dispositivo distinto no garantiza esta cancelación local; el chequeo de orden confirmada en el servidor es el respaldo.

Una revisión diaria protegida busca solicitudes pendientes sin cambios durante al menos 24 horas, con evento publicado y futuro, y sin compra confirmada posterior de ese correo y evento. Envía máximo una vez por solicitud; cambios explícitos de selección actualizan la solicitud y reinician el plazo. Se elimina el dato personal de solicitudes terminales tras 30 días. Antes de enviar, se reclama cada fila atómicamente y se comprueban nuevamente la cancelación y la compra. Una compra concurrente después de la última comprobación podría coincidir con el envío: se documenta como límite de la demo, no se promete cancelación perfecta. Si Brevo devuelve error o resultado incierto se marca fallo y no se reintenta automáticamente: esto reduce duplicados, pero puede perder un correo.

## T29: novedades semanales

Se reutiliza la casilla existente `marketing_opt_in` en `/cuenta/`; queda desactivada por defecto y no se activa por crear cuenta. El correo incluye enlace a `/cuenta/` para desmarcarla, con inicio de sesión si corresponde. La revisión diaria ejecuta esta campaña solo los lunes a las 15:00 UTC (09:00 en El Salvador); usa la fecha local del lunes como identificador de semana. Cada correo muestra hasta tres eventos publicados y futuros ordenados por fecha; son una selección general, no recomendaciones personalizadas. Si no hay eventos, no se envía ni se crea un registro de envío de esa semana. Incluir la etiqueta DEMO, enlaces absolutos del sitio y texto plano.

Solo cuentas con correo confirmado y `marketing_opt_in = true` se consideran; obtener direcciones en el servidor desde Auth, sin exponerlas al navegador ni guardar una copia adicional para esta campaña. Comprobar de nuevo la preferencia inmediatamente antes de enviar. Una clave única por usuario y semana más una reclamación atómica evita envíos concurrentes habituales. Un fallo o respuesta incierta queda registrado sin reintento automático; la revocación concurrente después de la última comprobación puede coincidir con un envío ya iniciado. No se modifica el perfil de personas que no se suscribieron.

## Infraestructura, seguridad y operación

Usar el cliente `sendBrevoEmail`, remitente y estilo del boleto existente, con etiquetas distintas para cada mensaje; escape HTML y URL canónica `siteConfig.siteUrl`. Dos endpoints internos invocados por programador, con `Authorization: Bearer <CRON_SECRET>` comparado en servidor y sin aceptación si falta el secreto. El horario diario puede configurarse en Vercel o un programador externo compatible; no se asume que la configuración por sí sola cree variables, aplique migraciones o habilite envíos. Ejecutar sin un secreto válido devuelve 401; sin configuración Brevo se registra fallo sin afectar checkout. RLS, privilegios mínimos y `service_role` solo servidor; ningún endpoint público lista direcciones ni permite elegir un destinatario arbitrario para envío inmediato. Validar tamaño de entrada, origen de las mutaciones y aplicar límite de solicitudes antes de exponer el formulario; no registrar correos, tokens ni secretos en logs.

Se exige aprobación/consentimiento del propietario del correo para cada tipo de mensaje, no métricas inventadas y copys en español con distintivo DEMO. Pruebas con cliente Brevo simulado para evitar correos reales; la comprobación real se hace solo con destinatario de prueba autorizado y configuración disponible. El despliegue, migraciones y programación son pasos separados del código. Verificar restricciones reales del plan de Vercel y cuotas de Brevo antes de programar.

## Aceptación

- Invitado y cuenta pueden solicitar un único recordatorio; se respeta el plazo, se revalida evento y se evita el envío tras compra ya confirmada o cancelación observada.
- Solo cuentas suscritas y confirmadas reciben la selección semanal; desuscripción desde cuenta y exclusión de eventos pasados/no publicados comprobadas.
- Ejecuciones simultáneas no reclaman dos veces la misma fila; se documentan las ventanas de carrera con envío externo y fallos inciertos, sin afirmar entrega exactamente una vez.
- No hay envíos reales en pruebas automatizadas; pruebas, lint, typecheck y build se registran, y las dos tareas del backlog solo pasan a terminado cuando se cumplan sus criterios.
