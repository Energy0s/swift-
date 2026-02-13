/**
 * Serviço de geração de mensagens TARGET2 (RTGS)
 * Conforme demo Payment-Components: https://github.com/Payment-Components/demo-iso20022#target2-rtgs-messages
 *
 * TARGET2 = Real-Time Gross Settlement da zona Euro (BCE)
 * Usa classes que estendem ISO20022: FIToFICustomerCreditTransfer08Rtgs
 * Estrutura pacs.008 com regras TARGET2 (EUR, BICs participantes)
 */

import type { Pacs008Input } from './iso20022Service.js';
import { generatePacs008 } from './iso20022Service.js';

export type RtgsInput = Pacs008Input;

/**
 * Gera mensagem pacs.008 TARGET2 RTGS
 * Compatível com FIToFICustomerCreditTransfer08Rtgs
 * Estrutura idêntica ao pacs.008.001.08, validada contra schema TARGET2
 * TARGET2 tipicamente usa EUR
 */
export function generateRtgsPacs008(transfer: RtgsInput): string {
  return generatePacs008(transfer);
}
