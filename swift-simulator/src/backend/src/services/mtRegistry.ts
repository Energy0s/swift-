/**
 * Registro de geradores SWIFT MT
 * Cada tipo MT tem seu gerador que recebe payload e retorna mensagem raw
 */

import type { SwiftMessageType } from '../store/messagesStore.js';
import {
  formatSwiftAmount,
  formatSwiftDate,
  formatBicBlock,
  formatBic8,
  escapeSwiftText,
  buildSwiftMessage,
} from './mtUtils.js';
import { generateMt103 } from './mt103Service.js';
import { generateMt202 } from './mt202Service.js';

type MtPayload = Record<string, unknown>;

function getRef(p: MtPayload): string {
  return (p.referenceNumber as string) || `REF${Date.now()}`.substring(0, 16);
}

function getBic(p: MtPayload, key: string): string {
  return (p[key] as string) || 'XXXXXXXX';
}

function getAmount(p: MtPayload): number {
  return Number(p.amount) || 0;
}

function getCurrency(p: MtPayload): string {
  return (p.currency as string) || 'EUR';
}

function getDate(p: MtPayload): string {
  return formatSwiftDate((p.valueDate as string) || undefined);
}

// MT101 - Request for Transfer
function genMt101(p: MtPayload): string {
  const ref = getRef(p);
  const lines = [
    `:20:${ref}`,
    `:21:${(p.relatedReference as string) || ref}`.substring(0, 16),
    `:32A:${getDate(p)}${getCurrency(p)}${formatSwiftAmount(getAmount(p))}`,
    `:50K:${escapeSwiftText((p.orderingCustomer as string) || '')}`,
    `:59F:/${(p.beneficiaryIban as string) || ''}`,
    escapeSwiftText((p.beneficiaryName as string) || ''),
  ];
  return buildSwiftMessage('101', getBic(p, 'senderBic'), getBic(p, 'receiverBic'), lines);
}

// MT102 - Multiple Customer Credit Transfer
function genMt102(p: MtPayload): string {
  const ref = getRef(p);
  const lines = [
    `:20:${ref}`,
    `:21:${(p.relatedReference as string) || ref}`.substring(0, 16),
    `:32A:${getDate(p)}${getCurrency(p)}${formatSwiftAmount(getAmount(p))}`,
    `:50K:${escapeSwiftText((p.orderingCustomer as string) || '')}`,
    `:59F:/${(p.beneficiaryIban as string) || ''}`,
    escapeSwiftText((p.beneficiaryName as string) || ''),
  ];
  return buildSwiftMessage('102', getBic(p, 'senderBic'), getBic(p, 'receiverBic'), lines);
}

// MT102+ STP
function genMt102STP(p: MtPayload): string {
  return genMt102(p); // STP = mesmo formato, flags diferentes em produção
}

// MT103 - usa serviço existente
function genMt103(p: MtPayload): string {
  return generateMt103({
    referenceNumber: getRef(p),
    sourceIban: (p.sourceIban as string) || '',
    sourceBic: getBic(p, 'sourceBic'),
    sourceHolderName: (p.sourceHolderName as string) || '',
    destinationIban: (p.destinationIban as string) || '',
    destinationBic: getBic(p, 'destinationBic'),
    destinationHolderName: (p.destinationHolderName as string) || '',
    amount: getAmount(p),
    currency: getCurrency(p),
    purpose: p.purpose as string,
    bankOperationCode: (p.bankOperationCode as 'CRED' | 'SPAY' | 'SSTD' | 'SPRI') || 'CRED',
    detailsOfCharges: (p.detailsOfCharges as 'OUR' | 'BEN' | 'SHA') || 'OUR',
  });
}

// MT103+ REMIT / STP - mesmo que MT103 com header diferente
function genMt103REMIT(p: MtPayload): string {
  return genMt103(p);
}

function genMt103STP(p: MtPayload): string {
  return genMt103(p);
}

