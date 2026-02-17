/**
 * Testes de unicidade e concorrência do SwiftAutoNumberingService
 */

import { generateAutoFields, getAutoFieldsForMessage } from '../swiftAutoNumberingService';

describe('swiftAutoNumberingService', () => {

  it('gera auto_fields com session e sequence únicos', async () => {
    const r1 = await generateAutoFields({ mtType: 'mt103', mtMessageId: 9001 });
    const r2 = await generateAutoFields({ mtType: 'mt103', mtMessageId: 9002 });
    expect(r1.session_number).toMatch(/^\d{4}$/);
    expect(r1.sequence_number).toMatch(/^\d{6}$/);
    expect(r2.session_number).toMatch(/^\d{4}$/);
    expect(r2.sequence_number).toMatch(/^\d{6}$/);
    expect(r1.uetr).not.toBe(r2.uetr);
    expect(`${r1.sender_lt}-${r1.session_number}-${r1.sequence_number}`).not.toBe(
      `${r2.sender_lt}-${r2.session_number}-${r2.sequence_number}`
    );
  });

  it('retorna o mesmo registro se já existir para a mensagem', async () => {
    const r1 = await generateAutoFields({ mtType: 'mt_free', mtMessageId: 9003 });
    const r2 = await generateAutoFields({ mtType: 'mt_free', mtMessageId: 9003 });
    expect(r1.uetr).toBe(r2.uetr);
    expect(r1.session_number).toBe(r2.session_number);
    expect(r1.sequence_number).toBe(r2.sequence_number);
  });

  it('getAutoFieldsForMessage retorna null quando não existe', () => {
    const r = getAutoFieldsForMessage('mt103', 999999);
    expect(r).toBeNull();
  });

  it('gera 100 auto_fields em paralelo sem colisões de UETR', async () => {
    const promises = Array.from({ length: 100 }, (_, i) =>
      generateAutoFields({ mtType: 'mt103', mtMessageId: 10000 + i })
    );
    const results = await Promise.all(promises);
    const uetrs = new Set(results.map((r) => r.uetr));
    expect(uetrs.size).toBe(100);
  });

  it('gera 100 auto_fields em paralelo sem colisões de session/sequence', async () => {
    const promises = Array.from({ length: 100 }, (_, i) =>
      generateAutoFields({ mtType: 'mt103', mtMessageId: 20000 + i })
    );
    const results = await Promise.all(promises);
    const keys = new Set(results.map((r) => `${r.sender_lt}-${r.session_number}-${r.sequence_number}`));
    expect(keys.size).toBe(100);
  });
});
