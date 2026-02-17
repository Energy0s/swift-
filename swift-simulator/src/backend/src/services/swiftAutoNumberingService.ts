/**
 * SwiftAutoNumberingService - Geração atômica de campos automáticos
 * Usa swift_sequence_counter para unicidade garantida
 */

import { getNextSessionSequence } from '../store/swiftSequenceCounterStore.js';
import * as swiftAutoFieldsStore from '../store/swiftAutoFieldsStore.js';
import type { MtType } from '../store/swiftAutoFieldsStore.js';

const SENDER_BIC = process.env.SWIFT_SENDER_BIC || 'BOMGBRS1XXX';
const DEFAULT_APP_ID = 'F01';

function formatBic12(bic: string): string {
  const c = (bic || '').replace(/\s/g, '').toUpperCase();
  if (c.length >= 12) return c.slice(0, 12);
  if (c.length >= 8) return c.padEnd(12, 'X');
  return (c || 'XXXXXXXX').padEnd(12, 'X');
}

export interface GenerateAutoFieldsParams {
  mtType: MtType;
  mtMessageId: number;
  senderLtConfig?: string;
  useStp?: boolean;
  useMur?: string;
}

export interface AutoFieldsResult {
  sender_lt: string;
  application_id: string;
  session_number: string;
  sequence_number: string;
  uetr: string;
  mur_108: string | null;
  stp_119: string | null;
}

export async function generateAutoFields(params: GenerateAutoFieldsParams): Promise<AutoFieldsResult> {
  const { mtType, mtMessageId, senderLtConfig, useStp, useMur } = params;
  const senderLt = formatBic12(senderLtConfig || SENDER_BIC);

  const existing = swiftAutoFieldsStore.findByMessage(mtType, mtMessageId);
  if (existing) {
    return {
      sender_lt: existing.sender_lt,
      application_id: existing.application_id,
      session_number: existing.session_number,
      sequence_number: existing.sequence_number,
      uetr: existing.uetr,
      mur_108: existing.mur_108,
      stp_119: existing.stp_119,
    };
  }

  const { sessionNumber, sequenceNumber } = await getNextSessionSequence(senderLt);

  const record = swiftAutoFieldsStore.create({
    mt_type: mtType,
    mt_message_id: mtMessageId,
    sender_lt: senderLt,
    application_id: DEFAULT_APP_ID,
    session_number: sessionNumber,
    sequence_number: sequenceNumber,
    uetr: '',
    mur_108: useMur || null,
    stp_119: useStp ? 'STP' : null,
  });

  return {
    sender_lt: record.sender_lt,
    application_id: record.application_id,
    session_number: record.session_number,
    sequence_number: record.sequence_number,
    uetr: record.uetr,
    mur_108: record.mur_108,
    stp_119: record.stp_119,
  };
}

export function getAutoFieldsForMessage(mtType: MtType, mtMessageId: number): AutoFieldsResult | null {
  const existing = swiftAutoFieldsStore.findByMessage(mtType, mtMessageId);
  if (!existing) return null;
  return {
    sender_lt: existing.sender_lt,
    application_id: existing.application_id,
    session_number: existing.session_number,
    sequence_number: existing.sequence_number,
    uetr: existing.uetr,
    mur_108: existing.mur_108,
    stp_119: existing.stp_119,
  };
}
