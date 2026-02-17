/**
 * Rotas SWIFT Inbox - Recebimento e listagem de mensagens recebidas
 */

import { Router, Request, Response } from 'express';
import Joi from 'joi';
import { authMiddleware } from '../middleware/auth.js';
import { incomingMessageStore } from '../store/incomingMessageStore.js';
import { parse, computeChecksumSha256 } from '../services/swiftIncomingParser.js';
import type { AuthPayload } from '../middleware/auth.js';
import type { IngestSource } from '../store/incomingMessageTypes.js';

type Req = Request & { user?: AuthPayload };

const router = Router();
router.use(authMiddleware);

const ingestSchema = Joi.object({
  raw_payload: Joi.string().required().min(1),
  ingest_source: Joi.string()
    .valid('SIMULATED', 'SWIFT_GATEWAY', 'FILE', 'API', 'OTHER')
    .default('SIMULATED'),
  received_at: Joi.string().isoDate().optional(),
});

router.post('/', (req: Req, res: Response) => {
  const { error, value } = ingestSchema.validate(req.body);
  if (error) return res.status(400).json({ status: 'error', message: error.details[0].message });

  const rawPayload = value.raw_payload as string;
  const ingestSource = (value.ingest_source as IngestSource) || 'SIMULATED';
  const receivedAt = (value.received_at as string) || new Date().toISOString();

  const checksumSha256 = computeChecksumSha256(rawPayload);
  const rawSizeBytes = Buffer.byteLength(rawPayload, 'utf8');

  const result = parse(rawPayload, receivedAt);

  const msg = incomingMessageStore.create({
    receivedAt,
    ingestSource,
    direction: 'INCOMING',
    status: result.parsed ? 'PARSED' : 'PARSE_ERROR',
    rawPayload,
    rawFormat: rawPayload.includes('{1:') || rawPayload.includes('{2:') ? 'FIN' : 'FIN',
    checksumSha256,
    rawSizeBytes,
    mtType: result.mtType,
    senderBic: result.senderBic,
    receiverBic: result.receiverBic,
    priority: result.priority,
    uetr: result.uetr,
    ref20: result.extractedFields.ref_20,
    ref21: result.extractedFields.ref_21,
    relatedMt: result.extractedFields.related_mt,
    valueDate: result.extractedFields.value_date,
    currency: result.extractedFields.currency,
    amount: result.extractedFields.amount,
    normalizedText: result.normalizedText,
    normalizedJson: result.tags,
    parseErrors: result.parseErrors?.length ? result.parseErrors : undefined,
    createdBy: req.user!.userId,
  });

  res.status(201).json({
    status: 'success',
    data: {
      message: msg,
      parseResult: { parsed: result.parsed },
    },
  });
});

router.get('/', (req: Req, res: Response) => {
  const result = incomingMessageStore.find({
    mtType: req.query.mt_type as string | undefined,
    status: req.query.status as string | undefined,
    senderBic: req.query.sender_bic as string | undefined,
    receiverBic: req.query.receiver_bic as string | undefined,
    ref20: req.query.ref_20 as string | undefined,
    uetr: req.query.uetr as string | undefined,
    dateFrom: req.query.date_from as string | undefined,
    dateTo: req.query.date_to as string | undefined,
    freeText: req.query.free_text as string | undefined,
    page: req.query.page ? Number(req.query.page) : 1,
    limit: req.query.limit ? Number(req.query.limit) : 20,
    sort: (req.query.sort as string) || 'receivedAt',
    sortOrder: (req.query.sort_order as 'asc' | 'desc') || 'desc',
  });
  res.json({ status: 'success', data: result });
});

router.get('/:id', (req: Req, res: Response) => {
  const msg = incomingMessageStore.findById(req.params.id);
  if (!msg) return res.status(404).json({ status: 'error', message: 'Mensagem não encontrada' });

  incomingMessageStore.recordViewed(msg.id, req.user!.userId);

  const auditLog = incomingMessageStore.getAuditLog(msg.id);

  res.json({
    status: 'success',
    data: {
      message: msg,
      auditLog,
    },
  });
});

router.post('/:id/archive', (req: Req, res: Response) => {
  const msg = incomingMessageStore.findById(req.params.id);
  if (!msg) return res.status(404).json({ status: 'error', message: 'Mensagem não encontrada' });

  const updated = incomingMessageStore.update(
    msg.id,
    { status: 'ARCHIVED' },
    req.user!.userId
  );
  if (!updated) return res.status(400).json({ status: 'error', message: 'Falha ao arquivar' });

  res.json({ status: 'success', data: { message: updated } });
});

router.post('/:id/mark-review-required', (req: Req, res: Response) => {
  const msg = incomingMessageStore.findById(req.params.id);
  if (!msg) return res.status(404).json({ status: 'error', message: 'Mensagem não encontrada' });

  const updated = incomingMessageStore.update(
    msg.id,
    { status: 'REVIEW_REQUIRED' },
    req.user!.userId
  );
  if (!updated) return res.status(400).json({ status: 'error', message: 'Falha ao marcar' });

  res.json({ status: 'success', data: { message: updated } });
});

router.post('/:id/reparse', (req: Req, res: Response) => {
  const msg = incomingMessageStore.findById(req.params.id);
  if (!msg) return res.status(404).json({ status: 'error', message: 'Mensagem não encontrada' });

  const result = parse(msg.rawPayload, msg.receivedAt);

  const updated = incomingMessageStore.update(
    msg.id,
    {
      status: result.parsed ? 'PARSED' : 'PARSE_ERROR',
      mtType: result.mtType,
      senderBic: result.senderBic,
      receiverBic: result.receiverBic,
      priority: result.priority,
      uetr: result.uetr,
      ref20: result.extractedFields.ref_20,
      ref21: result.extractedFields.ref_21,
      relatedMt: result.extractedFields.related_mt,
      valueDate: result.extractedFields.value_date,
      currency: result.extractedFields.currency,
      amount: result.extractedFields.amount,
      normalizedText: result.normalizedText,
      normalizedJson: result.tags,
      parseErrors: result.parseErrors?.length ? result.parseErrors : undefined,
    },
    req.user!.userId
  );
  if (!updated) return res.status(400).json({ status: 'error', message: 'Falha ao reparse' });

  res.json({
    status: 'success',
    data: {
      message: updated,
      parseResult: { parsed: result.parsed },
    },
  });
});

export default router;
