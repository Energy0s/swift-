/**
 * Serviço de recibo técnico SWIFT
 * GET /api/swift/receipts/:mtType/:id
 */

import api from './api';

export type ReceiptMtType = 'mt103' | 'mt_free' | 'mt101' | 'mt109';

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
  networkAck?: string;
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

export function getReceipt(mtType: ReceiptMtType, id: number) {
  return api.get<{ status: string; data: { receipt: SwiftReceiptData } }>(
    `/swift/receipts/${mtType}/${id}`
  );
}
