/**
 * Store swift_network_report - dados recebidos do gateway/Alliance/log
 * Apenas armazena, nunca gera
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';
import * as crypto from 'crypto';
import type { MtType } from './swiftAutoFieldsStore.js';

const DATA_DIR = join(process.cwd(), 'data');
const NETWORK_REPORT_FILE = join(DATA_DIR, 'swift_network_report.json');

export interface SwiftNetworkReportRecord {
  id: string;
  mt_type: MtType;
  mt_message_id: number;
  chk: string | null;
  tracking: string | null;
  pki_signature: string | null;
  access_code: string | null;
  release_code: string | null;
  category: string | null;
  creation_time: string | null;
  application: string | null;
  operator: string | null;
  raw_text: string | null;
  parsed_text_blocks: Record<string, string> | null;
  created_at: string;
}

interface NetworkReportData {
  records: SwiftNetworkReportRecord[];
}

let records: SwiftNetworkReportRecord[] = [];

function load(): void {
  try {
    if (existsSync(NETWORK_REPORT_FILE)) {
      const raw = readFileSync(NETWORK_REPORT_FILE, 'utf-8');
      const parsed = JSON.parse(raw) as NetworkReportData;
      records = parsed.records || [];
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
    writeFileSync(NETWORK_REPORT_FILE, JSON.stringify({ records }, null, 2), 'utf-8');
  } catch {
    // in-memory only
  }
}

load();

export function findByMessage(mtType: MtType, mtMessageId: number): SwiftNetworkReportRecord | undefined {
  return records.find((r) => r.mt_type === mtType && r.mt_message_id === mtMessageId);
}

export function create(record: Omit<SwiftNetworkReportRecord, 'id' | 'created_at'>): SwiftNetworkReportRecord {
  const now = new Date().toISOString();
  const full: SwiftNetworkReportRecord = {
    ...record,
    id: crypto.randomUUID(),
    created_at: now,
  };
  records.push(full);
  save();
  return full;
}

export function upsert(record: Omit<SwiftNetworkReportRecord, 'id' | 'created_at'>): SwiftNetworkReportRecord {
  const idx = records.findIndex((r) => r.mt_type === record.mt_type && r.mt_message_id === record.mt_message_id);
  const now = new Date().toISOString();
  if (idx >= 0) {
    const updated: SwiftNetworkReportRecord = { ...records[idx]!, ...record, created_at: records[idx]!.created_at };
    records[idx] = updated;
    save();
    return records[idx]!;
  }
  return create(record);
}
