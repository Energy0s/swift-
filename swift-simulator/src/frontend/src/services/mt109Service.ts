/**
 * Cliente API MT109 - Advice of Cheque(s)
 */

import api from './api';

const BASE = '/swift/mt109';

export interface Mt109Cheque {
  id?: number;
  chequeNumber: string;
  chequeAmount: number;
  currency: string;
  chequeIssueDate?: string;
  draweeBankName?: string;
  draweeBankBic?: string;
  payeeName?: string;
  payeeAddress?: string;
  placeOfIssue?: string;
  remittanceInformation?: string;
  senderToReceiverInfo?: string;
}

export type Mt109Type = 'MT109' | 'MT110';

export interface Mt109Message {
  id: number;
  userId: number;
  mtType?: Mt109Type;
  messageId: string;
  transactionReferenceNumber: string;
  relatedReference?: string;
  dateOfIssue: string;
  orderingInstitution?: string;
  orderingCustomer: Record<string, string>;
  beneficiary: Record<string, string>;
  cheques: Mt109Cheque[];
  detailsOfCharges: string;
  swiftHeader?: Record<string, string>;
  compliance?: Record<string, unknown>;
  createdBy: number;
  approvedBy1?: number;
  approvedBy2?: number;
  releaseTimestamp?: string;
  swiftAckTimestamp?: string;
  swiftNackCode?: string;
  repairRequiredFlag?: boolean;
  messageStatus: string;
  finMessage?: string;
  createdAt: string;
  updatedAt: string;
  auditLog: Array<{ id: number; event: string; userId?: number; userName?: string; timestamp: string }>;
}

export interface Mt109CreatePayload {
  mtType?: Mt109Type;
  swiftHeader?: Record<string, string>;
  transactionReferenceNumber: string;
  relatedReference?: string;
  dateOfIssue: string;
  orderingInstitution?: string;
  orderingCustomer: {
    orderingAccountNumber?: string;
    orderingName?: string;
    addressLine1?: string;
    addressLine2?: string;
    country?: string;
  };
  beneficiary: {
    beneficiaryAccount?: string;
    beneficiaryName?: string;
    addressLine1?: string;
    addressLine2?: string;
    country?: string;
  };
  cheques: Mt109Cheque[];
  detailsOfCharges: 'OUR' | 'SHA' | 'BEN';
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

export const mt109Api = {
  create: (payload: Mt109CreatePayload) => api.post(`${BASE}/messages`, payload),
  list: (filters?: Record<string, unknown>) => api.get(`${BASE}/messages`, { params: filters }),
  get: (id: number) => api.get(`${BASE}/messages/${id}`),
  update: (id: number, payload: Mt109CreatePayload) => api.put(`${BASE}/messages/${id}`, payload),
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
