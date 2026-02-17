/**
 * Rotas MT103 - Single Customer Credit Transfer
 */

import { Router, Request, Response } from 'express';
import Joi from 'joi';
import { authMiddleware } from '../middleware/auth.js';
import { mt103Store } from '../store/mt103Store.js';
import { userStore } from '../store/index.js';
import {
  validateMt103,
  canEdit,
  isReleasedOrLater,
  generateMt103Fin,
  requireFourEyes,
} from '../services/mt103ModuleService.js';
import { generateAutoFields, getAutoFieldsForMessage } from '../services/swiftAutoNumberingService.js';
import { handleAttachNetworkReport } from './swiftNetworkReportHandler.js';
import * as swiftNetworkReportStore from '../store/swiftNetworkReportStore.js';
import type { AuthPayload } from '../middleware/auth.js';
import type {
  Mt103SwiftHeader,
  Mt103OrderingCustomer,
  Mt103BeneficiaryCustomer,
  Mt103BankingDetails,
  Mt103Compliance,
} from '../store/mt103Types.js';

type Req = Request & { user?: AuthPayload };

const router = Router();
router.use(authMiddleware);

const createSchema = Joi.object({
  mtType: Joi.string().valid('MT103', 'MT103REMIT', 'MT103STP').default('MT103'),
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
  bankOperationCode: Joi.string().valid('CRED', 'SPAY', 'SSTD', 'SPRI').default('CRED'),
  valueDate: Joi.string().required(),
  currency: Joi.string().required().length(3),
  interbankSettledAmount: Joi.number().required().positive(),
  orderingCustomer: Joi.object({
    orderingAccountNumber: Joi.string(),
    orderingIban: Joi.string(),
    orderingName: Joi.string(),
    addressLine1: Joi.string(),
    addressLine2: Joi.string(),
    country: Joi.string(),
  }).required(),
  beneficiaryCustomer: Joi.object({
    beneficiaryAccountNumber: Joi.string(),
    beneficiaryIban: Joi.string(),
    beneficiaryName: Joi.string(),
    addressLine1: Joi.string(),
    addressLine2: Joi.string(),
    country: Joi.string(),
  }).required(),
  bankingDetails: Joi.object({
    orderingInstitution: Joi.string(),
    sendersCorrespondent: Joi.string(),
    receiversCorrespondent: Joi.string(),
    intermediaryInstitution: Joi.string(),
    accountWithInstitution: Joi.string(),
  }),
  remittanceInformation: Joi.string().max(140),
  detailsOfCharges: Joi.string().valid('OUR', 'SHA', 'BEN').required(),
  senderChargesAmount: Joi.number(),
  receiverChargesAmount: Joi.number(),
  compliance: Joi.object(),
});

