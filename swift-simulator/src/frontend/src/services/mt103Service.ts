/**
 * Cliente API MT103 - Single Customer Credit Transfer
 */

import api from './api';

const BASE = '/swift/mt103';

export type Mt103Type = 'MT103' | 'MT103REMIT' | 'MT103STP';

export interface Mt103Message {
  id: number;
  userId: number;
  mtType?: Mt103Type;
  messageId: string;
  transactionReferenceNumber: string;
  bankOperationCode: string;
  valueDate: string;
  currency: string;
  interbankSettledAmount: number;
  orderingCustomer: Record<string, string>;
  beneficiaryCustomer: Record<string, string>;
  swiftHeader?: Record<string, string>;
  bankingDetails?: Record<string, string>;
  compliance?: Record<string, unknown>;
  remittanceInformation?: string;
  detailsOfCharges: string;
  senderChargesAmount?: number;
  receiverChargesAmount?: number;
  messageStatus: string;
  compliance?: Record<string, unknown>;
  createdBy: number;
  approvedBy1?: number;
  approvedBy2?: number;
  releaseTimestamp?: string;
  swiftAckTimestamp?: string;
  swiftNackCode?: string;
  repairRequiredFlag?: boolean;
  finMessage?: string;
  createdAt: string;
  updatedAt: string;
  auditLog: Array<{ id: number; event: string; userId?: number; userName?: string; timestamp: string }>;
}

export interface Mt103CreatePayload {
  mtType?: Mt103Type;
  swiftHeader?: Record<string, string>;
  transactionReferenceNumber: string;
  bankOperationCode?: 'CRED' | 'SPAY' | 'SSTD' | 'SPRI';
  valueDate: string;
  currency: string;
  interbankSettledAmount: number;
  orderingCustomer: {
    orderingAccountNumber?: string;
    orderingIban?: string;
    orderingName?: string;
    addressLine1?: string;
    addressLine2?: string;
    country?: string;
  };
  beneficiaryCustomer: {
    beneficiaryAccountNumber?: string;
    beneficiaryIban?: string;
    beneficiaryName?: string;
    addressLine1?: string;
    addressLine2?: string;
    country?: string;
  };
  bankingDetails?: {
    orderingInstitution?: string;
    sendersCorrespondent?: string;
    receiversCorrespondent?: string;
    intermediaryInstitution?: string;
    accountWithInstitution?: string;
  };
  remittanceInformation?: string;
  detailsOfCharges: 'OUR' | 'SHA' | 'BEN';
  senderChargesAmount?: number;
  receiverChargesAmount?: number;
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

export const mt103Api = {
  create: (payload: Mt103CreatePayload) => api.post(`${BASE}/messages`, payload),
  list: (filters?: Record<string, unknown>) => api.get(`${BASE}/messages`, { params: filters }),
  get: (id: number) => api.get(`${BASE}/messages/${id}`),
  update: (id: number, payload: Mt103CreatePayload) => api.put(`${BASE}/messages/${id}`, payload),
  validate: (id: number) => api.post(`${BASE}/messages/${id}/validate`),
  submitApproval: (id: number) => api.post(`${BASE}/messages/${id}/submit-approval`),
  approve: (id: number) => api.post(`${BASE}/messages/${id}/approve`),
  release: (id: number) => api.post(`${BASE}/messages/${id}/release`),
  ack: (id: number) => api.post(`${BASE}/messages/${id}/ack`),
  nack: (id: number, nackCode?: string) => api.post(`${BASE}/messages/${id}/nack`, { nackCode }),
  cancel: (id: number) => api.post(`${BASE}/messages/${id}/cancel`),
  getFin: (id: number) => api.get(`${BASE}/messages/${id}/fin`),
  attachNetworkReport: (id: number, rawText: string) =>
    api.post(`${BASE}/messages/${id}/network-report`, { raw_text: rawText }),
};
