/**
 * Serviço de geração de mensagens BAHTNET
 * Conforme demo Payment-Components: https://github.com/Payment-Components/demo-iso20022#bahtnet-messages
 *
 * BAHTNET = Sistema de pagamentos interbancários da Tailândia (THB)
 * Usa BahtnetMessage com BusinessApplicationHeader02 + FIToFICustomerCreditTransfer08
 * BahtnetMsgType.PACS_008 para pacs.008.001.08
 */

import { generatePacs008, type Pacs008Input } from './iso20022Service.js';

export type BahtnetInput = Pacs008Input;

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
 * Mesmo formato usado em CBPR+, obrigatório em mensagens BAHTNET
 */
function generateBusinessApplicationHeader(input: BahtnetInput): string {
  const now = new Date().toISOString().slice(0, 19);
  const bizMsgIdr = `${input.referenceNumber}-BAH`;

  return `<AppHdr xmlns="urn:iso:std:iso:20022:tech:xsd:head.001.001.02">
  <BizMsgIdr>${escapeXml(bizMsgIdr)}</BizMsgIdr>
  <MsgDefIdr>pacs.008.001.08</MsgDefIdr>
  <BizSvc>bahtnet.pacs008</BizSvc>
  <CreDt>${now}</CreDt>
  <Fr>
    <FIId>
      <FinInstnId>
        <BICFI>${escapeXml(input.sourceBic)}</BICFI>
      </FinInstnId>
    </FIId>
  </Fr>
  <To>
    <FIId>
      <FinInstnId>
        <BICFI>${escapeXml(input.destinationBic)}</BICFI>
      </FinInstnId>
    </FIId>
  </To>
</AppHdr>`;
}

/**
 * Gera mensagem BAHTNET completa
 * Estrutura: AppHdr (BusinessApplicationHeader02) + Document (pacs.008)
 * Compatível com BahtnetMessage&lt;BusinessApplicationHeader02, FIToFICustomerCreditTransfer08&gt;
 */
export function generateBahtnetMessage(input: BahtnetInput): string {
  const appHdr = generateBusinessApplicationHeader(input);
  const pacs008 = generatePacs008(input);
  const docContent = pacs008.replace(/<\?xml[^?]*\?>\s*/g, '').trim();

  return `<?xml version="1.0" encoding="UTF-8"?>
<BahtnetMessage xmlns="urn:swift:bahtnet:envelope">
  ${appHdr}
  ${docContent}
</BahtnetMessage>`;
}
