/**
 * Rotas MT101 - Request for Transfer
 */

import { Router, Request, Response } from 'express';
import Joi from 'joi';
import { authMiddleware } from '../middleware/auth.js';
import { mt101Store } from '../store/mt101Store.js';
import { userStore } from '../store/index.js';
import {
  validateMt101,
  canEdit,
  isReleasedOrLater,
  generateMt101Fin,
  requireFourEyes,
} from '../services/mt101Service.js';
import { generateAutoFields, getAutoFieldsForMessage } from '../services/swiftAutoNumberingService.js';
import { handleAttachNetworkReport } from './swiftNetworkReportHandler.js';
import * as swiftNetworkReportStore from '../store/swiftNetworkReportStore.js';
import type { AuthPayload } from '../middleware/auth.js';
import type {
  Mt101SwiftHeader,
  Mt101OrderingCustomer,
  Mt101ExecutionDetails,
  Mt101Transaction,
  Mt101Compliance,
} from '../store/mt101Types.js';

type Req = Request & { user?: AuthPayload };

const router = Router();
router.use(authMiddleware);

const createSchema = Joi.object({
  mtType: Joi.string().valid('MT101', 'MT102', 'MT102STP').default('MT101'),
  swiftHeader: Joi.object({
    applicationId: Joi.string(),
    serviceId: Joi.string(),
    logicalTerminal: Joi.string(),
    sessionNumber: Joi.string(),
    sequenceNumber: Joi.string(),
    receiverBic: Joi.string(),
    messagePriority: Joi.string(),
    deliveryMonitoring: Joi.string(),
    obsolescencePeriod: Joi.string(),
  }).default({}),
  transactionReferenceNumber: Joi.string().required().max(16),
  customerSpecifiedReference: Joi.string().max(16),
  messageIndex: Joi.number().integer().min(1),
  messageTotal: Joi.number().integer().min(1),
  orderingCustomer: Joi.object({
    orderingAccountNumber: Joi.string(),
    orderingIban: Joi.string(),
    orderingCustomerName: Joi.string(),
    addressLine1: Joi.string(),
    addressLine2: Joi.string(),
    city: Joi.string(),
    postalCode: Joi.string(),
    country: Joi.string(),
    taxId: Joi.string(),
    customerId: Joi.string(),
    kycStatus: Joi.string(),
    riskClassification: Joi.string(),
  }).default({}),
  executionDetails: Joi.object({
    requestedExecutionDate: Joi.string().required(),
    instructionCode: Joi.string(),
    valueDate: Joi.string(),
    executionPriority: Joi.string(),
    cutOffTimeValidation: Joi.string(),
    holidayCalendarValidation: Joi.string(),
  }).required(),
  transactions: Joi.array()
    .items(
      Joi.object({
        currency: Joi.string().required().length(3),
        amount: Joi.number().required().positive(),
        exchangeRate: Joi.number(),
        settlementAmount: Joi.number(),
        accountWithInstitution: Joi.string(),
        beneficiaryAccountNumber: Joi.string(),
        beneficiaryIban: Joi.string(),
        beneficiaryName: Joi.string(),
        beneficiaryAddressLine1: Joi.string(),
        beneficiaryAddressLine2: Joi.string(),
        beneficiaryCity: Joi.string(),
        beneficiaryCountry: Joi.string(),
        beneficiaryBankName: Joi.string(),
        beneficiaryBankBic: Joi.string(),
        beneficiaryBankAddress: Joi.string(),
        intermediaryBankBic: Joi.string(),
        intermediaryBankName: Joi.string(),
        correspondentBankBic: Joi.string(),
        remittanceInformation: Joi.string().max(140),
        purposeOfPaymentCode: Joi.string(),
        regulatoryReportingCode: Joi.string(),
        chargesType: Joi.string().valid('OUR', 'SHA', 'BEN').required(),
        senderChargesAmount: Joi.number(),
        receiverChargesAmount: Joi.number(),
        senderToReceiverInformation: Joi.string(),
      })
    )
    .min(1)
    .required(),
  compliance: Joi.object().optional(),
});

