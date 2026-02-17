/**
 * Rotas MT Free - Mensagens Livres (MT199, MT299, MT999)
 */

import { Router, Request, Response } from 'express';
import Joi from 'joi';
import { authMiddleware } from '../middleware/auth.js';
import { mtFreeStore } from '../store/mtFreeStore.js';
import { userStore } from '../store/index.js';
import {
  validateMtFree,
  canEdit,
  isReleasedOrLater,
  generateMtFreeFin,
  requireFourEyes,
} from '../services/mtFreeModuleService.js';
import { generateAutoFields, getAutoFieldsForMessage } from '../services/swiftAutoNumberingService.js';
import { handleAttachNetworkReport } from './swiftNetworkReportHandler.js';
import * as swiftNetworkReportStore from '../store/swiftNetworkReportStore.js';
import type { AuthPayload } from '../middleware/auth.js';
import type { MtFreeSwiftHeader, MtFreeCompliance } from '../store/mtFreeTypes.js';

type Req = Request & { user?: AuthPayload };

const router = Router();
router.use(authMiddleware);

const NARRATIVE_MAX = 3500;

const createSchema = Joi.object({
  mtType: Joi.string().valid('MT199', 'MT299', 'MT999').required(),
  swiftHeader: Joi.object({
    applicationId: Joi.string(),
    serviceId: Joi.string(),
    senderBic: Joi.string(),
    sessionNumber: Joi.string(),
    sequenceNumber: Joi.string(),
    receiverBic: Joi.string(),
    messagePriority: Joi.string().valid('N', 'U'),
    deliveryMonitoring: Joi.string(),
    obsolescencePeriod: Joi.string(),
  }).default({}),
  receiverBic: Joi.string().required(),
  transactionReferenceNumber: Joi.string().required().max(35),
  relatedReference: Joi.string().max(35).allow(''),
  narrativeFreeText: Joi.string().required().max(NARRATIVE_MAX),
  originalMessageMt: Joi.string().allow(''),
  originalMessageDate: Joi.string().allow(''),
  senderToReceiverInfo: Joi.string().max(140).allow(''),
  compliance: Joi.object(),
});

