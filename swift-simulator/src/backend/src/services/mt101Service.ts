/**
 * Serviço MT101 - Validação, FIN, transições de status
 */

import type { Mt101Message, Mt101Transaction, Mt101MessageStatus } from '../store/mt101Types.js';
import {
  formatSwiftAmount,
  formatSwiftDate,
  formatBicBlock,
  formatBic8,
  escapeSwiftText,
  buildSwiftMessage,
  generateUetr,
} from './mtUtils.js';
import { validateField20, validateSwiftTextX } from './swiftValidation.js';

const ISO_CURRENCIES = ['EUR', 'USD', 'GBP', 'CHF', 'JPY', 'BRL', 'CAD', 'AUD', 'CNY', 'MXN'];
const EDITABLE_STATUSES: Mt101MessageStatus[] = ['Draft'];
const RELEASED_STATUSES: Mt101MessageStatus[] = ['Released to SWIFT', 'ACK Received', 'NACK Received', 'Completed'];

export interface Mt101ValidationResult {
  valid: boolean;
  errors: string[];
}

export function validateMt101(msg: Mt101Message): Mt101ValidationResult {
  const errors: string[] = [];

  const ref20 = validateField20(msg.transactionReferenceNumber || '');
  if (!ref20.valid) errors.push(ref20.error!);
  if (msg.transactions.length > 1 && (!msg.messageIndex || !msg.messageTotal)) {
    errors.push(':28D: Message Index/Total é obrigatório quando há múltiplas instruções');
  }
  if (!msg.executionDetails?.requestedExecutionDate) {
    errors.push(':30: Requested Execution Date é obrigatório');
  } else {
    const execDate = new Date(msg.executionDetails.requestedExecutionDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    execDate.setHours(0, 0, 0, 0);
    if (execDate < today) {
      errors.push(':30: Requested Execution Date deve ser >= hoje');
    }
  }

  if (msg.transactions.length === 0) {
    errors.push('Pelo menos uma transação é obrigatória');
  }

  for (let i = 0; i < msg.transactions.length; i++) {
    const tx = msg.transactions[i];
    if (!tx.currency || !ISO_CURRENCIES.includes(tx.currency)) {
      errors.push(`Transação ${i + 1}: Currency deve ser ISO válido (ex: EUR, USD)`);
    }
    if (!tx.amount || tx.amount <= 0) {
      errors.push(`Transação ${i + 1}: Amount deve ser > 0`);
    }
    if (!tx.beneficiaryName?.trim() && !tx.beneficiaryIban?.trim()) {
      errors.push(`Transação ${i + 1}: :59: Beneficiary (nome ou IBAN) é obrigatório`);
    }
    if (!tx.chargesType || !['OUR', 'SHA', 'BEN'].includes(tx.chargesType)) {
      errors.push(`Transação ${i + 1}: :71A: Details of Charges (OUR/SHA/BEN) é obrigatório`);
    }
    if (tx.remittanceInformation) {
      if (tx.remittanceInformation.length > 140) errors.push(`Transação ${i + 1}: :70: Remittance máximo 140 caracteres`);
      const r70 = validateSwiftTextX(tx.remittanceInformation, 140);
      if (!r70.valid) errors.push(`Transação ${i + 1}: :70: ${r70.error}`);
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

export function canEdit(msg: Mt101Message): boolean {
  return EDITABLE_STATUSES.includes(msg.messageStatus) || msg.repairRequiredFlag === true;
}

export function isReleasedOrLater(msg: Mt101Message): boolean {
  return RELEASED_STATUSES.includes(msg.messageStatus);
}

export function generateMt101Fin(msg: Mt101Message): string {
  const senderBic = msg.swiftHeader?.logicalTerminal || 'XXXXXXXX';
  const receiverBic = msg.swiftHeader?.receiverBic || 'XXXXXXXX';
  const lines: string[] = [];

  lines.push(`:20:${escapeSwiftText(msg.transactionReferenceNumber || '')}`);
  if (msg.customerSpecifiedReference) {
    lines.push(`:21R:${escapeSwiftText(msg.customerSpecifiedReference)}`);
  }
  if (msg.messageIndex !== undefined && msg.messageTotal !== undefined) {
    lines.push(`:28D:${msg.messageIndex}/${msg.messageTotal}`);
  }
  lines.push(`:30:${formatSwiftDate(msg.executionDetails?.requestedExecutionDate)}`);
  if (msg.executionDetails?.instructionCode) {
    lines.push(`:23E:${escapeSwiftText(msg.executionDetails.instructionCode)}`);
  }

  const ord = msg.orderingCustomer;
  if (ord?.orderingIban) {
    lines.push(`:50K:/${ord.orderingIban}`);
    if (ord.orderingCustomerName) {
      lines.push(escapeSwiftText(ord.orderingCustomerName));
    }
  } else if (ord?.orderingCustomerName) {
    lines.push(`:50K:${escapeSwiftText(ord.orderingCustomerName)}`);
  }

  for (const tx of msg.transactions) {
    lines.push(`:32B:${tx.currency}${formatSwiftAmount(tx.amount)}`);
    if (tx.accountWithInstitution) {
      lines.push(`:57A:${formatBic8(tx.accountWithInstitution)}`);
    }
    const benLine = tx.beneficiaryIban
      ? `:59:/${tx.beneficiaryIban}\n${escapeSwiftText(tx.beneficiaryName || '')}`
      : `:59:${escapeSwiftText(tx.beneficiaryName || '')}`;
    lines.push(benLine);
    if (tx.remittanceInformation) {
      lines.push(`:70:${escapeSwiftText(tx.remittanceInformation.substring(0, 140))}`);
    }
    lines.push(`:71A:${tx.chargesType}`);
    if (tx.senderChargesAmount !== undefined && tx.senderChargesAmount > 0) {
      lines.push(`:71F:${tx.currency}${formatSwiftAmount(tx.senderChargesAmount)}`);
    }
    if (tx.receiverChargesAmount !== undefined && tx.receiverChargesAmount > 0) {
      lines.push(`:71G:${tx.currency}${formatSwiftAmount(tx.receiverChargesAmount)}`);
    }
    if (tx.senderToReceiverInformation) {
      lines.push(`:72:${escapeSwiftText(tx.senderToReceiverInformation)}`);
    }
  }

  return buildSwiftMessage('101', senderBic, receiverBic, lines);
}

export function requireFourEyes(approver1: number, approver2: number): boolean {
  return approver1 !== approver2 && approver1 > 0 && approver2 > 0;
}