// MT104 - Direct Debit
function genMt104(p: MtPayload): string {
  const ref = getRef(p);
  const lines = [
    `:20:${ref}`,
    `:21:${(p.relatedReference as string) || ref}`.substring(0, 16),
    `:32A:${getDate(p)}${getCurrency(p)}${formatSwiftAmount(getAmount(p))}`,
    `:50K:${escapeSwiftText((p.orderingCustomer as string) || '')}`,
    `:59F:/${(p.beneficiaryIban as string) || ''}`,
    escapeSwiftText((p.beneficiaryName as string) || ''),
    `:71A:${(p.detailsOfCharges as string) || 'OUR'}`,
  ];
  return buildSwiftMessage('104', getBic(p, 'senderBic'), getBic(p, 'receiverBic'), lines);
}

// MT105, MT106 - EDIFACT Envelope
function genMt105(p: MtPayload): string {
  const ref = getRef(p);
  const lines = [
    `:20:${ref}`,
    `:23E:${(p.instructionCode as string) || 'EDIF'}`,
    `:70:${escapeSwiftText((p.narrative as string) || 'EDIFACT Envelope')}`,
  ];
  return buildSwiftMessage('105', getBic(p, 'senderBic'), getBic(p, 'receiverBic'), lines);
}

function genMt106(p: MtPayload): string {
  return genMt105(p);
}

// MT107 - General Direct Debit
function genMt107(p: MtPayload): string {
  const ref = getRef(p);
  const lines = [
    `:20:${ref}`,
    `:21:${(p.relatedReference as string) || ref}`.substring(0, 16),
    `:32A:${getDate(p)}${getCurrency(p)}${formatSwiftAmount(getAmount(p))}`,
    `:50K:${escapeSwiftText((p.orderingCustomer as string) || '')}`,
    `:59F:/${(p.beneficiaryIban as string) || ''}`,
    escapeSwiftText((p.beneficiaryName as string) || ''),
  ];
  return buildSwiftMessage('107', getBic(p, 'senderBic'), getBic(p, 'receiverBic'), lines);
}

// MT110 - Advice of Cheque(s)
function genMt110(p: MtPayload): string {
  const ref = getRef(p);
  const lines = [
    `:20:${ref}`,
    `:21:${(p.relatedReference as string) || ref}`.substring(0, 16),
    `:32A:${getDate(p)}${getCurrency(p)}${formatSwiftAmount(getAmount(p))}`,
    `:50K:${escapeSwiftText((p.orderingCustomer as string) || '')}`,
    `:59F:/${(p.beneficiaryIban as string) || ''}`,
    escapeSwiftText((p.beneficiaryName as string) || ''),
    `:70:${escapeSwiftText((p.chequeInfo as string) || 'Advice of Cheque')}`,
  ];
  return buildSwiftMessage('110', getBic(p, 'senderBic'), getBic(p, 'receiverBic'), lines);
}

// MT111 - Request for Stop Payment
function genMt111(p: MtPayload): string {
  const ref = getRef(p);
  const lines = [
    `:20:${ref}`,
    `:21:${(p.relatedReference as string) || ref}`.substring(0, 16),
    `:32A:${getDate(p)}${getCurrency(p)}${formatSwiftAmount(getAmount(p))}`,
    `:50K:${escapeSwiftText((p.orderingCustomer as string) || '')}`,
    `:59F:/${(p.beneficiaryIban as string) || ''}`,
    escapeSwiftText((p.beneficiaryName as string) || ''),
    `:70:${escapeSwiftText((p.stopPaymentReason as string) || 'Request for Stop Payment')}`,
  ];
  return buildSwiftMessage('111', getBic(p, 'senderBic'), getBic(p, 'receiverBic'), lines);
}

// MT112 - Status of Stop Payment Request
function genMt112(p: MtPayload): string {
  const ref = getRef(p);
  const lines = [
    `:20:${ref}`,
    `:21:${(p.relatedReference as string) || ref}`.substring(0, 16),
    `:79:${escapeSwiftText((p.statusNarrative as string) || 'Status of Stop Payment Request')}`,
  ];
  return buildSwiftMessage('112', getBic(p, 'senderBic'), getBic(p, 'receiverBic'), lines);
}

