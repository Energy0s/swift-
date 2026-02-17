/**
 * Serviço MT103 - Validação, FIN, transições
 * Separação do mt103Service.ts existente (geração para transfers)
 */

import type { Mt103Message, Mt103MessageStatus } from '../store/mt103Types.js';
import {
  formatSwiftAmount,
  formatSwiftDate,
  formatBic8,
  escapeSwiftText,
} from './mtUtils.js';
import {
  buildBlock1,
  buildBlock2,
  buildBlock3Gpi,
  buildBlock5,
  generateSessionSequence,
  generateUetr,
  generateChk,
} from './swiftAutoFields.js';
import { validateField20, validateSwiftTextX } from './swiftValidation.js';

const ISO_CURRENCIES = ['EUR', 'USD', 'GBP', 'CHF', 'JPY', 'BRL', 'CAD', 'AUD', 'CNY', 'MXN'];
const EDITABLE_STATUSES: Mt103MessageStatus[] = ['Draft'];
const RELEASED_STATUSES: Mt103MessageStatus[] = ['Released to SWIFT', 'ACK Received', 'NACK Received', 'Completed'];

export interface Mt103ValidationResult {
  valid: boolean;
  errors: string[];
}

export function validateMt103(msg: Mt103Message): Mt103ValidationResult {
  const errors: string[] = [];

  const ref20 = validateField20(msg.transactionReferenceNumber || '');
  if (!ref20.valid) errors.push(ref20.error!);
  if (!msg.bankOperationCode) errors.push(':23B: Bank Operation Code é obrigatório');
  if (!msg.valueDate) errors.push(':32A: Value Date é obrigatório');
  if (!msg.currency || !ISO_CURRENCIES.includes(msg.currency)) errors.push(':32A: Currency deve ser ISO válido');
  if (!msg.interbankSettledAmount || msg.interbankSettledAmount <= 0) errors.push(':32A: Amount deve ser > 0');

  const ord = msg.orderingCustomer;
  if (!ord?.orderingName?.trim() && !ord?.orderingIban?.trim() && !ord?.orderingAccountNumber?.trim()) {
    errors.push(':50: Ordering Customer (nome, IBAN ou conta) é obrigatório');
  }

  const ben = msg.beneficiaryCustomer;
  if (!ben?.beneficiaryName?.trim() && !ben?.beneficiaryIban?.trim() && !ben?.beneficiaryAccountNumber?.trim()) {
    errors.push(':59: Beneficiary Customer (nome, IBAN ou conta) é obrigatório');
  }

  if (!msg.detailsOfCharges || !['OUR', 'SHA', 'BEN'].includes(msg.detailsOfCharges)) {
    errors.push(':71A: Details of Charges (OUR/SHA/BEN) é obrigatório');
  }

  if (msg.remittanceInformation) {
    if (msg.remittanceInformation.length > 140) errors.push(':70: Remittance Information máximo 140 caracteres');
    const r70 = validateSwiftTextX(msg.remittanceInformation, 140);
    if (!r70.valid) errors.push(`:70: ${r70.error}`);
  }

  return { valid: errors.length === 0, errors };
}

export function canEdit(msg: Mt103Message): boolean {
  return EDITABLE_STATUSES.includes(msg.messageStatus) || msg.repairRequiredFlag === true;
}

export function isReleasedOrLater(msg: Mt103Message): boolean {
  return RELEASED_STATUSES.includes(msg.messageStatus);
}

export interface Mt103FinResult {
  finMessage: string;
  autoFields: { sessionSequence: string; uetr: string; chk: string };
}

