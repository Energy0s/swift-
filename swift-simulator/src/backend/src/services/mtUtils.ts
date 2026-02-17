/**
 * Utilitários compartilhados para geração de mensagens SWIFT MT
 */

import {
  buildBlock1,
  buildBlock2,
  buildBlock5,
  generateSessionSequence,
  generateUetr,
  generateChk,
} from './swiftAutoFields.js';

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

export { generateUetr } from './swiftAutoFields.js';

export interface BuildSwiftMessageOptions {
  hasBlock3?: boolean;
  sessionSequence?: string;
  uetr?: string;
  senderReference?: string;
  includeBlock5?: boolean;
}

export function buildSwiftMessage(
  mtCode: string,
  senderBic: string,
  receiverBic: string,
  block4Lines: string[],
  options?: BuildSwiftMessageOptions
): string {
  const sessionSeq = options?.sessionSequence || generateSessionSequence();
  const block1 = buildBlock1({
    senderBic,
    sessionSequence: sessionSeq,
  });
  const block2 = buildBlock2({
    mtCode: mtCode.replace(/[^0-9]/g, ''),
    receiverBic,
    priority: 'N',
  });
  const block4 = `{4:\n${block4Lines.join('\n')}\n-}`;
  let body = '';
  if (options?.hasBlock3) {
    const uetr = options?.uetr || generateUetr();
    const block3 = `{3:{111:001}{121:${uetr}}}`;
    body = `${block1}${block2}${block3}${block4}`;
  } else {
    body = `${block1}${block2}${block4}`;
  }
  if (options?.includeBlock5) {
    const chk = generateChk(body);
    return `${body}${buildBlock5(chk)}`;
  }
  return body;
}
