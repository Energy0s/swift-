/**
 * Cliente API MT101 - Request for Transfer
 */

import api from './api';

const BASE = '/swift/mt101';

export interface Mt101Transaction {
  id: number;
  sequenceNumber: number;
  currency: string;
  amount: number;
  exchangeRate?: number;
  settlementAmount?: number;
  beneficiaryAccountNumber?: string;
  beneficiaryIban?: string;
  beneficiaryName?: string;
  beneficiaryBankBic?: string;
  chargesType: string;
  senderChargesAmount?: number;
  receiverChargesAmount?: number;
  remittanceInformation?: string;
}

export type Mt101Type = 'MT101' | 'MT102' | 'MT102STP';

export interface Mt101Message {
  id: number;
  userId: number;
  mtType?: Mt101Type;
  messageId: string;
  batchId: string;
  transactionReferenceNumber: string;
  customerSpecifiedReference?: string;
  messageIndex?: number;
  messageTotal?: number;
  messageStatus: string;
  swiftHeader: Record<string, string>;
  orderingCustomer: Record<string, string>;
  executionDetails: { requestedExecutionDate: string; [k: string]: unknown };
  transactions: Mt101Transaction[];
  totalCharges?: number;
  chargesCurrency?: string;
  netSettlementAmount?: number;
  compliance?: Record<string, unknown>;
  createdBy: number;
  modifiedBy?: number;
  approvedBy1?: number;
  approvedBy2?: number;
  releaseTimestamp?: string;
  swiftAckReceivedTimestamp?: string;
  swiftNackCode?: string;
  repairRequiredFlag?: boolean;
  cancellationRequestedFlag?: boolean;
  uetr?: string;
  internalCoreReference?: string;
  auditTrailReference?: string;
  cutOffComplianceStatus?: string;
  processingTime?: string;
  finMessage?: string;
  createdAt: string;
  updatedAt: string;
  auditLog: Array<{
    id: number;
    event: string;
    userId?: number;
    userName?: string;
    timestamp: string;
    details?: Record<string, unknown>;
  }>;
}

export interface Mt101CreatePayload {
  mtType?: Mt101Type;
  swiftHeader?: Record<string, string>;
  transactionReferenceNumber: string;
  customerSpecifiedReference?: string;
  messageIndex?: number;
  messageTotal?: number;
  orderingCustomer?: Record<string, string>;
  executionDetails: {
    requestedExecutionDate: string;
    instructionCode?: string;
    valueDate?: string;
    [k: string]: unknown;
  };
  transactions: Array<{
    currency: string;
    amount: number;
    exchangeRate?: number;
    settlementAmount?: number;
    accountWithInstitution?: string;
    beneficiaryAccountNumber?: string;
    beneficiaryIban?: string;
    beneficiaryName?: string;
    beneficiaryAddressLine1?: string;
    beneficiaryAddressLine2?: string;
    beneficiaryCity?: string;
    beneficiaryCountry?: string;
    beneficiaryBankName?: string;
    beneficiaryBankBic?: string;
    intermediaryBankBic?: string;
    intermediaryBankName?: string;
    correspondentBankBic?: string;
    remittanceInformation?: string;
    purposeOfPaymentCode?: string;
    regulatoryReportingCode?: string;
    chargesType: 'OUR' | 'SHA' | 'BEN';
    senderChargesAmount?: number;
    receiverChargesAmount?: number;
    senderToReceiverInformation?: string;
  }>;
  compliance?: Record<string, unknown>;
}

export interface Mt101ListFilters {
  mtType?: string;
  status?: string;
  dateFrom?: string;
  dateTo?: string;
  reference?: string;
  debtorName?: string;
  beneficiaryName?: string;
  currency?: string;
  amountMin?: number;
  amountMax?: number;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface AutoFields {
  sender_lt: string;
  application_id: string;
  session_number: string;
  sequence_number: string;
  uetr: string;
  mur_108: string | null;
  stp_119: string | null;
}

export interface NetworkReport {
  chk: string | null;
  tracking: string | null;
  pki_signature: string | null;
  access_code: string | null;
  release_code: string | null;
  category: string | null;
  creation_time: string | null;
  application: string | null;
  operator: string | null;
  raw_text: string | null;
}

export const mt101Api = {
  create: (payload: Mt101CreatePayload) =>
    api.post(`${BASE}/messages`, payload),

  list: (filters?: Mt101ListFilters) =>
    api.get(`${BASE}/messages`, { params: filters }),

  get: (id: number) =>
    api.get(`${BASE}/messages/${id}`),

  update: (id: number, payload: Mt101CreatePayload) =>
    api.put(`${BASE}/messages/${id}`, payload),

  validate: (id: number) =>
    api.post(`${BASE}/messages/${id}/validate`),

  submitApproval: (id: number) =>
    api.post(`${BASE}/messages/${id}/submit-approval`),

  approve: (id: number) =>
    api.post(`${BASE}/messages/${id}/approve`),

  release: (id: number) =>
    api.post(`${BASE}/messages/${id}/release`),

  ack: (id: number) =>
    api.post(`${BASE}/messages/${id}/ack`),

  nack: (id: number, nackCode?: string) =>
    api.post(`${BASE}/messages/${id}/nack`, { nackCode }),

  cancel: (id: number) =>
    api.post(`${BASE}/messages/${id}/cancel`),

  getFin: (id: number) =>
    api.get(`${BASE}/messages/${id}/fin`),

  attachNetworkReport: (id: number, rawText: string) =>
    api.post(`${BASE}/messages/${id}/network-report`, { raw_text: rawText }),
};
