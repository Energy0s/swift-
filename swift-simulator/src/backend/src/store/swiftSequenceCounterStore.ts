/**
 * Store para contador de sequência SWIFT (atomicidade por sender_lt)
 * Garante unicidade de (sender_lt, session_number, sequence_number)
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';

const DATA_DIR = join(process.cwd(), 'data');
const COUNTER_FILE = join(DATA_DIR, 'swift_sequence_counter.json');

export interface SequenceCounterEntry {
  sender_lt: string;
  last_session: number;
  last_sequence: number;
}

interface CounterData {
  bySenderLt: Record<string, { last_session: number; last_sequence: number }>;
}

let data: CounterData = { bySenderLt: {} };

function load(): void {
  try {
    if (existsSync(COUNTER_FILE)) {
      const raw = readFileSync(COUNTER_FILE, 'utf-8');
      data = JSON.parse(raw);
      if (!data.bySenderLt) data.bySenderLt = {};
    }
  } catch {
    data = { bySenderLt: {} };
  }
}

function save(): void {
  try {
    if (!existsSync(DATA_DIR)) {
      mkdirSync(DATA_DIR, { recursive: true });
    }
    writeFileSync(COUNTER_FILE, JSON.stringify(data, null, 2), 'utf-8');
  } catch {
    // in-memory only
  }
}

load();

let queue: Promise<unknown> = Promise.resolve();

function enqueue<T>(fn: () => T): Promise<T> {
  const p = queue.then(() => fn());
  queue = p;
  return p;
}

/**
 * Obtém próximo (session_number, sequence_number) de forma atômica.
 * Session: 4 dígitos (0000-9999), Sequence: 6 dígitos (000000-999999).
 * Quando sequence atinge 999999, incrementa session.
 */
export function getNextSessionSequence(senderLt: string): Promise<{ sessionNumber: string; sequenceNumber: string }> {
  return enqueue(() => {
    const lt = (senderLt || 'BOMGBRS1XXX').replace(/\s/g, '').toUpperCase().slice(0, 12).padEnd(12, 'X');
    if (!data.bySenderLt[lt]) {
      data.bySenderLt[lt] = { last_session: 0, last_sequence: 0 };
    }
    const entry = data.bySenderLt[lt]!;
    entry.last_sequence += 1;
    if (entry.last_sequence > 999999) {
      entry.last_sequence = 0;
      entry.last_session += 1;
      if (entry.last_session > 9999) entry.last_session = 0;
    }
    save();
    return {
      sessionNumber: entry.last_session.toString().padStart(4, '0'),
      sequenceNumber: entry.last_sequence.toString().padStart(6, '0'),
    };
  });
}