// MT121 - Multiple Interbank Funds Transfer
function genMt121(p: MtPayload): string {
  const ref = getRef(p);
  const lines = [
    `:20:${ref}`,
    `:21:${(p.relatedReference as string) || ref}`.substring(0, 16),
    `:32A:${getDate(p)}${getCurrency(p)}${formatSwiftAmount(getAmount(p))}`,
    `:52A:${formatBic8(getBic(p, 'orderingBic'))}`,
    `:58A:${formatBic8(getBic(p, 'beneficiaryBic'))}`,
  ];
  return buildSwiftMessage('121', getBic(p, 'senderBic'), getBic(p, 'receiverBic'), lines);
}

// MT190, MT191, MT192, MT195, MT196, MT198, MT199 - Advice/Queries/Free format
function genMt190(p: MtPayload): string {
  const ref = getRef(p);
  const lines = [
    `:20:${ref}`,
    `:70:${escapeSwiftText((p.narrative as string) || 'Advice of Charges/Interest Adjustments')}`,
  ];
  return buildSwiftMessage('190', getBic(p, 'senderBic'), getBic(p, 'receiverBic'), lines);
}

function genMt191(p: MtPayload): string {
  const ref = getRef(p);
  const lines = [
    `:20:${ref}`,
    `:70:${escapeSwiftText((p.narrative as string) || 'Request for Payment of Charges/Expenses')}`,
  ];
  return buildSwiftMessage('191', getBic(p, 'senderBic'), getBic(p, 'receiverBic'), lines);
}

function genMt192(p: MtPayload): string {
  const ref = getRef(p);
  const lines = [
    `:20:${ref}`,
    `:21:${(p.relatedReference as string) || ref}`.substring(0, 16),
    `:79:${escapeSwiftText((p.cancellationReason as string) || 'Request for Cancellation')}`,
  ];
  return buildSwiftMessage('192', getBic(p, 'senderBic'), getBic(p, 'receiverBic'), lines);
}

function genMt195(p: MtPayload): string {
  const ref = getRef(p);
  const lines = [
    `:20:${ref}`,
    `:79:${escapeSwiftText((p.queryText as string) || 'Query')}`,
  ];
  return buildSwiftMessage('195', getBic(p, 'senderBic'), getBic(p, 'receiverBic'), lines);
}

function genMt196(p: MtPayload): string {
  const ref = getRef(p);
  const lines = [
    `:20:${ref}`,
    `:21:${(p.relatedReference as string) || ref}`.substring(0, 16),
    `:79:${escapeSwiftText((p.answerText as string) || 'Answer')}`,
  ];
  return buildSwiftMessage('196', getBic(p, 'senderBic'), getBic(p, 'receiverBic'), lines);
}

function genMt198(p: MtPayload): string {
  const ref = getRef(p);
  const lines = [
    `:20:${ref}`,
    `:79:${escapeSwiftText((p.proprietaryContent as string) || 'Proprietary Message')}`,
  ];
  return buildSwiftMessage('198', getBic(p, 'senderBic'), getBic(p, 'receiverBic'), lines);
}

function genMt199(p: MtPayload): string {
  const ref = getRef(p);
  const lines = [
    `:20:${ref}`,
    `:79:${escapeSwiftText((p.freeFormatText as string) || 'Free Format Message')}`,
  ];
  return buildSwiftMessage('199', getBic(p, 'senderBic'), getBic(p, 'receiverBic'), lines);
}

// MT200 - FI Transfer Own Account
function genMt200(p: MtPayload): string {
  const ref = getRef(p);
  const lines = [
    `:20:${ref}`,
    `:21:${(p.relatedReference as string) || ref}`.substring(0, 16),
    `:32A:${getDate(p)}${getCurrency(p)}${formatSwiftAmount(getAmount(p))}`,
    `:52A:${formatBic8(getBic(p, 'orderingBic'))}`,
    `:58A:${formatBic8(getBic(p, 'beneficiaryBic'))}`,
  ];
  return buildSwiftMessage('200', getBic(p, 'senderBic'), getBic(p, 'receiverBic'), lines);
}

// MT201 - Multiple FI Transfers Own Account
function genMt201(p: MtPayload): string {
  return genMt200(p);
}

