/**
 * Regras de formatação SWIFT conforme especificação FIN
 * Conjunto de caracteres X (SWIFT) e validações de campos
 */

/**
 * Conjunto de caracteres X - SWIFT FIN
 * a-z A-Z 0-9 / - ? : ( ) . , ' + CrLf Espaço
 * Caracteres como @ # $ % & * não são permitidos
 */
const SWIFT_CHARSET_X_REGEX = /^[a-zA-Z0-9/\-?:().,'+ \r\n]*$/;

const REF20_MAX = 35;
const REF21_MAX = 35;

/**
 * Valida campo :20 (Sender's Reference) - conjunto X
 */
export function validateField20(value: string): { valid: boolean; error?: string } {
  if (!value || typeof value !== 'string') {
    return { valid: false, error: ':20: Referência é obrigatória' };
  }
  const trimmed = value.trim();
  if (trimmed.length === 0) {
    return { valid: false, error: ':20: Referência não pode ser vazia' };
  }
  if (trimmed.length > REF20_MAX) {
    return { valid: false, error: `:20: Máximo ${REF20_MAX} caracteres` };
  }
  if (!SWIFT_CHARSET_X_REGEX.test(trimmed)) {
    return { valid: false, error: ':20: Caracteres inválidos. Permitidos: A-Z a-z 0-9 / - ? : ( ) . , \' + e espaço' };
  }
  return { valid: true };
}

/**
 * Valida campo :21 (Related Reference)
 */
export function validateField21(value: string | undefined): { valid: boolean; error?: string } {
  if (!value || value.trim().length === 0) return { valid: true };
  const trimmed = value.trim();
  if (trimmed.length > REF21_MAX) {
    return { valid: false, error: `:21: Máximo ${REF21_MAX} caracteres` };
  }
  if (!SWIFT_CHARSET_X_REGEX.test(trimmed)) {
    return { valid: false, error: ':21: Caracteres inválidos. Conjunto X: A-Z a-z 0-9 / - ? : ( ) . , \' + espaço' };
  }
  return { valid: true };
}

/**
 * Valida texto para campos que usam conjunto X (ex: :79, :70, :72)
 * maxLength opcional
 */
export function validateSwiftTextX(value: string, maxLength?: number): { valid: boolean; error?: string } {
  if (!value || typeof value !== 'string') return { valid: true };
  if (maxLength !== undefined && value.length > maxLength) {
    return { valid: false, error: `Máximo ${maxLength} caracteres` };
  }
  if (!SWIFT_CHARSET_X_REGEX.test(value)) {
    return { valid: false, error: 'Caracteres inválidos. Permitidos: A-Z a-z 0-9 / - ? : ( ) . , \' + espaço e quebras de linha' };
  }
  return { valid: true };
}

/**
 * Sanitiza string para conjunto X - remove caracteres inválidos
 * Útil para garantir que o output FIN seja válido
 */
export function sanitizeForSwiftX(value: string): string {
  if (!value || typeof value !== 'string') return '';
  return value.replace(/[^a-zA-Z0-9/\-?:().,'+ \r\n]/g, ' ').trim();
}

/**
 * Trunca e sanitiza referência :20
 */
export function sanitizeField20(value: string): string {
  return sanitizeForSwiftX(value).substring(0, REF20_MAX);
}
