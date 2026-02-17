/**
 * Tipos MT Free - Mensagens Livres SWIFT (MT199, MT299, MT999)
 * Uma entidade única via campo mt_type
 */

export type MtFreeType = 'MT199' | 'MT299' | 'MT999';

export type MtFreeMessageStatus =
  | 'Draft'
  | 'Validated'
  | 'Pending Approval'
  | 'Approved'
  | 'Released to SWIFT'
  | 'ACK Received'
  | 'NACK Received'
  | 'Under Investigation'
  | 'Cancelled'
  | 'Completed';

export interface MtFreeSwiftHeader {
  applicationId?: string;
  serviceId?: string;
  senderBic?: string;
  sessionNumber?: string;
  sequenceNumber?: string;
  receiverBic?: string;
  messagePriority?: string;
  deliveryMonitoring?: string;
  obsolescencePeriod?: string;
  uetr?: string;
  chk?: string;
}

export interface MtFreeCompliance {
  sanctionsResult?: string;
  amlRiskScore?: number;
  pepFlag?: boolean;
  countryRisk?: string;
  manualReviewFlag?: boolean;
  complianceStatus?: string;
  complianceOfficerId?: string;
  complianceTimestamp?: string;
}

export interface MtFreeAuditEntry {
  id: number;
  event: string;
  userId?: number;
  userName?: string;
  timestamp: string;
  reason?: string;
  details?: Record<string, unknown>;
}

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
  swiftHeader: MtFreeSwiftHeader;
  compliance?: MtFreeCompliance;
  createdBy: number;
  modifiedBy?: number;
  approvedBy1?: number;
  approvedBy2?: number;
  fourEyesStatus?: string;
  releaseTimestamp?: string;
  swiftAckTimestamp?: string;
  swiftNackCode?: string;
  repairRequiredFlag?: boolean;
  cancellationRequestedFlag?: boolean;
  messageStatus: MtFreeMessageStatus;
  finMessage?: string;
  createdAt: string;
  updatedAt: string;
  auditLog: MtFreeAuditEntry[];
}
