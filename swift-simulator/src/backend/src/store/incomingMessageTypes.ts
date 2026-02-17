/**
 * Tipos para mensagens SWIFT recebidas (Inbox)
 */

export type IngestSource = 'SIMULATED' | 'SWIFT_GATEWAY' | 'FILE' | 'API' | 'OTHER';
export type RawFormat = 'FIN' | 'UNKNOWN';
export type IncomingMessageStatus =
  | 'RECEIVED'
  | 'PARSED'
  | 'PARSE_ERROR'
  | 'REVIEW_REQUIRED'
  | 'ARCHIVED';

export interface IncomingMessageTag {
  tag: string;
  valueLines: string[];
  rawBlock?: string;
}

export interface IncomingMessageExtractedFields {
  ref_20?: string;
  ref_21?: string;
  related_mt?: string;
  value_date?: string;
  currency?: string;
  amount?: number;
}

export interface IncomingMessage {
  id: string;
  receivedAt: string;
  ingestSource: IngestSource;
  direction: 'INCOMING';
  status: IncomingMessageStatus;
  rawPayload: string;
  rawFormat: RawFormat;
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
  createdBy: number | 'system';
  updatedAt: string;
  updatedBy?: number | 'system';
}

export interface IncomingMessageAuditEntry {
  id: number;
  incomingMessageId: string;
  eventType: 'RECEIVED' | 'PARSED' | 'PARSE_ERROR' | 'STATUS_CHANGED' | 'VIEWED' | 'ARCHIVED';
  eventTimestamp: string;
  actorUserId?: number | null;
  detailsJson?: Record<string, unknown>;
}
