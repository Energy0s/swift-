/**
 * GET /api/swift/search?q=...&type=...
 * Busca global SWIFT em MT103, MT101, MT109, MT Free e Inbox
 */

import { Router, Request, Response } from 'express';
import { authMiddleware } from '../middleware/auth.js';
import { mt103Store } from '../store/mt103Store.js';
import { mt101Store } from '../store/mt101Store.js';
import { mt109Store } from '../store/mt109Store.js';
import { mtFreeStore } from '../store/mtFreeStore.js';
import { incomingMessageStore } from '../store/incomingMessageStore.js';
import type { AuthPayload } from '../middleware/auth.js';

type Req = Request & { user?: AuthPayload };

const router = Router();
router.use(authMiddleware);

type SearchType = 'ALL' | 'REF20' | 'UETR' | 'BIC' | 'MT' | 'STATUS';

interface SearchResult {
  messageId: string;
  mtType: string;
  direction: 'IN' | 'OUT';
  reference20: string | null;
  uetr: string | null;
  senderBic: string | null;
  receiverBic: string | null;
  status: string;
  createdAt: string;
}

function searchAll(userId: number, q: string, type: SearchType): SearchResult[] {
  const qLower = q.toLowerCase().trim();
  const qUpper = q.toUpperCase().trim();
  const results: SearchResult[] = [];

  const add103 = (m: { id: number; transactionReferenceNumber?: string; swiftHeader?: { uetr?: string; receiverBic?: string }; messageStatus: string; createdAt: string }) => {
    const ref20 = m.transactionReferenceNumber ?? null;
    const uetr = (m.swiftHeader as { uetr?: string })?.uetr ?? null;
    const receiverBic = (m.swiftHeader as { receiverBic?: string })?.receiverBic ?? null;
    const match = type === 'ALL' && (
      (ref20?.toUpperCase().includes(qUpper)) ||
      (uetr?.toLowerCase().includes(qLower)) ||
      (receiverBic?.toUpperCase().includes(qUpper)) ||
      ('103'.includes(q) || 'MT103'.toUpperCase().includes(qUpper)) ||
      (m.messageStatus?.toUpperCase().includes(qUpper))
    ) || type === 'REF20' && ref20?.toUpperCase().includes(qUpper)
    || type === 'UETR' && uetr?.toLowerCase().includes(qLower)
    || type === 'BIC' && receiverBic?.toUpperCase().includes(qUpper)
    || type === 'MT' && ('103'.includes(q) || 'MT103'.toUpperCase().includes(qUpper))
    || type === 'STATUS' && m.messageStatus?.toUpperCase().includes(qUpper);
    if (match) {
      results.push({
        messageId: String(m.id),
        mtType: 'MT103',
        direction: 'OUT',
        reference20: ref20,
        uetr,
        senderBic: 'BOMGBRS1XXX',
        receiverBic,
        status: m.messageStatus,
        createdAt: m.createdAt,
      });
    }
  };

  const add101 = (m: { id: number; transactionReferenceNumber?: string; swiftHeader?: { uetr?: string; receiverBic?: string }; messageStatus: string; createdAt: string }) => {
    const ref20 = m.transactionReferenceNumber ?? null;
    const uetr = (m.swiftHeader as { uetr?: string })?.uetr ?? null;
    const receiverBic = (m.swiftHeader as { receiverBic?: string })?.receiverBic ?? null;
    const match = type === 'ALL' && (
      (ref20?.toUpperCase().includes(qUpper)) ||
      (uetr?.toLowerCase().includes(qLower)) ||
      (receiverBic?.toUpperCase().includes(qUpper)) ||
      ('101'.includes(q) || 'MT101'.toUpperCase().includes(qUpper)) ||
      (m.messageStatus?.toUpperCase().includes(qUpper))
    ) || type === 'REF20' && ref20?.toUpperCase().includes(qUpper)
    || type === 'UETR' && uetr?.toLowerCase().includes(qLower)
    || type === 'BIC' && receiverBic?.toUpperCase().includes(qUpper)
    || type === 'MT' && ('101'.includes(q) || 'MT101'.toUpperCase().includes(qUpper))
    || type === 'STATUS' && m.messageStatus?.toUpperCase().includes(qUpper);
    if (match) {
      results.push({
        messageId: String(m.id),
        mtType: 'MT101',
        direction: 'OUT',
        reference20: ref20,
        uetr,
        senderBic: 'BOMGBRS1XXX',
        receiverBic,
        status: m.messageStatus,
        createdAt: m.createdAt,
      });
    }
  };

  const add109 = (m: { id: number; transactionReferenceNumber?: string; swiftHeader?: { uetr?: string; receiverBic?: string }; messageStatus: string; createdAt: string }) => {
    const ref20 = m.transactionReferenceNumber ?? null;
    const uetr = (m.swiftHeader as { uetr?: string })?.uetr ?? null;
    const receiverBic = (m.swiftHeader as { receiverBic?: string })?.receiverBic ?? null;
    const match = type === 'ALL' && (
      (ref20?.toUpperCase().includes(qUpper)) ||
      (uetr?.toLowerCase().includes(qLower)) ||
      (receiverBic?.toUpperCase().includes(qUpper)) ||
      ('109'.includes(q) || 'MT109'.toUpperCase().includes(qUpper)) ||
      (m.messageStatus?.toUpperCase().includes(qUpper))
    ) || type === 'REF20' && ref20?.toUpperCase().includes(qUpper)
    || type === 'UETR' && uetr?.toLowerCase().includes(qLower)
    || type === 'BIC' && receiverBic?.toUpperCase().includes(qUpper)
    || type === 'MT' && ('109'.includes(q) || 'MT109'.toUpperCase().includes(qUpper))
    || type === 'STATUS' && m.messageStatus?.toUpperCase().includes(qUpper);
    if (match) {
      results.push({
        messageId: String(m.id),
        mtType: 'MT109',
        direction: 'OUT',
        reference20: ref20,
        uetr,
        senderBic: 'BOMGBRS1XXX',
        receiverBic,
        status: m.messageStatus,
        createdAt: m.createdAt,
      });
    }
  };

  const addFree = (m: { id: number; transactionReferenceNumber?: string; relatedReference?: string; swiftHeader?: { uetr?: string; receiverBic?: string }; messageStatus: string; mtType?: string; createdAt: string }) => {
    const ref20 = m.transactionReferenceNumber ?? null;
    const uetr = (m.swiftHeader as { uetr?: string })?.uetr ?? null;
    const receiverBic = (m.swiftHeader as { receiverBic?: string })?.receiverBic ?? null;
    const mt = m.mtType ?? 'MT199';
    const match = type === 'ALL' && (
      (ref20?.toUpperCase().includes(qUpper)) ||
      (m.relatedReference?.toUpperCase().includes(qUpper)) ||
      (uetr?.toLowerCase().includes(qLower)) ||
      (receiverBic?.toUpperCase().includes(qUpper)) ||
      (mt.toUpperCase().includes(qUpper)) ||
      (m.messageStatus?.toUpperCase().includes(qUpper))
    ) || type === 'REF20' && ref20?.toUpperCase().includes(qUpper)
    || type === 'UETR' && uetr?.toLowerCase().includes(qLower)
    || type === 'BIC' && receiverBic?.toUpperCase().includes(qUpper)
    || type === 'MT' && mt.toUpperCase().includes(qUpper)
    || type === 'STATUS' && m.messageStatus?.toUpperCase().includes(qUpper);
    if (match) {
      results.push({
        messageId: String(m.id),
        mtType: mt,
        direction: 'OUT',
        reference20: ref20,
        uetr,
        senderBic: 'BOMGBRS1XXX',
        receiverBic,
        status: m.messageStatus,
        createdAt: m.createdAt,
      });
    }
  };

  const addIncoming = (m: { id: string; ref20?: string; uetr?: string; senderBic?: string; receiverBic?: string; mtType?: string; status: string; receivedAt: string }) => {
    const ref20 = m.ref20 ?? null;
    const uetr = m.uetr ?? null;
    const senderBic = m.senderBic ?? null;
    const receiverBic = m.receiverBic ?? null;
    const mt = m.mtType ?? 'MT';
    const match = type === 'ALL' && (
      (ref20?.toUpperCase().includes(qUpper)) ||
      (uetr?.toLowerCase().includes(qLower)) ||
      (senderBic?.toUpperCase().includes(qUpper)) ||
      (receiverBic?.toUpperCase().includes(qUpper)) ||
      (mt?.toUpperCase().includes(qUpper)) ||
      (m.status?.toUpperCase().includes(qUpper))
    ) || type === 'REF20' && ref20?.toUpperCase().includes(qUpper)
    || type === 'UETR' && uetr?.toLowerCase().includes(qLower)
    || type === 'BIC' && (senderBic?.toUpperCase().includes(qUpper) || receiverBic?.toUpperCase().includes(qUpper))
    || type === 'MT' && mt?.toUpperCase().includes(qUpper)
    || type === 'STATUS' && m.status?.toUpperCase().includes(qUpper);
    if (match) {
      results.push({
        messageId: m.id,
        mtType: mt ?? 'MT',
        direction: 'IN',
        reference20: ref20,
        uetr,
        senderBic,
        receiverBic,
        status: m.status,
        createdAt: m.receivedAt,
      });
    }
  };

  if (!q || q.length < 2) {
    return results;
  }

  const r103 = mt103Store.findByUserId(userId, { limit: 500 });
  r103.messages.forEach(add103);
  const r101 = mt101Store.findByUserId(userId, { limit: 500 });
  r101.messages.forEach(add101);
  const r109 = mt109Store.findByUserId(userId, { limit: 500 });
  r109.messages.forEach(add109);
  const rFree = mtFreeStore.findByUserId(userId, { limit: 500 });
  rFree.messages.forEach(addFree);
  const rIn = incomingMessageStore.find({ limit: 500 });
  rIn.messages.forEach(addIncoming);

  results.sort((a, b) => (b.createdAt > a.createdAt ? 1 : -1));
  return results.slice(0, 50);
}

router.get('/', (req: Req, res: Response) => {
  const q = (req.query.q as string) || '';
  const type = ((req.query.type as string) || 'ALL').toUpperCase() as SearchType;
  const validTypes: SearchType[] = ['ALL', 'REF20', 'UETR', 'BIC', 'MT', 'STATUS'];
  const searchType = validTypes.includes(type) ? type : 'ALL';

  const results = searchAll(req.user!.userId, q, searchType);

  res.json({
    q,
    type: searchType,
    results,
  });
});

export default router;
