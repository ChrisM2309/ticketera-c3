export type LegalSection = { id: string; title: string; paragraphs: string[] };

/*
 * Textos de demostración en lenguaje claro. Describen solo lo que el proyecto hace o hará;
 * el responsable debe revisarlos antes de publicar. Contacto: el mismo contacto DEMO del pie.
 */

export const privacySections: LegalSection[] = [
  {
    id: 'datos',
    title: 'Qué datos tratamos',
    paragraphs: [
      'Cuando compras entradas te pedimos tu nombre, tu correo y, si quieres, tu teléfono. No necesitas cuenta para comprar.',
      'Cuando existan cuentas para organizadores, guardaremos tu correo, tu nombre y, de forma opcional, tu universidad.',
      'Nunca pedimos ni guardamos datos de tarjeta: los pagos de este sitio son simulados.',
    ],
  },
  {
    id: 'finalidad',
    title: 'Para qué los usamos',
    paragraphs: [
      'Usamos los datos de compra para registrar tu orden, emitir tus boletos con código QR y enviarte la confirmación.',
      'Usamos los datos de cuenta para que los organizadores puedan ingresar y gestionar sus eventos.',
    ],
  },
  {
    id: 'analitica',
    title: 'Analítica',
    paragraphs: [
      'Cuando se active, la analítica será propia y solo se activará si aceptas. No la usaremos si la rechazas.',
      'Su fin es entender cómo se usa el sitio dentro del proyecto académico, sin vender ni compartir tus datos con terceros.',
    ],
  },
  {
    id: 'cookies',
    title: 'Cookies',
    paragraphs: [
      'Usamos cookies de sesión para mantener tu ingreso cuando tienes cuenta.',
      'Usamos una cookie para recordar tu decisión sobre el consentimiento.',
    ],
  },
  {
    id: 'conservacion',
    title: 'Cuánto tiempo los conservamos',
    paragraphs: [
      'Los datos de esta demostración se conservan solo mientras dure el proyecto académico.',
    ],
  },
  {
    id: 'derechos',
    title: 'Tus derechos',
    paragraphs: [
      'Puedes pedir acceder a tus datos, corregirlos o que los eliminemos.',
      'Para ejercer estos derechos escríbenos al contacto de demostración.',
    ],
  },
  {
    id: 'contacto',
    title: 'Contacto',
    paragraphs: [
      'Escríbenos al contacto de demostración que aparece al pie de cada página (contacto@ticketera.example). Es un dato ficticio con fines demostrativos.',
    ],
  },
  {
    id: 'demo',
    title: 'Sitio de demostración',
    paragraphs: [
      'Ticketera C3 es un proyecto académico DEMO. Toma el estilo visual de C3, pero no es un producto ni un servicio oficial de C3.',
    ],
  },
];

export const termsSections: LegalSection[] = [
  {
    id: 'alcance',
    title: 'Alcance',
    paragraphs: [
      'Este sitio permite descubrir eventos tecnológicos en El Salvador, simular la compra de entradas y proponer eventos como organizador.',
      'Al usarlo aceptas estos términos. Pueden cambiar mientras el proyecto avanza.',
    ],
  },
  {
    id: 'pagos-simulados',
    title: 'Pagos simulados',
    paragraphs: [
      'Los pagos son simulados: no se cobra dinero real y no se piden números de tarjeta.',
      'Las órdenes y los boletos se guardan en el sistema, pero no dan derecho a entrar a un evento real.',
    ],
  },
  {
    id: 'contenido',
    title: 'Contenido de eventos',
    paragraphs: [
      'Los eventos publicados son de demostración o los proponen organizadores. Solo se muestran los aprobados por la administración.',
      'Quien propone un evento es responsable de que la información sea veraz.',
    ],
  },
  {
    id: 'responsabilidad',
    title: 'Responsabilidad',
    paragraphs: [
      'El sitio se ofrece tal como está, con fines académicos. No garantizamos disponibilidad continua ni que los datos se conserven más allá del proyecto.',
    ],
  },
  {
    id: 'demo',
    title: 'Sitio de demostración',
    paragraphs: [
      'Ticketera C3 es un proyecto académico y no es un servicio oficial de C3.',
    ],
  },
];
