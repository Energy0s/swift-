/**
 * Rotas MT109 - Advice of Cheque(s)
 */

import { Router, Request, Response } from 'express';
import Joi from 'joi';
import { authMiddleware } from '../middleware/auth.js';
import { mt109Store } from '../store/mt109Store.js';
import { userStore } from '../store/index.js';
import {
  validateMt109,
  canEdit,
  isReleasedOrLater,
  generateMt109Fin,
  requireFourEyes,
} from '../services/mt109ModuleService.js';
import { generateAutoFields, getAutoFieldsForMessage } from '../services/swiftAutoNumberingService.js';
import { handleAttachNetworkReport } from './swiftNetworkReportHandler.js';
import * as swiftNetworkReportStore from '../store/swiftNetworkReportStore.js';
import type { AuthPayload } from '../middleware/auth.js';
import type {
  Mt109SwiftHeader,
  Mt109OrderingCustomer,
  Mt109Beneficiary,
  Mt109Cheque,
  Mt109Compliance,
} from '../store/mt109Types.js';

type Req = Request & { user?: AuthPayload };

const router = Router();
router.use(authMiddleware);

const chequeSchema = Joi.object({
  id: Joi.number(),
  chequeNumber: Joi.string().required(),
  chequeAmount: Joi.number().required().positive(),
  currency: Joi.string().required().length(3),
  chequeIssueDate: Joi.string(),
  draweeBankName: Joi.string(),
  draweeBankBic: Joi.string(),
  payeeName: Joi.string(),
  payeeAddress: Joi.string(),
  placeOfIssue: Joi.string(),
  remittanceInformation: Joi.string().max(140),
  senderToReceiverInfo: Joi.string().max(140),
});

const createSchema = Joi.object({
  mtType: Joi.string().valid('MT109', 'MT110').default('MT109'),
  swiftHeader: Joi.object({
    applicationId: Joi.string(),
    serviceId: Joi.string(),
    logicalTerminal: Joi.string(),
    sessionNumber: Joi.string(),
    sequenceNumber: Joi.string(),
    receiverBic: Joi.string(),
    messagePriority: Joi.string(),
  }).default({}),
  transactionReferenceNumber: Joi.string().required().max(16),
  relatedReference: Joi.string().max(16),
  dateOfIssue: Joi.string().required(),
  orderingInstitution: Joi.string(),
  orderingCustomer: Joi.object({
    orderingAccountNumber: Joi.string(),
    orderingName: Joi.string(),
    addressLine1: Joi.string(),
    addressLine2: Joi.string(),
    country: Joi.string(),
  }).required(),
  beneficiary: Joi.object({
    beneficiaryAccount: Joi.string(),
    beneficiaryName: Joi.string(),
    addressLine1: Joi.string(),
    addressLine2: Joi.string(),
    country: Joi.string(),
  }).required(),
  cheques: Joi.array().items(chequeSchema).min(1).required(),
  detailsOfCharges: Joi.string().valid('OUR', 'SHA', 'BEN').required(),
  compliance: Joi.object(),
});

