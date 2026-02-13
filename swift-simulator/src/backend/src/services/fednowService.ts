/**
 * Serviço de geração de mensagens FedNow
 * Conforme demo Payment-Components: https://github.com/Payment-Components/demo-iso20022#fednow-messages
 *
 * FedNow = Sistema de pagamentos instantâneos do Federal Reserve (EUA)
 * Usa classes que estendem ISO20022: FIToFICustomerCreditTransfer08Fednow
 * Estrutura pacs.008 com regras FedNow (Customer Credit Transfers)
 */

import type { Pacs008Input } from './iso20022Service.js';
import { generatePacs008 } from './iso20022Service.js';

export type FednowInput = Pacs008Input;

/**
 * Gera mensagem pacs.008 FedNow
 * Compatível com FIToFICustomerCreditTransfer08Fednow
 * Estrutura pacs.008.001.08, validada contra schema FedNow
 * Categoria: Customer Credit Transfers
 */
export function generateFednowPacs008(transfer: FednowInput): string {
  return generatePacs008(transfer);
}
