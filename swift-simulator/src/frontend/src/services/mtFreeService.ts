/**
 * Cliente API MT Free - Mensagens Livres (MT199, MT299, MT999)
 */

import api from './api';

const BASE = '/swift/free';

export type MtFreeType = 'MT199' | 'MT299' | 'MT999';

export interface MtFreeMessage {
  id: number;
  userId: number;
  mtType: MtFreeType;
  messageId: string;
  transactionReferenceNumber: string;
  relatedReference?: string;
  narrativeFreeText: string;
  originalMessageMt?: string;
  originalMessageDate?: string;
  senderToReceiverInfo?: string;
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

export interface MtFreeCreatePayload {
  mtType: MtFreeType;
  receiverBic: string;
  swiftHeader?: Record<string, string>;
  transactionReferenceNumber: string;
  relatedReference?: string;
  narrativeFreeText: string;
  originalMessageMt?: string;
  originalMessageDate?: string;
  senderToReceiverInfo?: string;
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

export const mtFreeApi = {
  create: (payload: MtFreeCreatePayload) => api.post(`${BASE}/messages`, payload),
  list: (filters?: Record<string, unknown>) => api.get(`${BASE}/messages`, { params: filters }),
  get: (id: number) => api.get(`${BASE}/messages/${id}`),
  update: (id: number, payload: MtFreeCreatePayload) => api.put(`${BASE}/messages/${id}`, payload),
  validate: (id: number) => api.post(`${BASE}/messages/${id}/validate`),
  submitApproval: (id: number) => api.post(`${BASE}/messages/${id}/submit-approval`),
  approve: (id: number) => api.post(`${BASE}/messages/${id}/approve`),
  release: (id: number) => api.post(`${BASE}/messages/${id}/release`),
  ack: (id: number) => api.post(`${BASE}/messages/${id}/ack`),
  nack: (id: number, nackCode?: string) => api.post(`${BASE}/messages/${id}/nack`, { nackCode }),
  cancel: (id: number) => api.post(`${BASE}/messages/${id}/cancel`),
  getFin: (id: number) => api.get(`${BASE}/messages/${id}/fin`),
  delete: (id: number) => api.delete(`${BASE}/messages/${id}`),
  deleteByReference: (reference: string) => api.delete(`${BASE}/messages/bulk`, { params: { reference } }),
  attachNetworkReport: (id: number, rawText: string) =>
    api.post(`${BASE}/messages/${id}/network-report`, { raw_text: rawText }),
};
