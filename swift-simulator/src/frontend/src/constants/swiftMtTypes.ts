/**
 * Tipos SWIFT MT — Pagamentos, Mensagens, Tesouraria, Trade, Securities
 */

export interface SwiftMtItem {
  code: string;
  label: string;
  fullName: string;
}

export const PAGAMENTOS: SwiftMtItem[] = [
  { code: 'MT101', label: 'MT101', fullName: 'Request for Transfer' },
  { code: 'MT102', label: 'MT102', fullName: 'Multiple Customer Credit Transfer' },
  { code: 'MT102STP', label: 'MT102+', fullName: 'Multiple Customer Credit Transfer (STP)' },
  { code: 'MT103', label: 'MT103', fullName: 'Single Customer Credit Transfer' },
  { code: 'MT103REMIT', label: 'MT103+ (REMIT)', fullName: 'Single Customer Credit Transfer (REMIT)' },
  { code: 'MT103STP', label: 'MT103+ (STP)', fullName: 'Single Customer Credit Transfer (STP)' },
  { code: 'MT104', label: 'MT104', fullName: 'Direct Debit and Request for Debit Transfer' },
  { code: 'MT107', label: 'MT107', fullName: 'General Direct Debit Message' },
  { code: 'MT200', label: 'MT200', fullName: 'Financial Institution Transfer for Own Account' },
  { code: 'MT201', label: 'MT201', fullName: 'Multiple Financial Institution Transfers (Own Account)' },
  { code: 'MT202', label: 'MT202', fullName: 'General Financial Institution Transfer' },
  { code: 'MT203', label: 'MT203', fullName: 'Multiple General Financial Institution Transfer' },
  { code: 'MT204', label: 'MT204', fullName: 'Financial Markets Direct Debit' },
  { code: 'MT205', label: 'MT205', fullName: 'Financial Institution Transfer Execution' },
  { code: 'MT207', label: 'MT207', fullName: 'Request for Financial Institution Transfer' },
];

export const MENSAGENS: SwiftMtItem[] = [
  { code: 'MT105', label: 'MT105', fullName: 'EDIFACT Envelope' },
  { code: 'MT106', label: 'MT106', fullName: 'EDIFACT Envelope' },
  { code: 'MT109', label: 'MT109', fullName: 'Advice of Cheque(s)' },
  { code: 'MT110', label: 'MT110', fullName: 'Advice of Cheque(s)' },
  { code: 'MT111', label: 'MT111', fullName: 'Request for Stop Payment of a Cheque' },
  { code: 'MT112', label: 'MT112', fullName: 'Status of Stop Payment Request' },
  { code: 'MT121', label: 'MT121', fullName: 'Multiple Interbank Funds Transfer' },
  { code: 'MT190', label: 'MT190', fullName: 'Advice of Charges/Interest Adjustments' },
  { code: 'MT191', label: 'MT191', fullName: 'Request for Payment of Charges/Expenses' },
  { code: 'MT192', label: 'MT192', fullName: 'Request for Cancellation' },
  { code: 'MT195', label: 'MT195', fullName: 'Queries' },
  { code: 'MT196', label: 'MT196', fullName: 'Answers' },
  { code: 'MT198', label: 'MT198', fullName: 'Proprietary Message' },
  { code: 'MT199', label: 'MT199', fullName: 'Free Format Message' },
  { code: 'MT206', label: 'MT206', fullName: 'Cheque Truncation Message' },
  { code: 'MT210', label: 'MT210', fullName: 'Notice to Receive' },
  { code: 'MT256', label: 'MT256', fullName: 'Advice of Non-Payment of Cheques' },
  { code: 'MT290', label: 'MT290', fullName: 'Advice of Charges/Interest Adjustments' },
  { code: 'MT291', label: 'MT291', fullName: 'Request for Payment of Charges/Expenses' },
  { code: 'MT292', label: 'MT292', fullName: 'Request for Cancellation' },
  { code: 'MT295', label: 'MT295', fullName: 'Queries' },
  { code: 'MT296', label: 'MT296', fullName: 'Answers' },
  { code: 'MT298', label: 'MT298', fullName: 'Proprietary Message' },
  { code: 'MT299', label: 'MT299', fullName: 'Free Format Message' },
];

