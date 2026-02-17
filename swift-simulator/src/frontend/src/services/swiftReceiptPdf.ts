/**
 * Geração de PDF — Recibo SWIFT (Cópia de Envio)
 * Estilo legado: fonte monoespaçada, maiúsculas, linhas pontilhadas
 * Cabeçalho: VHS INVESTIMENTOS S.A. | BIC: BOMGBRS1XXX
 */

import { jsPDF } from 'jspdf';

const VHS_HEADER = {
  name: 'VHS INVESTIMENTOS S.A.',
  cnpj: '61.600.361/0001-63',
  address: 'AL DOUTOR CARLOS DE CARVALHO, 417 - SALA 9',
  phone: '(41) 3205-4347',
  ie: 'ISENTO',
  im: '12536471',
  bic: 'BOMGBRS1XXX',
};

interface SwiftReceiptData {
  messageType?: string;
  reference?: string;
  valueDate?: string;
  amount?: number;
  currency?: string;
  senderBic?: string;
  senderName?: string;
  senderAddress?: string;
  senderAccount?: string;
  senderIban?: string;
  receiverBic?: string;
  receiverName?: string;
  receiverAddress?: string;
  receiverAccount?: string;
  orderingCustomer?: string;
  beneficiaryName?: string;
  beneficiaryAddress?: string;
  beneficiaryCity?: string;
  beneficiaryCountry?: string;
  bankOperationCode?: string;
  dateOfIssue?: string;
  detailsOfCharges?: string;
  senderToReceiverInfo?: string;
  purpose?: string;
  rawMessage?: string;
  createdAt?: string;
  [key: string]: unknown;
}

const U = (s: string) => (s || '').toUpperCase();
const fmt = (v: unknown) => (v !== undefined && v !== null && v !== '' ? String(v).toUpperCase() : '');

function lineDotted(doc: jsPDF, y: number, x1 = 14, x2 = 196) {
  doc.setDrawColor(0, 0, 0);
  if (typeof (doc as any).setLineDashPattern === 'function') {
    (doc as any).setLineDashPattern([1, 2]);
  }
  doc.line(x1, y, x2, y);
  if (typeof (doc as any).setLineDashPattern === 'function') {
    (doc as any).setLineDashPattern([]);
  }
}

function addLine(doc: jsPDF, y: number, text: string): number {
  doc.setFont('Courier', 'normal');
  doc.setFontSize(8);
  const lines = doc.splitTextToSize(text, 182);
  doc.text(lines, 14, y);
  return y + lines.length * 4 + 2;
}

function addSeparator(doc: jsPDF, y: number, label: string): number {
  const sep = `---------- ${label} ----------`;
  doc.setFont('Courier', 'normal');
  doc.setFontSize(8);
  doc.text(sep, 14, y);
  y += 5;
  lineDotted(doc, y);
  return y + 6;
}

function addField(doc: jsPDF, y: number, tag: string, label: string, value: string): number {
  const display = (value || '').trim();
  const prefix = tag ? `***${tag}* ` : '';
  const labelPart = label ? `${prefix}${label} :` : `${prefix}`;
  doc.setFont('Courier', 'normal');
  doc.setFontSize(8);
  if (display && display.length < 50) {
    doc.text(`${labelPart} ${display}`, 14, y);
    return y + 5;
  }
  doc.text(labelPart, 14, y);
  if (display) {
    const lines = doc.splitTextToSize(display, 160);
    doc.text(lines, 16, y + 4);
    return y + 4 + lines.length * 4 + 2;
  }
  return y + 5;
}

