import { Router, Request, Response } from 'express';
import { authMiddleware } from '../middleware/auth.js';
import { searchBanks, findBankByBic } from '../store/banksStore.js';

const router = Router();

router.use(authMiddleware);

/**
 * GET /api/banks/search?q=COBA
 * Busca bancos por BIC, nome, cidade ou país
 * Para autocomplete no campo BIC
 */
router.get('/search', (req: Request & { user?: { userId: number } }, res: Response) => {
  const q = (req.query.q as string) || '';
  const limit = Math.min(Number(req.query.limit) || 20, 50);
  const banks = searchBanks(q, limit);
  res.json({
    status: 'success',
    data: { banks },
  });
});

/**
 * GET /api/banks/lookup?bic=COBADEFF
 * Busca banco exato por BIC
 * Retorna nome, cidade, país
 */
router.get('/lookup', (req: Request & { user?: { userId: number } }, res: Response) => {
  const bic = (req.query.bic as string) || '';
  const bank = findBankByBic(bic);
  if (!bank) {
    return res.status(404).json({ status: 'error', message: 'BIC não encontrado' });
  }
  res.json({
    status: 'success',
    data: { bank },
  });
});

export default router;
