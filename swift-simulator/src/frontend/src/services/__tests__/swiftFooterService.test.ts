/**
 * Testes do serviço getSwiftFooter e schema SwiftFooterData
 */

jest.mock('../api', () => ({
  __esModule: true,
  default: {
    get: jest.fn(),
  },
}));

import { getSwiftFooter, type SwiftFooterData } from '../swiftHeaderService';
import api from '../api';

describe('swiftFooterService', () => {
  it('getSwiftFooter chama /swift/footer', async () => {
    const mockData: SwiftFooterData = {
      environment: 'UAT',
      logicalTerminal: 'BOMGBRS1XXX',
      session: { sessionNumber: '0001', sequenceNumber: '000042' },
      operator: { idShort: '1' },
      serverTime: { iso: '2026-02-14T12:00:00', tz: 'America/Sao_Paulo' },
      lastRefreshAt: { iso: '2026-02-14T12:00:00', tz: 'America/Sao_Paulo' },
      traffic15m: { sentCount: 0, receivedCount: 0, nackCount: 0, holdsCount: 0 },
      build: { version: '1.0.0', commit: 'abc1234' },
    };
    (api.get as jest.Mock).mockResolvedValue({ data: { status: 'success', data: mockData } });
    const result = await getSwiftFooter();
    expect(api.get).toHaveBeenCalledWith('/swift/footer');
    expect(result.data?.data?.environment).toBe('UAT');
    expect(result.data?.data?.traffic15m.sentCount).toBe(0);
    expect(result.data?.data?.build.version).toBe('1.0.0');
  });

  it('SwiftFooterData schema tem campos obrigatórios', () => {
    const d: SwiftFooterData = {
      environment: 'PROD',
      logicalTerminal: 'XXX',
      session: { sessionNumber: null, sequenceNumber: null },
      operator: { idShort: null },
      serverTime: { iso: '', tz: '' },
      lastRefreshAt: { iso: '', tz: '' },
      traffic15m: { sentCount: 0, receivedCount: 0, nackCount: 0, holdsCount: 0 },
      build: { version: '', commit: '' },
    };
    expect(d.environment).toBeDefined();
    expect(d.traffic15m).toHaveProperty('sentCount');
    expect(d.traffic15m).toHaveProperty('receivedCount');
    expect(d.traffic15m).toHaveProperty('nackCount');
    expect(d.traffic15m).toHaveProperty('holdsCount');
  });
});