// MT202 - usa serviço existente
function genMt202(p: MtPayload): string {
  return generateMt202({
    referenceNumber: getRef(p),
    relatedReference: p.relatedReference as string,
    orderingBic: getBic(p, 'orderingBic'),
    beneficiaryBic: getBic(p, 'beneficiaryBic'),
    amount: getAmount(p),
    currency: getCurrency(p),
    valueDate: p.valueDate as string,
    senderToReceiverInfo: p.senderToReceiverInfo as string,
  });
}

// MT203
function genMt203(p: MtPayload): string {
  return genMt202(p);
}

// MT204, MT205, MT206, MT207
function genMt204(p: MtPayload): string {
  const ref = getRef(p);
  const lines = [
    `:20:${ref}`,
    `:32A:${getDate(p)}${getCurrency(p)}${formatSwiftAmount(getAmount(p))}`,
    `:52A:${formatBic8(getBic(p, 'orderingBic'))}`,
    `:58A:${formatBic8(getBic(p, 'beneficiaryBic'))}`,
  ];
  return buildSwiftMessage('204', getBic(p, 'senderBic'), getBic(p, 'receiverBic'), lines);
}

function genMt205(p: MtPayload): string {
  return genMt204(p);
}

function genMt206(p: MtPayload): string {
  const ref = getRef(p);
  const lines = [
    `:20:${ref}`,
    `:21:${(p.relatedReference as string) || ref}`.substring(0, 16),
    `:79:${escapeSwiftText((p.chequeTruncationInfo as string) || 'Cheque Truncation Message')}`,
  ];
  return buildSwiftMessage('206', getBic(p, 'senderBic'), getBic(p, 'receiverBic'), lines);
}

function genMt207(p: MtPayload): string {
  const ref = getRef(p);
  const lines = [
    `:20:${ref}`,
    `:21:${(p.relatedReference as string) || ref}`.substring(0, 16),
    `:32A:${getDate(p)}${getCurrency(p)}${formatSwiftAmount(getAmount(p))}`,
    `:52A:${formatBic8(getBic(p, 'orderingBic'))}`,
    `:58A:${formatBic8(getBic(p, 'beneficiaryBic'))}`,
  ];
  return buildSwiftMessage('207', getBic(p, 'senderBic'), getBic(p, 'receiverBic'), lines);
}

// MT210 - Notice to Receive
function genMt210(p: MtPayload): string {
  const ref = getRef(p);
  const lines = [
    `:20:${ref}`,
    `:21:${(p.relatedReference as string) || ref}`.substring(0, 16),
    `:32A:${getDate(p)}${getCurrency(p)}${formatSwiftAmount(getAmount(p))}`,
    `:79:${escapeSwiftText((p.noticeText as string) || 'Notice to Receive')}`,
  ];
  return buildSwiftMessage('210', getBic(p, 'senderBic'), getBic(p, 'receiverBic'), lines);
}

// MT256 - Advice of Non-Payment of Cheques
function genMt256(p: MtPayload): string {
  const ref = getRef(p);
  const lines = [
    `:20:${ref}`,
    `:21:${(p.relatedReference as string) || ref}`.substring(0, 16),
    `:79:${escapeSwiftText((p.nonPaymentReason as string) || 'Advice of Non-Payment of Cheques')}`,
  ];
  return buildSwiftMessage('256', getBic(p, 'senderBic'), getBic(p, 'receiverBic'), lines);
}

// MT290, MT291, MT292, MT295, MT296, MT298, MT299 - Category 2 versions
function genMt290(p: MtPayload): string {
  return genMt190(p);
}

function genMt291(p: MtPayload): string {
  return genMt191(p);
}

function genMt292(p: MtPayload): string {
  return genMt192(p);
}

function genMt295(p: MtPayload): string {
  return genMt195(p);
}

function genMt296(p: MtPayload): string {
  return genMt196(p);
}

function genMt298(p: MtPayload): string {
  return genMt198(p);
}

function genMt299(p: MtPayload): string {
  return genMt199(p);
}

