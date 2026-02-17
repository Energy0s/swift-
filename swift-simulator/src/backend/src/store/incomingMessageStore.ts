/**
 * Store para mensagens SWIFT recebidas (Inbox)
 * Persistência em JSON file (data/incoming_messages.json)
 */

import { randomUUID } from 'crypto';
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';
import type {
  IncomingMessage,
  IncomingMessageStatus,
  IncomingMessageAuditEntry,
  IngestSource,
} from './incomingMessageTypes.js';

const DATA_DIR = join(process.cwd(), 'data');
const INCOMING_FILE = join(DATA_DIR, 'incoming_messages.json');
const AUDIT_FILE = join(DATA_DIR, 'incoming_message_audit.json');

interface IncomingData {
  messages: IncomingMessage[];
}

interface AuditData {
  entries: IncomingMessageAuditEntry[];
  idCounter: number;
}

let messages: IncomingMessage[] = [];
let auditEntries: IncomingMessageAuditEntry[] = [];
let auditIdCounter = 1;

function loadData(): void {
  try {
    if (existsSync(INCOMING_FILE)) {
      const raw = readFileSync(INCOMING_FILE, 'utf-8');
      const data: IncomingData = JSON.parse(raw);
      messages = data.messages || [];
    }
  } catch {
    messages = [];
  }
  try {
    if (existsSync(AUDIT_FILE)) {
      const raw = readFileSync(AUDIT_FILE, 'utf-8');
      const data: AuditData = JSON.parse(raw);
      auditEntries = data.entries || [];
      auditIdCounter = data.idCounter ?? auditEntries.length + 1;
    }
  } catch {
    auditEntries = [];
  }
}

function saveMessages(): void {
  try {
    if (!existsSync(DATA_DIR)) mkdirSync(DATA_DIR, { recursive: true });
    writeFileSync(INCOMING_FILE, JSON.stringify({ messages }, null, 2), 'utf-8');
  } catch {
    // in-memory only
  }
}

function saveAudit(): void {
  try {
    if (!existsSync(DATA_DIR)) mkdirSync(DATA_DIR, { recursive: true });
    writeFileSync(
      AUDIT_FILE,
      JSON.stringify({ entries: auditEntries, idCounter: auditIdCounter }, null, 2),
      'utf-8'
    );
  } catch {
    // in-memory only
  }
}

function addAudit(
  incomingMessageId: string,
  eventType: IncomingMessageAuditEntry['eventType'],
  actorUserId?: number | null,
  details?: Record<string, unknown>
): void {
  const entry: IncomingMessageAuditEntry = {
    id: auditIdCounter++,
    incomingMessageId,
    eventType,
    eventTimestamp: new Date().toISOString(),
    actorUserId: actorUserId ?? null,
    detailsJson: details,
  };
  auditEntries.push(entry);
  saveAudit();
}

loadData();

