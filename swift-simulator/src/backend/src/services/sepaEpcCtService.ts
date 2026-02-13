/**
 * Serviço de geração de mensagens SEPA-EPC Credit Transfer
 * Formato ISO20022 para transferências SEPA na zona Euro
 * Baseado no demo Payment-Components: FIToFICustomerCreditTransfer08SepaEpcCt
 *
 * SEPA = Single Euro Payments Area
 * EPC = European Payments Council
 */

export interface SepaEpcCtInput {
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
  categoryPurpose?: 'SALA' | 'CORT' | 'SUPP' | 'GOVT' | 'OTHR';
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
 * Gera mensagem pacs.008 SEPA-EPC Credit Transfer
 * Estrutura compatível com FIToFICustomerCreditTransfer08SepaEpcCt
 *
 * SEPA-EPC-CT usa pacs.008 com elementos adicionais:
 * - Purp/CtgyPurp (categoria de propósito)
 * - Moeda tipicamente EUR
 * - IBANs de países SEPA
 */
export function generateSepaEpcCt(transfer: SepaEpcCtInput): string {
  const now = new Date().toISOString().slice(0, 19);
  const categoryPurpose = transfer.categoryPurpose || 'OTHR';

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
      <Purp><CtgyPurp>${categoryPurpose}</CtgyPurp></Purp>
      <RmtInf><Ustrd>${escapeXml(transfer.purpose || '')}</Ustrd></RmtInf>
    </CdtTrfTxInf>
  </FIToFICstmrCdtTrf>
</Document>`;
}