function buildMessageFromBody(body: Record<string, unknown>, userId: number) {
  const mtType = (body.mtType as 'MT109' | 'MT110') || 'MT109';
  const msgId = `${mtType}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const cheques = (body.cheques as Record<string, unknown>[] || []).map((c) => {
    const base = {
      chequeNumber: c.chequeNumber as string,
      chequeAmount: Number(c.chequeAmount),
      currency: c.currency as string,
      chequeIssueDate: (c.chequeIssueDate as string) || (body.dateOfIssue as string),
      draweeBankName: c.draweeBankName as string | undefined,
      draweeBankBic: c.draweeBankBic as string | undefined,
      payeeName: c.payeeName as string | undefined,
      payeeAddress: c.payeeAddress as string | undefined,
      placeOfIssue: c.placeOfIssue as string | undefined,
      remittanceInformation: c.remittanceInformation as string | undefined,
      senderToReceiverInfo: c.senderToReceiverInfo as string | undefined,
    };
    return c.id ? { ...base, id: c.id as number } : base;
  });
  return {
    userId,
    mtType,
    messageId: msgId,
    messageStatus: 'Draft' as const,
    transactionReferenceNumber: body.transactionReferenceNumber as string,
    relatedReference: body.relatedReference as string | undefined,
    dateOfIssue: body.dateOfIssue as string,
    orderingInstitution: body.orderingInstitution as string | undefined,
    orderingCustomer: body.orderingCustomer as Mt109OrderingCustomer,
    beneficiary: body.beneficiary as Mt109Beneficiary,
    cheques,
    detailsOfCharges: (body.detailsOfCharges as 'OUR' | 'SHA' | 'BEN') || 'OUR',
    swiftHeader: (body.swiftHeader as Mt109SwiftHeader) || {},
    compliance: body.compliance as Mt109Compliance | undefined,
    createdBy: userId,
  };
}

router.post('/messages', async (req: Req, res: Response) => {
  const { error, value } = createSchema.validate(req.body);
  if (error) return res.status(400).json({ status: 'error', message: error.details[0].message });
  const msg = mt109Store.create(buildMessageFromBody(value, req.user!.userId));
  const autoFields = await generateAutoFields({
    mtType: 'mt109',
    mtMessageId: msg.id,
    senderLtConfig: msg.swiftHeader?.logicalTerminal,
  });
  res.status(201).json({
    status: 'success',
    data: { message: msg, auto_fields: autoFields },
  });
});

router.get('/messages', (req: Req, res: Response) => {
  const result = mt109Store.findByUserId(req.user!.userId, {
    status: req.query.status as string | undefined,
    mtType: req.query.mtType as string | undefined,
    dateFrom: req.query.dateFrom as string | undefined,
    dateTo: req.query.dateTo as string | undefined,
    reference: req.query.reference as string | undefined,
    page: req.query.page ? Number(req.query.page) : 1,
    limit: req.query.limit ? Number(req.query.limit) : 20,
    sortBy: req.query.sortBy as string | undefined,
    sortOrder: (req.query.sortOrder as 'asc' | 'desc') || 'desc',
  });
  res.json({ status: 'success', data: result });
});

router.get('/messages/:id', (req: Req, res: Response) => {
  const msg = mt109Store.findById(Number(req.params.id));
  if (!msg || msg.userId !== req.user!.userId) {
    return res.status(404).json({ status: 'error', message: 'Mensagem não encontrada' });
  }
  const autoFields = getAutoFieldsForMessage('mt109', msg.id);
  const networkReport = swiftNetworkReportStore.findByMessage('mt109', msg.id);
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

router.put('/messages/:id', (req: Req, res: Response) => {
  const msg = mt109Store.findById(Number(req.params.id));
  if (!msg || msg.userId !== req.user!.userId) {
    return res.status(404).json({ status: 'error', message: 'Mensagem não encontrada' });
  }
  if (!canEdit(msg)) {
    return res.status(400).json({ status: 'error', message: 'Edição não permitida. Status: ' + msg.messageStatus });
  }
  const { error, value } = createSchema.validate(req.body);
  if (error) return res.status(400).json({ status: 'error', message: error.details[0].message });
  const { messageId: _msgId, ...bodyData } = buildMessageFromBody(value, req.user!.userId);
  const updated = mt109Store.update(msg.id, {
    ...bodyData,
    messageStatus: msg.repairRequiredFlag ? 'Draft' : msg.messageStatus,
    repairRequiredFlag: false,
  }, req.user!.userId);
  if (!updated) return res.status(400).json({ status: 'error', message: 'Falha ao atualizar' });
  res.json({ status: 'success', data: { message: updated } });
});

router.post('/messages/:id/validate', (req: Req, res: Response) => {
  const msg = mt109Store.findById(Number(req.params.id));
  if (!msg || msg.userId !== req.user!.userId) {
    return res.status(404).json({ status: 'error', message: 'Mensagem não encontrada' });
  }
  const result = validateMt109(msg);
  if (result.valid) mt109Store.update(msg.id, { messageStatus: 'Validated' }, req.user!.userId);
  res.json({ status: 'success', data: result });
});

router.post('/messages/:id/submit-approval', (req: Req, res: Response) => {
  const msg = mt109Store.findById(Number(req.params.id));
  if (!msg || msg.userId !== req.user!.userId) {
    return res.status(404).json({ status: 'error', message: 'Mensagem não encontrada' });
  }
  const validation = validateMt109(msg);
  if (!validation.valid) {
    return res.status(400).json({ status: 'error', message: 'Validação falhou', data: validation });
  }
  if (!['Draft', 'Validated'].includes(msg.messageStatus)) {
    return res.status(400).json({ status: 'error', message: 'Status não permite submissão' });
  }
  const updated = mt109Store.update(msg.id, { messageStatus: 'Pending Approval' }, req.user!.userId);
  mt109Store.addAuditEntry(msg.id, 'SUBMITTED_FOR_APPROVAL', req.user!.userId);
  res.json({ status: 'success', data: { message: updated } });
});

router.post('/messages/:id/approve', (req: Req, res: Response) => {
  const msg = mt109Store.findById(Number(req.params.id));
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
    const updated = mt109Store.update(msg.id, { approvedBy1: approverId }, approverId);
    mt109Store.addAuditEntry(msg.id, 'APPROVED_BY_1', approverId, userName);
    return res.json({ status: 'success', data: { message: updated } });
  }
  if (msg.approvedBy1 === approverId) {
    const updated = mt109Store.update(msg.id, { approvedBy2: approverId, messageStatus: 'Approved' }, approverId);
    mt109Store.addAuditEntry(msg.id, 'APPROVED_BY_2', approverId, userName);
    return res.json({ status: 'success', data: { message: updated } });
  }
  if (!requireFourEyes(msg.approvedBy1, approverId)) {
    return res.status(400).json({ status: 'error', message: '4-eyes: dois aprovadores distintos necessários' });
  }
  const updated = mt109Store.update(msg.id, { approvedBy2: approverId, messageStatus: 'Approved' }, approverId);
  mt109Store.addAuditEntry(msg.id, 'APPROVED_BY_2', approverId, userName);
  res.json({ status: 'success', data: { message: updated } });
});

router.post('/messages/:id/network-report', async (req: Req, res: Response) => {
  await handleAttachNetworkReport(req as unknown as Parameters<typeof handleAttachNetworkReport>[0], res, 'mt109', (id, userId) => {
    const msg = mt109Store.findById(id);
    if (!msg || msg.userId !== userId) return { found: false };
    return {
      found: true,
      addAudit: (event, details) => mt109Store.addAuditEntry(id, event, userId, undefined, details),
    };
  });
});

router.post('/messages/:id/release', (req: Req, res: Response) => {
  const msg = mt109Store.findById(Number(req.params.id));
  if (!msg || msg.userId !== req.user!.userId) {
    return res.status(404).json({ status: 'error', message: 'Mensagem não encontrada' });
  }
  if (msg.messageStatus !== 'Approved') {
    return res.status(400).json({ status: 'error', message: 'Mensagem deve estar Aprovada' });
  }
  const finMessage = generateMt109Fin(msg);
  const now = new Date().toISOString();
  const updated = mt109Store.update(msg.id, {
    messageStatus: 'Released to SWIFT',
    releaseTimestamp: now,
    finMessage,
  }, req.user!.userId);
  mt109Store.addAuditEntry(msg.id, 'RELEASED', req.user!.userId, undefined, { finMessage });
  res.json({ status: 'success', data: { message: updated } });
});

router.post('/messages/:id/ack', (req: Req, res: Response) => {
  const msg = mt109Store.findById(Number(req.params.id));
  if (!msg || msg.userId !== req.user!.userId) {
    return res.status(404).json({ status: 'error', message: 'Mensagem não encontrada' });
  }
  if (!['Released to SWIFT', 'ACK Received', 'NACK Received'].includes(msg.messageStatus)) {
    return res.status(400).json({ status: 'error', message: 'ACK só para mensagens liberadas' });
  }
  const now = new Date().toISOString();
  const updated = mt109Store.update(msg.id, {
    messageStatus: 'ACK Received',
    swiftAckTimestamp: now,
  }, req.user!.userId);
  mt109Store.addAuditEntry(msg.id, 'ACK_RECEIVED', req.user!.userId);
  res.json({ status: 'success', data: { message: updated } });
});

router.post('/messages/:id/nack', (req: Req, res: Response) => {
  const msg = mt109Store.findById(Number(req.params.id));
  if (!msg || msg.userId !== req.user!.userId) {
    return res.status(404).json({ status: 'error', message: 'Mensagem não encontrada' });
  }
  if (!['Released to SWIFT', 'ACK Received', 'NACK Received'].includes(msg.messageStatus)) {
    return res.status(400).json({ status: 'error', message: 'NACK só para mensagens liberadas' });
  }
  const nackCode = (req.body?.nackCode as string) || 'NACK';
  const updated = mt109Store.update(msg.id, {
    messageStatus: 'NACK Received',
    swiftNackCode: nackCode,
    repairRequiredFlag: true,
  }, req.user!.userId);
  mt109Store.addAuditEntry(msg.id, 'NACK_RECEIVED', req.user!.userId, undefined, { nackCode });
  res.json({ status: 'success', data: { message: updated } });
});

router.post('/messages/:id/cancel', (req: Req, res: Response) => {
  const msg = mt109Store.findById(Number(req.params.id));
  if (!msg || msg.userId !== req.user!.userId) {
    return res.status(404).json({ status: 'error', message: 'Mensagem não encontrada' });
  }
  if (isReleasedOrLater(msg)) {
    return res.status(400).json({ status: 'error', message: 'Cancelamento não permitido após liberação' });
  }
  const updated = mt109Store.update(msg.id, {
    messageStatus: 'Cancelled',
    cancellationRequestedFlag: true,
  }, req.user!.userId);
  mt109Store.addAuditEntry(msg.id, 'CANCELLATION_REQUESTED', req.user!.userId);
  res.json({ status: 'success', data: { message: updated } });
});

router.get('/messages/:id/fin', (req: Req, res: Response) => {
  const msg = mt109Store.findById(Number(req.params.id));
  if (!msg || msg.userId !== req.user!.userId) {
    return res.status(404).json({ status: 'error', message: 'Mensagem não encontrada' });
  }
  if (!['Released to SWIFT', 'ACK Received', 'NACK Received', 'Completed'].includes(msg.messageStatus)) {
    return res.status(400).json({ status: 'error', message: 'FIN disponível apenas para mensagens liberadas' });
  }
  const finMessage = msg.finMessage || generateMt109Fin(msg);
  res.json({ status: 'success', data: { finMessage } });
});

export default router;
