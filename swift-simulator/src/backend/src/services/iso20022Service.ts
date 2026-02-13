/**
 * Serviço de geração de mensagens ISO20022 (pacs.008)
 * Equivalente ao MT103 para transferências de crédito de cliente
 */

export interface Pacs008Input {
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

function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/**
 * Gera mensagem pacs.008 (Customer Credit Transfer)
 * Formato ISO20022 para transferências internacionais
 */
export function generatePacs008(transfer: Pacs008Input): string {
  const now = new Date().toISOString().slice(0, 19);

  return `<?xml version="1.0" encoding="UTF-8"?>
<Document xmlns="urn:iso:std:iso:20022:tech:xsd:pacs.008.001.08">
  <FIToFICstmrCdtTrf>
    <GrpHdr>
      <MsgId>${escapeXml(transfer.referenceNumber)}</MsgId>
      <CreDtTm>${now}</CreDtTm>
      <NbOfTxs>1</NbOfTxs>
    </GrpHdr>
    <CdtTrfTxInf>
      <PmtId>
        <InstrId>${escapeXml(transfer.referenceNumber)}</InstrId>
        <EndToEndId>${escapeXml(transfer.referenceNumber)}</EndToEndId>
      </PmtId>
      <IntrBkSttlmAmt Ccy="${escapeXml(transfer.currency)}">${transfer.amount.toFixed(2)}</IntrBkSttlmAmt>
      <InstgAgt><FinInstnId><BIC>${escapeXml(transfer.sourceBic)}</BIC></FinInstnId></InstgAgt>
      <Dbtr><Nm>${escapeXml(transfer.sourceHolderName)}</Nm></Dbtr>
      <DbtrAcct><Id><IBAN>${escapeXml(transfer.sourceIban)}</IBAN></Id></DbtrAcct>
      <Cdtr><Nm>${escapeXml(transfer.destinationHolderName)}</Nm></Cdtr>
      <CdtrAcct><Id><IBAN>${escapeXml(transfer.destinationIban)}</IBAN></Id></CdtrAcct>
      <CdtrAgt><FinInstnId><BIC>${escapeXml(transfer.destinationBic)}</BIC></FinInstnId></CdtrAgt>
      <RmtInf><Ustrd>${escapeXml(transfer.purpose || '')}</Ustrd></RmtInf>
    </CdtTrfTxInf>
  </FIToFICstmrCdtTrf>
</Document>`;
}

/**
 * Gera número de referência único no formato SWIFT
 */
export function generateReferenceNumber(): string {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `SW${timestamp}${random}`;
}
