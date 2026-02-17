/**
 * Store swift_auto_fields - campos gerados pelo nosso sistema
 * Associado a (mt_type, mt_message_id)
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';
import * as crypto from 'crypto';

const DATA_DIR = join(process.cwd(), 'data');
const AUTO_FIELDS_FILE = join(DATA_DIR, 'swift_auto_fields.json');

export type MtType = 'mt103' | 'mt_free' | 'mt101' | 'mt109';

export interface SwiftAutoFieldsRecord {
  id: string;
  mt_type: MtType;
  mt_message_id: number;
  sender_lt: string;
  application_id: string;
  session_number: string;
  sequence_number: string;
  uetr: string;
  mur_108: string | null;
  stp_119: string | null;
  created_at: string;
  updated_at: string;
}

interface AutoFieldsData {
  records: SwiftAutoFieldsRecord[];
  usedUetr: Set<string>;
}

let records: SwiftAutoFieldsRecord[] = [];
const usedUetr = new Set<string>();

function load(): void {
  try {
    if (existsSync(AUTO_FIELDS_FILE)) {
      const raw = readFileSync(AUTO_FIELDS_FILE, 'utf-8');
      const parsed = JSON.parse(raw) as { records: SwiftAutoFieldsRecord[] };
      records = parsed.records || [];
      usedUetr.clear();
      records.forEach((r) => usedUetr.add(r.uetr));
    }
  } catch {
    records = [];
  }
}

function save(): void {
  try {
    if (!existsSync(DATA_DIR)) {
      mkdirSync(DATA_DIR, { recursive: true });
    }
    writeFileSync(AUTO_FIELDS_FILE, JSON.stringify({ records }, null, 2), 'utf-8');
  } catch {
    // in-memory only
  }
}

load();

function generateUuid(): string {
  return (typeof crypto.randomUUID === 'function' ? crypto.randomUUID() : fallbackUuidV4()).toUpperCase();
}

function fallbackUuidV4(): string {
  const buf = crypto.randomBytes(16);
  buf[6] = (buf[6]! & 0x0f) | 0x40;
  buf[8] = (buf[8]! & 0x3f) | 0x80;
  const hex = buf.toString('hex');
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

export function findByMessage(mtType: MtType, mtMessageId: number): SwiftAutoFieldsRecord | undefined {
  return records.find((r) => r.mt_type === mtType && r.mt_message_id === mtMessageId);
}

export function findByUetr(uetr: string): SwiftAutoFieldsRecord | undefined {
  return records.find((r) => r.uetr.toUpperCase() === uetr.toUpperCase());
}

export function findBySessionSequence(senderLt: string, session: string, sequence: string): SwiftAutoFieldsRecord | undefined {
  return records.find(
    (r) =>
      r.sender_lt === senderLt && r.session_number === session && r.sequence_number === sequence
  );
}

export function create(record: Omit<SwiftAutoFieldsRecord, 'id' | 'created_at' | 'updated_at'>): SwiftAutoFieldsRecord {
  const existing = findByMessage(record.mt_type, record.mt_message_id);
  if (existing) return existing;

  let uetr = record.uetr;
  if (!uetr || usedUetr.has(uetr)) {
    uetr = generateUuid();
    let attempts = 0;
    while (usedUetr.has(uetr) && attempts < 100) {
      uetr = generateUuid();
      attempts++;
    }
    usedUetr.add(uetr);
  }

  const now = new Date().toISOString();
  const full: SwiftAutoFieldsRecord = {
    ...record,
    uetr,
    id: crypto.randomUUID(),
    created_at: now,
    updated_at: now,
  };
  records.push(full);
  save();
  return full;
}
