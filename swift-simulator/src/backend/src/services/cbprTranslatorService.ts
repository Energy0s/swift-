/**
 * Tradutor CBPR+ - MT (ISO 15022) ↔ MX (ISO 20022)
 * Conforme demo Payment-Components: https://github.com/Payment-Components/demo-translator-cbpr
 *
 * - translateMtToMx: MT103 → pacs.008 (ou CBPR+ envelope)
 * - translateMxToMt: pacs.008 → MT103
 */

import { generatePacs008 } from './iso20022Service.js';
import { generateMt103 } from './mt103Service.js';
import { generateCbprMessage } from './cbprService.js';
import type { Mt103Input } from './mt103Service.js';

export interface TranslationResult<T = string> {
  message: T;
  errors: TranslationError[];
}

export interface TranslationError {
  errorCode: string;
  errorCategory: string;
  errorDescription: string;
  originalFieldPath?: string;
  targetFieldPath?: string;
  originalValue?: string;
  alteredValue?: string;
}

/** Dados extraídos de MT103 ou pacs.008 para tradução */
export interface TransferData {
  referenceNumber: string;
  sourceIban: string;
  sourceBic: string;
  sourceHolderName: string;
  destinationIban: string;
  destinationBic: string;
  destinationHolderName: string;
  amount: number;
  currency: string;
  purpose?: string;
}

// --- Parsing MT103 ---

function extractBlock4(mtMessage: string): string {
  const match = mtMessage.match(/\{4:([\s\S]*?)\}-?\}/);
  return match ? match[1].trim() : '';
}

function extractTag(block4: string, tag: string): string | null {
  const regex = new RegExp(`:${tag}:([\\s\\S]*?)(?=:[0-9]{2}[A-Z]?:|$)`, 'm');
  const match = block4.match(regex);
  return match ? match[1].trim().replace(/\n-?$/, '') : null;
}

function extractBicFromBlock(block: string, pattern: RegExp): string | null {
  const match = block.match(pattern);
  return match ? match[1].replace(/X+$/, '').trim() : null;
}

/**
 * Parse MT103 e extrai dados para tradução
 */
function parseMt103(mtMessage: string): TransferData | null {
  const block1 = mtMessage.match(/\{1:([^}]+)\}/)?.[1] || '';
  const block2 = mtMessage.match(/\{2:([^}]+)\}/)?.[1] || '';
  const block4 = extractBlock4(mtMessage);
  if (!block4) return null;

  const ref = extractTag(block4, '20');
  const val32a = extractTag(block4, '32A');
  const ord50 = extractTag(block4, '50K') || extractTag(block4, '50A') || extractTag(block4, '50F') || extractTag(block4, '50');
  const ben59 = extractTag(block4, '59F') || extractTag(block4, '59A') || extractTag(block4, '59') || extractTag(block4, '59');
  const rem70 = extractTag(block4, '70');

  if (!ref || !val32a || !ben59) return null;

  // :32A: YYMMDD + CURRENCY + amount (ex: 250213EUR1500,00 ou 1500.00)
  const val32aMatch = val32a.match(/^(\d{6})([A-Z]{3})([\d,.\s]+)$/);
  const currency = val32aMatch ? val32aMatch[2] : 'EUR';
  const amountStr = val32aMatch ? val32aMatch[3].replace(',', '.') : '0';
  const amount = parseFloat(amountStr) || 0;

  // :59F: /IBAN\nNome ou /IBAN\nNome\nEndereço
  let destIban = '';
  let destName = '';
  if (ben59.startsWith('/')) {
    const parts = ben59.substring(1).split('\n');
    destIban = parts[0]?.trim() || '';
    destName = parts.slice(1).join(' ').trim() || 'Beneficiary';
  } else {
    destName = ben59.replace(/\n/g, ' ').trim() || 'Beneficiary';
  }

  // BICs: block1 = remetente, block2 = destinatário
  const sourceBic = extractBicFromBlock(block1, /F01([A-Z0-9]{8,11})/) || 'XXXXXXXX';
  const destBic = extractBicFromBlock(block2, /[IO]103([A-Z0-9]{8,11})/) || 'XXXXXXXX';

  // IBAN ordenante: :50K geralmente não tem IBAN; usar placeholder se necessário
  const sourceIban = 'PLACEHOLDER'; // MT103 :50K pode não ter IBAN
  const sourceName = ord50?.replace(/\n/g, ' ').trim() || 'Ordering Customer';

  return {
    referenceNumber: ref,
    sourceIban,
    sourceBic,
    sourceHolderName: sourceName,
    destinationIban: destIban,
    destinationBic: destBic,
    destinationHolderName: destName,
    amount,
    currency,
    purpose: rem70 || undefined,
  };
}

// --- Parsing pacs.008 / CBPR+ ---

function extractXmlTag(xml: string, tag: string): string | null {
  const re = new RegExp(`<${tag}[^>]*>([^<]*)</${tag}>`, 's');
  const m = xml.match(re);
  return m ? m[1].trim() : null;
}

/**
 * Extrai o Document pacs.008 de uma mensagem MX (pacs.008 puro ou envelope CBPR+)
 */
