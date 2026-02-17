/**
 * Tipos MT101 - Request for Transfer / MT102 - Multiple Customer Credit Transfer
 */

export type Mt101Type = 'MT101' | 'MT102' | 'MT102STP';

export type Mt101MessageStatus =
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

export interface Mt101SwiftHeader {
  applicationId?: string;
  serviceId?: string;
  logicalTerminal?: string;
  sessionNumber?: string;
  sequenceNumber?: string;
  receiverBic?: string;
  messagePriority?: string;
  deliveryMonitoring?: string;
  obsolescencePeriod?: string;
}

export interface Mt101OrderingCustomer {
  orderingAccountNumber?: string;
  orderingIban?: string;
  orderingCustomerName?: string;
  addressLine1?: string;
  addressLine2?: string;
  city?: string;
  postalCode?: string;
  country?: string;
  taxId?: string;
  customerId?: string;
  kycStatus?: string;
  riskClassification?: string;
}

export interface Mt101ExecutionDetails {
  requestedExecutionDate: string;
  instructionCode?: string;
  valueDate?: string;
  executionPriority?: string;
  cutOffTimeValidation?: string;
  holidayCalendarValidation?: string;
}

export interface Mt101Transaction {
  id: number;
  sequenceNumber: number;
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
  beneficiaryBankAddress?: string;
  intermediaryBankBic?: string;
  intermediaryBankName?: string;
  correspondentBankBic?: string;
  remittanceInformation?: string;
  purposeOfPaymentCode?: string;
  regulatoryReportingCode?: string;
  chargesType: ChargesType;
  senderChargesAmount?: number;
  receiverChargesAmount?: number;
  senderToReceiverInformation?: string;
  complianceHoldFlag?: boolean;
  repairFlag?: boolean;
  returnFlag?: boolean;
}

export interface Mt101Compliance {
  sanctionsScreeningResult?: string;
  nameScreeningResult?: string;
  amlRiskScore?: number;
  countryRiskRating?: string;
  pepCheckStatus?: string;
  adverseMediaCheck?: string;
  internalComplianceStatus?: string;
  manualReviewRequired?: boolean;
  complianceOfficerId?: string;
  complianceReleaseTimestamp?: string;
  countryOfOrigin?: string;
  countryOfDestination?: string;
  ultimateDebtor?: string;
  ultimateCreditor?: string;
  regulatoryReportingText?: string;
  taxDeclarationCode?: string;
}

export interface Mt101AuditEntry {
  id: number;
  event: string;
  userId?: number;
  userName?: string;
  timestamp: string;
  details?: Record<string, unknown>;
}

export interface Mt101Message {
  id: number;
  userId: number;
  mtType: Mt101Type;
  messageId: string;
  batchId: string;
  transactionReferenceNumber: string;
  customerSpecifiedReference?: string;
  messageIndex?: number;
  messageTotal?: number;
  messageStatus: Mt101MessageStatus;
  swiftHeader: Mt101SwiftHeader;
  orderingCustomer: Mt101OrderingCustomer;
  executionDetails: Mt101ExecutionDetails;
  transactions: Mt101Transaction[];
  totalCharges?: number;
  chargesCurrency?: string;
  netSettlementAmount?: number;
  compliance?: Mt101Compliance;
  createdBy: number;
  modifiedBy?: number;
  approvedBy1?: number;
  approvedBy2?: number;
  fourEyesControlStatus?: string;
  dualAuthorizationStatus?: string;
  digitalSignatureStatus?: string;
  authenticationResult?: string;
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
  auditLog: Mt101AuditEntry[];
}
