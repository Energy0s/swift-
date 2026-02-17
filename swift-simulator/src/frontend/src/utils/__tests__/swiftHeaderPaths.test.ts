/**
 * Teste da função isSwiftPath
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

function isSwiftPath(path: string): boolean {
  return SWIFT_PATHS.some((p) => path === p || path.startsWith(p + '/'));
}

describe('isSwiftPath', () => {
  it('retorna true para rotas do módulo SWIFT', () => {
    expect(isSwiftPath('/dashboard')).toBe(true);
    expect(isSwiftPath('/inbox')).toBe(true);
    expect(isSwiftPath('/inbox/123')).toBe(true);
    expect(isSwiftPath('/transfer')).toBe(true);
    expect(isSwiftPath('/mt103')).toBe(true);
    expect(isSwiftPath('/mt103/1')).toBe(true);
    expect(isSwiftPath('/mt103/1/edit')).toBe(true);
    expect(isSwiftPath('/free')).toBe(true);
    expect(isSwiftPath('/swift/search')).toBe(true);
    expect(isSwiftPath('/swift/outbox')).toBe(true);
    expect(isSwiftPath('/swift/receipts/mt103/1')).toBe(true);
  });

  it('retorna false para rotas fora do módulo SWIFT', () => {
    expect(isSwiftPath('/profile')).toBe(false);
    expect(isSwiftPath('/login')).toBe(false);
    expect(isSwiftPath('/transactions')).toBe(false);
  });
});
