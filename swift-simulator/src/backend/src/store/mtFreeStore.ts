/**
 * Store MT Free - Mensagens Livres (MT199, MT299, MT999)
 */

import type { MtFreeMessage, MtFreeAuditEntry, MtFreeMessageStatus, MtFreeType } from './mtFreeTypes.js';
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_DIR = join(__dirname, '..', '..', 'data');
const MT_FREE_FILE = join(DATA_DIR, 'mt_free.json');

interface MtFreeData {
  messages: MtFreeMessage[];
  auditIdCounter: number;
}

let messages: MtFreeMessage[] = [];
let messageIdCounter = 1;
let auditIdCounter = 1;

function loadData(): void {
  try {
    if (existsSync(MT_FREE_FILE)) {
      const raw = readFileSync(MT_FREE_FILE, 'utf-8');
      const data: MtFreeData = JSON.parse(raw);
      messages = data.messages || [];
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
      mkdirSync(DATA_DIR, { recursive: true });
    }
    const data: MtFreeData = { messages, auditIdCounter };
    writeFileSync(MT_FREE_FILE, JSON.stringify(data, null, 2), 'utf-8');
  } catch {
    // in-memory only
  }
}

loadData();

function addAudit(msg: MtFreeMessage, event: string, userId?: number, userName?: string, reason?: string, details?: Record<string, unknown>): MtFreeAuditEntry {
  const entry: MtFreeAuditEntry = {
    id: auditIdCounter++,
    event,
    userId,
    userName,
    timestamp: new Date().toISOString(),
    reason,
    details,
  };
  msg.auditLog = msg.auditLog || [];
  msg.auditLog.push(entry);
  return entry;
}

export const mtFreeStore = {
  create(data: Omit<MtFreeMessage, 'id' | 'createdAt' | 'updatedAt' | 'auditLog'>): MtFreeMessage {
    const now = new Date().toISOString();
    const msg: MtFreeMessage = {
      ...data,
      id: messageIdCounter++,
      messageStatus: 'Draft',
      auditLog: [],
      createdAt: now,
      updatedAt: now,
    };
    addAudit(msg, 'CREATED', data.createdBy, undefined, undefined, { messageId: msg.messageId });
    messages.push(msg);
    saveData();
    return msg;
  },

  findById(id: number): MtFreeMessage | undefined {
    return messages.find((m) => m.id === id);
  },

  findByUserId(
    userId: number,
    filters?: {
      mtType?: MtFreeType | string;
      status?: MtFreeMessageStatus | string;
      dateFrom?: string;
      dateTo?: string;
      reference?: string;
      relatedReference?: string;
      senderBic?: string;
      receiverBic?: string;
      page?: number;
      limit?: number;
      sortBy?: string;
      sortOrder?: 'asc' | 'desc';
    }
  ): { messages: MtFreeMessage[]; pagination: { page: number; limit: number; total: number; pages: number } } {
    let list = messages.filter((m) => m.userId === userId);
    if (filters?.mtType) list = list.filter((m) => m.mtType === filters.mtType);
    if (filters?.status) list = list.filter((m) => m.messageStatus === filters.status);
    if (filters?.dateFrom) list = list.filter((m) => m.createdAt >= filters!.dateFrom!);
    if (filters?.dateTo) list = list.filter((m) => m.createdAt <= filters!.dateTo!);
    if (filters?.reference) {
      const q = filters.reference.toUpperCase().trim();
      list = list.filter((m) => m.transactionReferenceNumber.toUpperCase().includes(q));
    }
    if (filters?.relatedReference) {
      const q = filters.relatedReference.toUpperCase().trim();
      list = list.filter((m) => m.relatedReference?.toUpperCase().includes(q));
    }
    if (filters?.senderBic) {
      const q = (filters.senderBic || '').replace(/\s/g, '').toUpperCase();
      list = list.filter((m) => (m.swiftHeader?.senderBic || '').replace(/\s/g, '').toUpperCase().includes(q));
    }
    if (filters?.receiverBic) {
      const q = (filters.receiverBic || '').replace(/\s/g, '').toUpperCase();
      list = list.filter((m) => (m.swiftHeader?.receiverBic || '').replace(/\s/g, '').toUpperCase().includes(q));
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

  update(id: number, data: Partial<Omit<MtFreeMessage, 'id' | 'createdAt' | 'auditLog'>>, modifiedBy?: number): MtFreeMessage | null {
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
    if (modifiedBy) addAudit(updated, 'MODIFIED', modifiedBy, undefined, undefined, { changes: Object.keys(data) });
    messages[idx] = updated;
    saveData();
    return updated;
  },

  updateForWorkflow(
    id: number,
    data: Partial<Omit<MtFreeMessage, 'id' | 'createdAt' | 'auditLog'>>,
    allowedFromStatuses: MtFreeMessageStatus[],
    modifiedBy?: number
  ): MtFreeMessage | null {
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
    if (modifiedBy) addAudit(updated, 'WORKFLOW', modifiedBy, undefined, undefined, { changes: Object.keys(data) });
    messages[idx] = updated;
    saveData();
    return updated;
  },

  addAuditEntry(id: number, event: string, userId?: number, userName?: string, reason?: string, details?: Record<string, unknown>): MtFreeMessage | null {
    const msg = messages.find((m) => m.id === id);
    if (!msg) return null;
    addAudit(msg, event, userId, userName, reason, details);
    msg.updatedAt = new Date().toISOString();
    saveData();
    return msg;
  },

  deleteById(id: number): boolean {
    const idx = messages.findIndex((m) => m.id === id);
    if (idx < 0) return false;
    messages.splice(idx, 1);
    saveData();
    return true;
  },

  deleteByReference(reference: string): number {
    const q = reference.toUpperCase().trim();
    const before = messages.length;
    messages = messages.filter((m) => !(m.transactionReferenceNumber || '').toUpperCase().includes(q));
    const deleted = before - messages.length;
    if (deleted > 0) saveData();
    return deleted;
  },

  /** Seed: insere mensagem pré-montada (ex.: MT199 enviada) */
  seedInsert(msg: MtFreeMessage): MtFreeMessage {
    const maxId = messages.reduce((m, x) => Math.max(m, x.id), 0);
    const seeded = { ...msg, id: msg.id || maxId + 1 };
    if (!messages.some((m) => m.id === seeded.id)) {
      messages.push(seeded);
      if (seeded.id >= messageIdCounter) messageIdCounter = seeded.id + 1;
      saveData();
    }
    return seeded;
  },
};