export const TESOURARIA_FX: SwiftMtItem[] = [
  { code: 'MT300', label: 'MT300', fullName: 'Foreign Exchange Confirmation' },
  { code: 'MT303', label: 'MT303', fullName: 'Forex/Currency Option Allocation' },
  { code: 'MT304', label: 'MT304', fullName: 'Advice/Instruction of Third Party Deal' },
  { code: 'MT305', label: 'MT305', fullName: 'Currency Option Confirmation' },
  { code: 'MT307', label: 'MT307', fullName: 'Advice/Instruction of Third Party FX Deal' },
  { code: 'MT308', label: 'MT308', fullName: 'Instruction for Gross/Net Settlement of FX Deals' },
  { code: 'MT320', label: 'MT320', fullName: 'Fixed Loan/Deposit Confirmation' },
  { code: 'MT330', label: 'MT330', fullName: 'Call/Notice Loan/Deposit Confirmation' },
  { code: 'MT340', label: 'MT340', fullName: 'FRA Confirmation' },
  { code: 'MT350', label: 'MT350', fullName: 'Advice of Loan/Deposit Interest Payment' },
  { code: 'MT360', label: 'MT360', fullName: 'Interest Rate Derivative Confirmation' },
  { code: 'MT380', label: 'MT380', fullName: 'Foreign Exchange Order' },
  { code: 'MT381', label: 'MT381', fullName: 'Foreign Exchange Order Confirmation' },
  { code: 'MT390', label: 'MT390', fullName: 'Advice of Charges/Interest Adjustments' },
  { code: 'MT395', label: 'MT395', fullName: 'Queries' },
  { code: 'MT396', label: 'MT396', fullName: 'Answers' },
  { code: 'MT398', label: 'MT398', fullName: 'Proprietary Message' },
  { code: 'MT399', label: 'MT399', fullName: 'Free Format Message' },
];

export const TRADE_COLLECTIONS: SwiftMtItem[] = [
  { code: 'MT400', label: 'MT400', fullName: 'Advice of Payment' },
  { code: 'MT405', label: 'MT405', fullName: 'Clean Collection' },
  { code: 'MT410', label: 'MT410', fullName: 'Acknowledgment' },
  { code: 'MT412', label: 'MT412', fullName: 'Advice of Acceptance' },
  { code: 'MT416', label: 'MT416', fullName: 'Advice of Non-Payment/Non-Acceptance' },
  { code: 'MT420', label: 'MT420', fullName: 'Tracer' },
  { code: 'MT430', label: 'MT430', fullName: 'Amendment of Instructions' },
  { code: 'MT450', label: 'MT450', fullName: 'Cash Letter Credit Advice' },
  { code: 'MT455', label: 'MT455', fullName: 'CL Credit Adjustment Advice' },
  { code: 'MT456', label: 'MT456', fullName: 'Advice of Dishonor' },
  { code: 'MT490', label: 'MT490', fullName: 'Advice of Charges/Interest Adjustments' },
  { code: 'MT491', label: 'MT491', fullName: 'Charge/Expense Request' },
  { code: 'MT492', label: 'MT492', fullName: 'Request for Cancellation' },
  { code: 'MT495', label: 'MT495', fullName: 'Queries' },
  { code: 'MT496', label: 'MT496', fullName: 'Answers' },
  { code: 'MT498', label: 'MT498', fullName: 'Proprietary Message' },
  { code: 'MT499', label: 'MT499', fullName: 'Free Format Message' },
];

export const SECURITIES: SwiftMtItem[] = [
  { code: 'MT500', label: 'MT500', fullName: 'Instruction to Register' },
  { code: 'MT501', label: 'MT501', fullName: 'Confirmation of Registration' },
  { code: 'MT502', label: 'MT502', fullName: 'Order to Buy/Sell' },
  { code: 'MT520', label: 'MT520', fullName: 'Request for Statement' },
  { code: 'MT530', label: 'MT530', fullName: 'Securities Statement Message' },
  { code: 'MT540', label: 'MT540', fullName: 'Receive/Deliver – Free' },
  { code: 'MT541', label: 'MT541', fullName: 'Receive/Deliver Against Payment' },
  { code: 'MT542', label: 'MT542', fullName: 'Deliver/Receive Against Payment' },
  { code: 'MT543', label: 'MT543', fullName: 'Notification of Pending Settlement' },
  { code: 'MT544', label: 'MT544', fullName: 'Confirmation of Pending Settlement' },
  { code: 'MT545', label: 'MT545', fullName: 'Deliver/Receive – Free' },
  { code: 'MT546', label: 'MT546', fullName: 'Notification of Receive/Deliver' },
  { code: 'MT547', label: 'MT547', fullName: 'Confirmation Receive/Deliver – Free' },
  { code: 'MT548', label: 'MT548', fullName: 'Settlement Status' },
  { code: 'MT550', label: 'MT550', fullName: 'Status of Pending Transactions' },
  { code: 'MT560', label: 'MT560', fullName: 'Custody Account Report' },
  { code: 'MT564', label: 'MT564', fullName: 'Corporate Action Notification' },
  { code: 'MT599', label: 'MT599', fullName: 'Free Format Message' },
];

