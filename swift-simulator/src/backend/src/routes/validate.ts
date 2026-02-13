import { Router, Request, Response } from 'express';
import { authMiddleware } from '../middleware/auth.js';
import { findBankByBic } from '../store/banksStore.js';

const router = Router();

router.use(authMiddleware);

// Validação simplificada de IBAN (formato básico)
function isValidIbanFormat(iban: string): boolean {
  const cleaned = iban.replace(/\s/g, '').toUpperCase();
  if (cleaned.length < 15 || cleaned.length > 34) return false;
  if (!/^[A-Z]{2}[0-9]{2}[A-Z0-9]+$/.test(cleaned)) return false;
  return true;
}

// Validação simplificada de BIC (8 ou 11 caracteres)
function isValidBicFormat(bic: string): boolean {
  const cleaned = bic.replace(/\s/g, '').toUpperCase();
  return /^[A-Z]{4}[A-Z]{2}[A-Z0-9]{2}([A-Z0-9]{3})?$/.test(cleaned);
}

router.post('/iban', (req: Request & { user?: { userId: number } }, res: Response) => {
  const { iban } = req.body;
  if (!iban) {
    return res.status(400).json({ status: 'error', message: 'IBAN é obrigatório' });
  }
  const valid = isValidIbanFormat(iban);
  const country = iban.replace(/\s/g, '').substring(0, 2);
  res.json({
    status: 'success',
    data: {
      valid,
      country,
      bankCode: valid ? iban.replace(/\s/g, '').substring(4, 12) : null,
      accountNumber: valid ? iban.replace(/\s/g, '').substring(12) : null,
    },
  });
});

router.post('/bic', (req: Request & { user?: { userId: number } }, res: Response) => {
  const { bic } = req.body;
  if (!bic) {
    return res.status(400).json({ status: 'error', message: 'BIC é obrigatório' });
  }
  const valid = isValidBicFormat(bic);
  const bank = valid ? findBankByBic(bic) : null;
  res.json({
    status: 'success',
    data: {
      valid,
      bankName: bank?.name ?? (valid ? null : null),
      city: bank?.city ?? (valid ? null : null),
      country: bank?.country ?? (valid ? null : null),
    },
  });
});

export default router;
