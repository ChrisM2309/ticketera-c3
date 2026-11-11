import { describe, expect, it } from 'vitest';

import { hashTicketQrToken } from '@/features/ticketing/qr';
import { checkInMessage, normalizeScannedCode } from '@/features/ticketing/check-in';
import { hashScannedCode } from '@/features/ticketing/check-in-token';

describe('check-in', () => {
  it('recorta el código QR y acepta un token válido', () => {
    expect(normalizeScannedCode('  Abc_123-xyz\n')).toBe('Abc_123-xyz');
  });

  it('rechaza códigos vacíos o con caracteres inválidos', () => {
    expect(normalizeScannedCode(' \n ')).toBeNull();
    expect(normalizeScannedCode('token con espacios')).toBeNull();
    expect(normalizeScannedCode('token/ajeno')).toBeNull();
  });

  it('usa el mismo hash que la emisión del boleto', () => {
    expect(hashScannedCode('token-qr_123')).toBe(hashTicketQrToken('token-qr_123'));
  });

  it('muestra un mensaje específico por resultado del check-in', () => {
    expect(checkInMessage('checked_in').text).toBe('Entrada válida');
    expect(checkInMessage('already_checked_in').text).toBe('Esta entrada ya fue usada');
    expect(checkInMessage('not_found').text).toBe('Código no encontrado');
    expect(checkInMessage('wrong_event').text).toBe('Este boleto es de otro evento');
  });
});
