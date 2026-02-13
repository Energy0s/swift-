/**
 * Serviço de geração de mensagens CBPR+ (Cross-Border Payments and Reporting Plus)
 * Conforme demo Payment-Components: https://github.com/Payment-Components/demo-iso20022#cbpr-messages
 *
 * CBPR+ = Business Application Header (head.001.001.02) + Document (pacs.008)
 * Usa CbprMessage com BusinessApplicationHeader02 e FIToFICustomerCreditTransfer08
 */

import { generatePacs008, type Pacs008Input } from './iso20022Service.js';

export interface CbprInput extends Pacs008Input {
  /** BIC do banco remetente (From) - default: sourceBic */
  fromBic?: string;
  /** BIC do banco destinatário (To) - default: destinationBic */
  toBic?: string;
  /** Business Service - default: swift.cbprplus.cov.02 */
  bizSvc?: string;
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
 * Gera Business Application Header (head.001.001.02)
 * BusinessApplicationHeader02 - obrigatório em todas as mensagens CBPR+
 */
function generateBusinessApplicationHeader(input: CbprInput): string {
  const now = new Date().toISOString().slice(0, 19);
  const fromBic = input.fromBic || input.sourceBic;
  const toBic = input.toBic || input.destinationBic;
  const bizSvc = input.bizSvc || 'swift.cbprplus.cov.02';
  const bizMsgIdr = `${input.referenceNumber}-BAH`;

  return `<AppHdr xmlns="urn:iso:std:iso:20022:tech:xsd:head.001.001.02">
  <BizMsgIdr>${escapeXml(bizMsgIdr)}</BizMsgIdr>
  <MsgDefIdr>pacs.008.001.08</MsgDefIdr>
  <BizSvc>${escapeXml(bizSvc)}</BizSvc>
  <CreDt>${now}</CreDt>
  <Fr>
    <FIId>
      <FinInstnId>
        <BICFI>${escapeXml(fromBic)}</BICFI>
      </FinInstnId>
    </FIId>
  </Fr>
  <To>
    <FIId>
      <FinInstnId>
        <BICFI>${escapeXml(toBic)}</BICFI>
      </FinInstnId>
    </FIId>
  </To>
</AppHdr>`;
}

/**
 * Gera mensagem CBPR+ completa
 * Estrutura: AppHdr (BusinessApplicationHeader02) + Document (pacs.008)
 * Compatível com CbprMessage&lt;BusinessApplicationHeader02, FIToFICustomerCreditTransfer08&gt;
 */
export function generateCbprMessage(input: CbprInput): string {
  const appHdr = generateBusinessApplicationHeader(input);
  const pacs008 = generatePacs008(input);
  // Remove declaração XML; o Document do pacs.008 já está completo
  const docContent = pacs008.replace(/<\?xml[^?]*\?>\s*/g, '').trim();

  return `<?xml version="1.0" encoding="UTF-8"?>
<CbprMessage xmlns="urn:swift:cbpr:envelope">
  ${appHdr}
  ${docContent}
</CbprMessage>`;
}