// Generic generator for MT3xx/4xx/5xx narrative types
function genMtNarrative(mtNum: string, defaultNarrative: string, p: MtPayload): string {
  const ref = getRef(p);
  const lines = [
    `:20:${ref}`,
    `:21:${((p.relatedReference as string) || ref).substring(0, 16)}`,
    `:32A:${getDate(p)}${getCurrency(p)}${formatSwiftAmount(getAmount(p))}`,
    `:79:${escapeSwiftText((p.narrative as string) || (p.freeFormatText as string) || defaultNarrative)}`,
  ];
  return buildSwiftMessage(mtNum, getBic(p, 'senderBic'), getBic(p, 'receiverBic'), lines);
}

// MT300-MT399 - Tesouraria/FX
function genMt300(p: MtPayload): string {
  return genMtNarrative('300', 'Foreign Exchange Confirmation', p);
}
function genMt303(p: MtPayload): string { return genMtNarrative('303', 'Forex/Currency Option Allocation', p); }
function genMt304(p: MtPayload): string { return genMtNarrative('304', 'Advice/Instruction of Third Party Deal', p); }
function genMt305(p: MtPayload): string { return genMtNarrative('305', 'Currency Option Confirmation', p); }
function genMt307(p: MtPayload): string { return genMtNarrative('307', 'Advice/Instruction of Third Party FX Deal', p); }
function genMt308(p: MtPayload): string { return genMtNarrative('308', 'Instruction for Gross/Net Settlement of FX Deals', p); }
function genMt320(p: MtPayload): string { return genMtNarrative('320', 'Fixed Loan/Deposit Confirmation', p); }
function genMt330(p: MtPayload): string { return genMtNarrative('330', 'Call/Notice Loan/Deposit Confirmation', p); }
function genMt340(p: MtPayload): string { return genMtNarrative('340', 'FRA Confirmation', p); }
function genMt350(p: MtPayload): string { return genMtNarrative('350', 'Advice of Loan/Deposit Interest Payment', p); }
function genMt360(p: MtPayload): string { return genMtNarrative('360', 'Interest Rate Derivative Confirmation', p); }
function genMt380(p: MtPayload): string { return genMtNarrative('380', 'Foreign Exchange Order', p); }
function genMt381(p: MtPayload): string { return genMtNarrative('381', 'Foreign Exchange Order Confirmation', p); }
function genMt390(p: MtPayload): string { return genMtNarrative('390', 'Advice of Charges/Interest Adjustments', p); }
function genMt395(p: MtPayload): string {
  const ref = getRef(p);
  const lines = [`:20:${ref}`, `:79:${escapeSwiftText((p.queryText as string) || 'Query')}`];
  return buildSwiftMessage('395', getBic(p, 'senderBic'), getBic(p, 'receiverBic'), lines);
}
function genMt396(p: MtPayload): string {
  const ref = getRef(p);
  const lines = [`:20:${ref}`, `:21:${((p.relatedReference as string) || ref).substring(0, 16)}`, `:79:${escapeSwiftText((p.answerText as string) || 'Answer')}`];
  return buildSwiftMessage('396', getBic(p, 'senderBic'), getBic(p, 'receiverBic'), lines);
}
function genMt398(p: MtPayload): string {
  const ref = getRef(p);
  const lines = [`:20:${ref}`, `:79:${escapeSwiftText((p.proprietaryContent as string) || 'Proprietary Message')}`];
  return buildSwiftMessage('398', getBic(p, 'senderBic'), getBic(p, 'receiverBic'), lines);
}
function genMt399(p: MtPayload): string {
  const ref = getRef(p);
  const lines = [`:20:${ref}`, `:79:${escapeSwiftText((p.freeFormatText as string) || 'Free Format Message')}`];
  return buildSwiftMessage('399', getBic(p, 'senderBic'), getBic(p, 'receiverBic'), lines);
}

