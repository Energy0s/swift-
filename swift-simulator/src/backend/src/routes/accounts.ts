import { Router, Request, Response } from 'express';
import { authMiddleware } from '../middleware/auth.js';
import { accountStore, transferStore } from '../store/index.js';
import { generateMt940 } from '../services/mt940Service.js';

const router = Router();

router.use(authMiddleware);

router.get('/', (req: Request & { user?: { userId: number } }, res: Response) => {
  const accounts = accountStore.findByUserId(req.user!.userId).map((a) => ({
    ...a,
    dailyUsed: transferStore.getDailyUsedByAccount(a.id),
  }));
  res.json({
    status: 'success',
    data: { accounts },
  });
});

router.get('/:id', (req: Request & { user?: { userId: number } }, res: Response) => {
  const account = accountStore.findById(Number(req.params.id));
  if (!account || account.userId !== req.user!.userId) {
    return res.status(404).json({ status: 'error', message: 'Conta não encontrada' });
  }
  res.json({
    status: 'success',
    data: {
      account: {
        ...account,
        dailyUsed: transferStore.getDailyUsedByAccount(account.id),
      },
    },
  });
});

router.get('/:id/statement', (req: Request & { user?: { userId: number } }, res: Response) => {
  const account = accountStore.findById(Number(req.params.id));
  if (!account || account.userId !== req.user!.userId) {
    return res.status(404).json({ status: 'error', message: 'Conta não encontrada' });
  }
  const format = (req.query.format as string) || 'mt940';
  if (format === 'mt940') {
    const accountTransfers = transferStore.findByAccountId(account.id);
    const today = new Date().toISOString().slice(0, 10);
    const statementNumber = `STMT${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, '0')}`;
    const openingBalance = account.balance + accountTransfers.reduce((sum, t) => sum + t.totalAmount, 0);
    const mt940 = generateMt940({
      accountIban: account.iban,
      statementNumber,
      sequenceNumber: '001',
      openingBalance,
      openingBalanceDate: today,
      openingBalanceIsDebit: openingBalance < 0,
      currency: account.currency,
      transactions: accountTransfers.map((t) => ({
        valueDate: t.createdAt.slice(0, 10),
        bookingDate: t.createdAt.slice(0, 10),
        isDebit: true,
        amount: t.totalAmount,
        currency: t.currency,
        reference: t.referenceNumber,
        description: `TRF TO ${t.destinationHolderName} / ${t.destinationIban}`,
      })),
    });
    res.set('Content-Type', 'text/plain; charset=utf-8');
    res.send(mt940);
  } else {
    res.status(400).json({ status: 'error', message: 'Formato não suportado. Use format=mt940' });
  }
});

export default router;