function buildMessageFromBody(body: Record<string, unknown>, userId: number) {
  const mtType = body.mtType as 'MT199' | 'MT299' | 'MT999';
  const msgId = `${mtType}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const header = (body.swiftHeader as MtFreeSwiftHeader) || {};
  const receiverBic = (body.receiverBic as string) || header.receiverBic || '';
  return {
    userId,
    mtType,
    messageId: msgId,
    messageStatus: 'Draft' as const,
    transactionReferenceNumber: body.transactionReferenceNumber as string,
    relatedReference: body.relatedReference as string | undefined,
    narrativeFreeText: (body.narrativeFreeText as string) || '',
    originalMessageMt: body.originalMessageMt as string | undefined,
    originalMessageDate: body.originalMessageDate as string | undefined,
    senderToReceiverInfo: body.senderToReceiverInfo as string | undefined,
    swiftHeader: {
      ...header,
      senderBic: header.senderBic || 'BOMGBRS1XXX',
      receiverBic,
      messagePriority: header.messagePriority || 'N',
    },
    compliance: body.compliance as MtFreeCompliance | undefined,
    createdBy: userId,
  };
}

router.post('/messages', async (req: Req, res: Response) => {
  const { error, value } = createSchema.validate(req.body);
  if (error) return res.status(400).json({ status: 'error', message: error.details[0].message });
  const msg = mtFreeStore.create(buildMessageFromBody(value, req.user!.userId));
  const autoFields = await generateAutoFields({
    mtType: 'mt_free',
    mtMessageId: msg.id,
    senderLtConfig: msg.swiftHeader?.senderBic,
  });
  res.status(201).json({
    status: 'success',
    data: { message: msg, auto_fields: autoFields },
  });
});

router.get('/messages', (req: Req, res: Response) => {
  try {
    const page = req.query.page ? Math.max(1, Number(req.query.page) || 1) : 1;
    const limit = req.query.limit ? Math.min(100, Math.max(1, Number(req.query.limit) || 20)) : 20;
    const result = mtFreeStore.findByUserId(req.user!.userId, {
      mtType: (req.query.mtType as string) || undefined,
      status: (req.query.status as string) || undefined,
      dateFrom: (req.query.dateFrom as string) || undefined,
      dateTo: (req.query.dateTo as string) || undefined,
      reference: (req.query.reference as string) || undefined,
      relatedReference: (req.query.relatedReference as string) || undefined,
      senderBic: (req.query.senderBic as string) || undefined,
      receiverBic: (req.query.receiverBic as string) || undefined,
      page,
      limit,
      sortBy: (req.query.sortBy as string) || undefined,
      sortOrder: ((req.query.sortOrder as string) === 'asc' ? 'asc' : 'desc') as 'asc' | 'desc',
    });
    res.json({ status: 'success', data: result });
  } catch (err) {
    res.status(500).json({ status: 'error', message: (err as Error).message || 'Erro ao listar mensagens' });
  }
});

router.get('/messages/:id', (req: Req, res: Response) => {
  const msg = mtFreeStore.findById(Number(req.params.id));
  if (!msg || msg.userId !== req.user!.userId) {
    return res.status(404).json({ status: 'error', message: 'Mensagem não encontrada' });
  }
  const autoFields = getAutoFieldsForMessage('mt_free', msg.id);
  const networkReport = swiftNetworkReportStore.findByMessage('mt_free', msg.id);
  const payload: Record<string, unknown> = { message: msg };
  if (autoFields) payload.auto_fields = autoFields;
  if (networkReport) {
    payload.network_report = {
      chk: networkReport.chk,
      tracking: networkReport.tracking,
      pki_signature: networkReport.pki_signature,
      access_code: networkReport.access_code,
      release_code: networkReport.release_code,
      category: networkReport.category,
      creation_time: networkReport.creation_time,
      application: networkReport.application,
      operator: networkReport.operator,
      raw_text: networkReport.raw_text,
    };
  }
  res.json({ status: 'success', data: payload });
});

router.delete('/messages/:id', (req: Req, res: Response) => {
  const msg = mtFreeStore.findById(Number(req.params.id));
  if (!msg || msg.userId !== req.user!.userId) {
    return res.status(404).json({ status: 'error', message: 'Mensagem não encontrada' });
  }
  mtFreeStore.deleteById(msg.id);
  res.json({ status: 'success', message: 'Mensagem excluída' });
});

router.delete('/messages/bulk', (req: Req, res: Response) => {
  const reference = req.query.reference as string;
  if (!reference?.trim()) {
    return res.status(400).json({ status: 'error', message: 'Parâmetro reference é obrigatório' });
  }
  const deleted = mtFreeStore.deleteByReference(reference);
  res.json({ status: 'success', message: `${deleted} mensagem(ns) excluída(s)`, data: { deleted } });
});

router.put('/messages/:id', (req: Req, res: Response) => {
  const msg = mtFreeStore.findById(Number(req.params.id));
  if (!msg || msg.userId !== req.user!.userId) {
    return res.status(404).json({ status: 'error', message: 'Mensagem não encontrada' });
  }
  if (!canEdit(msg)) {
    return res.status(400).json({ status: 'error', message: 'Edição não permitida. Status: ' + msg.messageStatus });
  }
  const { error, value } = createSchema.validate(req.body);
  if (error) return res.status(400).json({ status: 'error', message: error.details[0].message });
  const updated = mtFreeStore.update(msg.id, {
    ...buildMessageFromBody(value, req.user!.userId),
    messageStatus: msg.repairRequiredFlag ? 'Draft' : msg.messageStatus,
    repairRequiredFlag: false,
  }, req.user!.userId);
  if (!updated) return res.status(400).json({ status: 'error', message: 'Falha ao atualizar' });
  res.json({ status: 'success', data: { message: updated } });
});

router.post('/messages/:id/validate', (req: Req, res: Response) => {
  const msg = mtFreeStore.findById(Number(req.params.id));
  if (!msg || msg.userId !== req.user!.userId) {
    return res.status(404).json({ status: 'error', message: 'Mensagem não encontrada' });
  }
  const result = validateMtFree(msg);
  if (result.valid) mtFreeStore.update(msg.id, { messageStatus: 'Validated' }, req.user!.userId);
  res.json({ status: 'success', data: result });
});

router.post('/messages/:id/submit-approval', (req: Req, res: Response) => {
  const msg = mtFreeStore.findById(Number(req.params.id));
  if (!msg || msg.userId !== req.user!.userId) {
    return res.status(404).json({ status: 'error', message: 'Mensagem não encontrada' });
  }
  const validation = validateMtFree(msg);
  if (!validation.valid) {
    return res.status(400).json({ status: 'error', message: 'Validação falhou', data: validation });
  }
  if (!['Draft', 'Validated'].includes(msg.messageStatus)) {
    return res.status(400).json({ status: 'error', message: 'Status não permite submissão' });
  }
  const updated = mtFreeStore.updateForWorkflow(msg.id, { messageStatus: 'Pending Approval' }, ['Draft', 'Validated'], req.user!.userId);
  if (!updated) return res.status(400).json({ status: 'error', message: 'Falha ao submeter' });
  mtFreeStore.addAuditEntry(msg.id, 'SUBMITTED_FOR_APPROVAL', req.user!.userId);
  res.json({ status: 'success', data: { message: updated } });
});

router.post('/messages/:id/approve', (req: Req, res: Response) => {
  const msg = mtFreeStore.findById(Number(req.params.id));
  if (!msg || msg.userId !== req.user!.userId) {
    return res.status(404).json({ status: 'error', message: 'Mensagem não encontrada' });
  }
  if (msg.messageStatus !== 'Pending Approval') {
    return res.status(400).json({ status: 'error', message: 'Mensagem não está pendente de aprovação' });
  }
  const approverId = req.user!.userId;
  const user = userStore.findById(approverId);
  const userName = user?.name || user?.email || String(approverId);

  if (!msg.approvedBy1) {
    const updated = mtFreeStore.updateForWorkflow(msg.id, { approvedBy1: approverId }, ['Pending Approval'], approverId);
    if (!updated) return res.status(400).json({ status: 'error', message: 'Falha ao aprovar' });
    mtFreeStore.addAuditEntry(msg.id, 'APPROVED_BY_1', approverId, userName);
    return res.json({ status: 'success', data: { message: updated } });
  }
  if (msg.approvedBy1 === approverId) {
    const updated = mtFreeStore.updateForWorkflow(msg.id, { approvedBy2: approverId, messageStatus: 'Approved' }, ['Pending Approval'], approverId);
    if (!updated) return res.status(400).json({ status: 'error', message: 'Falha ao aprovar' });
    mtFreeStore.addAuditEntry(msg.id, 'APPROVED_BY_2', approverId, userName);
    return res.json({ status: 'success', data: { message: updated } });
  }
  if (!requireFourEyes(msg.approvedBy1, approverId)) {
    return res.status(400).json({ status: 'error', message: '4-eyes: dois aprovadores distintos necessários' });
  }
  const updated = mtFreeStore.updateForWorkflow(msg.id, { approvedBy2: approverId, messageStatus: 'Approved' }, ['Pending Approval'], approverId);
  if (!updated) return res.status(400).json({ status: 'error', message: 'Falha ao aprovar' });
  mtFreeStore.addAuditEntry(msg.id, 'APPROVED_BY_2', approverId, userName);
  res.json({ status: 'success', data: { message: updated } });
});

router.post('/messages/:id/network-report', async (req: Req, res: Response) => {
  await handleAttachNetworkReport(req as unknown as Parameters<typeof handleAttachNetworkReport>[0], res, 'mt_free', (id, userId) => {
    const msg = mtFreeStore.findById(id);
    if (!msg || msg.userId !== userId) return { found: false };
    return {
      found: true,
      addAudit: (event, details) => mtFreeStore.addAuditEntry(id, event, userId, undefined, undefined, details),
    };
  });
});

router.post('/messages/:id/release', async (req: Req, res: Response) => {
  const msg = mtFreeStore.findById(Number(req.params.id));
  if (!msg || msg.userId !== req.user!.userId) {
    return res.status(404).json({ status: 'error', message: 'Mensagem não encontrada' });
  }
  if (msg.messageStatus !== 'Approved') {
    return res.status(400).json({ status: 'error', message: 'Mensagem deve estar Aprovada' });
  }
  const storedAutoFields = getAutoFieldsForMessage('mt_free', msg.id);
  const msgForFin = storedAutoFields
    ? { ...msg, swiftHeader: { ...msg.swiftHeader, sessionNumber: storedAutoFields.session_number, sequenceNumber: storedAutoFields.sequence_number, uetr: storedAutoFields.uetr } }
    : msg;
  const result = generateMtFreeFin(msgForFin, true);
  const { finMessage, autoFields } = result;
  const sessionSeq = storedAutoFields ? `${storedAutoFields.session_number}${storedAutoFields.sequence_number}` : autoFields.sessionSequence;
  const swiftHeader = {
    ...msg.swiftHeader,
    sessionNumber: sessionSeq.slice(0, 4),
    sequenceNumber: sessionSeq.slice(4, 10),
    uetr: (storedAutoFields?.uetr ?? autoFields.uetr),
    chk: autoFields.chk,
  } as MtFreeSwiftHeader;
  const now = new Date().toISOString();
  const updated = mtFreeStore.updateForWorkflow(
    msg.id,
    {
      messageStatus: 'Released to SWIFT',
      releaseTimestamp: now,
      finMessage,
      swiftHeader,
    },
    ['Approved'],
    req.user!.userId
  );
  mtFreeStore.addAuditEntry(msg.id, 'RELEASED', req.user!.userId, undefined, undefined, { finMessage });
  res.json({ status: 'success', data: { message: updated } });
});

router.post('/messages/:id/ack', (req: Req, res: Response) => {
  const msg = mtFreeStore.findById(Number(req.params.id));
  if (!msg || msg.userId !== req.user!.userId) {
    return res.status(404).json({ status: 'error', message: 'Mensagem não encontrada' });
  }
  if (!['Released to SWIFT', 'ACK Received', 'NACK Received'].includes(msg.messageStatus)) {
    return res.status(400).json({ status: 'error', message: 'ACK só para mensagens liberadas' });
  }
  const now = new Date().toISOString();
  const updated = mtFreeStore.update(msg.id, {
    messageStatus: 'ACK Received',
    swiftAckTimestamp: now,
  }, req.user!.userId);
  mtFreeStore.addAuditEntry(msg.id, 'ACK_RECEIVED', req.user!.userId);
  res.json({ status: 'success', data: { message: updated } });
});

router.post('/messages/:id/nack', (req: Req, res: Response) => {
  const msg = mtFreeStore.findById(Number(req.params.id));
  if (!msg || msg.userId !== req.user!.userId) {
    return res.status(404).json({ status: 'error', message: 'Mensagem não encontrada' });
  }
  if (!['Released to SWIFT', 'ACK Received', 'NACK Received'].includes(msg.messageStatus)) {
    return res.status(400).json({ status: 'error', message: 'NACK só para mensagens liberadas' });
  }
  const nackCode = (req.body?.nackCode as string) || 'NACK';
  const updated = mtFreeStore.update(msg.id, {
    messageStatus: 'NACK Received',
    swiftNackCode: nackCode,
    repairRequiredFlag: true,
  }, req.user!.userId);
  mtFreeStore.addAuditEntry(msg.id, 'NACK_RECEIVED', req.user!.userId, undefined, undefined, { nackCode });
  res.json({ status: 'success', data: { message: updated } });
});

router.post('/messages/:id/cancel', (req: Req, res: Response) => {
  const msg = mtFreeStore.findById(Number(req.params.id));
  if (!msg || msg.userId !== req.user!.userId) {
    return res.status(404).json({ status: 'error', message: 'Mensagem não encontrada' });
  }
  if (isReleasedOrLater(msg)) {
    return res.status(400).json({ status: 'error', message: 'Cancelamento não permitido após liberação' });
  }
  const updated = mtFreeStore.update(msg.id, {
    messageStatus: 'Cancelled',
    cancellationRequestedFlag: true,
  }, req.user!.userId);
  mtFreeStore.addAuditEntry(msg.id, 'CANCELLATION_REQUESTED', req.user!.userId);
  res.json({ status: 'success', data: { message: updated } });
});

router.get('/messages/:id/fin', (req: Req, res: Response) => {
  const msg = mtFreeStore.findById(Number(req.params.id));
  if (!msg || msg.userId !== req.user!.userId) {
    return res.status(404).json({ status: 'error', message: 'Mensagem não encontrada' });
  }
  if (!['Released to SWIFT', 'ACK Received', 'NACK Received', 'Completed'].includes(msg.messageStatus)) {
    return res.status(400).json({ status: 'error', message: 'FIN disponível apenas para mensagens liberadas' });
  }
  const finMessage = msg.finMessage || generateMtFreeFin(msg);
  res.json({ status: 'success', data: { finMessage } });
});

export default router;
