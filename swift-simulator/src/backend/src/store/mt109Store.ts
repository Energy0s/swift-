/**
 * Store MT109 - Advice of Cheque(s)
 * Múltiplos cheques por mensagem
 */

import type { Mt109Message, Mt109AuditEntry, Mt109MessageStatus, Mt109Type } from './mt109Types.js';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join } from 'path';

const DATA_DIR = join(process.cwd(), 'data');
const MT109_FILE = join(DATA_DIR, 'mt109.json');

interface Mt109Data {
  messages: Mt109Message[];
  messageIdCounter: number;
  chequeIdCounter: number;
  auditIdCounter: number;
}

let messages: Mt109Message[] = [];
let messageIdCounter = 1;
let chequeIdCounter = 1;
let auditIdCounter = 1;

function loadData(): void {
  try {
    if (existsSync(MT109_FILE)) {
      const raw = readFileSync(MT109_FILE, 'utf-8');
      const data: Mt109Data = JSON.parse(raw);
      messages = (data.messages || []).map((m) => ({ ...m, mtType: (m as Mt109Message).mtType || 'MT109' }));
      messageIdCounter = data.messageIdCounter ?? 1;
      chequeIdCounter = data.chequeIdCounter ?? 1;
      auditIdCounter = data.auditIdCounter ?? 1;
      const maxMsgId = messages.reduce((m, x) => Math.max(m, x.id), 0);
      messageIdCounter = Math.max(messageIdCounter, maxMsgId + 1);
      const maxChequeId = messages.reduce((m, msg) => {
        const max = (msg.cheques || []).reduce((c, ch) => Math.max(c, ch.id ?? 0), 0);
        return Math.max(m, max);
      }, 0);
      chequeIdCounter = Math.max(chequeIdCounter, maxChequeId + 1);
    }
  } catch {
    messages = [];
  }
}

function saveData(): void {
  try {
    if (!existsSync(DATA_DIR)) {
      const { mkdirSync } = require('fs');
      mkdirSync(DATA_DIR, { recursive: true });
    }
    const data: Mt109Data = { messages, messageIdCounter, chequeIdCounter, auditIdCounter };
    writeFileSync(MT109_FILE, JSON.stringify(data, null, 2), 'utf-8');
  } catch {
    // in-memory only
  }
}

loadData();

function addAudit(msg: Mt109Message, event: string, userId?: number, userName?: string, details?: Record<string, unknown>): Mt109AuditEntry {
  const entry: Mt109AuditEntry = {
    id: auditIdCounter++,
    event,
    userId,
    userName,
    timestamp: new Date().toISOString(),
    details,
  };
  msg.auditLog = msg.auditLog || [];
  msg.auditLog.push(entry);
  return entry;
}

export const mt109Store = {
  create(data: Omit<Mt109Message, 'id' | 'createdAt' | 'updatedAt' | 'auditLog'>): Mt109Message {
    const now = new Date().toISOString();
    const chequesWithIds = (data.cheques || []).map((c) => ({
      ...c,
      id: chequeIdCounter++,
    }));
    const msg: Mt109Message = {
      ...data,
      id: messageIdCounter++,
      cheques: chequesWithIds,
      messageStatus: 'Draft',
      auditLog: [],
      createdAt: now,
      updatedAt: now,
    };
    addAudit(msg, 'CREATED', data.createdBy, undefined, { messageId: msg.messageId });
    messages.push(msg);
    saveData();
    return msg;
  },

  findById(id: number): Mt109Message | undefined {
    return messages.find((m) => m.id === id);
  },

  findByUserId(
    userId: number,
    filters?: {
      status?: Mt109MessageStatus | string;
      mtType?: Mt109Type | string;
      dateFrom?: string;
      dateTo?: string;
      reference?: string;
      page?: number;
      limit?: number;
      sortBy?: string;
      sortOrder?: 'asc' | 'desc';
    }
  ): { messages: Mt109Message[]; pagination: { page: number; limit: number; total: number; pages: number } } {
    let list = messages.filter((m) => m.userId === userId);
    if (filters?.status) list = list.filter((m) => m.messageStatus === filters.status);
    if (filters?.mtType) list = list.filter((m) => (m.mtType || 'MT109') === filters.mtType);
    if (filters?.dateFrom) list = list.filter((m) => m.createdAt >= filters!.dateFrom!);
    if (filters?.dateTo) list = list.filter((m) => m.createdAt <= filters!.dateTo!);
    if (filters?.reference) {
      const q = filters.reference.toUpperCase().trim();
      list = list.filter((m) => m.transactionReferenceNumber.toUpperCase().includes(q));
    }
    const limit = filters?.limit ?? 20;
    const page = filters?.page ?? 1;
    const total = list.length;
    const pages = Math.ceil(total / limit);
    const sortBy = filters?.sortBy || 'createdAt';
    const sortOrder = filters?.sortOrder || 'desc';
    list = [...list].sort((a, b) => {
      const va = (a as unknown as Record<string, unknown>)[sortBy];
      const vb = (b as unknown as Record<string, unknown>)[sortBy];
      if (va === vb) return 0;
      const cmp = (va as string | number) < (vb as string | number) ? -1 : 1;
      return sortOrder === 'asc' ? cmp : -cmp;
    });
    const start = (page - 1) * limit;
    const paginated = list.slice(start, start + limit);
    return { messages: paginated, pagination: { page, limit, total, pages } };
  },

  update(id: number, data: Partial<Omit<Mt109Message, 'id' | 'createdAt' | 'auditLog'>>, modifiedBy?: number): Mt109Message | null {
    const idx = messages.findIndex((m) => m.id === id);
    if (idx < 0) return null;
    const msg = messages[idx];
    const allowedStatuses = ['Draft'];
    if (!allowedStatuses.includes(msg.messageStatus) && !msg.repairRequiredFlag) return null;
    const cheques = data.cheques ?? msg.cheques;
    const chequesWithIds = cheques.map((c) =>
      c.id ? c : { ...c, id: chequeIdCounter++ }
    );
    const updated = {
      ...msg,
      ...data,
      cheques: chequesWithIds,
      updatedAt: new Date().toISOString(),
      modifiedBy: modifiedBy ?? msg.modifiedBy,
    };
    if (modifiedBy) addAudit(updated, 'MODIFIED', modifiedBy, undefined, { changes: Object.keys(data) });
    messages[idx] = updated;
    saveData();
    return updated;
  },

  addAuditEntry(id: number, event: string, userId?: number, userName?: string, details?: Record<string, unknown>): Mt109Message | null {
    const msg = messages.find((m) => m.id === id);
    if (!msg) return null;
    addAudit(msg, event, userId, userName, details);
    msg.updatedAt = new Date().toISOString();
    saveData();
    return msg;
  },
};