// MT400-MT499 - Trade/Collections
function genMt400(p: MtPayload): string { return genMtNarrative('400', 'Advice of Payment', p); }
function genMt405(p: MtPayload): string { return genMtNarrative('405', 'Clean Collection', p); }
function genMt410(p: MtPayload): string { return genMtNarrative('410', 'Acknowledgment', p); }
function genMt412(p: MtPayload): string { return genMtNarrative('412', 'Advice of Acceptance', p); }
function genMt416(p: MtPayload): string { return genMtNarrative('416', 'Advice of Non-Payment/Non-Acceptance', p); }
function genMt420(p: MtPayload): string { return genMtNarrative('420', 'Tracer', p); }
function genMt430(p: MtPayload): string { return genMtNarrative('430', 'Amendment of Instructions', p); }
function genMt450(p: MtPayload): string { return genMtNarrative('450', 'Cash Letter Credit Advice', p); }
function genMt455(p: MtPayload): string { return genMtNarrative('455', 'CL Credit Adjustment Advice', p); }
function genMt456(p: MtPayload): string { return genMtNarrative('456', 'Advice of Dishonor', p); }
function genMt490(p: MtPayload): string { return genMtNarrative('490', 'Advice of Charges/Interest Adjustments', p); }
function genMt491(p: MtPayload): string { return genMtNarrative('491', 'Charge/Expense Request', p); }
function genMt492(p: MtPayload): string {
  const ref = getRef(p);
  const lines = [`:20:${ref}`, `:21:${((p.relatedReference as string) || ref).substring(0, 16)}`, `:79:${escapeSwiftText((p.cancellationReason as string) || 'Request for Cancellation')}`];
  return buildSwiftMessage('492', getBic(p, 'senderBic'), getBic(p, 'receiverBic'), lines);
}
function genMt495(p: MtPayload): string {
  const ref = getRef(p);
  const lines = [`:20:${ref}`, `:79:${escapeSwiftText((p.queryText as string) || 'Query')}`];
  return buildSwiftMessage('495', getBic(p, 'senderBic'), getBic(p, 'receiverBic'), lines);
}
function genMt496(p: MtPayload): string {
  const ref = getRef(p);
  const lines = [`:20:${ref}`, `:21:${((p.relatedReference as string) || ref).substring(0, 16)}`, `:79:${escapeSwiftText((p.answerText as string) || 'Answer')}`];
  return buildSwiftMessage('496', getBic(p, 'senderBic'), getBic(p, 'receiverBic'), lines);
}
function genMt498(p: MtPayload): string {
  const ref = getRef(p);
  const lines = [`:20:${ref}`, `:79:${escapeSwiftText((p.proprietaryContent as string) || 'Proprietary Message')}`];
  return buildSwiftMessage('498', getBic(p, 'senderBic'), getBic(p, 'receiverBic'), lines);
}
function genMt499(p: MtPayload): string {
  const ref = getRef(p);
  const lines = [`:20:${ref}`, `:79:${escapeSwiftText((p.freeFormatText as string) || 'Free Format Message')}`];
  return buildSwiftMessage('499', getBic(p, 'senderBic'), getBic(p, 'receiverBic'), lines);
}

// MT500-MT599 - Securities
function genMt500(p: MtPayload): string { return genMtNarrative('500', 'Instruction to Register', p); }
function genMt501(p: MtPayload): string { return genMtNarrative('501', 'Confirmation of Registration', p); }
function genMt502(p: MtPayload): string { return genMtNarrative('502', 'Order to Buy/Sell', p); }
function genMt520(p: MtPayload): string { return genMtNarrative('520', 'Request for Statement', p); }
function genMt530(p: MtPayload): string { return genMtNarrative('530', 'Securities Statement Message', p); }
function genMt540(p: MtPayload): string { return genMtNarrative('540', 'Receive/Deliver – Free', p); }
function genMt541(p: MtPayload): string { return genMtNarrative('541', 'Receive/Deliver Against Payment', p); }
function genMt542(p: MtPayload): string { return genMtNarrative('542', 'Deliver/Receive Against Payment', p); }
function genMt543(p: MtPayload): string { return genMtNarrative('543', 'Notification of Pending Settlement', p); }
function genMt544(p: MtPayload): string { return genMtNarrative('544', 'Confirmation of Pending Settlement', p); }
function genMt545(p: MtPayload): string { return genMtNarrative('545', 'Deliver/Receive – Free', p); }
function genMt546(p: MtPayload): string { return genMtNarrative('546', 'Notification of Receive/Deliver', p); }
function genMt547(p: MtPayload): string { return genMtNarrative('547', 'Confirmation Receive/Deliver – Free', p); }
function genMt548(p: MtPayload): string { return genMtNarrative('548', 'Settlement Status', p); }
function genMt550(p: MtPayload): string { return genMtNarrative('550', 'Status of Pending Transactions', p); }
function genMt560(p: MtPayload): string { return genMtNarrative('560', 'Custody Account Report', p); }
function genMt564(p: MtPayload): string { return genMtNarrative('564', 'Corporate Action Notification', p); }
function genMt599(p: MtPayload): string {
  const ref = getRef(p);
  const lines = [`:20:${ref}`, `:79:${escapeSwiftText((p.freeFormatText as string) || 'Free Format Message')}`];
  return buildSwiftMessage('599', getBic(p, 'senderBic'), getBic(p, 'receiverBic'), lines);
}

