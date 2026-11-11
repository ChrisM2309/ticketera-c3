import { describe, expect, it } from 'vitest';
import { parseCampaign } from '@/lib/analytics/campaign';

describe('atribución de campaña', () => {
  it('acepta solo parámetros UTM acotados y sin datos personales', () => {
    expect(parseCampaign('?utm_source=boletin&utm_medium=email&utm_campaign=tech&utm_content=boton&utm_term=ia&token=secreto')).toEqual({
      utm_source: 'boletin', utm_medium: 'email', utm_campaign: 'tech', utm_content: 'boton', utm_term: 'ia',
    });
    expect(parseCampaign('?utm_source=persona%40ejemplo.com&utm_medium=https%3A%2F%2Fejemplo.com&utm_campaign=' + 'x'.repeat(81))).toEqual({});
  });
});
