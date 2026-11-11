export type CheckInResult = 'checked_in' | 'already_checked_in' | 'not_found' | 'wrong_event';

export function normalizeScannedCode(input: string): string | null {
  const code = input.trim();
  return /^[A-Za-z0-9_-]+$/.test(code) ? code : null;
}

export function checkInMessage(result: CheckInResult): { tone: 'success' | 'warning' | 'error'; text: string } {
  switch (result) {
    case 'checked_in':
      return { tone: 'success', text: 'Entrada válida' };
    case 'already_checked_in':
      return { tone: 'warning', text: 'Esta entrada ya fue usada' };
    case 'wrong_event':
      return { tone: 'error', text: 'Este boleto es de otro evento' };
    case 'not_found':
      return { tone: 'error', text: 'Código no encontrado' };
  }
}
