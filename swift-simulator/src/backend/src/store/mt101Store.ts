/**
 * Store MT101 - Request for Transfer
 * Persistência em arquivo JSON (compatível com migração para PostgreSQL)
 */

import type {
  Mt101Message,
  Mt101Transaction,
  Mt101AuditEntry,
  Mt101MessageStatus,
  Mt101Type,
} from './mt101Types.js';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join } from 'path';

const DATA_DIR = join(process.cwd(), 'data');
const MT101_FILE = join(DATA_DIR, 'mt101.json');

interface Mt101Data {
  messages: Mt101Message[];
  transactionIdCounter: number;
  auditIdCounter: number;
}

let messages: Mt101Message[] = [];
let messageIdCounter = 1;
let transactionIdCounter = 1;
let auditIdCounter = 1;

function loadData(): void {
  try {
    if (existsSync(MT101_FILE)) {
      const raw = readFileSync(MT101_FILE, 'utf-8');
      const data: Mt101Data = JSON.parse(raw);
      messages = (data.messages || []).map((m) => ({ ...m, mtType: (m as Mt101Message).mtType || 'MT101' }));
      transactionIdCounter = data.transactionIdCounter ?? 1;
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
    const data: Mt101Data = {
      messages,
      transactionIdCounter,
      auditIdCounter,
    };
    writeFileSync(MT101_FILE, JSON.stringify(data, null, 2), 'utf-8');
  } catch {
    // fallback: in-memory only
  }
}

loadData();

function addAudit(msg: Mt101Message, event: string, userId?: number, userName?: string, details?: Record<string, unknown>): Mt101AuditEntry {
  const entry: Mt101AuditEntry = {
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

export const mt101Store = {
  create(data: Omit<Mt101Message, 'id' | 'createdAt' | 'updatedAt' | 'auditLog'>): Mt101Message {
    const now = new Date().toISOString();
    const msg: Mt101Message = {
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

  findById(id: number): Mt101Message | undefined {
    return messages.find((m) => m.id === id);
  },

  findByUserId(
    userId: number,
    filters?: {
      status?: Mt101MessageStatus | string;
      mtType?: Mt101Type | string;
      dateFrom?: string;
      dateTo?: string;
      reference?: string;
      debtorName?: string;
      beneficiaryName?: string;
      currency?: string;
      amountMin?: number;
      amountMax?: number;
      riskFlags?: boolean;
      page?: number;
      limit?: number;
      sortBy?: string;
      sortOrder?: 'asc' | 'desc';
    }
  ): { messages: Mt101Message[]; pagination: { page: number; limit: number; total: number; pages: number } } {
    let list = messages.filter((m) => m.userId === userId);
    if (filters?.status) {
      list = list.filter((m) => m.messageStatus === filters.status);
    }
    if (filters?.mtType) {
      list = list.filter((m) => (m.mtType || 'MT101') === filters.mtType);
    }
    if (filters?.dateFrom) {
      list = list.filter((m) => m.createdAt >= filters!.dateFrom!);
    }
    if (filters?.dateTo) {
      list = list.filter((m) => m.createdAt <= filters!.dateTo!);
    }
    if (filters?.reference) {
      const q = filters.reference.toUpperCase().trim();
      list = list.filter((m) => m.transactionReferenceNumber.toUpperCase().includes(q));
    }
    if (filters?.debtorName) {
      const q = filters.debtorName.toLowerCase().trim();
      list = list.filter((m) =>
        (m.orderingCustomer?.orderingCustomerName || '').toLowerCase().includes(q)
      );
    }
    if (filters?.beneficiaryName) {
      const q = filters.beneficiaryName.toLowerCase().trim();
      list = list.filter((m) =>
        m.transactions.some(
          (t) => (t.beneficiaryName || '').toLowerCase().includes(q)
        )
      );
    }
    if (filters?.currency) {
      list = list.filter((m) =>
        m.transactions.some((t) => t.currency === filters.currency)
      );
    }
    if (filters?.amountMin !== undefined) {
      list = list.filter((m) => {
        const total = m.transactions.reduce((s, t) => s + t.amount, 0);
        return total >= filters!.amountMin!;
      });
    }
    if (filters?.amountMax !== undefined) {
      list = list.filter((m) => {
        const total = m.transactions.reduce((s, t) => s + t.amount, 0);
        return total <= filters!.amountMax!;
      });
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

  update(
    id: number,
    data: Partial<Omit<Mt101Message, 'id' | 'createdAt' | 'auditLog'>>,
    modifiedBy?: number
  ): Mt101Message | null {
    const idx = messages.findIndex((m) => m.id === id);
    if (idx < 0) return null;
    const msg = messages[idx];
    const allowedStatuses = ['Draft', 'Repair Required'];
    if (data.messageStatus && !allowedStatuses.includes(msg.messageStatus)) {
      return null;
    }
    const updated = {
      ...msg,
      ...data,
      updatedAt: new Date().toISOString(),
      modifiedBy: modifiedBy ?? msg.modifiedBy,
    };
    if (modifiedBy) {
      addAudit(updated, 'MODIFIED', modifiedBy, undefined, { changes: Object.keys(data) });
    }
    messages[idx] = updated;
    saveData();
    return updated;
  },

  addAuditEntry(id: number, event: string, userId?: number, userName?: string, details?: Record<string, unknown>): Mt101Message | null {
    const msg = messages.find((m) => m.id === id);
    if (!msg) return null;
    addAudit(msg, event, userId, userName, details);
    msg.updatedAt = new Date().toISOString();
    saveData();
    return msg;
  },

  getNextTransactionId(): number {
    return transactionIdCounter++;
  },
};