export const incomingMessageStore = {
  create(data: Omit<IncomingMessage, 'id' | 'updatedAt'>): IncomingMessage {
    const now = new Date().toISOString();
    const msg: IncomingMessage = {
      ...data,
      id: randomUUID(),
      updatedAt: now,
    };
    messages.push(msg);
    saveMessages();
    addAudit(msg.id, 'RECEIVED', typeof data.createdBy === 'number' ? data.createdBy : null);
    if (data.status === 'PARSED') {
      addAudit(msg.id, 'PARSED', typeof data.createdBy === 'number' ? data.createdBy : null);
    } else if (data.status === 'PARSE_ERROR') {
      addAudit(msg.id, 'PARSE_ERROR', typeof data.createdBy === 'number' ? data.createdBy : null, {
        errors: data.parseErrors,
      });
    }
    return msg;
  },

  findById(id: string): IncomingMessage | undefined {
    return messages.find((m) => m.id === id);
  },

  find(
    filters?: {
      mtType?: string;
      status?: string;
      senderBic?: string;
      receiverBic?: string;
      ref20?: string;
      uetr?: string;
      dateFrom?: string;
      dateTo?: string;
      freeText?: string;
      page?: number;
      limit?: number;
      sort?: string;
      sortOrder?: 'asc' | 'desc';
    }
  ): {
    messages: IncomingMessage[];
    pagination: { page: number; limit: number; total: number; pages: number };
  } {
    let list = [...messages];
    if (filters?.mtType) list = list.filter((m) => m.mtType === filters!.mtType);
    if (filters?.status) list = list.filter((m) => m.status === filters!.status);
    if (filters?.senderBic) {
      const q = filters.senderBic.toUpperCase().trim();
      list = list.filter((m) => m.senderBic?.toUpperCase().includes(q));
    }
    if (filters?.receiverBic) {
      const q = filters.receiverBic.toUpperCase().trim();
      list = list.filter((m) => m.receiverBic?.toUpperCase().includes(q));
    }
    if (filters?.ref20) {
      const q = filters.ref20.toUpperCase().trim();
      list = list.filter((m) => m.ref20?.toUpperCase().includes(q));
    }
    if (filters?.uetr) {
      const q = filters.uetr.trim();
      list = list.filter((m) => m.uetr?.toLowerCase().includes(q.toLowerCase()));
    }
    if (filters?.dateFrom) list = list.filter((m) => m.receivedAt >= filters!.dateFrom!);
    if (filters?.dateTo) list = list.filter((m) => m.receivedAt <= filters!.dateTo!);
    if (filters?.freeText) {
      const q = filters.freeText.toLowerCase().trim();
      list = list.filter(
        (m) =>
          m.normalizedText?.toLowerCase().includes(q) ||
          m.rawPayload.toLowerCase().includes(q)
      );
    }

    const sortBy = filters?.sort || 'receivedAt';
    const sortOrder = filters?.sortOrder || 'desc';
    list.sort((a, b) => {
      const va = (a as unknown as Record<string, unknown>)[sortBy] as string | number;
      const vb = (b as unknown as Record<string, unknown>)[sortBy] as string | number;
      if (va === vb) return 0;
      const cmp = va < vb ? -1 : 1;
      return sortOrder === 'asc' ? cmp : -cmp;
    });

    const limit = filters?.limit ?? 20;
    const page = filters?.page ?? 1;
    const total = list.length;
    const pages = Math.ceil(total / limit) || 1;
    const start = (page - 1) * limit;
    const paginated = list.slice(start, start + limit);

    return { messages: paginated, pagination: { page, limit, total, pages } };
  },

  update(
    id: string,
    data: Partial<
      Pick<
        IncomingMessage,
        | 'status'
        | 'mtType'
        | 'senderBic'
        | 'receiverBic'
        | 'normalizedText'
        | 'normalizedJson'
        | 'parseErrors'
        | 'ref20'
        | 'ref21'
        | 'relatedMt'
        | 'valueDate'
        | 'currency'
        | 'amount'
        | 'uetr'
        | 'priority'
      >
    >,
    updatedBy?: number | 'system'
  ): IncomingMessage | null {
    const idx = messages.findIndex((m) => m.id === id);
    if (idx < 0) return null;
    const prev = messages[idx];
    const updated: IncomingMessage = {
      ...prev,
      ...data,
      updatedAt: new Date().toISOString(),
      updatedBy: updatedBy ?? prev.updatedBy,
    };
    messages[idx] = updated;
    saveMessages();
    if (data.status && data.status !== prev.status) {
      addAudit(id, 'STATUS_CHANGED', typeof updatedBy === 'number' ? updatedBy : null, {
        from: prev.status,
        to: data.status,
      });
    }
    return updated;
  },

  getAuditLog(incomingMessageId: string): IncomingMessageAuditEntry[] {
    return auditEntries
      .filter((e) => e.incomingMessageId === incomingMessageId)
      .sort((a, b) => new Date(b.eventTimestamp).getTime() - new Date(a.eventTimestamp).getTime());
  },

  recordViewed(id: string, userId?: number): void {
    addAudit(id, 'VIEWED', userId ?? null);
  },
};
