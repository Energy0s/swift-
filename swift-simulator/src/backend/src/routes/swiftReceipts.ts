/**
 * GET /api/swift/receipts/:mtType/:id
 * Retorna dados do recibo técnico SWIFT para visualização/PDF
 */

import { Router, Request, Response } from 'express';
import { authMiddleware } from '../middleware/auth.js';
import { mt103Store } from '../store/mt103Store.js';
import { mtFreeStore } from '../store/mtFreeStore.js';
import { mt101Store } from '../store/mt101Store.js';
import { mt109Store } from '../store/mt109Store.js';
import { getAutoFieldsForMessage } from '../services/swiftAutoNumberingService.js';
import * as swiftNetworkReportStore from '../store/swiftNetworkReportStore.js';
import { generateMt103Fin } from '../services/mt103ModuleService.js';
import { generateMtFreeFin } from '../services/mtFreeModuleService.js';
import { generateMt101Fin } from '../services/mt101Service.js';
import { generateMt109Fin } from '../services/mt109ModuleService.js';
import type { AuthPayload } from '../middleware/auth.js';
import type { Mt103Message } from '../store/mt103Types.js';
import type { MtFreeMessage } from '../store/mtFreeTypes.js';
import type { Mt101Message } from '../store/mt101Types.js';
import type { Mt109Message } from '../store/mt109Types.js';

type Req = Request & { user?: AuthPayload };

const router = Router();
router.use(authMiddleware);

type MtType = 'mt103' | 'mt_free' | 'mt101' | 'mt109';

function buildReceiptData(
  mtType: MtType,
  msg: Record<string, unknown>,
  finMessage: string,
  autoFields: { sender_lt: string; receiver_lt?: string; uetr: string; mur_108?: string } | null,
  networkReport: {
    chk?: string | null;
    tracking?: string | null;
    pki_signature?: string | null;
    access_code?: string | null;
    release_code?: string | null;
    category?: string | null;
    creation_time?: string | null;
    application?: string | null;
    operator?: string | null;
    raw_text?: string | null;
  } | null
): Record<string, unknown> {
  const swiftHeader = (msg.swiftHeader as Record<string, string>) || {};
  const mtTypeLabel = (msg.mtType as string) || mtType.toUpperCase().replace('_', '');
  const status = (msg.messageStatus as string) || '';

  let networkDeliveryStatus = '-';
  if (['ACK Received', 'Completed'].includes(status)) networkDeliveryStatus = 'ACK (DELIVERED)';
  else if (status === 'NACK Received') networkDeliveryStatus = 'NACK';
  else if (status === 'Released to SWIFT') networkDeliveryStatus = 'DELIVERED';

  let nrCreationTime = networkReport?.creation_time || '';
  if (nrCreationTime && nrCreationTime.includes('T')) {
    try {
      const d = new Date(nrCreationTime);
      const dd = String(d.getDate()).padStart(2, '0');
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      const yyyy = d.getFullYear();
      const hh = String(d.getHours()).padStart(2, '0');
      const min = String(d.getMinutes()).padStart(2, '0');
      const ss = String(d.getSeconds()).padStart(2, '0');
      nrCreationTime = `${dd}/${mm}/${yyyy} - ${hh}:${min}:${ss}`;
    } catch {
      nrCreationTime = String(nrCreationTime);
    }
  }

  return {
    mtType: mtTypeLabel,
    direction: 'OUTGOING',
    network: 'FIN',
    senderLt: autoFields?.sender_lt || swiftHeader.logicalTerminal || swiftHeader.senderBic || 'BOMGBRS1XXX',
    receiverLt: swiftHeader.receiverBic || autoFields?.receiver_lt || '-',
    priority: swiftHeader.messagePriority || 'N',
    inputTime: (msg.createdAt as string) || (msg.releaseTimestamp as string),
    messageStatus: status,
    networkDeliveryStatus,
    uetr: autoFields?.uetr || swiftHeader.uetr || '-',
    mur: autoFields?.mur_108 || swiftHeader.mur || '-',
    finMessage,
    networkAck: status === 'ACK Received' ? undefined : undefined,
    networkReport: networkReport
      ? {
          category: networkReport.category,
          creationTime: nrCreationTime,
          application: networkReport.application,
          operator: networkReport.operator,
          chk: networkReport.chk,
          tracking: networkReport.tracking,
          pkiSignature: networkReport.pki_signature,
          accessCode: networkReport.access_code,
          releaseCode: networkReport.release_code,
          rawText: networkReport.raw_text,
        }
      : null,
  };
}

router.get('/:mtType/:id', (req: Req, res: Response) => {
  const mtType = req.params.mtType as MtType;
  const id = Number(req.params.id);
  const userId = req.user!.userId;

  if (!['mt103', 'mt_free', 'mt101', 'mt109'].includes(mtType)) {
    return res.status(400).json({ status: 'error', message: 'mtType inválido' });
  }

  let msg: Record<string, unknown> | null = null;
  let finMessage = '';

  if (mtType === 'mt103') {
    const m = mt103Store.findById(id);
    if (!m || m.userId !== userId) return res.status(404).json({ status: 'error', message: 'Mensagem não encontrada' });
    msg = m as unknown as Record<string, unknown>;
    finMessage = (m.finMessage as string) || '';
  } else if (mtType === 'mt_free') {
    const m = mtFreeStore.findById(id);
    if (!m || m.userId !== userId) return res.status(404).json({ status: 'error', message: 'Mensagem não encontrada' });
    msg = m as unknown as Record<string, unknown>;
    finMessage = (m.finMessage as string) || '';
  } else if (mtType === 'mt101') {
    const m = mt101Store.findById(id);
    if (!m || m.userId !== userId) return res.status(404).json({ status: 'error', message: 'Mensagem não encontrada' });
    msg = m as unknown as Record<string, unknown>;
    finMessage = (m.finMessage as string) || '';
  } else if (mtType === 'mt109') {
    const m = mt109Store.findById(id);
    if (!m || m.userId !== userId) return res.status(404).json({ status: 'error', message: 'Mensagem não encontrada' });
    msg = m as unknown as Record<string, unknown>;
    finMessage = (m.finMessage as string) || '';
  }

  if (!msg) return res.status(404).json({ status: 'error', message: 'Mensagem não encontrada' });

  if (!finMessage) {
    if (mtType === 'mt103') finMessage = generateMt103Fin(msg as unknown as Mt103Message);
    else if (mtType === 'mt_free') finMessage = generateMtFreeFin(msg as unknown as MtFreeMessage);
    else if (mtType === 'mt101') finMessage = generateMt101Fin(msg as unknown as Mt101Message);
    else if (mtType === 'mt109') finMessage = generateMt109Fin(msg as unknown as Mt109Message);
  }

  const autoFields = getAutoFieldsForMessage(mtType, id);
  const networkReport = swiftNetworkReportStore.findByMessage(mtType, id);

  const normalizedAutoFields = autoFields
    ? {
        sender_lt: autoFields.sender_lt,
        receiver_lt: (msg.swiftHeader as Record<string, string>)?.receiverBic,
        uetr: autoFields.uetr,
        mur_108: autoFields.mur_108 ?? undefined,
      }
    : null;

  const receiptData = buildReceiptData(mtType, msg, finMessage, normalizedAutoFields, networkReport ?? null);

  res.json({ status: 'success', data: { receipt: receiptData } });
});

export default router;