function buildMessageFromBody(body: Record<string, unknown>, userId: number) {
  const mtType = (body.mtType as 'MT101' | 'MT102' | 'MT102STP') || 'MT101';
  const msgId = `${mtType}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const batchId = `BATCH-${Date.now()}`;
  const transactions: Mt101Transaction[] = (body.transactions as Record<string, unknown>[]).map(
    (t, i) => ({
      id: mt101Store.getNextTransactionId(),
      sequenceNumber: i + 1,
      currency: t.currency as string,
      amount: Number(t.amount),
      exchangeRate: t.exchangeRate as number | undefined,
      settlementAmount: t.settlementAmount as number | undefined,
      accountWithInstitution: t.accountWithInstitution as string | undefined,
      beneficiaryAccountNumber: t.beneficiaryAccountNumber as string | undefined,
      beneficiaryIban: t.beneficiaryIban as string | undefined,
      beneficiaryName: t.beneficiaryName as string | undefined,
      beneficiaryAddressLine1: t.beneficiaryAddressLine1 as string | undefined,
      beneficiaryAddressLine2: t.beneficiaryAddressLine2 as string | undefined,
      beneficiaryCity: t.beneficiaryCity as string | undefined,
      beneficiaryCountry: t.beneficiaryCountry as string | undefined,
      beneficiaryBankName: t.beneficiaryBankName as string | undefined,
      beneficiaryBankBic: t.beneficiaryBankBic as string | undefined,
      beneficiaryBankAddress: t.beneficiaryBankAddress as string | undefined,
      intermediaryBankBic: t.intermediaryBankBic as string | undefined,
      intermediaryBankName: t.intermediaryBankName as string | undefined,
      correspondentBankBic: t.correspondentBankBic as string | undefined,
      remittanceInformation: t.remittanceInformation as string | undefined,
      purposeOfPaymentCode: t.purposeOfPaymentCode as string | undefined,
      regulatoryReportingCode: t.regulatoryReportingCode as string | undefined,
      chargesType: (t.chargesType as 'OUR' | 'SHA' | 'BEN') || 'OUR',
      senderChargesAmount: t.senderChargesAmount as number | undefined,
      receiverChargesAmount: t.receiverChargesAmount as number | undefined,
      senderToReceiverInformation: t.senderToReceiverInformation as string | undefined,
    })
  );
  return {
    userId,
    mtType,
    messageId: msgId,
    batchId,
    transactionReferenceNumber: body.transactionReferenceNumber as string,
    customerSpecifiedReference: body.customerSpecifiedReference as string | undefined,
    messageIndex: body.messageIndex as number | undefined,
    messageTotal: body.messageTotal as number | undefined,
    messageStatus: 'Draft' as const,
    swiftHeader: (body.swiftHeader as Mt101SwiftHeader) || {},
    orderingCustomer: (body.orderingCustomer as Mt101OrderingCustomer) || {},
    executionDetails: body.executionDetails as Mt101ExecutionDetails,
    transactions,
    compliance: body.compliance as Mt101Compliance | undefined,
    createdBy: userId,
  };
}

router.post('/messages', async (req: Req, res: Response) => {
  const { error, value } = createSchema.validate(req.body);
  if (error) {
    return res.status(400).json({ status: 'error', message: error.details[0].message });
  }
  const userId = req.user!.userId;
  const data = buildMessageFromBody(value, userId);
  const msg = mt101Store.create(data);
  const autoFields = await generateAutoFields({
    mtType: 'mt101',
    mtMessageId: msg.id,
    senderLtConfig: msg.swiftHeader?.logicalTerminal,
    useStp: (msg.mtType || '').includes('STP'),
  });
  res.status(201).json({
    status: 'success',
    data: { message: msg, auto_fields: autoFields },
  });
});

router.get('/messages', (req: Req, res: Response) => {
  const userId = req.user!.userId;
  const filters = {
    status: req.query.status as string | undefined,
    mtType: req.query.mtType as string | undefined,
    dateFrom: req.query.dateFrom as string | undefined,
    dateTo: req.query.dateTo as string | undefined,
    reference: req.query.reference as string | undefined,
    debtorName: req.query.debtorName as string | undefined,
    beneficiaryName: req.query.beneficiaryName as string | undefined,
    currency: req.query.currency as string | undefined,
    amountMin: req.query.amountMin ? Number(req.query.amountMin) : undefined,
    amountMax: req.query.amountMax ? Number(req.query.amountMax) : undefined,
    page: req.query.page ? Number(req.query.page) : 1,
    limit: req.query.limit ? Number(req.query.limit) : 20,
    sortBy: req.query.sortBy as string | undefined,
    sortOrder: (req.query.sortOrder as 'asc' | 'desc') || 'desc',
  };
  const result = mt101Store.findByUserId(userId, filters);
  res.json({ status: 'success', data: result });
});

router.get('/messages/:id', (req: Req, res: Response) => {
  const msg = mt101Store.findById(Number(req.params.id));
  if (!msg || msg.userId !== req.user!.userId) {
    return res.status(404).json({ status: 'error', message: 'Mensagem não encontrada' });
  }
  const autoFields = getAutoFieldsForMessage('mt101', msg.id);
  const networkReport = swiftNetworkReportStore.findByMessage('mt101', msg.id);
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
  const msg = mt101Store.findById(Number(req.params.id));
  if (!msg || msg.userId !== req.user!.userId) {
    return res.status(404).json({ status: 'error', message: 'Mensagem não encontrada' });
  }
  if (!canEdit(msg)) {
    return res.status(400).json({
      status: 'error',
      message: 'Edição não permitida. Status atual: ' + msg.messageStatus,
    });
  }
  const { error, value } = createSchema.validate(req.body);
  if (error) {
    return res.status(400).json({ status: 'error', message: error.details[0].message });
  }
  const userId = req.user!.userId;
  const { messageId: _msgId, ...updateData } = buildMessageFromBody(value, userId);
  const updated = mt101Store.update(msg.id, {
    ...updateData,
    messageStatus: msg.repairRequiredFlag ? 'Draft' : msg.messageStatus,
    repairRequiredFlag: false,
  }, userId);
  if (!updated) {
    return res.status(400).json({ status: 'error', message: 'Falha ao atualizar' });
  }
  res.json({ status: 'success', data: { message: updated } });
});

router.post('/messages/:id/validate', (req: Req, res: Response) => {
  const msg = mt101Store.findById(Number(req.params.id));
  if (!msg || msg.userId !== req.user!.userId) {
    return res.status(404).json({ status: 'error', message: 'Mensagem não encontrada' });
  }
  const result = validateMt101(msg);
  if (result.valid) {
    mt101Store.update(msg.id, { messageStatus: 'Validated' }, req.user!.userId);
  }
  res.json({ status: 'success', data: result });
});

router.post('/messages/:id/submit-approval', (req: Req, res: Response) => {
  const msg = mt101Store.findById(Number(req.params.id));
  if (!msg || msg.userId !== req.user!.userId) {
    return res.status(404).json({ status: 'error', message: 'Mensagem não encontrada' });
  }
  const validation = validateMt101(msg);
  if (!validation.valid) {
    return res.status(400).json({
      status: 'error',
      message: 'Validação falhou',
      data: validation,
    });
  }
  if (!['Draft', 'Validated'].includes(msg.messageStatus)) {
    return res.status(400).json({
      status: 'error',
      message: 'Status atual não permite submissão para aprovação',
    });
  }
  const updated = mt101Store.update(msg.id, { messageStatus: 'Pending Approval' }, req.user!.userId);
  mt101Store.addAuditEntry(msg.id, 'SUBMITTED_FOR_APPROVAL', req.user!.userId);
  res.json({ status: 'success', data: { message: updated } });
});

router.post('/messages/:id/approve', (req: Req, res: Response) => {
  const msg = mt101Store.findById(Number(req.params.id));
  if (!msg || msg.userId !== req.user!.userId) {
    return res.status(404).json({ status: 'error', message: 'Mensagem não encontrada' });
  }
  if (msg.messageStatus !== 'Pending Approval') {
    return res.status(400).json({
      status: 'error',
      message: 'Mensagem não está pendente de aprovação',
    });
  }
  const approverId = req.user!.userId;
  const user = userStore.findById(approverId);
  const userName = user?.name || user?.email || String(approverId);

  if (!msg.approvedBy1) {
    const updated = mt101Store.update(msg.id, { approvedBy1: approverId }, approverId);
    mt101Store.addAuditEntry(msg.id, 'APPROVED_BY_1', approverId, userName);
    return res.json({ status: 'success', data: { message: updated } });
  }
  if (msg.approvedBy1 === approverId) {
    const updated = mt101Store.update(msg.id, {
      approvedBy2: approverId,
      messageStatus: 'Approved',
    }, approverId);
    mt101Store.addAuditEntry(msg.id, 'APPROVED_BY_2', approverId, userName);
    return res.json({ status: 'success', data: { message: updated } });
  }
  if (!requireFourEyes(msg.approvedBy1, approverId)) {
    return res.status(400).json({
      status: 'error',
      message: '4-eyes: dois aprovadores distintos são necessários',
    });
  }
  const updated = mt101Store.update(msg.id, {
    approvedBy2: approverId,
    messageStatus: 'Approved',
  }, approverId);
  mt101Store.addAuditEntry(msg.id, 'APPROVED_BY_2', approverId, userName);
  res.json({ status: 'success', data: { message: updated } });
});

router.post('/messages/:id/network-report', async (req: Req, res: Response) => {
  await handleAttachNetworkReport(req as unknown as Parameters<typeof handleAttachNetworkReport>[0], res, 'mt101', (id, userId) => {
    const msg = mt101Store.findById(id);
    if (!msg || msg.userId !== userId) return { found: false };
    return {
      found: true,
      addAudit: (event, details) => mt101Store.addAuditEntry(id, event, userId, undefined, details),
    };
  });
});

router.post('/messages/:id/release', (req: Req, res: Response) => {
  const msg = mt101Store.findById(Number(req.params.id));
  if (!msg || msg.userId !== req.user!.userId) {
    return res.status(404).json({ status: 'error', message: 'Mensagem não encontrada' });
  }
  if (msg.messageStatus !== 'Approved') {
    return res.status(400).json({
      status: 'error',
      message: 'Mensagem deve estar Aprovada para liberar',
    });
  }
  const finMessage = generateMt101Fin(msg);
  const now = new Date().toISOString();
  const updated = mt101Store.update(msg.id, {
    messageStatus: 'Released to SWIFT',
    releaseTimestamp: now,
    finMessage,
  }, req.user!.userId);
  mt101Store.addAuditEntry(msg.id, 'RELEASED', req.user!.userId, undefined, { finMessage });
  res.json({ status: 'success', data: { message: updated } });
});

router.post('/messages/:id/ack', (req: Req, res: Response) => {
  const msg = mt101Store.findById(Number(req.params.id));
  if (!msg || msg.userId !== req.user!.userId) {
    return res.status(404).json({ status: 'error', message: 'Mensagem não encontrada' });
  }
  if (!['Released to SWIFT', 'ACK Received', 'NACK Received'].includes(msg.messageStatus)) {
    return res.status(400).json({
      status: 'error',
      message: 'ACK só pode ser registrado para mensagens liberadas',
    });
  }
  const now = new Date().toISOString();
  const updated = mt101Store.update(msg.id, {
    messageStatus: 'ACK Received',
    swiftAckReceivedTimestamp: now,
  }, req.user!.userId);
  mt101Store.addAuditEntry(msg.id, 'ACK_RECEIVED', req.user!.userId);
  res.json({ status: 'success', data: { message: updated } });
});

router.post('/messages/:id/nack', (req: Req, res: Response) => {
  const msg = mt101Store.findById(Number(req.params.id));
  if (!msg || msg.userId !== req.user!.userId) {
    return res.status(404).json({ status: 'error', message: 'Mensagem não encontrada' });
  }
  if (!['Released to SWIFT', 'ACK Received', 'NACK Received'].includes(msg.messageStatus)) {
    return res.status(400).json({
      status: 'error',
      message: 'NACK só pode ser registrado para mensagens liberadas',
    });
  }
  const nackCode = (req.body?.nackCode as string) || 'NACK';
  const now = new Date().toISOString();
  const updated = mt101Store.update(msg.id, {
    messageStatus: 'NACK Received',
    swiftNackCode: nackCode,
    repairRequiredFlag: true,
  }, req.user!.userId);
  mt101Store.addAuditEntry(msg.id, 'NACK_RECEIVED', req.user!.userId, undefined, { nackCode });
  res.json({ status: 'success', data: { message: updated } });
});

router.post('/messages/:id/cancel', (req: Req, res: Response) => {
  const msg = mt101Store.findById(Number(req.params.id));
  if (!msg || msg.userId !== req.user!.userId) {
    return res.status(404).json({ status: 'error', message: 'Mensagem não encontrada' });
  }
  if (isReleasedOrLater(msg)) {
    return res.status(400).json({
      status: 'error',
      message: 'Cancelamento não permitido após liberação',
    });
  }
  const updated = mt101Store.update(msg.id, {
    messageStatus: 'Cancelled',
    cancellationRequestedFlag: true,
  }, req.user!.userId);
  mt101Store.addAuditEntry(msg.id, 'CANCELLATION_REQUESTED', req.user!.userId);
  res.json({ status: 'success', data: { message: updated } });
});

router.get('/messages/:id/fin', (req: Req, res: Response) => {
  const msg = mt101Store.findById(Number(req.params.id));
  if (!msg || msg.userId !== req.user!.userId) {
    return res.status(404).json({ status: 'error', message: 'Mensagem não encontrada' });
  }
  if (!['Released to SWIFT', 'ACK Received', 'NACK Received', 'Completed'].includes(msg.messageStatus)) {
    return res.status(400).json({
      status: 'error',
      message: 'FIN disponível apenas para mensagens liberadas',
    });
  }
  const finMessage = msg.finMessage || generateMt101Fin(msg);
  res.json({ status: 'success', data: { finMessage } });
});

export default router;
