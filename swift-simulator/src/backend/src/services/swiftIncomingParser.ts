/**
 * Parser de mensagens SWIFT recebidas (raw FIN)
 * Extrai campos e gera texto normalizado sem alterar o RAW.
 */

import { createHash } from 'crypto';
import type { IncomingMessageTag, IncomingMessageExtractedFields } from '../store/incomingMessageTypes.js';

export interface SwiftParseResult {
  parsed: boolean;
  mtType?: string;
  senderBic?: string;
  receiverBic?: string;
  priority?: string;
  uetr?: string;
  tags: IncomingMessageTag[];
  extractedFields: IncomingMessageExtractedFields;
  normalizedText: string;
  parseErrors: string[];
}

function extractBlock1(text: string): { sender?: string; session?: string; sequence?: string } {
  const m = text.match(/\{1:(F|O)([A-Z0-9]{8})([A-Z0-9]{4})([A-Z0-9]{4})([A-Z0-9]{3})?\}/);
  if (m) {
    return { sender: m[2] + (m[5] || 'XXX') };
  }
  const m2 = text.match(/\{1:[^}]*([A-Z0-9]{8}[A-Z0-9]{3}?)\}/);
  if (m2) return { sender: m2[1] };
  return {};
}

function extractBlock2(text: string): { mtType?: string; receiver?: string; priority?: string } {
  const m = text.match(/\{2:(I|O)(\d{3})([A-Z0-9]{12})([A-Z0-9]{4})([A-Z0-9]{4})([A-Z0-9]{3})?\s*([NU])?\}/);
  if (m) {
    const mt = 'MT' + m[2];
    const receiver = m[3] + (m[6] || 'XXX');
    const priority = m[7] || 'N';
    return { mtType: mt, receiver, priority };
  }
  const m2 = text.match(/\{2:[^}]*I(\d{3})[^}]*\}/);
  if (m2) return { mtType: 'MT' + m2[1] };
  return {};
}

function extractBlock3(text: string): { uetr?: string } {
  const m = text.match(/\{121:([a-fA-F0-9\-]{36})\}/);
  if (m) return { uetr: m[1] };
  return {};
}

