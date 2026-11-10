import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, test } from 'vitest';

const carpeta = join(process.cwd(), 'docs', 'design', 'wireframes');
const pantallas = ['01-home.svg', '02-categoria.svg', '03-evento.svg', '04-carrito-pago.svg', '05-confirmacion.svg'];
const flujoMovil = '06-flujo-movil.svg';
const estados = ['vacío', 'agotado', 'error', 'pago rechazado', 'gratis'];

function leer(archivo: string): string {
  return readFileSync(join(carpeta, archivo), 'utf8');
}

// Bloque de una tabla de dibujo: desde su <g id="..."> hasta el siguiente grupo con id.
function bloque(svg: string, id: string): string {
  const inicio = svg.indexOf(`<g id="${id}"`);
  if (inicio === -1) return '';
  const fin = svg.indexOf('<g id="', inicio + 1);
  return svg.slice(inicio, fin === -1 ? undefined : fin);
}

// Textos visibles de cada <text>, sin etiquetas.
function textos(svg: string): string[] {
  return [...svg.matchAll(/<text[^>]*>([^<]*)<\/text>/g)].map((m) => m[1].trim());
}

// Algún texto visible contiene la cadena indicada.
function muestra(svg: string, cadena: string): boolean {
  return textos(svg).some((texto) => texto.includes(cadena));
}