export function generateMt103Fin(msg: Mt103Message): string;
export function generateMt103Fin(msg: Mt103Message, withAutoFields: true): Mt103FinResult;
export function generateMt103Fin(msg: Mt103Message, withAutoFields?: boolean): string | Mt103FinResult {
  const senderBic = msg.swiftHeader?.logicalTerminal || 'BOMGBRS1XXX';
  const receiverBic = msg.swiftHeader?.receiverBic || 'XXXXXXXX';
  const lines: string[] = [];

  lines.push(`:20:${escapeSwiftText(msg.transactionReferenceNumber || '')}`);
  lines.push(`:23B:${msg.bankOperationCode || 'CRED'}`);
  const dateStr = msg.valueDate ? formatSwiftDate(msg.valueDate) : formatSwiftDate();
  lines.push(`:32A:${dateStr}${msg.currency}${formatSwiftAmount(msg.interbankSettledAmount)}`);

  const ord = msg.orderingCustomer;
  if (ord?.orderingIban) {
    lines.push(`:50K:/${ord.orderingIban}`);
    if (ord.orderingName) lines.push(escapeSwiftText(ord.orderingName));
  } else if (ord?.orderingName) {
    lines.push(`:50K:${escapeSwiftText(ord.orderingName)}`);
  }

  const bank = msg.bankingDetails;
  if (bank?.orderingInstitution) lines.push(`:52A:${formatBic8(bank.orderingInstitution)}`);
  if (bank?.sendersCorrespondent) lines.push(`:53A:${formatBic8(bank.sendersCorrespondent)}`);
  if (bank?.receiversCorrespondent) lines.push(`:54A:${formatBic8(bank.receiversCorrespondent)}`);
  if (bank?.intermediaryInstitution) lines.push(`:56A:${formatBic8(bank.intermediaryInstitution)}`);
  if (bank?.accountWithInstitution) lines.push(`:57A:${formatBic8(bank.accountWithInstitution)}`);

  const ben = msg.beneficiaryCustomer;
  if (ben?.beneficiaryIban) {
    lines.push(`:59:/${ben.beneficiaryIban}`);
    if (ben.beneficiaryName) lines.push(escapeSwiftText(ben.beneficiaryName));
  } else if (ben?.beneficiaryName) {
    lines.push(`:59:${escapeSwiftText(ben.beneficiaryName)}`);
  }

  if (msg.remittanceInformation) {
    lines.push(`:70:${escapeSwiftText(msg.remittanceInformation.substring(0, 140))}`);
  }
  lines.push(`:71A:${msg.detailsOfCharges}`);
  if (msg.senderChargesAmount !== undefined && msg.senderChargesAmount > 0) {
    lines.push(`:71F:${msg.currency}${formatSwiftAmount(msg.senderChargesAmount)}`);
  }
  if (msg.receiverChargesAmount !== undefined && msg.receiverChargesAmount > 0) {
    lines.push(`:71G:${msg.currency}${formatSwiftAmount(msg.receiverChargesAmount)}`);
  }

  const h = msg.swiftHeader as Record<string, string> | undefined;
  const sessionSeq = h?.sessionNumber && h?.sequenceNumber
    ? `${h.sessionNumber}${h.sequenceNumber}`
    : generateSessionSequence();
  const uetr = h?.uetr || generateUetr();
  const block1 = buildBlock1({ senderBic, sessionSequence: sessionSeq });
  const block2 = buildBlock2({ mtCode: '103', receiverBic, priority: 'N' });
  const block3 = buildBlock3Gpi(uetr);
  const block4 = `{4:\n${lines.join('\n')}\n-}`;
  const bodyWithoutChk = `${block1}${block2}${block3}${block4}`;
  const chk = h?.chk || generateChk(bodyWithoutChk);
  const finMessage = `${bodyWithoutChk}${buildBlock5(chk)}`;

  if (withAutoFields) {
    return {
      finMessage,
      autoFields: { sessionSequence: sessionSeq, uetr, chk },
    };
  }
  return finMessage;
}

export function requireFourEyes(approver1: number, approver2: number): boolean {
  return approver1 !== approver2 && approver1 > 0 && approver2 > 0;
}
