/**
 * Serviço MT109 - Advice of Cheque(s)
 * Validação, geração FIN, transições
 */

import type { Mt109Message, Mt109MessageStatus, Mt109Cheque } from '../store/mt109Types.js';
import {
  formatSwiftAmount,
  formatSwiftDate,
  formatBicBlock,
  formatBic8,
  escapeSwiftText,
} from './mtUtils.js';
import { validateField20, validateField21, validateSwiftTextX } from './swiftValidation.js';

const ISO_CURRENCIES = ['EUR', 'USD', 'GBP', 'CHF', 'JPY', 'BRL', 'CAD', 'AUD', 'CNY', 'MXN'];
const EDITABLE_STATUSES: Mt109MessageStatus[] = ['Draft'];
const RELEASED_STATUSES: Mt109MessageStatus[] = ['Released to SWIFT', 'ACK Received', 'NACK Received', 'Completed'];

export interface Mt109ValidationResult {
  valid: boolean;
  errors: string[];
}

export function validateMt109(msg: Mt109Message): Mt109ValidationResult {
  const errors: string[] = [];

  const ref20 = validateField20(msg.transactionReferenceNumber || '');
  if (!ref20.valid) errors.push(ref20.error!);
  const ref21 = validateField21(msg.relatedReference);
  if (!ref21.valid) errors.push(ref21.error!);
  if (!msg.dateOfIssue) errors.push(':30: Date of Issue é obrigatório');

  const ord = msg.orderingCustomer;
  if (!ord?.orderingName?.trim() && !ord?.orderingAccountNumber?.trim()) {
    errors.push(':50: Ordering Customer (nome ou conta) é obrigatório');
  }

  const ben = msg.beneficiary;
  if (!ben?.beneficiaryName?.trim() && !ben?.beneficiaryAccount?.trim()) {
    errors.push(':59: Beneficiary (nome ou conta) é obrigatório');
  }

  if (!msg.cheques?.length) {
    errors.push('Pelo menos 1 cheque é obrigatório');
  } else {
    msg.cheques.forEach((ch, i) => {
      if (!ch.chequeNumber?.trim()) errors.push(`Cheque ${i + 1}: Cheque Number é obrigatório`);
      if (!ch.currency || !ISO_CURRENCIES.includes(ch.currency)) errors.push(`Cheque ${i + 1}: Currency ISO válida obrigatória`);
      if (!ch.chequeAmount || ch.chequeAmount <= 0) errors.push(`Cheque ${i + 1}: Amount deve ser > 0`);
    });
  }

  if (!msg.detailsOfCharges || !['OUR', 'SHA', 'BEN'].includes(msg.detailsOfCharges)) {
    errors.push(':71A: Details of Charges (OUR/SHA/BEN) é obrigatório');
  }

  return { valid: errors.length === 0, errors };
}

export function canEdit(msg: Mt109Message): boolean {
  return EDITABLE_STATUSES.includes(msg.messageStatus) || msg.repairRequiredFlag === true;
}

export function isReleasedOrLater(msg: Mt109Message): boolean {
  return RELEASED_STATUSES.includes(msg.messageStatus);
}

export function generateMt109Fin(msg: Mt109Message): string {
  const senderBic = msg.swiftHeader?.logicalTerminal || 'BOMGBRS1XXX';
  const receiverBic = msg.swiftHeader?.receiverBic || 'XXXXXXXX';
  const lines: string[] = [];

  lines.push(`:20:${escapeSwiftText(msg.transactionReferenceNumber || '')}`);
  if (msg.relatedReference) lines.push(`:21:${escapeSwiftText(msg.relatedReference)}`);
  const dateStr = msg.dateOfIssue ? formatSwiftDate(msg.dateOfIssue) : formatSwiftDate();
  lines.push(`:30:${dateStr}`);

  if (msg.orderingInstitution) lines.push(`:52A:${formatBic8(msg.orderingInstitution)}`);

  const ord = msg.orderingCustomer;
  if (ord?.orderingAccountNumber) {
    lines.push(`:50K:/${ord.orderingAccountNumber}`);
    if (ord.orderingName) lines.push(escapeSwiftText(ord.orderingName));
  } else if (ord?.orderingName) {
    lines.push(`:50K:${escapeSwiftText(ord.orderingName)}`);
  }

  const ben = msg.beneficiary;
  if (ben?.beneficiaryAccount) {
    lines.push(`:59:/${ben.beneficiaryAccount}`);
    if (ben.beneficiaryName) lines.push(escapeSwiftText(ben.beneficiaryName));
  } else if (ben?.beneficiaryName) {
    lines.push(`:59:${escapeSwiftText(ben.beneficiaryName)}`);
  }

  msg.cheques?.forEach((ch: Mt109Cheque) => {
    if (ch.chequeNumber) lines.push(`:21:${escapeSwiftText(ch.chequeNumber)}`);
    lines.push(`:32B:${ch.currency}${formatSwiftAmount(ch.chequeAmount)}`);
    if (ch.remittanceInformation) lines.push(`:70:${escapeSwiftText(ch.remittanceInformation.substring(0, 140))}`);
    if (ch.senderToReceiverInfo) lines.push(`:72:${escapeSwiftText(ch.senderToReceiverInfo.substring(0, 140))}`);
  });

  lines.push(`:71A:${msg.detailsOfCharges}`);

  const block1 = `{1:F01${formatBicBlock(senderBic)}0000000000}`;
  const block2 = `{2:I109${formatBicBlock(receiverBic)}N}`;
  const block4 = `{4:\n${lines.join('\n')}\n-}`;
  const block5 = `{5:{CHK:${escapeSwiftText(msg.transactionReferenceNumber || '')}}}`;
  return `${block1}${block2}${block4}${block5}`;
}

export function requireFourEyes(approver1: number, approver2: number): boolean {
  return approver1 !== approver2 && approver1 > 0 && approver2 > 0;
}
