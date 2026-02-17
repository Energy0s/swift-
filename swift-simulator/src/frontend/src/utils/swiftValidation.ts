/**
 * Regras de formatação SWIFT - Conjunto X (client-side)
 * :20 = 16x, :21 = 16x, :70/:79 = conjunto X
 */

const SWIFT_CHARSET_X = /^[a-zA-Z0-9/\-?:().,'+ \r\n]*$/;

export function validateField20(value: string): string | null {
  if (!value || typeof value !== 'string') return ':20: Referência é obrigatória';
  const t = value.trim();
  if (t.length === 0) return ':20: Referência não pode ser vazia';
  if (t.length > 16) return ':20: Máximo 16 caracteres (formato 16x)';
  if (!SWIFT_CHARSET_X.test(t)) return ':20: Caracteres inválidos. Permitidos: A-Z a-z 0-9 / - ? : ( ) . , \' + espaço';
  return null;
}

export function validateField21(value: string | undefined): string | null {
  if (!value || value.trim().length === 0) return null;
  const t = value.trim();
  if (t.length > 16) return ':21: Máximo 16 caracteres';
  if (!SWIFT_CHARSET_X.test(t)) return ':21: Caracteres inválidos (conjunto X)';
  return null;
}

export function validateSwiftTextX(value: string, maxLength?: number): string | null {
  if (!value) return null;
  if (maxLength !== undefined && value.length > maxLength) return `Máximo ${maxLength} caracteres`;
  if (!SWIFT_CHARSET_X.test(value)) return 'Caracteres inválidos. Permitidos: A-Z a-z 0-9 / - ? : ( ) . , \' + espaço';
  return null;
}
