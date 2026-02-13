import { Router, Request, Response } from 'express';
import { authMiddleware } from '../middleware/auth.js';

const router = Router();

router.use(authMiddleware);

// Taxas fixas para desenvolvimento (substituir por API real depois)
const RATES: Record<string, number> = {
  USD: 1,
  EUR: 0.93,
  GBP: 0.81,
  JPY: 149.52,
  BRL: 4.97,
  CHF: 0.88,
};

router.get('/rates', (req: Request & { user?: { userId: number } }, res: Response) => {
  const base = (req.query.base as string) || 'USD';
  const symbols = (req.query.symbols as string) || 'EUR,GBP,JPY,BRL,CHF';
  const symbolList = symbols.split(',').map((s) => s.trim());

  const baseRate = RATES[base] || 1;
  const rates: Record<string, number> = {};
  for (const sym of symbolList) {
    if (RATES[sym]) {
      rates[sym] = RATES[sym] / baseRate;
    }
  }

  res.json({
    status: 'success',
    data: {
      base,
      rates,
      timestamp: new Date().toISOString(),
    },
  });
});

export default router;
