/**
 * Utilitários compartilhados para geração de mensagens SWIFT MT
 */

export function formatSwiftAmount(amount: number): string {
  return amount.toFixed(2).replace('.', ',');
}

export function formatSwiftDate(date?: Date | string): string {
  const d = date ? new Date(date) : new Date();
  const yy = d.getFullYear().toString().slice(-2);
  const mm = (d.getMonth() + 1).toString().padStart(2, '0');
  const dd = d.getDate().toString().padStart(2, '0');
  return `${yy}${mm}${dd}`;
}

export function formatBicBlock(bic: string): string {
  const cleaned = (bic || '').replace(/\s/g, '').toUpperCase();
  if (cleaned.length >= 12) return cleaned.substring(0, 12);
  if (cleaned.length >= 8) return cleaned.padEnd(12, 'X');
  return (cleaned || 'XXXXXXXX').padEnd(12, 'X');
}

export function formatBic8(bic: string): string {
  const cleaned = (bic || '').replace(/\s/g, '').toUpperCase();
  return cleaned.length >= 8 ? cleaned.substring(0, 8) : (cleaned || 'XXXXXXXX').padEnd(8, 'X');
}

export function escapeSwiftText(str: string): string {
  return (str || '')
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .trim();
}

export function generateUetr(): string {
  return typeof crypto !== 'undefined' && crypto.randomUUID
    ? crypto.randomUUID()
    : 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
        const r = (Math.random() * 16) | 0;
        return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16);
      });
}

export function buildSwiftMessage(
  mtCode: string,
  senderBic: string,
  receiverBic: string,
  block4Lines: string[],
  options?: { hasBlock3?: boolean }
): string {
  const block1 = `{1:F01${formatBicBlock(senderBic)}0000000000}`;
  const block2 = `{2:I${mtCode.replace(/[^0-9]/g, '')}${formatBicBlock(receiverBic)}N}`;
  const block4 = `{4:\n${block4Lines.join('\n')}\n-}`;
  const uetr = options?.hasBlock3 ? `{3:{111:001}{121:${generateUetr()}}}` : '';
  return uetr ? `${block1}${block2}${uetr}${block4}` : `${block1}${block2}${block4}`;
}
