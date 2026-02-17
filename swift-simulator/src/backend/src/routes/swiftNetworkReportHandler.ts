/**
 * Handler compartilhado para anexar Network Report a mensagens MT
 */

import { Response } from 'express';
import { parseNetworkReport } from '../services/swiftNetworkReportParser.js';
import * as swiftNetworkReportStore from '../store/swiftNetworkReportStore.js';
import type { MtType } from '../store/swiftAutoFieldsStore.js';
import type { AuthPayload } from '../middleware/auth.js';

type Req = { body: { raw_text?: string }; params: { id: string }; user?: AuthPayload };

export type MtResolver = (id: number, userId: number) => { found: boolean; addAudit?: (event: string, details?: Record<string, unknown>) => void };

export async function handleAttachNetworkReport(
  req: Req,
  res: Response,
  mtType: MtType,
  findMessage: (id: number, userId: number) => { found: boolean; addAudit?: (event: string, details?: Record<string, unknown>) => void }
): Promise<void> {
  const rawText = req.body?.raw_text;
  if (!rawText || typeof rawText !== 'string') {
    res.status(400).json({ status: 'error', message: 'raw_text é obrigatório' });
    return;
  }

  const id = Number(req.params.id);
  const { found, addAudit } = findMessage(id, req.user!.userId);
  if (!found) {
    res.status(404).json({ status: 'error', message: 'Mensagem não encontrada' });
    return;
  }

  const parsed = parseNetworkReport(rawText);
  const record = swiftNetworkReportStore.upsert({
    mt_type: mtType,
    mt_message_id: id,
    chk: parsed.chk,
    tracking: parsed.tracking,
    pki_signature: parsed.pki_signature,
    access_code: parsed.access_code,
    release_code: parsed.release_code,
    category: parsed.category,
    creation_time: parsed.creation_time,
    application: parsed.application,
    operator: parsed.operator,
    raw_text: parsed.raw_text,
    parsed_text_blocks: parsed.parsed_text_blocks,
  });

  addAudit?.('NETWORK_REPORT_ATTACHED', { reportId: record.id });

  res.status(201).json({
    status: 'success',
    data: {
      network_report: {
        chk: record.chk,
        tracking: record.tracking,
        pki_signature: record.pki_signature,
        access_code: record.access_code,
        release_code: record.release_code,
        category: record.category,
        creation_time: record.creation_time,
        application: record.application,
        operator: record.operator,
        raw_text: record.raw_text,
      },
    },
  });
}
