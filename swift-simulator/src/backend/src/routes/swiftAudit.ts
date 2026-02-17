/**
 * GET /api/swift/audit
 * Lista de eventos de auditoria do módulo SWIFT
 */

import { Router, Request, Response } from 'express';
import { authMiddleware } from '../middleware/auth.js';
import type { AuthPayload } from '../middleware/auth.js';

type Req = Request & { user?: AuthPayload };

const router = Router();
router.use(authMiddleware);

router.get('/', (_req: Req, res: Response) => {
  res.json({
    status: 'success',
    data: {
      entries: [],
    },
  });
});

export default router;
