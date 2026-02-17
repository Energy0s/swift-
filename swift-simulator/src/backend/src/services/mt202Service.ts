/**
 * Serviço de geração de mensagens SWIFT MT202
 * General Financial Institution Transfer — transferência entre bancos
 * Usado para liquidação interbancária (não transferência de cliente)
 * UETR obrigatório desde Nov/2018 (campo 121)
 */

import { generateUetr } from './mtUtils.js';

export interface Mt202Input {
  referenceNumber: string;
  relatedReference?: string;
  orderingBic: string;
  senderCorrespondentBic?: string;
  receiverCorrespondentBic?: string;
  beneficiaryBic: string;
  accountWithBic?: string;
  amount: number;
  currency: string;
  valueDate?: string;
  senderToReceiverInfo?: string;
}

function formatSwiftAmount(amount: number): string {
  return amount.toFixed(2).replace('.', ',');
}

function formatSwiftDate(date?: Date | string): string {
  const d = date ? new Date(date) : new Date();
  const yy = d.getFullYear().toString().slice(-2);
  const mm = (d.getMonth() + 1).toString().padStart(2, '0');
  const dd = d.getDate().toString().padStart(2, '0');
  return `${yy}${mm}${dd}`;
}

function formatBicBlock(bic: string): string {
  const cleaned = bic.replace(/\s/g, '').toUpperCase();
  if (cleaned.length >= 12) return cleaned.substring(0, 12);
  if (cleaned.length >= 8) return cleaned.padEnd(12, 'X');
  return cleaned.padEnd(12, 'X');
}

function formatBic8(bic: string): string {
  const cleaned = bic.replace(/\s/g, '').toUpperCase();
  return cleaned.length >= 8 ? cleaned.substring(0, 8) : cleaned.padEnd(8, 'X');
}

/**
 * Gera mensagem MT202 (General Financial Institution Transfer)
 * Tags: 20, 21, 32A, 52a, 53a, 54a, 58a obrigatórios
 */
export function generateMt202(transfer: Mt202Input): string {
  const date = formatSwiftDate(transfer.valueDate);
  const amount = formatSwiftAmount(transfer.amount);
  const orderingBic = formatBicBlock(transfer.orderingBic);
  const beneficiaryBic = formatBicBlock(transfer.beneficiaryBic);
  const relatedRef = (transfer.relatedReference || transfer.referenceNumber).substring(0, 16);

  const lines: string[] = [];
  lines.push(`:20:${transfer.referenceNumber.substring(0, 16)}`);
  lines.push(`:21:${relatedRef}`);
  lines.push(`:32A:${date}${transfer.currency}${amount}`);
  lines.push(`:52A:${formatBic8(transfer.orderingBic)}`);
  if (transfer.senderCorrespondentBic) {
    lines.push(`:53A:${formatBic8(transfer.senderCorrespondentBic)}`);
  }
  if (transfer.receiverCorrespondentBic) {
    lines.push(`:54A:${formatBic8(transfer.receiverCorrespondentBic)}`);
  }
  if (transfer.accountWithBic) {
    lines.push(`:57A:${formatBic8(transfer.accountWithBic)}`);
  }
  lines.push(`:58A:${formatBic8(transfer.beneficiaryBic)}`);
  if (transfer.senderToReceiverInfo) {
    const info = transfer.senderToReceiverInfo.substring(0, 35);
    lines.push(`:72:${info}`);
  }

  const block4 = lines.join('\n');

  const block1 = `{1:F01${orderingBic}0000000000}`;
  const block2 = `{2:I202${beneficiaryBic}N}`;
  const block3 = `{3:{111:001}{121:${generateUetr()}}}`;
  const block4Formatted = `{4:\n${block4}\n-}`;

  return `${block1}${block2}${block3}${block4Formatted}`;
}
