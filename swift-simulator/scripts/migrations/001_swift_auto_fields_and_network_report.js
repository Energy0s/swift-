#!/usr/bin/env node
/**
 * Migration 001: Cria estrutura para swift_auto_fields e swift_network_report
 * Garante que os arquivos JSON existam com estrutura inicial
 */

import { writeFileSync, existsSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_DIR = join(__dirname, '..', '..', 'src', 'backend', 'data');
const COUNTER_FILE = join(DATA_DIR, 'swift_sequence_counter.json');
const AUTO_FIELDS_FILE = join(DATA_DIR, 'swift_auto_fields.json');
const NETWORK_REPORT_FILE = join(DATA_DIR, 'swift_network_report.json');

function ensureFile(path, defaultContent) {
  if (!existsSync(path)) {
    if (!existsSync(DATA_DIR)) {
      mkdirSync(DATA_DIR, { recursive: true });
    }
    writeFileSync(path, JSON.stringify(defaultContent, null, 2), 'utf-8');
    return true;
  }
  return false;
}

const created = [];
if (ensureFile(COUNTER_FILE, { bySenderLt: {} })) created.push('swift_sequence_counter.json');
if (ensureFile(AUTO_FIELDS_FILE, { records: [] })) created.push('swift_auto_fields.json');
if (ensureFile(NETWORK_REPORT_FILE, { records: [] })) created.push('swift_network_report.json');

if (created.length > 0) {
  process.stdout.write(`Migration 001: criados ${created.join(', ')}\n`);
} else {
  process.stdout.write('Migration 001: arquivos já existem\n');
}