function extractBlock4Content(rawPayload: string): string {
  const m = rawPayload.match(/\{4:\s*([\s\S]*?)\}\s*(\{5:|$)/);
  if (m) return m[1];
  return rawPayload;
}

function extractBlock4Tags(rawPayload: string): IncomingMessageTag[] {
  const tags: IncomingMessageTag[] = [];
  const block4Content = extractBlock4Content(rawPayload);

  const tagRegex = /:(\d{2}[A-Z]?):/g;
  let match: RegExpExecArray | null;
  const matches: Array<{ tag: string; start: number; end: number }> = [];

  while ((match = tagRegex.exec(block4Content)) !== null) {
    const valueStart = match.index + match[0].length;
    const nextMatch = tagRegex.exec(block4Content);
    const valueEnd = nextMatch ? nextMatch.index : block4Content.length;
    if (nextMatch) tagRegex.lastIndex = nextMatch.index;
    matches.push({ tag: match[1], start: valueStart, end: valueEnd });
  }

  for (const m of matches) {
    const valueRaw = block4Content.substring(m.start, m.end).trim();
    const valueLines = valueRaw.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
    if (valueLines.length === 0 && valueRaw) valueLines.push(valueRaw);

    tags.push({
      tag: m.tag,
      valueLines,
      rawBlock: valueRaw || undefined,
    });
  }

  if (tags.length === 0) {
    const simpleTagRegex = /:(\d{2}[A-Z]?):([^\n]*?)(?=:\d{2}[A-Z]?:|$)/gs;
    while ((match = simpleTagRegex.exec(block4Content)) !== null) {
      const val = match[2].trim().split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
      tags.push({ tag: match[1], valueLines: val.length ? val : [] });
    }
  }

  return tags;
}

function extractFromTags(tags: IncomingMessageTag[]): IncomingMessageExtractedFields {
  const fields: IncomingMessageExtractedFields = {};
  for (const t of tags) {
    const val = t.valueLines[0] || '';
    if (t.tag === '20') fields.ref_20 = val;
    if (t.tag === '21') fields.ref_21 = val;
    if (t.tag === '11S' || t.tag === '21R') fields.related_mt = val;
    if (t.tag === '32A') {
      const m = val.match(/^(\d{6})([A-Z]{3})([\d,\.]+)$/);
      if (m) {
        const y = '20' + m[1].slice(0, 2);
        const mo = m[1].slice(2, 4);
        const d = m[1].slice(4, 6);
        fields.value_date = `${y}-${mo}-${d}`;
        fields.currency = m[2];
        const amt = m[3].replace(',', '.');
        fields.amount = parseFloat(amt) || undefined;
      }
    }
  }
  return fields;
}

function buildNormalizedText(
  mtType: string | undefined,
  senderBic: string | undefined,
  receiverBic: string | undefined,
  priority: string | undefined,
  uetr: string | undefined,
  receivedAt: string,
  tags: IncomingMessageTag[],
  extracted: IncomingMessageExtractedFields
): string {
  const lines: string[] = [];
  lines.push('=== HEADER ===');
  lines.push(`MT Type: ${mtType || 'N/A'}`);
  lines.push(`Sender BIC: ${senderBic || 'N/A'}`);
  lines.push(`Receiver BIC: ${receiverBic || 'N/A'}`);
  lines.push(`Priority: ${priority || 'N'}`);
  if (uetr) lines.push(`UETR: ${uetr}`);
  lines.push(`Received: ${receivedAt}`);
  lines.push('');
  lines.push('=== REFERENCES ===');
  if (extracted.ref_20) lines.push(`:20: ${extracted.ref_20}`);
  if (extracted.ref_21) lines.push(`:21: ${extracted.ref_21}`);
  if (extracted.related_mt) lines.push(`Related: ${extracted.related_mt}`);
  lines.push('');
  lines.push('=== KEY FIELDS ===');
  if (extracted.value_date) lines.push(`Value Date: ${extracted.value_date}`);
  if (extracted.currency) lines.push(`Currency: ${extracted.currency}`);
  if (extracted.amount != null) lines.push(`Amount: ${extracted.amount}`);
  lines.push('');
  lines.push('=== TAGS ===');
  for (const t of tags) {
    const val = t.valueLines.join('\n  ');
    lines.push(`:${t.tag}: ${val}`);
  }
  return lines.join('\n');
}

export function parse(rawPayload: string, receivedAt?: string): SwiftParseResult {
  const errors: string[] = [];
  const received = receivedAt || new Date().toISOString();

  if (!rawPayload || typeof rawPayload !== 'string') {
    return {
      parsed: false,
      tags: [],
      extractedFields: {},
      normalizedText: '',
      parseErrors: ['raw_payload vazio ou inválido'],
    };
  }

  const trimmed = rawPayload.trim();
  const block1 = extractBlock1(trimmed);
  const block2 = extractBlock2(trimmed);
  const block3 = extractBlock3(trimmed);

  let mtType = block2.mtType;
  if (!mtType) {
    const mtInText = trimmed.match(/MT(\d{3})|I(\d{3})/);
    if (mtInText) mtType = 'MT' + (mtInText[1] || mtInText[2]);
  }

  const tags = extractBlock4Tags(trimmed);
  const extracted = extractFromTags(tags);

  if (tags.length === 0) {
    const fallbackTags = extractTagsFallback(trimmed);
    fallbackTags.forEach((t) => tags.push(t));
    if (fallbackTags.length > 0) {
      Object.assign(extracted, extractFromTags(tags));
    }
  }

  const normalizedText = buildNormalizedText(
    mtType,
    block1.sender,
    block2.receiver,
    block2.priority || 'N',
    block3.uetr,
    received,
    tags,
    extracted
  );

  return {
    parsed: true,
    mtType,
    senderBic: block1.sender,
    receiverBic: block2.receiver,
    priority: block2.priority || 'N',
    uetr: block3.uetr,
    tags,
    extractedFields: extracted,
    normalizedText,
    parseErrors: errors,
  };
}

function extractTagsFallback(text: string): IncomingMessageTag[] {
  const tags: IncomingMessageTag[] = [];
  const regex = /:(\d{2}[A-Z]?):\s*([^\n:]*)(?:\n(?![:\d])[^\n]*)*/g;
  let m: RegExpExecArray | null;
  while ((m = regex.exec(text)) !== null) {
    const value = m[2].trim();
    const lines = value ? [value] : [];
    tags.push({ tag: m[1], valueLines: lines });
  }
  return tags;
}

export function computeChecksumSha256(rawPayload: string): string {
  return createHash('sha256').update(rawPayload, 'utf8').digest('hex');
}
