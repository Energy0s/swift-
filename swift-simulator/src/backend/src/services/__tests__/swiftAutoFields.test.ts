/**
 * Testes de unicidade e geração de campos SWIFT automáticos
 */

import {
  generateSessionSequence,
  generateUetr,
  generateChk,
  generateChkRandom,
  generateSenderReference,
  buildBlock1,
  buildBlock2,
  buildBlock3Gpi,
  buildBlock5,
} from '../swiftAutoFields';

describe('swiftAutoFields', () => {
  describe('generateSessionSequence', () => {
    it('retorna 10 dígitos', () => {
      const seq = generateSessionSequence();
      expect(seq).toMatch(/^\d{10}$/);
    });

    it('nunca repete em 1000 gerações', () => {
      const set = new Set();
      for (let i = 0; i < 1000; i++) {
        const s = generateSessionSequence();
        expect(set.has(s)).toBe(false);
        set.add(s);
      }
    });
  });

  describe('generateUetr', () => {
    it('retorna UUID v4 válido', () => {
      const uetr = generateUetr();
      expect(uetr).toMatch(
        /^[0-9A-F]{8}-[0-9A-F]{4}-4[0-9A-F]{3}-[89AB][0-9A-F]{3}-[0-9A-F]{12}$/i
      );
    });

    it('nunca repete em 1000 gerações', () => {
      const set = new Set();
      for (let i = 0; i < 1000; i++) {
        const u = generateUetr();
        expect(set.has(u)).toBe(false);
        set.add(u);
      }
    });
  });

  describe('generateChk', () => {
    it('retorna 12 caracteres hex', () => {
      const chk = generateChk('test message');
      expect(chk).toMatch(/^[0-9A-F]{12}$/);
    });

    it('é determinístico para mesmo conteúdo', () => {
      const msg = 'same content';
      expect(generateChk(msg)).toBe(generateChk(msg));
    });

    it('diferente para conteúdo diferente', () => {
      expect(generateChk('msg1')).not.toBe(generateChk('msg2'));
    });
  });

  describe('generateChkRandom', () => {
    it('retorna 12 caracteres hex', () => {
      const chk = generateChkRandom();
      expect(chk).toMatch(/^[0-9A-F]{12}$/);
    });
  });

  describe('generateSenderReference', () => {
    it('retorna string com prefixo REF', () => {
      const ref = generateSenderReference();
      expect(ref.startsWith('REF')).toBe(true);
    });

    it('não excede 35 caracteres', () => {
      const ref = generateSenderReference();
      expect(ref.length).toBeLessThanOrEqual(35);
    });
  });

  describe('buildBlock1', () => {
    it('formato correto', () => {
      const b1 = buildBlock1({ senderBic: 'BOMGBRS1XXX' });
      expect(b1).toMatch(/^\{1:F01[A-Z0-9]{12}\d{10}\}$/);
    });
  });

  describe('buildBlock2', () => {
    it('formato correto para MT103', () => {
      const b2 = buildBlock2({ mtCode: '103', receiverBic: 'UBSWCHZHXXX', priority: 'N' });
      expect(b2).toMatch(/^\{2:I103[A-Z0-9]{12}N\}$/);
    });
  });

  describe('buildBlock3Gpi', () => {
    it('contém 111 e 121', () => {
      const b3 = buildBlock3Gpi('550e8400-e29b-41d4-a716-446655440000');
      expect(b3).toContain('111:001');
      expect(b3).toContain('121:550e8400-e29b-41d4-a716-446655440000');
    });
  });

  describe('buildBlock5', () => {
    it('formato correto', () => {
      const b5 = buildBlock5('A1B2C3D4E5F6');
      expect(b5).toBe('{5:{CHK:A1B2C3D4E5F6}}');
    });

    it('com TNG quando solicitado', () => {
      const b5 = buildBlock5('A1B2C3D4E5F6', { tng: true });
      expect(b5).toContain('{TNG:}');
    });
  });

  describe('concorrência e carga', () => {
    it('gera 500 session/sequence em paralelo sem colisões', async () => {
      const count = 500;
      const promises = Array.from({ length: count }, () =>
        Promise.resolve(generateSessionSequence())
      );
      const results = await Promise.all(promises);
      const unique = new Set(results);
      expect(unique.size).toBe(count);
    });

    it('gera 500 UETR em paralelo sem colisões', async () => {
      const count = 500;
      const promises = Array.from({ length: count }, () => Promise.resolve(generateUetr()));
      const results = await Promise.all(promises);
      const unique = new Set(results);
      expect(unique.size).toBe(count);
    });
  });
});
