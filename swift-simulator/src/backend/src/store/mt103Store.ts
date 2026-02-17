/**
 * Store MT103 - Single Customer Credit Transfer
 * UMA transação por mensagem
 */

import type { Mt103Message, Mt103AuditEntry, Mt103MessageStatus, Mt103Type } from './mt103Types.js';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join } from 'path';

const DATA_DIR = join(process.cwd(), 'data');
const MT103_FILE = join(DATA_DIR, 'mt103.json');

interface Mt103Data {
  messages: Mt103Message[];
  auditIdCounter: number;
}

let messages: Mt103Message[] = [];
let messageIdCounter = 1;
let auditIdCounter = 1;

function loadData(): void {
  try {
    if (existsSync(MT103_FILE)) {
      const raw = readFileSync(MT103_FILE, 'utf-8');
      const data: Mt103Data = JSON.parse(raw);
      messages = (data.messages || []).map((m) => ({ ...m, mtType: (m as Mt103Message).mtType || 'MT103' }));
      auditIdCounter = data.auditIdCounter ?? 1;
      const maxId = messages.reduce((m, x) => Math.max(m, x.id), 0);
      messageIdCounter = maxId + 1;
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
    const data: Mt103Data = { messages, auditIdCounter };
    writeFileSync(MT103_FILE, JSON.stringify(data, null, 2), 'utf-8');
  } catch {
    // in-memory only
  }
}

loadData();

function addAudit(msg: Mt103Message, event: string, userId?: number, userName?: string, details?: Record<string, unknown>): Mt103AuditEntry {
  const entry: Mt103AuditEntry = {
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

export const mt103Store = {
  create(data: Omit<Mt103Message, 'id' | 'createdAt' | 'updatedAt' | 'auditLog'>): Mt103Message {
    const now = new Date().toISOString();
    const msg: Mt103Message = {
      ...data,
      id: messageIdCounter++,
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

  findById(id: number): Mt103Message | undefined {
    return messages.find((m) => m.id === id);
  },

  findByUserId(
    userId: number,
    filters?: {
      status?: Mt103MessageStatus | string;
      mtType?: Mt103Type | string;
      dateFrom?: string;
      dateTo?: string;
      reference?: string;
      page?: number;
      limit?: number;
      sortBy?: string;
      sortOrder?: 'asc' | 'desc';
    }
  ): { messages: Mt103Message[]; pagination: { page: number; limit: number; total: number; pages: number } } {
    let list = messages.filter((m) => m.userId === userId);
    if (filters?.status) list = list.filter((m) => m.messageStatus === filters.status);
    if (filters?.mtType) list = list.filter((m) => (m.mtType || 'MT103') === filters.mtType);
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

  update(id: number, data: Partial<Omit<Mt103Message, 'id' | 'createdAt' | 'auditLog'>>, modifiedBy?: number): Mt103Message | null {
    const idx = messages.findIndex((m) => m.id === id);
    if (idx < 0) return null;
    const msg = messages[idx];
    const allowedStatuses = ['Draft'];
    if (!allowedStatuses.includes(msg.messageStatus) && !msg.repairRequiredFlag) return null;
    const updated = {
      ...msg,
      ...data,
      updatedAt: new Date().toISOString(),
      modifiedBy: modifiedBy ?? msg.modifiedBy,
    };
    if (modifiedBy) addAudit(updated, 'MODIFIED', modifiedBy, undefined, { changes: Object.keys(data) });
    messages[idx] = updated;
    saveData();
    return updated;
  },

  updateForWorkflow(
    id: number,
    data: Partial<Omit<Mt103Message, 'id' | 'createdAt' | 'auditLog'>>,
    allowedFromStatuses: Mt103MessageStatus[],
    modifiedBy?: number
  ): Mt103Message | null {
    const idx = messages.findIndex((m) => m.id === id);
    if (idx < 0) return null;
    const msg = messages[idx];
    if (!allowedFromStatuses.includes(msg.messageStatus)) return null;
    const updated = {
      ...msg,
      ...data,
      updatedAt: new Date().toISOString(),
      modifiedBy: modifiedBy ?? msg.modifiedBy,
    };
    if (modifiedBy) addAudit(updated, 'WORKFLOW', modifiedBy, undefined, { changes: Object.keys(data) });
    messages[idx] = updated;
    saveData();
    return updated;
  },

  addAuditEntry(id: number, event: string, userId?: number, userName?: string, details?: Record<string, unknown>): Mt103Message | null {
    const msg = messages.find((m) => m.id === id);
    if (!msg) return null;
    addAudit(msg, event, userId, userName, details);
    msg.updatedAt = new Date().toISOString();
    saveData();
    return msg;
  },
};
