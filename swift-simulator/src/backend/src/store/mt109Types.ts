/**
 * Tipos MT109 - Advice of Cheque(s)
 * Múltiplos cheques por mensagem (bloco repetível)
 */

export type Mt109Type = 'MT109' | 'MT110';

export type Mt109MessageStatus =
  | 'Draft'
  | 'Validated'
  | 'Pending Approval'
  | 'Approved'
  | 'Released to SWIFT'
  | 'ACK Received'
  | 'NACK Received'
  | 'Under Investigation'
  | 'Cancelled'
  | 'Returned'
  | 'Completed';

export type ChargesType = 'OUR' | 'SHA' | 'BEN';

export interface Mt109SwiftHeader {
  applicationId?: string;
  serviceId?: string;
  logicalTerminal?: string;
  sessionNumber?: string;
  sequenceNumber?: string;
  receiverBic?: string;
  messagePriority?: string;
}

export interface Mt109OrderingCustomer {
  orderingAccountNumber?: string;
  orderingName?: string;
  addressLine1?: string;
  addressLine2?: string;
  country?: string;
}

export interface Mt109Beneficiary {
  beneficiaryAccount?: string;
  beneficiaryName?: string;
  addressLine1?: string;
  addressLine2?: string;
  country?: string;
}

export interface Mt109Cheque {
  id?: number;
  chequeNumber: string;
  chequeAmount: number;
  currency: string;
  chequeIssueDate: string;
  draweeBankName?: string;
  draweeBankBic?: string;
  payeeName?: string;
  payeeAddress?: string;
  placeOfIssue?: string;
  remittanceInformation?: string;
  senderToReceiverInfo?: string;
}

export interface Mt109Compliance {
  sanctionsScreeningResult?: string;
  amlRiskScore?: number;
  pepFlag?: boolean;
  countryRisk?: string;
  manualReviewFlag?: boolean;
  complianceStatus?: string;
  complianceOfficerId?: string;
  complianceTimestamp?: string;
}

export interface Mt109AuditEntry {
  id: number;
  event: string;
  userId?: number;
  userName?: string;
  timestamp: string;
  details?: Record<string, unknown>;
}

export interface Mt109Message {
  id: number;
  userId: number;
  mtType: Mt109Type;
  messageId: string;
  transactionReferenceNumber: string;
  relatedReference?: string;
  dateOfIssue: string;
  orderingInstitution?: string;
  orderingCustomer: Mt109OrderingCustomer;
  beneficiary: Mt109Beneficiary;
  cheques: Mt109Cheque[];
  detailsOfCharges: ChargesType;
  swiftHeader: Mt109SwiftHeader;
  compliance?: Mt109Compliance;
  createdBy: number;
  modifiedBy?: number;
  approvedBy1?: number;
  approvedBy2?: number;
  fourEyesControlStatus?: string;
  releaseTimestamp?: string;
  swiftAckTimestamp?: string;
  swiftNackCode?: string;
  repairRequiredFlag?: boolean;
  cancellationRequestedFlag?: boolean;
  messageStatus: Mt109MessageStatus;
  finMessage?: string;
  createdAt: string;
  updatedAt: string;
  auditLog: Mt109AuditEntry[];
}