export function generateSwiftReceiptPdf(data: SwiftReceiptData): Blob {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  doc.setFont('Courier', 'normal');
  doc.setFontSize(8);

  let y = 12;

  const docDate = data.createdAt
    ? new Date(data.createdAt).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'medium' })
    : new Date().toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'medium' });

  doc.text(U(`${docDate}`), 14, y);
  y += 5;
  doc.text(U(VHS_HEADER.name), 14, y);
  y += 5;
  doc.text(U(`PRINTER+++ ${docDate}+++CUSTOMER'S COPY`), 14, y);
  y += 6;

  y = addSeparator(doc, y, 'INSTANCE TYPE AND TRANSMISSION');
  y += 2;

  const mtType = (data.messageType || 'MT-103').replace('MT', 'MT-');
  doc.text(U(`${mtType} CASH BACKED SINGLE CUSTOMER TRANSFER-VIA BRUSSELS SWIFT SYSTEM`), 14, y);
  y += 5;
  doc.text(U(`SESSION HOLDER : ${VHS_HEADER.bic}`), 14, y);
  y += 4;
  doc.text(U(`DEST RTE : ${(data.receiverBic as string) || 'N/A'}/`), 14, y);
  y += 4;
  doc.text(U('NOTIFICATION (STATUS) : TRANSMISSION) OF ORIGINAL SENT BY SWIFT(ACK) NETWORK DELIVERY STATUS : RECEIVED'), 14, y);
  y += 4;
  doc.text(U('PRIORITY/DELIVERY : URGENT-EXPRESS, SAME DAY WIRE NETWORK DELIVERY STATUS : NETWORK ACK'), 14, y);
  y += 4;
  const ref = (data.reference as string) || 'N/A';
  doc.text(U(`MESSAGE INPUT REFERENCE : ${docDate}, ${VHS_HEADER.bic}/${ref}`), 14, y);
  y += 4;
  doc.text(U(`MESSAGE OUTPUT REFERENCE : ${docDate}, ${mtType} CASH BACKED SINGLE CUSTOMER TRANSFER ${(data.receiverBic as string) || ''}/${ref}`), 14, y);
  y += 6;

  y = addSeparator(doc, y, 'MESSAGE HEADER');
  y += 2;

  doc.text(U(`SWIFT INPUT: ${mtType} CASH BACKED SINGLE CREDIT CUSTOMER TRANSFER`), 14, y);
  y += 6;

  doc.text('SENDER', 14, y);
  y += 5;
  lineDotted(doc, y);
  y += 5;
  y = addField(doc, y, 'SWIFT CODE', '', VHS_HEADER.bic);
  y = addField(doc, y, '', 'BANK NAME', VHS_HEADER.name);
  y = addField(doc, y, '', 'BANK ADDRESS', VHS_HEADER.address);
  y = addField(doc, y, '', 'ACCOUNT NAME', (data.orderingCustomer as string) || '');
  y = addField(doc, y, '', 'APPLICANT ADDRESS', (data.senderAddress as string) || '');
  y = addField(doc, y, '', 'ACCOUNT NUMBER', (data.senderAccount as string) || (data.senderIban as string) || '');
  y = addField(doc, y, '', 'IBAN NUMBER', (data.senderIban as string) || (data.senderAccount as string) || '');
  y += 4;

  doc.text('RECEIVER:', 14, y);
  y += 5;
  lineDotted(doc, y);
  y += 5;
  y = addField(doc, y, 'SWIFT CODE', '', (data.receiverBic as string) || '');
  y = addField(doc, y, '', 'BANK NAME', (data.receiverName as string) || '');
  y = addField(doc, y, '', 'BANK ADDRESS', (data.receiverAddress as string) || '');
  y = addField(doc, y, '', 'ACCOUNT NAME', (data.beneficiaryName as string) || '');
  y = addField(doc, y, '', 'ACCOUNT NO', (data.receiverAccount as string) || '');
  y += 4;

  y = addSeparator(doc, y, 'MESSAGE TEXT');
  y += 2;

  y = addField(doc, y, 'F21', "VALIDATION & AUTHENTICATION OF STANDING SWIFT WIRE TRANSFER", '');
  y = addField(doc, y, 'F20', "SENDER'S REF", (data.reference as string) || '');
  y = addField(doc, y, '', 'RCVD++ VALUE DATE', (data.valueDate as string) || docDate.split(' ')[0] || '');
  const amt = data.amount && data.currency
    ? `${data.currency} ${Number(data.amount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
    : '';
  y = addField(doc, y, '', 'RCVD++ VALUE AMOUNT', amt);
  y = addField(doc, y, 'F23B', 'BANK OPERATION CODE', (data.bankOperationCode as string) || 'CRED');
  y = addField(doc, y, 'F31C', 'DATE OF ISSUE', (data.dateOfIssue as string) || docDate.split(' ')[0] || '');
  y = addField(doc, y, 'F32A', 'VALUE DATE/CURRENCY/INTER BANK SETTLED AMOUNT CURRENCY', (data.currency as string) || '');
  y = addField(doc, y, 'F32B', 'CURRENCY AMOUNT', amt);
  y = addField(doc, y, 'F51A', 'RCVD++ SENDER', (data.orderingCustomer as string) || '');
  y = addField(doc, y, 'F56A', 'CORRESPONDENT BANK', 'NONE');
  y = addField(doc, y, 'F57A', 'RCVD++ OWN/T/B/C ID', (data.receiverBic as string) || '');
  y = addField(doc, y, '', 'RECEIVER\'S BANK', (data.receiverName as string) || '');
  y = addField(doc, y, '', 'RECEIVER\'S ACCOUNT NAME', (data.beneficiaryName as string) || '');
  y = addField(doc, y, '', 'RECEIVER\'S ACCOUNT NUMBER', (data.receiverAccount as string) || '');
  y += 4;

  doc.text('***F59* BENEFICIARY CUSTOMER/ADDRESS', 14, y);
  y += 5;
  const beneficiaryAddr = [
    (data.beneficiaryAddress as string),
    (data.beneficiaryCity as string),
    (data.beneficiaryCountry as string),
  ].filter(Boolean).join(', ');
  y = addField(doc, y, '', '', (data.beneficiaryName as string) || beneficiaryAddr || '');
  if (beneficiaryAddr && data.beneficiaryName) {
    y = addField(doc, y, '', '', beneficiaryAddr);
  }
  y += 4;

  lineDotted(doc, y);
  y += 6;
  doc.text(U('SWIFT MESSAGE'), 160, y);

  if (y > 250 && data.rawMessage) {
    doc.addPage();
    y = 15;
  } else if (data.rawMessage) {
    y += 10;
  }

  if (data.rawMessage) {
    doc.setFont('Courier', 'normal');
    doc.setFontSize(7);
    const lines = doc.splitTextToSize(U((data.rawMessage as string).replace(/\r/g, '')), 182);
    doc.text(lines, 14, y);
  }

  return doc.output('blob');
}

export function downloadSwiftReceipt(data: SwiftReceiptData, filename?: string): void {
  const blob = generateSwiftReceiptPdf(data);
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename || `recibo-swift-${data.reference || Date.now()}.pdf`;
  a.click();
  URL.revokeObjectURL(url);
}

/** Dados para recibo MT Free (MT199, MT299, MT999) */
export interface MtFreeReceiptData {
  messageType?: string;
  reference?: string;
  relatedReference?: string;
  narrative?: string;
  senderBic?: string;
  receiverBic?: string;
  rawMessage?: string;
  createdAt?: string;
}

/** Gera PDF de recibo para MT Free (MT199/MT299/MT999) — estilo legado template */
export function generateMtFreeReceiptPdf(data: MtFreeReceiptData): Blob {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  doc.setFont('Courier', 'normal');
  doc.setFontSize(8);

  let y = 12;
  const docDate = data.createdAt
    ? new Date(data.createdAt).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'medium' })
    : new Date().toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'medium' });

  const mtType = (data.messageType || 'MT-199').replace('MT', 'MT-');
  const U = (s: string) => (s || '').toUpperCase();

  doc.text(U(docDate), 14, y);
  y += 5;
  doc.text(U(VHS_HEADER.name), 14, y);
  y += 5;
  doc.text(U(`PRINTER+++ ${docDate}+++CUSTOMER'S COPY`), 14, y);
  y += 6;

  y = addSeparator(doc, y, 'INSTANCE TYPE AND TRANSMISSION');
  y += 2;

  doc.text(U(`${mtType} FREE FORMAT MESSAGE-VIA BRUSSELS SWIFT SYSTEM`), 14, y);
  y += 5;
  doc.text(U(`SESSION HOLDER : ${VHS_HEADER.bic}`), 14, y);
  y += 4;
  doc.text(U(`DEST RTE : ${(data.receiverBic as string) || 'N/A'}/`), 14, y);
  y += 4;
  doc.text(U('NOTIFICATION (STATUS) : TRANSMISSION) OF ORIGINAL SENT BY SWIFT(ACK) NETWORK DELIVERY STATUS : RECEIVED'), 14, y);
  y += 4;
  doc.text(U('PRIORITY/DELIVERY : URGENT-EXPRESS, SAME DAY WIRE NETWORK DELIVERY STATUS : NETWORK ACK'), 14, y);
  y += 4;
  const ref = (data.reference as string) || 'N/A';
  doc.text(U(`MESSAGE INPUT REFERENCE : ${docDate}, ${VHS_HEADER.bic}/${ref}`), 14, y);
  y += 4;
  doc.text(U(`MESSAGE OUTPUT REFERENCE : ${docDate}, ${mtType} FREE FORMAT MESSAGE ${(data.receiverBic as string) || ''}/${ref}`), 14, y);
  y += 6;

  y = addSeparator(doc, y, 'MESSAGE HEADER');
  y += 2;

  doc.text(U(`SWIFT INPUT: ${mtType} FREE FORMAT MESSAGE`), 14, y);
  y += 6;

  doc.text('SENDER', 14, y);
  y += 5;
  lineDotted(doc, y);
  y += 5;
  y = addField(doc, y, 'SWIFT CODE', '', VHS_HEADER.bic);
  y = addField(doc, y, '', 'BANK NAME', VHS_HEADER.name);
  y = addField(doc, y, '', 'BANK ADDRESS', VHS_HEADER.address);
  y += 4;

  doc.text('RECEIVER:', 14, y);
  y += 5;
  lineDotted(doc, y);
  y += 5;
  y = addField(doc, y, 'SWIFT CODE', '', (data.receiverBic as string) || '');
  y = addField(doc, y, '', 'BANK NAME', '');
  y = addField(doc, y, '', 'BANK ADDRESS', '');
  y += 4;

  y = addSeparator(doc, y, 'MESSAGE TEXT');
  y += 2;

  y = addField(doc, y, 'F20', "SENDER'S REF", (data.reference as string) || '');
  y = addField(doc, y, 'F21', 'RELATED REFERENCE', (data.relatedReference as string) || '');
  y += 4;

  doc.text('***F79* NARRATIVE / FREE TEXT', 14, y);
  y += 5;
  const narrative = (data.narrative as string) || '';
  if (narrative) {
    const lines = doc.splitTextToSize(U(narrative.replace(/\r/g, '')), 182);
    doc.text(lines, 14, y);
    y += lines.length * 4 + 4;
  } else {
    y += 4;
  }

  lineDotted(doc, y);
  y += 6;
  doc.text(U('SWIFT MESSAGE'), 160, y);

  if (data.rawMessage && y < 250) y += 10;
  if (data.rawMessage) {
    if (y > 250) {
      doc.addPage();
      y = 15;
    }
    doc.setFont('Courier', 'normal');
    doc.setFontSize(7);
    const lines = doc.splitTextToSize(U((data.rawMessage as string).replace(/\r/g, '')), 182);
    doc.text(lines, 14, y);
  }

  return doc.output('blob');
}

