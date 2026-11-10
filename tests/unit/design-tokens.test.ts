import { describe, expect, it } from 'vitest';

import { contrast, darkTokens as dark, lightTokens as light } from './helpers/contrast';

describe('tokens de marca: contraste AA', () => {
  it('texto inverso sobre la acción cumple 4.5:1 en claro y en oscuro (botón primario)', () => {
    expect(contrast(light['texto-inverso'], light.accion)).toBeGreaterThanOrEqual(4.5);
    expect(contrast(light['texto-inverso'], light['accion-intensa'])).toBeGreaterThanOrEqual(4.5);
    expect(contrast(dark['texto-inverso'], dark.accion)).toBeGreaterThanOrEqual(4.5);
    expect(contrast(dark['texto-inverso'], dark['accion-intensa'])).toBeGreaterThanOrEqual(4.5);
  });

  it('texto y texto suave cumplen 4.5:1 sobre el fondo y las superficies', () => {
    expect(contrast(light.texto, light.fondo)).toBeGreaterThanOrEqual(4.5);
    expect(contrast(light['texto-suave'], light.fondo)).toBeGreaterThanOrEqual(4.5);
    expect(contrast(light['texto-suave'], light['superficie-sutil'])).toBeGreaterThanOrEqual(4.5);
    expect(contrast(dark.texto, dark.fondo)).toBeGreaterThanOrEqual(4.5);
    expect(contrast(dark['texto-suave'], dark.superficie)).toBeGreaterThanOrEqual(4.5);
  });

  it('el foco cumple 3:1 y el enlace 4.5:1 contra su fondo', () => {
    expect(contrast(light.foco, light.superficie)).toBeGreaterThanOrEqual(3);
    expect(contrast(dark.foco, dark.fondo)).toBeGreaterThanOrEqual(3);
    expect(contrast(light.enlace, light.superficie)).toBeGreaterThanOrEqual(4.5);
    expect(contrast(dark.enlace, dark.fondo)).toBeGreaterThanOrEqual(4.5);
  });

  it('el borde de campos cumple 3:1 sobre la superficie clara', () => {
    expect(contrast(light['borde-fuerte'], light.superficie)).toBeGreaterThanOrEqual(3);
  });
});
