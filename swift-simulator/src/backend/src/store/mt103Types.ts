/**
 * Tipos MT103 - Single Customer Credit Transfer
 * UMA transação por mensagem (sem tabela de transactions repetitivas)
 */

export type Mt103MessageStatus =
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

export type Mt103Type = 'MT103' | 'MT103REMIT' | 'MT103STP';
export type BankOperationCode = 'CRED' | 'SPAY' | 'SSTD' | 'SPRI';
export type ChargesType = 'OUR' | 'SHA' | 'BEN';

export interface Mt103SwiftHeader {
  applicationId?: string;
  serviceId?: string;
  logicalTerminal?: string;
  sessionNumber?: string;
  sequenceNumber?: string;
  receiverBic?: string;
  messagePriority?: string;
  uetr?: string;
  chk?: string;
}

export interface Mt103OrderingCustomer {
  orderingAccountNumber?: string;
  orderingIban?: string;
  orderingName?: string;
  addressLine1?: string;
  addressLine2?: string;
  country?: string;
}

export interface Mt103BeneficiaryCustomer {
  beneficiaryAccountNumber?: string;
  beneficiaryIban?: string;
  beneficiaryName?: string;
  addressLine1?: string;
  addressLine2?: string;
  country?: string;
}

export interface Mt103BankingDetails {
  orderingInstitution?: string;
  sendersCorrespondent?: string;
  receiversCorrespondent?: string;
  intermediaryInstitution?: string;
  accountWithInstitution?: string;
}

export interface Mt103Compliance {
  sanctionsScreeningResult?: string;
  amlRiskScore?: number;
  pepFlag?: boolean;
  countryRisk?: string;
  manualReviewFlag?: boolean;
  complianceStatus?: string;
  complianceOfficerId?: string;
  complianceTimestamp?: string;
}

export interface Mt103AuditEntry {
  id: number;
  event: string;
  userId?: number;
  userName?: string;
  timestamp: string;
  details?: Record<string, unknown>;
}

export interface Mt103Message {
  id: number;
  userId: number;
  mtType: Mt103Type;
  messageId: string;
  transactionReferenceNumber: string;
  bankOperationCode: BankOperationCode;
  valueDate: string;
  currency: string;
  interbankSettledAmount: number;
  orderingCustomer: Mt103OrderingCustomer;
  beneficiaryCustomer: Mt103BeneficiaryCustomer;
  bankingDetails?: Mt103BankingDetails;
  remittanceInformation?: string;
  detailsOfCharges: ChargesType;
  senderChargesAmount?: number;
  receiverChargesAmount?: number;
  swiftHeader: Mt103SwiftHeader;
  compliance?: Mt103Compliance;
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
  messageStatus: Mt103MessageStatus;
  finMessage?: string;
  createdAt: string;
  updatedAt: string;
  auditLog: Mt103AuditEntry[];
}