export const ALL_MT_TYPES = [
  ...PAGAMENTOS,
  ...MENSAGENS,
  ...TESOURARIA_FX,
  ...TRADE_COLLECTIONS,
  ...SECURITIES,
];

export const getMtByCode = (code: string) => ALL_MT_TYPES.find((m) => m.code === code);

/** Grupos de MTs que compartilham os mesmos campos (Mensagens) */
export const MENSAGENS_GROUPS: { route: string; codes: string[]; label: string; secondary: string }[] = [
  { route: 'MT105', codes: ['MT105', 'MT106'], label: 'MT105 / MT106', secondary: 'EDIFACT Envelope' },
  { route: 'MT109', codes: ['MT109', 'MT110'], label: 'MT109 / MT110', secondary: 'Aviso de Cheque(s)' },
  { route: 'MT190', codes: ['MT190', 'MT290'], label: 'MT190 / MT290', secondary: 'Advice of Charges/Interest' },
  { route: 'MT191', codes: ['MT191', 'MT291'], label: 'MT191 / MT291', secondary: 'Request for Payment of Charges' },
  { route: 'MT192', codes: ['MT192', 'MT292'], label: 'MT192 / MT292', secondary: 'Request for Cancellation' },
  { route: 'MT195', codes: ['MT195', 'MT295'], label: 'MT195 / MT295', secondary: 'Queries' },
  { route: 'MT196', codes: ['MT196', 'MT296'], label: 'MT196 / MT296', secondary: 'Answers' },
  { route: 'MT198', codes: ['MT198', 'MT298'], label: 'MT198 / MT298', secondary: 'Proprietary Message' },
];

/** Grupos de MTs que compartilham os mesmos campos (Tesouraria/FX) */
export const TESOURARIA_GROUPS: { route: string; codes: string[]; label: string; secondary: string }[] = [
  { route: 'MT300', codes: ['MT300', 'MT303', 'MT304', 'MT305', 'MT307', 'MT308', 'MT320', 'MT330', 'MT340', 'MT350', 'MT360', 'MT380', 'MT381', 'MT390'], label: 'MT300 / MT303 / MT304 / MT305 / MT307 / MT308 / MT320 / MT330 / MT340 / MT350 / MT360 / MT380 / MT381 / MT390', secondary: 'FX, Loan, Deposit, Derivatives' },
];

/** Grupos de MTs em Pagamentos (fiTransferFields) */
export const PAGAMENTOS_GROUPS: { route: string; codes: string[]; label: string; secondary: string }[] = [
  { route: 'MT200', codes: ['MT200', 'MT201', 'MT202', 'MT203', 'MT204', 'MT205', 'MT207'], label: 'MT200 / MT201 / MT202 / MT203 / MT204 / MT205 / MT207', secondary: 'Transferências entre Instituições Financeiras' },
];

/** Grupos de MTs em Trade/Collections (fxTradeFields) */
export const TRADE_GROUPS: { route: string; codes: string[]; label: string; secondary: string }[] = [
  { route: 'MT400', codes: ['MT400', 'MT405', 'MT410', 'MT412', 'MT416', 'MT420', 'MT430', 'MT450', 'MT455', 'MT456', 'MT490', 'MT491'], label: 'MT400 / MT405 / MT410 / MT412 / MT416 / MT420 / MT430 / MT450 / MT455 / MT456 / MT490 / MT491', secondary: 'Collections, Advice, Tracer' },
];

/** Grupos de MTs em Securities (fxTradeFields) */
export const SECURITIES_GROUPS: { route: string; codes: string[]; label: string; secondary: string }[] = [
  { route: 'MT500', codes: ['MT500', 'MT501', 'MT502', 'MT520', 'MT530', 'MT540', 'MT541', 'MT542', 'MT543', 'MT544', 'MT545', 'MT546', 'MT547', 'MT548', 'MT550', 'MT560', 'MT564'], label: 'MT500 / MT501 / MT502 / MT520 / MT530 / MT540 / MT541 / MT542 / MT543 / MT544 / MT545 / MT546 / MT547 / MT548 / MT550 / MT560 / MT564', secondary: '' },
];

const ALL_GROUPS = [...MENSAGENS_GROUPS, ...TESOURARIA_GROUPS, ...PAGAMENTOS_GROUPS, ...TRADE_GROUPS, ...SECURITIES_GROUPS];

export const getGroupByRoute = (route: string) => ALL_GROUPS.find((g) => g.route === route);
export const getGroupByCode = (code: string) => ALL_GROUPS.find((g) => g.codes.includes(code));