function buildMessageFromBody(body: Record<string, unknown>, userId: number) {
  const mtType = (body.mtType as 'MT103' | 'MT103REMIT' | 'MT103STP') || 'MT103';
  const msgId = `${mtType}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  return {
    userId,
    mtType,
    messageId: msgId,
    messageStatus: 'Draft' as const,
    transactionReferenceNumber: body.transactionReferenceNumber as string,
    bankOperationCode: (body.bankOperationCode as 'CRED' | 'SPAY' | 'SSTD' | 'SPRI') || 'CRED',
    valueDate: body.valueDate as string,
    currency: body.currency as string,
    interbankSettledAmount: Number(body.interbankSettledAmount),
    orderingCustomer: body.orderingCustomer as Mt103OrderingCustomer,
    beneficiaryCustomer: body.beneficiaryCustomer as Mt103BeneficiaryCustomer,
    bankingDetails: body.bankingDetails as Mt103BankingDetails | undefined,
    remittanceInformation: body.remittanceInformation as string | undefined,
    detailsOfCharges: (body.detailsOfCharges as 'OUR' | 'SHA' | 'BEN') || 'OUR',
    senderChargesAmount: body.senderChargesAmount as number | undefined,
    receiverChargesAmount: body.receiverChargesAmount as number | undefined,
    swiftHeader: (body.swiftHeader as Mt103SwiftHeader) || {},
    compliance: body.compliance as Mt103Compliance | undefined,
    createdBy: userId,
  };
}

router.post('/messages', async (req: Req, res: Response) => {
  const { error, value } = createSchema.validate(req.body);
  if (error) return res.status(400).json({ status: 'error', message: error.details[0].message });
  const msg = mt103Store.create(buildMessageFromBody(value, req.user!.userId));
  const autoFields = await generateAutoFields({
    mtType: 'mt103',
    mtMessageId: msg.id,
    senderLtConfig: msg.swiftHeader?.logicalTerminal,
    useStp: (msg.mtType || '').includes('STP'),
  });
  res.status(201).json({
    status: 'success',
    data: {
      message: msg,
      auto_fields: autoFields,
    },
  });
});

router.get('/messages', (req: Req, res: Response) => {
  const result = mt103Store.findByUserId(req.user!.userId, {
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
  const msg = mt103Store.findById(Number(req.params.id));
  if (!msg || msg.userId !== req.user!.userId) {
    return res.status(404).json({ status: 'error', message: 'Mensagem não encontrada' });
  }
  const autoFields = getAutoFieldsForMessage('mt103', msg.id);
  const networkReport = swiftNetworkReportStore.findByMessage('mt103', msg.id);
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
  const msg = mt103Store.findById(Number(req.params.id));
  if (!msg || msg.userId !== req.user!.userId) {
    return res.status(404).json({ status: 'error', message: 'Mensagem não encontrada' });
  }
  if (!canEdit(msg)) {
    return res.status(400).json({ status: 'error', message: 'Edição não permitida. Status: ' + msg.messageStatus });
  }
  const { error, value } = createSchema.validate(req.body);
  if (error) return res.status(400).json({ status: 'error', message: error.details[0].message });
  const { messageId: _msgId, ...bodyData } = buildMessageFromBody(value, req.user!.userId);
  const updated = mt103Store.update(msg.id, {
    ...bodyData,
    messageStatus: msg.repairRequiredFlag ? 'Draft' : msg.messageStatus,
    repairRequiredFlag: false,
  }, req.user!.userId);
  if (!updated) return res.status(400).json({ status: 'error', message: 'Falha ao atualizar' });
  res.json({ status: 'success', data: { message: updated } });
});

router.post('/messages/:id/validate', (req: Req, res: Response) => {
  const msg = mt103Store.findById(Number(req.params.id));
  if (!msg || msg.userId !== req.user!.userId) {
    return res.status(404).json({ status: 'error', message: 'Mensagem não encontrada' });
  }
  const result = validateMt103(msg);
  if (result.valid) mt103Store.update(msg.id, { messageStatus: 'Validated' }, req.user!.userId);
  res.json({ status: 'success', data: result });
});

router.post('/messages/:id/submit-approval', (req: Req, res: Response) => {
  const msg = mt103Store.findById(Number(req.params.id));
  if (!msg || msg.userId !== req.user!.userId) {
    return res.status(404).json({ status: 'error', message: 'Mensagem não encontrada' });
  }
  const validation = validateMt103(msg);
  if (!validation.valid) {
    return res.status(400).json({ status: 'error', message: 'Validação falhou', data: validation });
  }
  if (!['Draft', 'Validated'].includes(msg.messageStatus)) {
    return res.status(400).json({ status: 'error', message: 'Status não permite submissão' });
  }
  const updated = mt103Store.update(msg.id, { messageStatus: 'Pending Approval' }, req.user!.userId);
  mt103Store.addAuditEntry(msg.id, 'SUBMITTED_FOR_APPROVAL', req.user!.userId);
  res.json({ status: 'success', data: { message: updated } });
});

router.post('/messages/:id/approve', (req: Req, res: Response) => {
  const msg = mt103Store.findById(Number(req.params.id));
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
    const updated = mt103Store.update(msg.id, { approvedBy1: approverId }, approverId);
    mt103Store.addAuditEntry(msg.id, 'APPROVED_BY_1', approverId, userName);
    return res.json({ status: 'success', data: { message: updated } });
  }
  if (msg.approvedBy1 === approverId) {
    const updated = mt103Store.update(msg.id, { approvedBy2: approverId, messageStatus: 'Approved' }, approverId);
    mt103Store.addAuditEntry(msg.id, 'APPROVED_BY_2', approverId, userName);
    return res.json({ status: 'success', data: { message: updated } });
  }
  if (!requireFourEyes(msg.approvedBy1, approverId)) {
    return res.status(400).json({ status: 'error', message: '4-eyes: dois aprovadores distintos necessários' });
  }
  const updated = mt103Store.update(msg.id, { approvedBy2: approverId, messageStatus: 'Approved' }, approverId);
  mt103Store.addAuditEntry(msg.id, 'APPROVED_BY_2', approverId, userName);
  res.json({ status: 'success', data: { message: updated } });
});

router.post('/messages/:id/release', async (req: Req, res: Response) => {
  const msg = mt103Store.findById(Number(req.params.id));
  if (!msg || msg.userId !== req.user!.userId) {
    return res.status(404).json({ status: 'error', message: 'Mensagem não encontrada' });
  }
  if (msg.messageStatus !== 'Approved') {
    return res.status(400).json({ status: 'error', message: 'Mensagem deve estar Aprovada' });
  }
  const storedAutoFields = getAutoFieldsForMessage('mt103', msg.id);
  const msgForFin = storedAutoFields
    ? { ...msg, swiftHeader: { ...msg.swiftHeader, sessionNumber: storedAutoFields.session_number, sequenceNumber: storedAutoFields.sequence_number, uetr: storedAutoFields.uetr } }
    : msg;
  const result = generateMt103Fin(msgForFin, true);
  const { finMessage, autoFields } = result;
  const sessionSeq = storedAutoFields ? `${storedAutoFields.session_number}${storedAutoFields.sequence_number}` : autoFields.sessionSequence;
  const swiftHeader = {
    ...msg.swiftHeader,
    sessionNumber: sessionSeq.slice(0, 4),
    sequenceNumber: sessionSeq.slice(4, 10),
    uetr: (storedAutoFields?.uetr ?? autoFields.uetr),
    chk: autoFields.chk,
  };
  const now = new Date().toISOString();
  const updated = mt103Store.updateForWorkflow(
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
  mt103Store.addAuditEntry(msg.id, 'RELEASED', req.user!.userId, undefined, { finMessage });
  res.json({ status: 'success', data: { message: updated } });
});

router.post('/messages/:id/ack', (req: Req, res: Response) => {
  const msg = mt103Store.findById(Number(req.params.id));
  if (!msg || msg.userId !== req.user!.userId) {
    return res.status(404).json({ status: 'error', message: 'Mensagem não encontrada' });
  }
  if (!['Released to SWIFT', 'ACK Received', 'NACK Received'].includes(msg.messageStatus)) {
    return res.status(400).json({ status: 'error', message: 'ACK só para mensagens liberadas' });
  }
  const now = new Date().toISOString();
  const updated = mt103Store.update(msg.id, {
    messageStatus: 'ACK Received',
    swiftAckTimestamp: now,
  }, req.user!.userId);
  mt103Store.addAuditEntry(msg.id, 'ACK_RECEIVED', req.user!.userId);
  res.json({ status: 'success', data: { message: updated } });
});

router.post('/messages/:id/nack', (req: Req, res: Response) => {
  const msg = mt103Store.findById(Number(req.params.id));
  if (!msg || msg.userId !== req.user!.userId) {
    return res.status(404).json({ status: 'error', message: 'Mensagem não encontrada' });
  }
  if (!['Released to SWIFT', 'ACK Received', 'NACK Received'].includes(msg.messageStatus)) {
    return res.status(400).json({ status: 'error', message: 'NACK só para mensagens liberadas' });
  }
  const nackCode = (req.body?.nackCode as string) || 'NACK';
  const updated = mt103Store.update(msg.id, {
    messageStatus: 'NACK Received',
    swiftNackCode: nackCode,
    repairRequiredFlag: true,
  }, req.user!.userId);
  mt103Store.addAuditEntry(msg.id, 'NACK_RECEIVED', req.user!.userId, undefined, { nackCode });
  res.json({ status: 'success', data: { message: updated } });
});

router.post('/messages/:id/cancel', (req: Req, res: Response) => {
  const msg = mt103Store.findById(Number(req.params.id));
  if (!msg || msg.userId !== req.user!.userId) {
    return res.status(404).json({ status: 'error', message: 'Mensagem não encontrada' });
  }
  if (isReleasedOrLater(msg)) {
    return res.status(400).json({ status: 'error', message: 'Cancelamento não permitido após liberação' });
  }
  const updated = mt103Store.update(msg.id, {
    messageStatus: 'Cancelled',
    cancellationRequestedFlag: true,
  }, req.user!.userId);
  mt103Store.addAuditEntry(msg.id, 'CANCELLATION_REQUESTED', req.user!.userId);
  res.json({ status: 'success', data: { message: updated } });
});

router.post('/messages/:id/network-report', async (req: Req, res: Response) => {
  await handleAttachNetworkReport(req as unknown as Parameters<typeof handleAttachNetworkReport>[0], res, 'mt103', (id, userId) => {
    const msg = mt103Store.findById(id);
    if (!msg || msg.userId !== userId) return { found: false };
    return {
      found: true,
      addAudit: (event, details) => mt103Store.addAuditEntry(id, event, userId, undefined, details),
    };
  });
});

router.get('/messages/:id/fin', (req: Req, res: Response) => {
  const msg = mt103Store.findById(Number(req.params.id));
  if (!msg || msg.userId !== req.user!.userId) {
    return res.status(404).json({ status: 'error', message: 'Mensagem não encontrada' });
  }
  if (!['Released to SWIFT', 'ACK Received', 'NACK Received', 'Completed'].includes(msg.messageStatus)) {
    return res.status(400).json({ status: 'error', message: 'FIN disponível apenas para mensagens liberadas' });
  }
  const finMessage = msg.finMessage || generateMt103Fin(msg);
  res.json({ status: 'success', data: { finMessage } });
});

export default router;
