/**
 * Geração de linhas do recibo SWIFT — modelo visual OBRIGATÓRIO
 * Usado por SwiftReceiptView e swiftReceiptPdfExport
 * Layout FIXO — NÃO ALTERAR
 */

export interface SwiftReceiptNetworkAck {
  direction?: string;
  messageType?: string;
  relatedMessage?: string;
  processingTime?: string;
  deliveryResult?: string;
  finBlocks?: string;
}

export interface SwiftReceiptData {
  mtType: string;
  direction?: string;
  network?: string;
  senderLt?: string;
  receiverLt?: string;
  priority?: string;
  inputTime?: string;
  messageStatus?: string;
  networkDeliveryStatus?: string;
  uetr?: string;
  mur?: string;
  finMessage?: string;
  networkAck?: string | SwiftReceiptNetworkAck;
  networkReport?: {
    category?: string;
    creationTime?: string;
    application?: string;
    operator?: string;
    chk?: string;
    tracking?: string;
    pkiSignature?: string;
    accessCode?: string;
    releaseCode?: string;
    rawText?: string;
  };
}

const LABEL_WIDTH = 24;

function formatDateTime(s: string | undefined): string {
  if (!s) return '';
  try {
    const d = new Date(s);
    const dd = String(d.getDate()).padStart(2, '0');
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const yyyy = d.getFullYear();
    const hh = String(d.getHours()).padStart(2, '0');
    const min = String(d.getMinutes()).padStart(2, '0');
    const ss = String(d.getSeconds()).padStart(2, '0');
    return `${dd}/${mm}/${yyyy} ${hh}:${min}:${ss}`;
  } catch {
    return s;
  }
}

function formatCreationTime(s: string | undefined): string {
  if (!s) return '';
  try {
    const d = new Date(s);
    const dd = String(d.getDate()).padStart(2, '0');
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const yyyy = d.getFullYear();
    const hh = String(d.getHours()).padStart(2, '0');
    const min = String(d.getMinutes()).padStart(2, '0');
    const ss = String(d.getSeconds()).padStart(2, '0');
    return `${dd}/${mm}/${yyyy} - ${hh}:${min}:${ss}`;
  } catch {
    return s;
  }
}

function padRight(label: string, width: number): string {
  return (label + ' '.repeat(width)).slice(0, width);
}

function line(label: string, value: string | undefined): string {
  const v = value === undefined || value === null || value === '' ? '-' : value;
  return `${padRight(label, LABEL_WIDTH)} : ${v}`;
}

export function buildSwiftReceiptLines(data: SwiftReceiptData): string[] {
  const lines: string[] = [];
  const mtType = (data.mtType || 'MT103').toUpperCase().replace(/[^A-Z0-9]/g, '') || 'MTXXX';

  lines.push('=========================== RECIBO / PRINT TÉCNICO — SWIFT FIN ===========================');
  lines.push('');
  lines.push('=========================================================================================');
  lines.push(`RECIBO — ${mtType}`);
  lines.push('=========================================================================================');
  lines.push('');
  lines.push('------------------------------- MESSAGE DETAILS (OPERADOR) -------------------------------');
  lines.push(line('Direction', (data.direction || 'OUTGOING').toUpperCase()));
  lines.push(line('Network', (data.network || 'FIN').toUpperCase()));
  lines.push(line('Message Type', mtType));
  lines.push(line('Sender LT (Logical Term)', (data.senderLt || '-').toUpperCase()));
  lines.push(line('Receiver LT', (data.receiverLt || '-').toUpperCase()));
  lines.push(line('Priority', (data.priority || 'N').toUpperCase()));
  lines.push(line('Input/Creation Time', formatDateTime(data.inputTime)));
  lines.push(line('Message Status', (data.messageStatus || '-').toUpperCase()));
  lines.push(line('Network Delivery Status', (data.networkDeliveryStatus || '-').toUpperCase()));
  if (data.uetr) lines.push(line('UETR', data.uetr));
  if (data.mur) lines.push(line('MUR', data.mur));
  lines.push('-----------------------------------------------------------------------------------------');
  lines.push('');
  lines.push('------------------------------------ MESSAGE TEXT (FIN) ---------------------------------');
  lines.push('');
  lines.push((data.finMessage || '').trim() || '(vazio)');
  lines.push('');
  lines.push('-----------------------------------------------------------------------------------------');
  lines.push('');

  const networkAck = data.networkAck;
  if (networkAck) {
    lines.push('------------------------------------- NETWORK ACK (F21) ---------------------------------');
    lines.push('');
    if (typeof networkAck === 'string') {
      lines.push(networkAck.trim());
    } else {
      const ack = networkAck;
      if (ack.direction) lines.push(line('Direction', ack.direction.toUpperCase()));
      if (ack.messageType) lines.push(line('Message Type', ack.messageType));
      if (ack.relatedMessage) lines.push(line('Related Message', ack.relatedMessage));
      if (ack.processingTime) lines.push(line('Processing Time', ack.processingTime));
      if (ack.deliveryResult) lines.push(line('Delivery Result', ack.deliveryResult));
      if (ack.finBlocks) {
        lines.push('');
        lines.push(ack.finBlocks.trim());
      }
    }
    lines.push('');
    lines.push('-----------------------------------------------------------------------------------------');
    lines.push('');
  }

  const nr = data.networkReport;
  if (nr && (nr.category || nr.chk || nr.rawText)) {
    lines.push('------------------------------- NETWORK REPORT / TRAILER --------------------------------');
    lines.push('');
    if (nr.category) lines.push(line('Category', nr.category));
    if (nr.creationTime) lines.push(line('Creation Time', formatCreationTime(nr.creationTime) || nr.creationTime));
    if (nr.application) lines.push(line('Application', nr.application));
    if (nr.operator) lines.push(line('Operator', nr.operator));
    if (nr.chk) lines.push(line('{CHK}', nr.chk));
    if (nr.tracking) lines.push(line('TRACKING', nr.tracking));
    if (nr.pkiSignature) lines.push(line('PKI SIGNATURE', nr.pkiSignature));
    if (nr.accessCode) lines.push(line('ACCESS CODE', nr.accessCode));
    if (nr.releaseCode) lines.push(line('RELEASE CODE', nr.releaseCode));
    if (nr.rawText) {
      lines.push('');
      lines.push(nr.rawText.trim());
    }
    lines.push('');
    lines.push('----------------------------------------- END OF MESSAGE --------------------------------');
  } else {
    lines.push('----------------------------------------- END OF MESSAGE --------------------------------');
  }
  lines.push('');

  return lines;
}