export function downloadMtFreeReceipt(data: MtFreeReceiptData, filename?: string): void {
  const blob = generateMtFreeReceiptPdf(data);
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename || `recibo-swift-${data.messageType || 'MT199'}-${data.reference || Date.now()}.pdf`;
  a.click();
  URL.revokeObjectURL(url);
}

/** Gera recibo em texto (estilo legado) para impressão/download TXT */
export function generateSwiftReceiptText(data: SwiftReceiptData): string {
  const U = (s: string) => (s || '').toUpperCase();
  const v = (x: unknown) => (x !== undefined && x !== null && x !== '' ? String(x).toUpperCase() : '');
  const sep = (label: string) => `---------- ${label} ----------`;
  const dot = '..................................................';

  const docDate = data.createdAt
    ? new Date(data.createdAt).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'medium' })
    : new Date().toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'medium' });

  const mtType = (data.messageType || 'MT-103').replace('MT', 'MT-');
  const amt = data.amount && data.currency
    ? `${data.currency} ${Number(data.amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}`
    : '';

  const lines = [
    U(docDate),
    U(VHS_HEADER.name),
    U(`PRINTER+++ ${docDate}+++CUSTOMER'S COPY`),
    '',
    sep('INSTANCE TYPE AND TRANSMISSION'),
    dot,
    '',
    U(`${mtType} CASH BACKED SINGLE CUSTOMER TRANSFER-VIA BRUSSELS SWIFT SYSTEM`),
    U(`SESSION HOLDER : ${VHS_HEADER.bic}`),
    U(`DEST RTE : ${v(data.receiverBic)}/`),
    U('NOTIFICATION (STATUS) : TRANSMISSION) OF ORIGINAL SENT BY SWIFT(ACK) NETWORK DELIVERY STATUS : RECEIVED'),
    U('PRIORITY/DELIVERY : URGENT-EXPRESS, SAME DAY WIRE NETWORK DELIVERY STATUS : NETWORK ACK'),
    U(`MESSAGE INPUT REFERENCE : ${docDate}, ${VHS_HEADER.bic}/${v(data.reference)}`),
    U(`MESSAGE OUTPUT REFERENCE : ${docDate}, ${mtType} CASH BACKED SINGLE CUSTOMER TRANSFER ${v(data.receiverBic)}/${v(data.reference)}`),
    '',
    sep('MESSAGE HEADER'),
    dot,
    '',
    U(`SWIFT INPUT: ${mtType} CASH BACKED SINGLE CREDIT CUSTOMER TRANSFER`),
    '',
    'SENDER',
    dot,
    `***SWIFT CODE : ${VHS_HEADER.bic}`,
    `BANK NAME : ${U(VHS_HEADER.name)}`,
    `BANK ADDRESS : ${U(VHS_HEADER.address)}`,
    `ACCOUNT NAME : ${v(data.orderingCustomer)}`,
    `ACCOUNT NUMBER : ${v(data.senderAccount || data.senderIban)}`,
    `IBAN NUMBER : ${v(data.senderIban || data.senderAccount)}`,
    '',
    'RECEIVER:',
    dot,
    `***SWIFT CODE : ${v(data.receiverBic)}`,
    `BANK NAME : ${v(data.receiverName)}`,
    `BANK ADDRESS : ${v(data.receiverAddress)}`,
    `ACCOUNT NAME : ${v(data.beneficiaryName)}`,
    `ACCOUNT NO : ${v(data.receiverAccount)}`,
    '',
    sep('MESSAGE TEXT'),
    dot,
    '',
    `***F20* SENDER'S REF : ${v(data.reference)}`,
    `RCVD++ VALUE DATE : ${v(data.valueDate || docDate.split(' ')[0])}`,
    `RCVD++ VALUE AMOUNT : ${amt}`,
    `***F23B* BANK OPERATION CODE : ${v(data.bankOperationCode) || 'CRED'}`,
    `***F32A* VALUE DATE/CURRENCY/AMOUNT : ${amt}`,
    `***F51A* ORDERING INSTITUTION : ${v(data.orderingCustomer)}`,
    `***F57A* ACCOUNT WITH INSTITUTION : ${v(data.receiverBic)}`,
    `***F59* BENEFICIARY CUSTOMER : ${v(data.beneficiaryName)}`,
    `***F71A* DETAILS OF CHARGES : ${v(data.detailsOfCharges)}`,
    `***F72* SENDER TO RECEIVER INFO : ${v(data.senderToReceiverInfo || data.purpose)}`,
    '',
    '***F59* BENEFICIARY CUSTOMER/ADDRESS',
    dot,
    [v(data.beneficiaryName), v(data.beneficiaryAddress), v(data.beneficiaryCity), v(data.beneficiaryCountry)].filter(Boolean).join(', '),
    '',
    dot,
    '',
    U('SWIFT MESSAGE'),
  ];

  if (data.rawMessage) {
    lines.push('', U('RAW SWIFT MESSAGE'), dot, '', (data.rawMessage as string).replace(/\r/g, ''));
  }

  return lines.join('\n');
}
