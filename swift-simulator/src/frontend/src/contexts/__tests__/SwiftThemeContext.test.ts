/**
 * Testes do SwiftThemeProvider e checkSwiftPath
 */

import { checkSwiftPath } from '../../utils/swiftThemePaths';

describe('SwiftThemeContext', () => {
  describe('checkSwiftPath', () => {
    it('retorna true para rotas do módulo SWIFT', () => {
      expect(checkSwiftPath('/dashboard')).toBe(true);
      expect(checkSwiftPath('/inbox')).toBe(true);
      expect(checkSwiftPath('/inbox/123')).toBe(true);
      expect(checkSwiftPath('/transfer')).toBe(true);
      expect(checkSwiftPath('/mt103')).toBe(true);
      expect(checkSwiftPath('/mt103/1')).toBe(true);
      expect(checkSwiftPath('/swift/search')).toBe(true);
      expect(checkSwiftPath('/swift/runbook')).toBe(true);
      expect(checkSwiftPath('/swift/audit')).toBe(true);
    });

    it('retorna false para rotas fora do módulo SWIFT', () => {
      expect(checkSwiftPath('/login')).toBe(false);
      expect(checkSwiftPath('/profile')).toBe(false);
      expect(checkSwiftPath('/transactions')).toBe(false);
      expect(checkSwiftPath('/')).toBe(false);
    });
  });
});
