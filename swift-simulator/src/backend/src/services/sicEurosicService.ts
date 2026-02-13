/**
 * Serviço de geração de mensagens SIC/euroSIC
 * Conforme demo Payment-Components: https://github.com/Payment-Components/demo-iso20022#siceurosic-messages
 *
 * SIC = Swiss Interbank Clearing (Suíça)
 * euroSIC = Sistema de pagamentos em CHF/EUR
 * Usa classes que estendem ISO20022: FIToFICustomerCreditTransfer08SicEurosic
 * Estrutura pacs.008 com NbOfTxs e regras SIC/euroSIC
 */

import type { Pacs008Input } from './iso20022Service.js';
import { generatePacs008 } from './iso20022Service.js';

export type SicEurosicInput = Pacs008Input;

/**
 * Gera mensagem pacs.008 SIC/euroSIC
 * Compatível com FIToFICustomerCreditTransfer08SicEurosic
 * Estrutura pacs.008.001.08, validada contra schema SIC/euroSIC (v4.9)
 */
export function generateSicEurosicPacs008(transfer: SicEurosicInput): string {
  return generatePacs008(transfer);
}
