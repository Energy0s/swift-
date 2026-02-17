/**
 * GET /api/swift/header
 * Dados agregados do header SWIFT (ambiente, LT, status, filas, alertas, operador)
 */

import { Router, Request, Response } from 'express';
import { authMiddleware } from '../middleware/auth.js';
import { setLastRefresh } from '../services/swiftLastRefresh.js';
import { userStore } from '../store/index.js';
import { incomingMessageStore } from '../store/incomingMessageStore.js';
import { mt103Store } from '../store/mt103Store.js';
import { mt101Store } from '../store/mt101Store.js';
import { mt109Store } from '../store/mt109Store.js';
import { mtFreeStore } from '../store/mtFreeStore.js';
import type { AuthPayload } from '../middleware/auth.js';

type Req = Request & { user?: AuthPayload };

const router = Router();
router.use(authMiddleware);

const ENV = process.env.NODE_ENV === 'production' ? 'PROD' : process.env.NODE_ENV === 'test' ? 'TEST' : 'UAT';
const SENDER_BIC = process.env.SWIFT_SENDER_BIC || 'BOMGBRS1XXX';
const TZ = process.env.TZ || 'America/Sao_Paulo';

const PENDING_OUTBOX_STATUSES = ['Draft', 'Validated', 'Pending Approval', 'Approved', 'Released to SWIFT', 'ACK Received', 'NACK Received'];

function countInboxPending(): number {
  const { messages } = incomingMessageStore.find({ limit: 10000 });
  return messages.filter((m) => m.status !== 'ARCHIVED').length;
}

function countOutboxPending(userId: number): number {
  let count = 0;
  const m103 = mt103Store.findByUserId(userId, { limit: 10000 });
  count += m103.messages.filter((m) => PENDING_OUTBOX_STATUSES.includes(m.messageStatus)).length;
  const m101 = mt101Store.findByUserId(userId, { limit: 10000 });
  count += m101.messages.filter((m) => PENDING_OUTBOX_STATUSES.includes(m.messageStatus)).length;
  const m109 = mt109Store.findByUserId(userId, { limit: 10000 });
  count += m109.messages.filter((m) => PENDING_OUTBOX_STATUSES.includes(m.messageStatus)).length;
  const mFree = mtFreeStore.findByUserId(userId, { limit: 10000 });
  count += mFree.messages.filter((m) => PENDING_OUTBOX_STATUSES.includes(m.messageStatus)).length;
  return count;
}

router.get('/', (req: Req, res: Response) => {
  const userId = req.user!.userId;
  setLastRefresh(userId);
  const user = userStore.findById(userId);

  const inboxPending = countInboxPending();
  const outboxPending = countOutboxPending(userId);

  const now = new Date();
  const serverTimeIso = now.toISOString().slice(0, 19);

  const nameShort = user?.name ? (user.name.length > 15 ? user.name.slice(0, 12) + '...' : user.name) : 'N/A';

  res.json({
    status: 'success',
    data: {
      environment: ENV,
    logicalTerminal: SENDER_BIC,
    entityBic: SENDER_BIC,
    finStatus: 'UP',
    gatewayStatus: 'UP',
    rmaStatus: 'OK',
    queues: {
      inboxPending,
      outboxPending,
    },
    alerts: {
      criticalCount: 0,
      items: [],
    },
    serverTime: {
      iso: serverTimeIso,
      tz: TZ,
    },
    operator: {
      id: String(user?.id ?? ''),
      nameShort: nameShort,
      nameFull: user?.name ?? 'N/A',
      registration: user?.id ? String(user.id) : null,
      roles: ['OPERATOR'],
      lastLoginAt: null,
      avatarUrl: null,
    },
  },
});
});

export default router;
