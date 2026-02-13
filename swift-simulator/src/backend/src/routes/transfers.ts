import { Router, Request, Response } from 'express';
import { authMiddleware } from '../middleware/auth.js';
import { accountStore, transferStore, userStore } from '../store/index.js';
import { generatePacs008, generateReferenceNumber } from '../services/iso20022Service.js';
import { generateMt103 } from '../services/mt103Service.js';
import { generateSepaEpcCt } from '../services/sepaEpcCtService.js';
import { generateCbprMessage } from '../services/cbprService.js';
import { generateRtgsPacs008 } from '../services/rtgsService.js';
import { generateFednowPacs008 } from '../services/fednowService.js';
import { generateSicEurosicPacs008 } from '../services/sicEurosicService.js';
import { generateBahtnetMessage } from '../services/bahtnetService.js';
import { generateMt202 } from '../services/mt202Service.js';

const router = Router();

router.use(authMiddleware);

router.get('/stats', (req: Request & { user?: { userId: number } }, res: Response) => {
  const today = new Date().toISOString().slice(0, 10);
  const userTransfers = transferStore.findByUserId(req.user!.userId, { limit: 10000 });
  const sentToday = userTransfers.transfers.filter((t) => t.createdAt.startsWith(today)).length;
  const pending = userTransfers.transfers.filter((t) => t.status === 'pending' || t.status === 'processing').length;
  res.json({
    status: 'success',
    data: { sentToday, pending },
  });
});

router.get('/', (req: Request & { user?: { userId: number } }, res: Response) => {
  const { page = 1, limit = 10, status, accountId, reference } = req.query;
  const result = transferStore.findByUserId(req.user!.userId, {
    page: Number(page),
    limit: Number(limit),
    status: status as string | undefined,
    accountId: accountId ? Number(accountId) : undefined,
    reference: reference as string | undefined,
  });
  res.json({
    status: 'success',
    data: result,
  });
});

router.get('/:id', (req: Request & { user?: { userId: number } }, res: Response) => {
  const transfer = transferStore.findById(Number(req.params.id));
  if (!transfer || transfer.userId !== req.user!.userId) {
    return res.status(404).json({ status: 'error', message: 'Transferência não encontrada' });
  }
  const sourceAccount = accountStore.findById(transfer.sourceAccountId);
  res.json({
    status: 'success',
    data: {
      transfer: {
        ...transfer,
        destinationAccount: {
          iban: transfer.destinationIban,
          bic: transfer.destinationBic,
          holderName: transfer.destinationHolderName,
        },
        sourceAccount: sourceAccount
          ? {
              iban: sourceAccount.iban,
              bic: sourceAccount.bic,
              accountNumber: sourceAccount.accountNumber,
            }
          : null,
      },
    },
  });
});

router.get('/:id/swift-message', (req: Request & { user?: { userId: number } }, res: Response) => {
  const transfer = transferStore.findById(Number(req.params.id));
  if (!transfer || transfer.userId !== req.user!.userId) {
    return res.status(404).json({ status: 'error', message: 'Transferência não encontrada' });
  }
  const format = (req.query.format as string) || 'xml';
  if (format === 'mt103') {
    res.set('Content-Type', 'text/plain; charset=utf-8');
    res.send(transfer.swiftMessageMt103);
  } else if (format === 'mt202') {
    res.set('Content-Type', 'text/plain; charset=utf-8');
    const sourceBic = accountStore.findById(transfer.sourceAccountId)?.bic ?? '';
    const msg = transfer.swiftMessageMt202 ?? generateMt202({
      referenceNumber: transfer.referenceNumber,
      orderingBic: sourceBic,
      beneficiaryBic: transfer.destinationBic,
      amount: transfer.amount,
      currency: transfer.currency,
    });
    res.send(msg);
  } else if (format === 'sepa-epc-ct') {
    res.set('Content-Type', 'application/xml');
    res.send(transfer.swiftMessageSepaEpcCt);
  } else if (format === 'cbpr') {
    res.set('Content-Type', 'application/xml');
    res.send(transfer.swiftMessageCbpr);
  } else if (format === 'rtgs') {
    res.set('Content-Type', 'application/xml');
    res.send(transfer.swiftMessageRtgs);
  } else if (format === 'fednow') {
    res.set('Content-Type', 'application/xml');
    res.send(transfer.swiftMessageFednow);
  } else if (format === 'sic-eurosic') {
    res.set('Content-Type', 'application/xml');
    const msg = transfer.swiftMessageSicEurosic ?? generateSicEurosicPacs008({
      referenceNumber: transfer.referenceNumber,
      sourceIban: accountStore.findById(transfer.sourceAccountId)?.iban ?? '',
      sourceBic: accountStore.findById(transfer.sourceAccountId)?.bic ?? '',
      sourceHolderName: userStore.findById(transfer.userId)?.name ?? '',
      destinationIban: transfer.destinationIban,
      destinationBic: transfer.destinationBic,
      destinationHolderName: transfer.destinationHolderName,
      amount: transfer.amount,
      currency: transfer.currency,
      purpose: transfer.purpose,
    });
    res.send(msg);
  } else if (format === 'bahtnet') {
    res.set('Content-Type', 'application/xml');
    const msg = transfer.swiftMessageBahtnet ?? generateBahtnetMessage({
      referenceNumber: transfer.referenceNumber,
      sourceIban: accountStore.findById(transfer.sourceAccountId)?.iban ?? '',
      sourceBic: accountStore.findById(transfer.sourceAccountId)?.bic ?? '',
      sourceHolderName: userStore.findById(transfer.userId)?.name ?? '',
      destinationIban: transfer.destinationIban,
      destinationBic: transfer.destinationBic,
      destinationHolderName: transfer.destinationHolderName,
      amount: transfer.amount,
      currency: transfer.currency,
      purpose: transfer.purpose,
    });
    res.send(msg);
  } else {
    res.set('Content-Type', 'application/xml');
    res.send(transfer.swiftMessageXml);
  }
});