// XML bien formado sin dependencias: cada etiqueta se cierra en su orden y sin atributos repetidos.
function esXmlBienFormado(svg: string): boolean {
  const sinComentarios = svg.replace(/<!--[\s\S]*?-->/g, '');
  const pila: string[] = [];
  for (const m of sinComentarios.matchAll(/<(\/?)([A-Za-z][\w:-]*)(?:\s[^<>]*?)?(\/?)>/g)) {
    const [etiqueta, cierre, nombre, autocierre] = m;
    const atributos = [...etiqueta.matchAll(/\s([\w:-]+)="/g)].map((a) => a[1]);
    if (new Set(atributos).size !== atributos.length) return false;
    if (autocierre) continue;
    if (cierre) {
      if (pila.pop() !== nombre) return false;
    } else {
      pila.push(nombre);
    }
  }
  return pila.length === 0;
}

describe('wireframes de las cinco pantallas (WF-01)', () => {
  test('existen los cinco wireframes', () => {
    const faltantes = pantallas.filter((archivo) => !existsSync(join(carpeta, archivo)));

    expect(faltantes).toEqual([]);
  });

  test('cada SVG es XML bien formado con title y las dos tablas de dibujo', () => {
    for (const archivo of pantallas) {
      const svg = leer(archivo);

      expect(svg, archivo).toMatch(/^<svg[\s>]/);
      expect(esXmlBienFormado(svg), archivo).toBe(true);
      expect(svg, archivo).toMatch(/<title>[^<]+<\/title>/);
      expect(svg, archivo).toMatch(/<g id="movil"/);
      expect(svg, archivo).toMatch(/<g id="escritorio"/);
    }
  });

  test('cada tabla de dibujo mide 375×812 en móvil y 1280×800 en escritorio', () => {
    for (const archivo of pantallas) {
      const svg = leer(archivo);

      expect(bloque(svg, 'movil'), archivo).toMatch(/<rect class="marco" x="0" y="0" width="375" height="812"/);
      expect(bloque(svg, 'escritorio'), archivo).toMatch(/<rect class="marco" x="0" y="0" width="1280" height="800"/);
    }
  });

  test('cada pantalla trae anotaciones con prefijo Nota:', () => {
    for (const archivo of pantallas) {
      const notas = textos(leer(archivo)).filter((texto) => texto.startsWith('Nota:'));

      expect(notas.length, archivo).toBeGreaterThanOrEqual(3);
    }
  });

  test('son de baja fidelidad: sin colores literales, gradientes, emojis ni caracteres de reemplazo', () => {
    for (const archivo of pantallas) {
      const svg = leer(archivo);

      expect(svg, archivo).not.toMatch(/#[0-9a-fA-F]{3,8}\b/);
      expect(svg, archivo).not.toMatch(/\s(fill|stroke|color)="(?!none"|currentColor"|transparent")/);
      expect(svg, archivo).not.toMatch(/Gradient/);
      expect(svg, archivo).not.toMatch(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/u);
      expect(svg, archivo).not.toContain('�');
    }
  });

  test('el Home muestra eventos y categorías, el logo a Home y no tiene «Inicio» en el menú', () => {
    const svg = leer('01-home.svg');

    for (const texto of ['Próximos eventos', 'Categorías', 'Gratis', 'Iniciar sesión']) {
      expect(muestra(svg, texto), texto).toBe(true);
    }
    expect(muestra(svg, 'Logo')).toBe(true);
    expect(textos(svg)).not.toContain('Inicio');
    expect(bloque(svg, 'movil')).toMatch(/Próximos eventos/);
  });

  test('la categoría tiene filtros de tema, fecha, precio y ciudad, y bloque de destacados', () => {
    const svg = leer('02-categoria.svg');

    for (const texto of ['Tema', 'Fecha', 'Precio', 'Ciudad', 'Destacados de congresos', 'Congresos de tecnología']) {
      expect(muestra(svg, texto), texto).toBe(true);
    }
  });

  test('el evento muestra agenda, ponentes, agregar al calendario y compartir', () => {
    const svg = leer('03-evento.svg');

    for (const texto of ['Agenda', 'Ponentes', 'Agregar al calendario', 'Compartir']) {
      expect(muestra(svg, texto), texto).toBe(true);
    }
    expect(bloque(svg, 'movil')).toMatch(/Comprar entradas/);
  });

  test('carrito y pago permiten comprar sin cuenta, muestran comisión y total, y etiquetan el pago como DEMO', () => {
    const svg = leer('04-carrito-pago.svg');

    for (const texto of ['Continuar como invitado', 'Iniciar sesión', 'Comisión', 'Total', 'Pago de demostración', 'DEMO']) {
      expect(muestra(svg, texto), texto).toBe(true);
    }
  });

  test('la confirmación muestra boleto con QR, envío simulado por correo y WhatsApp, calendario y compartir', () => {
    const svg = leer('05-confirmacion.svg');

    expect(muestra(svg, 'QR')).toBe(true);
    expect(muestra(svg, 'correo (simulado)')).toBe(true);
    expect(muestra(svg, 'WhatsApp (simulado)')).toBe(true);
    for (const texto of ['Agregar al calendario', 'Compartir']) {
      expect(muestra(svg, texto), texto).toBe(true);
    }
  });
});

describe('flujo móvil con estados (WF-02)', () => {
  test('el flujo móvil muestra los estados vacío, agotado, error, pago rechazado y gratis', () => {
    const svg = leer(flujoMovil);

    for (const estado of estados) {
      expect(
        textos(svg).some((texto) => texto.startsWith('Estado:') && texto.includes(estado)),
        estado,
      ).toBe(true);
    }
  });

  test('el flujo es XML bien formado, de baja fidelidad y recorre las cinco pantallas en 4 clics', () => {
    const svg = leer(flujoMovil);

    expect(svg).toMatch(/^<svg[\s>]/);
    expect(esXmlBienFormado(svg)).toBe(true);
    expect(svg).toMatch(/<title>[^<]+<\/title>/);
    expect(svg).not.toMatch(/#[0-9a-fA-F]{3,8}\b/);
    expect(svg).not.toMatch(/\s(fill|stroke|color)="(?!none"|currentColor"|transparent")/);
    expect(svg).not.toMatch(/Gradient/);
    expect(svg).not.toMatch(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/u);
    expect(svg).not.toContain('�');
    for (const pantalla of ['Home', 'Categoría', 'Evento', 'Carrito y pago', 'Confirmación']) {
      expect(muestra(svg, pantalla), pantalla).toBe(true);
    }
    expect(muestra(svg, '4 clics hasta el boleto')).toBe(true);
  });
});

describe('README de wireframes', () => {
  test('el README enlaza cada wireframe', () => {
    const readme = readFileSync(join(carpeta, 'README.md'), 'utf8');

    for (const archivo of [...pantallas, flujoMovil]) {
      expect(readme, archivo).toContain(`](${archivo})`);
    }
  });
});
