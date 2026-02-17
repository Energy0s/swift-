/**
 * Utilitário para verificar se a rota pertence ao módulo SWIFT
 */

const SWIFT_PATHS = [
  '/dashboard',
  '/inbox',
  '/transfer',
  '/mt101',
  '/mt103',
  '/mt109',
  '/free',
  '/messages',
  '/swift',
];

export function checkSwiftPath(path: string): boolean {
  return SWIFT_PATHS.some((p) => path === p || path.startsWith(p + '/'));
}
