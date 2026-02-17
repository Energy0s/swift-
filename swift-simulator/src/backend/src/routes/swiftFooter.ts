/**
 * GET /api/swift/footer
 * Dados agregados do footer SWIFT (ambiente, LT, sessão, tráfego, build)
 */

import { Router, Request, Response } from 'express';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import { authMiddleware } from '../middleware/auth.js';
import { userStore } from '../store/index.js';
import { incomingMessageStore } from '../store/incomingMessageStore.js';
import { mt103Store } from '../store/mt103Store.js';
import { mt101Store } from '../store/mt101Store.js';
import { mt109Store } from '../store/mt109Store.js';
import { mtFreeStore } from '../store/mtFreeStore.js';
import { getLastRefresh, setLastRefresh } from '../services/swiftLastRefresh.js';
import type { AuthPayload } from '../middleware/auth.js';

type Req = Request & { user?: AuthPayload };

const router = Router();
router.use(authMiddleware);

const ENV = process.env.NODE_ENV === 'production' ? 'PROD' : process.env.NODE_ENV === 'test' ? 'TEST' : 'UAT';
const SENDER_BIC = process.env.SWIFT_SENDER_BIC || 'BOMGBRS1XXX';
const TZ = process.env.TZ || 'America/Sao_Paulo';
const APP_VERSION = process.env.APP_VERSION || process.env.npm_package_version || '1.0.0';
const GIT_COMMIT = process.env.GIT_COMMIT || 'dev';

function countTraffic15m(userId: number): {
  sentCount: number;
  receivedCount: number;
  nackCount: number;
  holdsCount: number;
} {
  const cutoff = new Date(Date.now() - 15 * 60 * 1000).toISOString();

  let sentCount = 0;
  let nackCount = 0;
  let holdsCount = 0;

  const countOutbound = (
    msgs: Array<{
      messageStatus?: string;
      swiftAckTimestamp?: string;
      swiftNackCode?: string;
      swiftAckReceivedTimestamp?: string;
      createdAt: string;
      updatedAt?: string;
    }>
  ) => {
    msgs.forEach((m) => {
      const ackTs = m.swiftAckTimestamp || m.swiftAckReceivedTimestamp;
      const updTs = m.updatedAt || m.createdAt;
      if (m.messageStatus === 'ACK Received' && ackTs && ackTs >= cutoff) sentCount++;
      else if (m.messageStatus === 'NACK Received' && updTs >= cutoff) nackCount++;
      else if (m.messageStatus === 'Under Investigation' && updTs >= cutoff) holdsCount++;
    });
  };

  const m103 = mt103Store.findByUserId(userId, { limit: 10000 });
  countOutbound(m103.messages);
  const m101 = mt101Store.findByUserId(userId, { limit: 10000 });
  countOutbound(m101.messages);
  const m109 = mt109Store.findByUserId(userId, { limit: 10000 });
  countOutbound(m109.messages);
  const mFree = mtFreeStore.findByUserId(userId, { limit: 10000 });
  countOutbound(mFree.messages);

  const { messages: incoming } = incomingMessageStore.find({ limit: 10000, dateFrom: cutoff });
  const receivedCount = incoming.filter((m) => m.receivedAt >= cutoff).length;

  return { sentCount, receivedCount, nackCount, holdsCount };
}

function getSessionSequence(): { sessionNumber: string | null; sequenceNumber: string | null } {
  try {
    const path = join(process.cwd(), 'data', 'swift_sequence_counter.json');
    if (existsSync(path)) {
      const raw = readFileSync(path, 'utf-8');
      const data = JSON.parse(raw);
      const lt = SENDER_BIC.replace(/\s/g, '').toUpperCase().slice(0, 12).padEnd(12, 'X');
      const e = data?.bySenderLt?.[lt];
      if (e) {
        return {
          sessionNumber: String(e.last_session ?? 0).padStart(4, '0'),
          sequenceNumber: String(e.last_sequence ?? 0).padStart(6, '0'),
        };
      }
    }
  } catch {
    // ignore
  }
  return { sessionNumber: null, sequenceNumber: null };
}

router.get('/', (req: Req, res: Response) => {
  const userId = req.user!.userId;
  const user = userStore.findById(userId);

  setLastRefresh(userId);
  const lastRefreshAt = getLastRefresh(userId);
  const now = new Date();
  const serverTimeIso = now.toISOString().slice(0, 19);
  const traffic = countTraffic15m(userId);
  const seq = getSessionSequence();

  res.json({
    status: 'success',
    data: {
      environment: ENV,
      logicalTerminal: SENDER_BIC,
      session: {
        sessionNumber: seq.sessionNumber,
        sequenceNumber: seq.sequenceNumber,
      },
      operator: {
        idShort: user?.id ? String(user.id) : null,
      },
      serverTime: {
        iso: serverTimeIso,
        tz: TZ,
      },
      lastRefreshAt: {
        iso: lastRefreshAt,
        tz: TZ,
      },
      traffic15m: {
        sentCount: traffic.sentCount,
        receivedCount: traffic.receivedCount,
        nackCount: traffic.nackCount,
        holdsCount: traffic.holdsCount,
      },
      build: {
        version: APP_VERSION,
        commit: GIT_COMMIT.slice(0, 7),
      },
    },
  });
});

export default router;
