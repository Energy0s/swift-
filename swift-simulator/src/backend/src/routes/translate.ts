/**
 * Rotas de tradução MT ↔ MX (CBPR+)
 * Conforme demo Payment-Components: https://github.com/Payment-Components/demo-translator-cbpr
 */

import { Router, Request, Response } from 'express';
import { translateMtToMx, translateMxToMt } from '../services/cbprTranslatorService.js';

const router = Router();

/**
 * POST /api/translate/mt-to-mx
 * Traduz MT103 para pacs.008 ou CBPR+
 *
 * Body: { message: string, format?: 'pacs008' | 'cbpr' }
 */
router.post('/mt-to-mx', (req: Request, res: Response) => {
  try {
    const { message, format = 'pacs008' } = req.body;

    if (!message || typeof message !== 'string') {
      return res.status(400).json({
        status: 'error',
        message: 'Campo "message" (MT103) é obrigatório',
      });
    }

    const result = translateMtToMx(message, { format });

    if (result.errors.length > 0 && !result.message) {
      return res.status(400).json({
        status: 'error',
        message: 'Mensagem MT103 inválida',
        errors: result.errors,
      });
    }

    const contentType = format === 'cbpr' ? 'application/xml' : 'application/xml';
    const accept = req.get('Accept');

    if (accept?.includes('application/json')) {
      return res.json({
        status: 'success',
        data: {
          message: result.message,
          format,
          errors: result.errors,
        },
      });
    }

    res.set('Content-Type', contentType);
    res.send(result.message);
  } catch (err) {
    res.status(500).json({ status: 'error', message: 'Erro na tradução' });
  }
});

/**
 * POST /api/translate/mx-to-mt
 * Traduz pacs.008 ou CBPR+ para MT103
 *
 * Body: { message: string } (XML pacs.008 ou CBPR+)
 */
router.post('/mx-to-mt', (req: Request, res: Response) => {
  try {
    const { message } = req.body;

    if (!message || typeof message !== 'string') {
      return res.status(400).json({
        status: 'error',
        message: 'Campo "message" (pacs.008 ou CBPR+ XML) é obrigatório',
      });
    }

    const result = translateMxToMt(message);

    if (result.errors.length > 0 && !result.message) {
      return res.status(400).json({
        status: 'error',
        message: 'Mensagem MX inválida',
        errors: result.errors,
      });
    }

    const accept = req.get('Accept');
    if (accept?.includes('application/json')) {
      return res.json({
        status: 'success',
        data: {
          message: result.message,
          format: 'mt103',
          errors: result.errors,
        },
      });
    }

    res.set('Content-Type', 'text/plain; charset=utf-8');
    res.send(result.message);
  } catch (err) {
    res.status(500).json({ status: 'error', message: 'Erro na tradução' });
  }
});

export default router;
