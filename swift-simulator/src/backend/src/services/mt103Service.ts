/**
 * Serviço de geração de mensagens SWIFT MT103
 * Formato legado para transferências de crédito de cliente
 * Baseado na especificação SWIFT MT e demo Payment-Components
 */

export interface Mt103Input {
  referenceNumber: string;
  sourceIban: string;
  sourceBic: string;
  sourceHolderName: string;
  destinationIban: string;
  destinationBic: string;
  destinationHolderName: string;
  amount: number;
  currency: string;
  purpose?: string;
  /** 23B - Bank Operation Code: CRED, SPAY, SSTD, SPRI */
  bankOperationCode?: 'CRED' | 'SPAY' | 'SSTD' | 'SPRI';
  /** 71A - Details of Charges: OUR, BEN, SHA */
  detailsOfCharges?: 'OUR' | 'BEN' | 'SHA';
}

/**
 * Formata valor no padrão SWIFT (vírgula como separador decimal)
 */
function formatSwiftAmount(amount: number): string {
  return amount.toFixed(2).replace('.', ',');
}

/**
 * Formata data no padrão SWIFT (YYMMDD)
 */
function formatSwiftDate(): string {
  const now = new Date();
  const yy = now.getFullYear().toString().slice(-2);
  const mm = (now.getMonth() + 1).toString().padStart(2, '0');
  const dd = now.getDate().toString().padStart(2, '0');
  return `${yy}${mm}${dd}`;
}

/**
 * Garante BIC com 12 caracteres para Block 1/2
 * BIC8 usa XXX, BIC11 usa X para completar
 */
function formatBicBlock(bic: string): string {
  const cleaned = bic.replace(/\s/g, '').toUpperCase();
  if (cleaned.length >= 12) return cleaned.substring(0, 12);
  if (cleaned.length >= 8) return cleaned.padEnd(12, 'X');
  return cleaned.padEnd(12, 'X');
}

/**
 * Escapa caracteres especiais para formato SWIFT
 * Quebras de linha em endereços usam \n
 */
function escapeSwiftText(str: string): string {
  return str
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .replace(/\n/g, '\n')
    .trim();
}

/**
 * Gera mensagem MT103 (Customer Credit Transfer)
 * Formato SWIFT legado para transferências internacionais
 *
 * Estrutura:
 * - Block 1: Basic Header (BIC origem)
 * - Block 2: Application Header (tipo 103)
 * - Block 3: User Header (UETR, etc.)
 * - Block 4: Text (tags 20, 32A, 50, 59, 70)
 */
export function generateMt103(transfer: Mt103Input): string {
  const date = formatSwiftDate();
  const amount = formatSwiftAmount(transfer.amount);
  const sourceBic = formatBicBlock(transfer.sourceBic);
  const destBic = formatBicBlock(transfer.destinationBic);

  // UETR (Unique End-to-End Transaction Reference) - formato UUID (36 chars)
  const uetr = typeof crypto !== 'undefined' && crypto.randomUUID
    ? crypto.randomUUID()
    : 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
        const r = (Math.random() * 16) | 0;
        return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16);
      });

  const bankOp = transfer.bankOperationCode || 'CRED';
  const charges = transfer.detailsOfCharges || 'OUR';

  const lines: string[] = [];
  lines.push(`:20:${transfer.referenceNumber}`);
  lines.push(`:23B:${bankOp}`);
  lines.push(`:32A:${date}${transfer.currency}${amount}`);
  lines.push(`:50K:${escapeSwiftText(transfer.sourceHolderName)}`);
  lines.push(`:59F:/${transfer.destinationIban}`);
  lines.push(escapeSwiftText(transfer.destinationHolderName));

  if (transfer.purpose) {
    lines.push(`:70:${escapeSwiftText(transfer.purpose)}`);
  }
  lines.push(`:71A:${charges}`);

  const block4 = lines.join('\n');

  // Block 1: F=FIN, 01=GPI, BIC origem, sessão 0000, sequência 000000
  const block1 = `{1:F01${sourceBic}0000000000}`;
  // Block 2: I=Input, 103=MT103, BIC destino, N=Normal priority
  const block2 = `{2:I103${destBic}N}`;
  // Block 3: Service type 111, UETR 121
  const block3 = `{3:{111:001}{121:${uetr}}}`;
  // Block 4: Tags da mensagem
  const block4Formatted = `{4:\n${block4}\n-}`;

  return `${block1}${block2}${block3}${block4Formatted}`;
}
