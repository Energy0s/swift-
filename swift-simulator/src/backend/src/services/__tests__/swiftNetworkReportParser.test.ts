/**
 * Testes do parser de Network Report
 */

import { parseNetworkReport } from '../swiftNetworkReportParser';

const EXAMPLE_RAW = `--------------------------------------------------Message Trailer----------------------------------------------
{CHK} : 41063056KDS
TRACKING : DH548IWBLD
PKI SIGNATURE : MAC-Equivalent
ACCESS CODE : GOSB78596124
RELEASE CODE : 598.D53225
--------------------------------------------------Interventions------------------------------------------------
Category : NETWORK REPORT
Creation Time : 16/12/2024 - 15:12:56
Application : SWIFT INTERFACE
Operator : SYSTEM
Text{1:F01DEUTDEDBSTG151256000}{3:{{119:STP}{111:001}{121:4148c3ec-4096-4dc2-8ab4-2f5c3e591729}{451:0}}
--------------------------------------------------End of Message ----------------------------------------------`;

describe('swiftNetworkReportParser', () => {
  it('extrai CHK corretamente', () => {
    const r = parseNetworkReport(EXAMPLE_RAW);
    expect(r.chk).toBe('41063056KDS');
  });

  it('extrai TRACKING corretamente', () => {
    const r = parseNetworkReport(EXAMPLE_RAW);
    expect(r.tracking).toBe('DH548IWBLD');
  });

  it('extrai PKI SIGNATURE corretamente', () => {
    const r = parseNetworkReport(EXAMPLE_RAW);
    expect(r.pki_signature).toBe('MAC-Equivalent');
  });

  it('extrai ACCESS CODE corretamente', () => {
    const r = parseNetworkReport(EXAMPLE_RAW);
    expect(r.access_code).toBe('GOSB78596124');
  });

  it('extrai RELEASE CODE corretamente', () => {
    const r = parseNetworkReport(EXAMPLE_RAW);
    expect(r.release_code).toBe('598.D53225');
  });

  it('extrai Category corretamente', () => {
    const r = parseNetworkReport(EXAMPLE_RAW);
    expect(r.category).toBe('NETWORK REPORT');
  });

  it('extrai Creation Time e converte para ISO', () => {
    const r = parseNetworkReport(EXAMPLE_RAW);
    expect(r.creation_time).toMatch(/2024-12-16T15:12:56/);
  });

  it('extrai Application corretamente', () => {
    const r = parseNetworkReport(EXAMPLE_RAW);
    expect(r.application).toBe('SWIFT INTERFACE');
  });

  it('extrai Operator corretamente', () => {
    const r = parseNetworkReport(EXAMPLE_RAW);
    expect(r.operator).toBe('SYSTEM');
  });

  it('preserva raw_text imutável', () => {
    const r = parseNetworkReport(EXAMPLE_RAW);
    expect(r.raw_text).toBe(EXAMPLE_RAW);
  });

  it('extrai blocos {1:...}{3:...} quando existirem', () => {
    const r = parseNetworkReport(EXAMPLE_RAW);
    expect(r.parsed_text_blocks).not.toBeNull();
    expect(r.parsed_text_blocks!['1']).toBeDefined();
    expect(r.parsed_text_blocks!['3']).toBeDefined();
  });

  it('retorna null para campos ausentes sem falhar', () => {
    const r = parseNetworkReport('texto mínimo sem campos');
    expect(r.chk).toBeNull();
    expect(r.tracking).toBeNull();
    expect(r.raw_text).toBe('texto mínimo sem campos');
  });
});