router.post('/', (req: Request & { user?: { userId: number } }, res: Response) => {
  try {
    const { sourceAccountId, destinationIban, destinationBic, destinationHolderName, amount, currency, purpose, bankOperationCode, detailsOfCharges } =
      req.body;

    if (!sourceAccountId || !destinationIban || !destinationBic || !destinationHolderName || !amount || !currency) {
      return res.status(400).json({
        status: 'error',
        message: 'Campos obrigatórios: sourceAccountId, destinationIban, destinationBic, destinationHolderName, amount, currency',
      });
    }

    const sourceAccount = accountStore.findById(Number(sourceAccountId));
    if (!sourceAccount || sourceAccount.userId !== req.user!.userId) {
      return res.status(404).json({ status: 'error', message: 'AC01 - Conta de origem não encontrada' });
    }

    const user = userStore.findById(req.user!.userId);
    if (!user) {
      return res.status(401).json({ status: 'error', message: 'Usuário não encontrado' });
    }

    const numAmount = Number(amount);
    if (numAmount <= 0) {
      return res.status(400).json({ status: 'error', message: 'AM09 - Valor deve ser maior que zero' });
    }

    if (sourceAccount.balance < numAmount) {
      return res.status(400).json({ status: 'error', message: 'AM04 - Saldo insuficiente' });
    }

    const fees = 25.0;
    const totalAmount = numAmount + fees;

    const dailyUsed = transferStore.getDailyUsedByAccount(sourceAccount.id);
    if (dailyUsed + totalAmount > sourceAccount.dailyLimit) {
      return res.status(400).json({
        status: 'error',
        message: `DM01 - Limite diário excedido. Usado hoje: ${dailyUsed.toFixed(2)}. Limite: ${sourceAccount.dailyLimit.toFixed(2)}`,
      });
    }
    const referenceNumber = generateReferenceNumber();

    const transferData = {
      referenceNumber,
      sourceIban: sourceAccount.iban,
      sourceBic: sourceAccount.bic,
      sourceHolderName: user.name,
      destinationIban,
      destinationBic,
      destinationHolderName,
      amount: numAmount,
      currency,
      purpose,
      bankOperationCode: bankOperationCode || 'CRED',
      detailsOfCharges: detailsOfCharges || 'OUR',
    };

    const swiftMessageXml = generatePacs008(transferData);
    const swiftMessageMt103 = generateMt103(transferData);
    const swiftMessageSepaEpcCt = generateSepaEpcCt({
      ...transferData,
      categoryPurpose: req.body.categoryPurpose || 'OTHR',
    });
    const swiftMessageCbpr = generateCbprMessage(transferData);
    const swiftMessageRtgs = generateRtgsPacs008(transferData);
    const swiftMessageFednow = generateFednowPacs008(transferData);
    const swiftMessageSicEurosic = generateSicEurosicPacs008(transferData);
    const swiftMessageBahtnet = generateBahtnetMessage(transferData);
    const swiftMessageMt202 = generateMt202({
      referenceNumber,
      orderingBic: sourceAccount.bic,
      beneficiaryBic: destinationBic,
      amount: numAmount,
      currency,
    });

    const transfer = transferStore.create({
      userId: req.user!.userId,
      referenceNumber,
      sourceAccountId: sourceAccount.id,
      destinationIban,
      destinationBic,
      destinationHolderName,
      amount: numAmount,
      currency,
      fees,
      totalAmount,
      purpose,
      status: 'created',
      swiftMessageXml,
      swiftMessageMt103,
      swiftMessageMt202,
      swiftMessageSepaEpcCt,
      swiftMessageCbpr,
      swiftMessageRtgs,
      swiftMessageFednow,
      swiftMessageSicEurosic,
      swiftMessageBahtnet,
      messageType: 'pacs.008',
    });

    accountStore.updateBalance(sourceAccount.id, sourceAccount.balance - totalAmount);

    transferStore.update(transfer.id, { status: 'completed' });

    res.status(201).json({
      status: 'success',
      message: 'Transferência criada com sucesso',
      data: {
        transfer: {
          id: transfer.id,
          referenceNumber: transfer.referenceNumber,
          status: 'completed',
          estimatedCompletion: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        },
      },
    });
  } catch (err) {
    res.status(500).json({ status: 'error', message: 'Erro interno' });
  }
});

export default router;