function extractPacs008Document(mxMessage: string): string {
  const trimmed = mxMessage.trim();
  if (trimmed.includes('<Document') && trimmed.includes('FIToFICstmrCdtTrf')) {
    const docMatch = trimmed.match(/<Document[^>]*>([\s\S]*?)<\/Document>/);
    if (docMatch) {
      return `<Document xmlns="urn:iso:std:iso:20022:tech:xsd:pacs.008.001.08">${docMatch[1]}</Document>`;
    }
  }
  return trimmed;
}

/**
 * Parse pacs.008 XML e extrai dados para tradução
 */
function parsePacs008(xml: string): TransferData | null {
  const doc = extractPacs008Document(xml);
  const fitofic = doc.match(/<FIToFICstmrCdtTrf>([\s\S]*?)<\/FIToFICstmrCdtTrf>/)?.[1];
  if (!fitofic) return null;

  const msgId = extractXmlTag(fitofic, 'MsgId');
  const instrId = extractXmlTag(fitofic, 'InstrId');
  const endToEndId = extractXmlTag(fitofic, 'EndToEndId');
  const ref = msgId || instrId || endToEndId || 'REF-UNKNOWN';

  const amountEl = fitofic.match(/<IntrBkSttlmAmt[^>]*Ccy="([^"]*)"[^>]*>([^<]*)<\/IntrBkSttlmAmt>/);
  const currency = amountEl ? amountEl[1] : 'EUR';
  const amount = amountEl ? parseFloat(amountEl[2]) : 0;

  const instgAgtBlock = fitofic.match(/<InstgAgt>([\s\S]*?)<\/InstgAgt>/)?.[1] || '';
  const cdtrAgtBlock = fitofic.match(/<CdtrAgt>([\s\S]*?)<\/CdtrAgt>/)?.[1] || '';
  const sourceBic = (instgAgtBlock.match(/<BIC>([^<]*)<\/BIC>/) || [])[1] || 'XXXXXXXX';
  const destBic = (cdtrAgtBlock.match(/<BIC>([^<]*)<\/BIC>/) || [])[1] || 'XXXXXXXX';

  const sourceName = (fitofic.match(/<Dbtr>[\s\S]*?<Nm>([^<]*)<\/Nm>/) || [])[1] || 'Debtor';
  const destName = (fitofic.match(/<Cdtr>[\s\S]*?<Nm>([^<]*)<\/Nm>/) || [])[1] || 'Creditor';

  const sourceIban = (fitofic.match(/<DbtrAcct>[\s\S]*?<IBAN>([^<]*)<\/IBAN>/) || [])[1] || '';
  const destIban = (fitofic.match(/<CdtrAcct>[\s\S]*?<IBAN>([^<]*)<\/IBAN>/) || [])[1] || '';

  const purpose = (fitofic.match(/<RmtInf>[\s\S]*?<Ustrd>([^<]*)<\/Ustrd>/) || [])[1] || undefined;

  return {
    referenceNumber: ref,
    sourceIban: sourceIban || 'PLACEHOLDER',
    sourceBic,
    sourceHolderName: sourceName,
    destinationIban: destIban,
    destinationBic: destBic,
    destinationHolderName: destName,
    amount,
    currency,
    purpose: purpose?.trim() || undefined,
  };
}

// --- API pública ---

export type MtToMxOutputFormat = 'pacs008' | 'cbpr';

/**
 * Traduz MT103 para MX (pacs.008 ou CBPR+)
 * Equivalente a CbprTranslator.translateMtToMx()
 */
export function translateMtToMx(
  mtMessage: string,
  options?: { format?: MtToMxOutputFormat }
): TranslationResult<string> {
  const errors: TranslationError[] = [];
  const data = parseMt103(mtMessage);

  if (!data) {
    errors.push({
      errorCode: 'INVALID_MT',
      errorCategory: 'PARSING',
      errorDescription: 'Mensagem MT103 inválida ou incompleta',
    });
    return { message: '', errors };
  }

  if (!data.destinationIban || data.destinationIban === '') {
    errors.push({
      errorCode: 'T0001T',
      errorCategory: 'TRUNC_N',
      errorDescription: 'IBAN do beneficiário não encontrado em :59',
      targetFieldPath: 'CdtrAcct/Id/IBAN',
    });
  }

  const format = options?.format ?? 'pacs008';
  const message = format === 'cbpr'
    ? generateCbprMessage(data)
    : generatePacs008(data);

  return { message, errors };
}

/**
 * Traduz MX (pacs.008 ou CBPR+) para MT103
 * Equivalente a CbprTranslator.translateMxToMt()
 */
export function translateMxToMt(mxMessage: string): TranslationResult<string> {
  const errors: TranslationError[] = [];
  const data = parsePacs008(mxMessage);

  if (!data) {
    errors.push({
      errorCode: 'INVALID_MX',
      errorCategory: 'PARSING',
      errorDescription: 'Mensagem pacs.008/CBPR+ inválida ou incompleta',
    });
    return { message: '', errors };
  }

  const message = generateMt103(data as Mt103Input);
  return { message, errors };
}