const mtCodeToNumber: Record<string, string> = {
  MT101: '101', MT102: '102', MT102STP: '102', MT103: '103', MT103REMIT: '103', MT103STP: '103',
  MT104: '104', MT105: '105', MT106: '106', MT107: '107', MT110: '110', MT111: '111', MT112: '112',
  MT121: '121', MT190: '190', MT191: '191', MT192: '192', MT195: '195', MT196: '196', MT198: '198', MT199: '199',
  MT200: '200', MT201: '201', MT202: '202', MT203: '203', MT204: '204', MT205: '205', MT206: '206', MT207: '207',
  MT210: '210', MT256: '256', MT290: '290', MT291: '291', MT292: '292', MT295: '295', MT296: '296', MT298: '298', MT299: '299',
};

const generators: Record<SwiftMessageType, (p: MtPayload) => string> = {
  MT101: genMt101, MT102: genMt102, MT102STP: genMt102STP, MT103: genMt103, MT103REMIT: genMt103REMIT, MT103STP: genMt103STP,
  MT104: genMt104, MT105: genMt105, MT106: genMt106, MT107: genMt107,
  MT110: genMt110, MT111: genMt111, MT112: genMt112, MT121: genMt121,
  MT190: genMt190, MT191: genMt191, MT192: genMt192, MT195: genMt195, MT196: genMt196, MT198: genMt198, MT199: genMt199,
  MT200: genMt200, MT201: genMt201, MT202: genMt202, MT203: genMt203, MT204: genMt204, MT205: genMt205, MT206: genMt206, MT207: genMt207,
  MT210: genMt210, MT256: genMt256,
  MT290: genMt290, MT291: genMt291, MT292: genMt292, MT295: genMt295, MT296: genMt296, MT298: genMt298, MT299: genMt299,
  MT300: genMt300, MT303: genMt303, MT304: genMt304, MT305: genMt305, MT307: genMt307, MT308: genMt308,
  MT320: genMt320, MT330: genMt330, MT340: genMt340, MT350: genMt350, MT360: genMt360, MT380: genMt380, MT381: genMt381,
  MT390: genMt390, MT395: genMt395, MT396: genMt396, MT398: genMt398, MT399: genMt399,
  MT400: genMt400, MT405: genMt405, MT410: genMt410, MT412: genMt412, MT416: genMt416, MT420: genMt420, MT430: genMt430,
  MT450: genMt450, MT455: genMt455, MT456: genMt456,
  MT490: genMt490, MT491: genMt491, MT492: genMt492, MT495: genMt495, MT496: genMt496, MT498: genMt498, MT499: genMt499,
  MT500: genMt500, MT501: genMt501, MT502: genMt502, MT520: genMt520, MT530: genMt530,
  MT540: genMt540, MT541: genMt541, MT542: genMt542, MT543: genMt543, MT544: genMt544, MT545: genMt545, MT546: genMt546, MT547: genMt547, MT548: genMt548,
  MT550: genMt550, MT560: genMt560, MT564: genMt564, MT599: genMt599,
};

export function generateMtMessage(messageType: SwiftMessageType, payload: MtPayload): string {
  const gen = generators[messageType];
  if (!gen) {
    throw new Error(`Tipo MT não suportado: ${messageType}`);
  }
  return gen(payload);
}
