import { Router, Request, Response } from 'express';
import { authMiddleware } from '../middleware/auth.js';
import { messagesStore } from '../store/messagesStore.js';
import { accountStore } from '../store/index.js';
import { generateMtMessage } from '../services/mtRegistry.js';

const router = Router();

router.use(authMiddleware);

router.get('/', (req: Request & { user?: { userId: number } }, res: Response) => {
  const { messageType, status, page = 1, limit = 20 } = req.query;
  const result = messagesStore.findByUserId(req.user!.userId, {
    messageType: messageType as any,
    status: status as string,
    page: Number(page),
    limit: Number(limit),
  });
  res.json({ status: 'success', data: result });
});

router.get('/stats', (req: Request & { user?: { userId: number } }, res: Response) => {
  const result = messagesStore.findByUserId(req.user!.userId, { limit: 10000 });
  const sentToday = result.messages.filter((m) => {
    const today = new Date().toISOString().slice(0, 10);
    return m.createdAt.startsWith(today) && m.status === 'sent';
  }).length;
  const pending = result.messages.filter((m) => m.status === 'draft').length;
  res.json({ status: 'success', data: { sentToday, pending } });
});

router.get('/:id', (req: Request & { user?: { userId: number } }, res: Response) => {
  const msg = messagesStore.findById(Number(req.params.id));
  if (!msg || msg.userId !== req.user!.userId) {
    return res.status(404).json({ status: 'error', message: 'Mensagem não encontrada' });
  }
  res.json({ status: 'success', data: { message: msg } });
});

router.post('/', (req: Request & { user?: { userId: number } }, res: Response) => {
  try {
    const { messageType, payload } = req.body;
    if (!messageType || !payload) {
      return res.status(400).json({
        status: 'error',
        message: 'Campos obrigatórios: messageType, payload',
      });
    }

    const accounts = accountStore.findByUserId(req.user!.userId);
    const defaultBic = accounts[0]?.bic || 'XXXXXXXX';

    const enrichedPayload = {
      ...payload,
      referenceNumber: payload.referenceNumber || `REF${Date.now()}`.substring(0, 16),
      senderBic: payload.senderBic || defaultBic,
      receiverBic: payload.receiverBic || payload.destinationBic || payload.beneficiaryBic || defaultBic,
      sourceBic: payload.sourceBic || defaultBic,
      orderingBic: payload.orderingBic || defaultBic,
      beneficiaryBic: payload.beneficiaryBic || payload.destinationBic || defaultBic,
    };

    const rawMessage = generateMtMessage(messageType, enrichedPayload);

    const message = messagesStore.create({
      userId: req.user!.userId,
      messageType,
      referenceNumber: enrichedPayload.referenceNumber,
      rawMessage,
      payload: enrichedPayload,
      status: 'sent',
    });

    res.status(201).json({
      status: 'success',
      message: 'Mensagem SWIFT gerada com sucesso',
      data: {
        message: {
          id: message.id,
          messageType: message.messageType,
          referenceNumber: message.referenceNumber,
          status: message.status,
          rawMessage: message.rawMessage,
        },
      },
    });
  } catch (err: any) {
    res.status(400).json({
      status: 'error',
      message: err?.message || 'Erro ao gerar mensagem',
    });
  }
});

export default router;
