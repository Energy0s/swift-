/**
 * Cliente API SWIFT Inbox - Mensagens recebidas
 */

import api from './api';

const BASE = '/swift/incoming';

export interface IncomingMessageTag {
  tag: string;
  valueLines: string[];
  rawBlock?: string;
}

export interface IncomingMessage {
  id: string;
  receivedAt: string;
  ingestSource: string;
  direction: string;
  status: string;
  rawPayload: string;
  rawFormat: string;
  checksumSha256: string;
  rawSizeBytes: number;
  mtType?: string;
  senderBic?: string;
  receiverBic?: string;
  priority?: string;
  uetr?: string;
  ref20?: string;
  ref21?: string;
  relatedMt?: string;
  valueDate?: string;
  currency?: string;
  amount?: number;
  normalizedText?: string;
  normalizedJson?: IncomingMessageTag[];
  parseErrors?: string[];
  createdBy: number | string;
  updatedAt: string;
  updatedBy?: number | string;
}

export interface IncomingAuditEntry {
  id: number;
  incomingMessageId: string;
  eventType: string;
  eventTimestamp: string;
  actorUserId?: number | null;
  detailsJson?: Record<string, unknown>;
}

export interface IncomingListFilters {
  mt_type?: string;
  status?: string;
  sender_bic?: string;
  receiver_bic?: string;
  ref_20?: string;
  uetr?: string;
  date_from?: string;
  date_to?: string;
  free_text?: string;
  page?: number;
  limit?: number;
  sort?: string;
  sort_order?: 'asc' | 'desc';
}

export const incomingApi = {
  ingest: (payload: {
    raw_payload: string;
    ingest_source?: string;
    received_at?: string;
  }) => api.post(`${BASE}`, payload),

  list: (filters?: IncomingListFilters) =>
    api.get<{ status: string; data: { messages: IncomingMessage[]; pagination: Record<string, number> } }>(
      BASE,
      { params: filters }
    ),

  get: (id: string) =>
    api.get<{
      status: string;
      data: { message: IncomingMessage; auditLog: IncomingAuditEntry[] };
    }>(`${BASE}/${id}`),

  archive: (id: string) => api.post(`${BASE}/${id}/archive`),
  markReviewRequired: (id: string) => api.post(`${BASE}/${id}/mark-review-required`),
  reparse: (id: string) => api.post(`${BASE}/${id}/reparse`),
};
