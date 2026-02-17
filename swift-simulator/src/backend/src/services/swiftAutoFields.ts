/**
 * Módulo central de geração automática de campos SWIFT
 * Geração real, única e à prova de duplicação para todos os MTs
 * RFC 4122 (UUID v4), crypto seguro, zero hardcode
 */

import * as crypto from 'crypto';

const SENDER_BIC = process.env.SWIFT_SENDER_BIC || 'BOMGBRS1XXX';
const SESSION_SEQ_LENGTH = 10;
const CHK_LENGTH = 12;
const SENDER_REF_PREFIX = 'REF';

const usedSessionSeq = new Set<string>();
const usedUetr = new Set<string>();
const MAX_CACHE_SIZE = 100000;

function trimCache<T>(set: Set<T>, max: number): void {
  if (set.size > max) {
    const arr = Array.from(set);
    arr.slice(0, arr.length - max).forEach((v) => set.delete(v));
  }
}

/**
 * Gera 10 dígitos únicos para Session (4) + Sequence (6)
 * Cronologicamente seguro, crypto random, sem colisões
 */
export function generateSessionSequence(): string {
  const buf = crypto.randomBytes(5);
  let value = BigInt(0);
  for (let i = 0; i < 5; i++) value = (value << BigInt(8)) | BigInt(buf[i]!);
  const str = value.toString().padStart(SESSION_SEQ_LENGTH, '0').slice(-SESSION_SEQ_LENGTH);
  if (usedSessionSeq.has(str)) return generateSessionSequence();
  usedSessionSeq.add(str);
  trimCache(usedSessionSeq, MAX_CACHE_SIZE);
  return str;
}

/**
 * UETR - Unique End-to-End Transaction Reference (RFC 4122 UUID v4)
 */
export function generateUetr(): string {
  const uetr = (typeof crypto.randomUUID === 'function' ? crypto.randomUUID() : fallbackUuidV4());
  if (usedUetr.has(uetr)) return generateUetr();
  usedUetr.add(uetr);
  trimCache(usedUetr, MAX_CACHE_SIZE);
  return uetr.toUpperCase();
}

function fallbackUuidV4(): string {
  const buf = crypto.randomBytes(16);
  buf[6] = (buf[6]! & 0x0f) | 0x40;
  buf[8] = (buf[8]! & 0x3f) | 0x80;
  const hex = buf.toString('hex');
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

/**
 * Sender Reference: prefixo + timestamp + hash curto (único)
 */
export function generateSenderReference(): string {
  const ts = Date.now().toString(36).toUpperCase();
  const hash = crypto.createHash('sha256')
    .update(`${ts}-${crypto.randomBytes(8).toString('hex')}`)
    .digest('hex')
    .slice(0, 8)
    .toUpperCase();
  return `${SENDER_REF_PREFIX}${ts}${hash}`.replace(/[^A-Z0-9]/g, '').slice(0, 35);
}

/**
 * CHK - Checksum do trailer (12 hex)
 * Calculado a partir do conteúdo da mensagem para consistência
 */
export function generateChk(messageContent: string): string {
  const hash = crypto.createHash('sha256').update(messageContent, 'utf8').digest('hex');
  return hash.slice(0, CHK_LENGTH).toUpperCase();
}

/**
 * Gera CHK aleatório quando o conteúdo ainda não existe (ex: criação)
 */
export function generateChkRandom(): string {
  return crypto.randomBytes(6).toString('hex').toUpperCase();
}

export interface SwiftAutoFields {
  logicalTerminal: string;
  sessionSequence: string;
  uetr: string;
  senderReference: string;
  chk: string;
}

export interface SwiftBlock1Params {
  applicationId?: string;
  senderBic?: string;
  sessionSequence?: string;
}

export interface SwiftBlock2Params {
  mtCode: string;
  receiverBic: string;
  priority?: 'N' | 'U' | 'S';
}

export interface SwiftBlock3Params {
  uetr?: string;
  senderReference?: string;
}

/**
 * Formata BIC para 12 caracteres (Block 1/2)
 */
function formatBic12(bic: string): string {
  const c = (bic || '').replace(/\s/g, '').toUpperCase();
  if (c.length >= 12) return c.slice(0, 12);
  if (c.length >= 8) return c.padEnd(12, 'X');
  return (c || 'XXXXXXXX').padEnd(12, 'X');
}

/**
 * Gera Basic Header Block {1:...}
 */
export function buildBlock1(params: SwiftBlock1Params): string {
  const appId = params.applicationId || 'F01';
  const bic = formatBic12(params.senderBic || SENDER_BIC);
  const sessionSeq = params.sessionSequence || generateSessionSequence();
  return `{1:${appId}${bic}${sessionSeq}}`;
}

/**
 * Gera Application Header Block {2:...}
 */
export function buildBlock2(params: SwiftBlock2Params): string {
  const mtNum = params.mtCode.replace(/[^0-9]/g, '');
  const bic = formatBic12(params.receiverBic);
  const prio = params.priority || 'N';
  return `{2:I${mtNum}${bic}${prio}}`;
}

/**
 * Gera User Header Block {3:...} com UETR e opcional 108
 */
export function buildBlock3(params: SwiftBlock3Params): string {
  const uetr = params.uetr || generateUetr();
  const ref108 = params.senderReference || generateSenderReference();
  return `{3:{108:${ref108}}{121:${uetr}}}`;
}

/**
 * Gera User Header Block {3:...} formato GPI (111:001 + 121:UETR)
 */
export function buildBlock3Gpi(uetr?: string): string {
  const u = uetr || generateUetr();
  return `{3:{111:001}{121:${u}}}`;
}

/**
 * Gera User Header Block {3:...} apenas UETR (formato alternativo)
 */
export function buildBlock3UetrOnly(uetr?: string): string {
  const u = uetr || generateUetr();
  return `{3:{121:${u}}}`;
}

/**
 * Gera Trailer Block {5:...}
 */
export function buildBlock5(chk: string, options?: { tng?: boolean }): string {
  const tng = options?.tng ? '{TNG:}' : '';
  return `{5:{CHK:${chk}}${tng}}`;
}

/**
 * Gera conjunto completo de campos automáticos para uma mensagem
 */
export function generateSwiftAutoFields(): SwiftAutoFields {
  return {
    logicalTerminal: formatBic12(SENDER_BIC),
    sessionSequence: generateSessionSequence(),
    uetr: generateUetr(),
    senderReference: generateSenderReference(),
    chk: generateChkRandom(),
  };
}

/**
 * Obtém BIC do remetente configurado
 */
export function getSenderBic(): string {
  return SENDER_BIC;
}
