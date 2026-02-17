/**
 * Serviço MT Free - Mensagens Livres (MT199, MT299, MT999)
 */

import type { MtFreeMessage, MtFreeMessageStatus } from '../store/mtFreeTypes.js';
import { formatBicBlock, escapeSwiftText } from './mtUtils.js';
import {
  buildBlock1,
  buildBlock2,
  buildBlock3UetrOnly,
  buildBlock5,
  generateSessionSequence,
  generateUetr,
  generateChk,
} from './swiftAutoFields.js';
import { validateField20, validateField21, validateSwiftTextX } from './swiftValidation.js';

const MT_FREE_TYPES = ['MT199', 'MT299', 'MT999'] as const;
const NARRATIVE_MAX_LENGTH = 3500;
const EDITABLE_STATUSES: MtFreeMessageStatus[] = ['Draft'];
const RELEASED_STATUSES: MtFreeMessageStatus[] = ['Released to SWIFT', 'ACK Received', 'NACK Received', 'Completed'];

function isValidBic(bic: string): boolean {
  const cleaned = (bic || '').replace(/\s/g, '').toUpperCase();
  if (cleaned.length !== 8 && cleaned.length !== 11) return false;
  return /^[A-Z0-9]{8}([A-Z0-9]{3})?$/.test(cleaned);
}

export interface MtFreeValidationResult {
  valid: boolean;
  errors: string[];
}

export function validateMtFree(msg: MtFreeMessage): MtFreeValidationResult {
  const errors: string[] = [];

  if (!msg.mtType || !MT_FREE_TYPES.includes(msg.mtType as (typeof MT_FREE_TYPES)[number])) {
    errors.push('mt_type deve ser MT199, MT299 ou MT999');
  }
  const ref20 = validateField20(msg.transactionReferenceNumber || '');
  if (!ref20.valid) errors.push(ref20.error!);
  const ref21 = validateField21(msg.relatedReference);
  if (!ref21.valid) errors.push(ref21.error!);
  if (!msg.narrativeFreeText?.trim()) errors.push(':79: Narrative / Free Text é obrigatório');
  if (msg.narrativeFreeText) {
    if (msg.narrativeFreeText.length > NARRATIVE_MAX_LENGTH) errors.push(`:79: Narrative máximo ${NARRATIVE_MAX_LENGTH} caracteres`);
    const r79 = validateSwiftTextX(msg.narrativeFreeText, NARRATIVE_MAX_LENGTH);
    if (!r79.valid) errors.push(`:79: ${r79.error}`);
  }
  const senderBic = msg.swiftHeader?.senderBic || 'BOMGBRS1XXX';
  const receiverBic = msg.swiftHeader?.receiverBic;
  if (!isValidBic(senderBic)) errors.push('sender_bic inválido (formato BIC 8 ou 11 caracteres)');
  if (!receiverBic?.trim()) errors.push('receiver_bic é obrigatório');
  else if (!isValidBic(receiverBic)) errors.push('receiver_bic inválido (formato BIC 8 ou 11 caracteres)');

  return { valid: errors.length === 0, errors };
}

export function canEdit(msg: MtFreeMessage): boolean {
  return EDITABLE_STATUSES.includes(msg.messageStatus) || msg.repairRequiredFlag === true;
}

export function isReleasedOrLater(msg: MtFreeMessage): boolean {
  return RELEASED_STATUSES.includes(msg.messageStatus);
}

export interface MtFreeFinResult {
  finMessage: string;
  autoFields: {
    sessionSequence: string;
    uetr: string;
    chk: string;
  };
}

export function generateMtFreeFin(msg: MtFreeMessage): string;
export function generateMtFreeFin(msg: MtFreeMessage, withAutoFields: true): MtFreeFinResult;
export function generateMtFreeFin(msg: MtFreeMessage, withAutoFields?: boolean): string | MtFreeFinResult {
  const mtNum = msg.mtType?.replace(/[^0-9]/g, '') || '199';
  const senderBic = msg.swiftHeader?.senderBic || 'BOMGBRS1XXX';
  const receiverBic = msg.swiftHeader?.receiverBic || 'XXXXXXXX';
  const h = msg.swiftHeader as Record<string, string> | undefined;
  const sessionSeq = h?.sessionNumber && h?.sequenceNumber
    ? `${h.sessionNumber}${h.sequenceNumber}`
    : generateSessionSequence();
  const uetr = h?.uetr || generateUetr();
  const lines: string[] = [];

  lines.push(`:20:${escapeSwiftText(msg.transactionReferenceNumber || '')}`);
  if (msg.relatedReference?.trim()) lines.push(`:21:${escapeSwiftText(msg.relatedReference)}`);
  const narrative = (msg.narrativeFreeText || '').replace(/\r\n/g, '\n').replace(/\r/g, '\n').trim();
  const narrativeLines = narrative.split('\n');
  narrativeLines.forEach((line, i) => {
    lines.push(i === 0 ? `:79:${escapeSwiftText(line)}` : escapeSwiftText(line));
  });
  if (narrativeLines.length === 0) lines.push(':79:');
  if (msg.senderToReceiverInfo?.trim()) lines.push(`:72:${escapeSwiftText(msg.senderToReceiverInfo)}`);

  const block1 = buildBlock1({ senderBic, sessionSequence: sessionSeq });
  const block2 = buildBlock2({ mtCode: mtNum, receiverBic, priority: 'N' });
  const block3 = buildBlock3UetrOnly(uetr);
  const block4 = `{4:\n${lines.join('\n')}\n-}`;
  const bodyWithoutChk = `${block1}${block2}${block3}${block4}`;
  const chk = h?.chk || generateChk(bodyWithoutChk);
  const block5 = buildBlock5(chk, { tng: true });
  const finMessage = `${bodyWithoutChk}${block5}`;

  if (withAutoFields) {
    return {
      finMessage,
      autoFields: {
        sessionSequence: sessionSeq,
        uetr,
        chk,
      },
    };
  }
  return finMessage;
}

export function requireFourEyes(approver1: number, approver2: number): boolean {
  return approver1 !== approver2 && approver1 > 0 && approver2 > 0;
}
