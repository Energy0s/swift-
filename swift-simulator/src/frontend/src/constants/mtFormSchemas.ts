/**
 * Schemas de formulário por tipo MT
 * Cada campo mapeia para o payload enviado ao backend
 */

export type FieldType = 'text' | 'number' | 'select' | 'textarea' | 'bic' | 'iban';

export interface FormField {
  key: string;
  label: string;
  type: FieldType;
  required?: boolean;
  options?: { value: string; label: string }[];
  helperText?: string;
  placeholder?: string;
}

export interface MtFormSchema {
  messageType: string;
  fields: FormField[];
}

const CURRENCIES = ['USD', 'EUR', 'GBP', 'CHF', 'BRL', 'JPY'];
const BANK_OP = [
  { value: 'CRED', label: 'CRED' },
  { value: 'SPAY', label: 'SPAY' },
  { value: 'SSTD', label: 'SSTD' },
  { value: 'SPRI', label: 'SPRI' },
];
const CHARGES = [
  { value: 'OUR', label: 'OUR' },
  { value: 'BEN', label: 'BEN' },
  { value: 'SHA', label: 'SHA' },
];

const basePaymentFields: FormField[] = [
  { key: 'referenceNumber', label: '20 — Transaction Reference', type: 'text', required: true },
  { key: 'relatedReference', label: '21 — Related Reference', type: 'text' },
  { key: 'amount', label: '32A — Amount', type: 'number', required: true },
  { key: 'currency', label: '32A — Currency', type: 'select', required: true, options: CURRENCIES.map((c) => ({ value: c, label: c })) },
  { key: 'orderingCustomer', label: '50 — Ordering Customer', type: 'text', required: true },
  { key: 'beneficiaryIban', label: '59 — Beneficiary IBAN', type: 'iban', required: true },
  { key: 'beneficiaryName', label: '59 — Beneficiary Name', type: 'text', required: true },
  { key: 'senderBic', label: 'Sender BIC', type: 'bic' },
  { key: 'receiverBic', label: 'Receiver BIC', type: 'bic' },
];

const mt103Fields: FormField[] = [
  { key: 'referenceNumber', label: '20 — Transaction Reference', type: 'text', required: true },
  { key: 'sourceIban', label: '50 — Source IBAN', type: 'iban', required: true },
  { key: 'sourceBic', label: 'Source BIC', type: 'bic', required: true },
  { key: 'sourceHolderName', label: '50 — Ordering Customer', type: 'text', required: true },
  { key: 'destinationIban', label: '59 — Beneficiary IBAN', type: 'iban', required: true },
  { key: 'destinationBic', label: '57A — Destination BIC', type: 'bic', required: true },
  { key: 'destinationHolderName', label: '59 — Beneficiary Name', type: 'text', required: true },
  { key: 'amount', label: '32A — Amount', type: 'number', required: true },
  { key: 'currency', label: '32A — Currency', type: 'select', required: true, options: CURRENCIES.map((c) => ({ value: c, label: c })) },
  { key: 'bankOperationCode', label: '23B — Bank Operation Code', type: 'select', options: BANK_OP },
  { key: 'detailsOfCharges', label: '71A — Details of Charges', type: 'select', options: CHARGES },
  { key: 'purpose', label: '70 — Remittance Info', type: 'text' },
];

const fiTransferFields: FormField[] = [
  { key: 'referenceNumber', label: '20 — Transaction Reference', type: 'text', required: true },
  { key: 'relatedReference', label: '21 — Related Reference', type: 'text' },
  { key: 'amount', label: '32A — Amount', type: 'number', required: true },
  { key: 'currency', label: '32A — Currency', type: 'select', required: true, options: CURRENCIES.map((c) => ({ value: c, label: c })) },
  { key: 'orderingBic', label: '52A — Ordering Institution BIC', type: 'bic', required: true },
  { key: 'beneficiaryBic', label: '58A — Beneficiary Institution BIC', type: 'bic', required: true },
  { key: 'senderBic', label: 'Sender BIC', type: 'bic' },
  { key: 'receiverBic', label: 'Receiver BIC', type: 'bic' },
  { key: 'senderToReceiverInfo', label: '72 — Sender to Receiver Info', type: 'text' },
];

const narrativeFields: FormField[] = [
  { key: 'referenceNumber', label: '20 — Transaction Reference', type: 'text', required: true },
  { key: 'relatedReference', label: '21 — Related Reference', type: 'text' },
  { key: 'narrative', label: '70/79 — Narrative', type: 'textarea', required: true },
  { key: 'senderBic', label: 'Sender BIC', type: 'bic' },
  { key: 'receiverBic', label: 'Receiver BIC', type: 'bic' },
];

const freeFormatFields: FormField[] = [
  { key: 'referenceNumber', label: '20 — Transaction Reference', type: 'text', required: true },
  { key: 'freeFormatText', label: '79 — Free Format Text', type: 'textarea', required: true },
  { key: 'senderBic', label: 'Sender BIC', type: 'bic' },
  { key: 'receiverBic', label: 'Receiver BIC', type: 'bic' },
];

const fxTradeFields: FormField[] = [
  { key: 'referenceNumber', label: '20 — Transaction Reference', type: 'text', required: true },
  { key: 'relatedReference', label: '21 — Related Reference', type: 'text' },
  { key: 'amount', label: '32A — Amount', type: 'number', required: true },
  { key: 'currency', label: '32A — Currency', type: 'select', required: true, options: CURRENCIES.map((c) => ({ value: c, label: c })) },
  { key: 'narrative', label: '79 — Narrative', type: 'textarea', required: true },
  { key: 'senderBic', label: 'Sender BIC', type: 'bic' },
  { key: 'receiverBic', label: 'Receiver BIC', type: 'bic' },
];

export const MT_FORM_SCHEMAS: Record<string, MtFormSchema> = {
  MT101: { messageType: 'MT101', fields: basePaymentFields },
  MT102: { messageType: 'MT102', fields: basePaymentFields },
  MT102STP: { messageType: 'MT102STP', fields: basePaymentFields },
  MT103: { messageType: 'MT103', fields: mt103Fields },
  MT103REMIT: { messageType: 'MT103REMIT', fields: mt103Fields },
  MT103STP: { messageType: 'MT103STP', fields: mt103Fields },
  MT104: { messageType: 'MT104', fields: [...basePaymentFields, { key: 'detailsOfCharges', label: '71A — Details of Charges', type: 'select', options: CHARGES }] },
  MT105: { messageType: 'MT105', fields: narrativeFields },
  MT106: { messageType: 'MT106', fields: narrativeFields },
  MT107: { messageType: 'MT107', fields: basePaymentFields },
  MT110: { messageType: 'MT110', fields: [...basePaymentFields, { key: 'chequeInfo', label: '70 — Cheque Info', type: 'text' }] },
  MT111: { messageType: 'MT111', fields: [...basePaymentFields, { key: 'stopPaymentReason', label: '70 — Stop Payment Reason', type: 'text' }] },
  MT112: { messageType: 'MT112', fields: [
    { key: 'referenceNumber', label: '20 — Transaction Reference', type: 'text', required: true },
    { key: 'relatedReference', label: '21 — Related Reference', type: 'text' },
    { key: 'statusNarrative', label: '79 — Status Narrative', type: 'textarea', required: true },
    { key: 'senderBic', label: 'Sender BIC', type: 'bic' },
    { key: 'receiverBic', label: 'Receiver BIC', type: 'bic' },
  ]},
  MT121: { messageType: 'MT121', fields: fiTransferFields },
  MT190: { messageType: 'MT190', fields: narrativeFields },
  MT191: { messageType: 'MT191', fields: narrativeFields },
  MT192: { messageType: 'MT192', fields: [
    { key: 'referenceNumber', label: '20 — Transaction Reference', type: 'text', required: true },
    { key: 'relatedReference', label: '21 — Related Reference', type: 'text' },
    { key: 'cancellationReason', label: '79 — Cancellation Reason', type: 'textarea', required: true },
    { key: 'senderBic', label: 'Sender BIC', type: 'bic' },
    { key: 'receiverBic', label: 'Receiver BIC', type: 'bic' },
  ]},
  MT195: { messageType: 'MT195', fields: [
    { key: 'referenceNumber', label: '20 — Transaction Reference', type: 'text', required: true },
    { key: 'queryText', label: '79 — Query Text', type: 'textarea', required: true },
    { key: 'senderBic', label: 'Sender BIC', type: 'bic' },
    { key: 'receiverBic', label: 'Receiver BIC', type: 'bic' },
  ]},
  MT196: { messageType: 'MT196', fields: [
    { key: 'referenceNumber', label: '20 — Transaction Reference', type: 'text', required: true },
    { key: 'relatedReference', label: '21 — Related Reference', type: 'text' },
    { key: 'answerText', label: '79 — Answer Text', type: 'textarea', required: true },
    { key: 'senderBic', label: 'Sender BIC', type: 'bic' },
    { key: 'receiverBic', label: 'Receiver BIC', type: 'bic' },
  ]},
  MT198: { messageType: 'MT198', fields: [
    { key: 'referenceNumber', label: '20 — Transaction Reference', type: 'text', required: true },
    { key: 'proprietaryContent', label: '79 — Proprietary Content', type: 'textarea', required: true },
    { key: 'senderBic', label: 'Sender BIC', type: 'bic' },
    { key: 'receiverBic', label: 'Receiver BIC', type: 'bic' },
  ]},
  MT199: { messageType: 'MT199', fields: freeFormatFields },
  MT200: { messageType: 'MT200', fields: fiTransferFields },
  MT201: { messageType: 'MT201', fields: fiTransferFields },
  MT202: { messageType: 'MT202', fields: fiTransferFields },
  MT203: { messageType: 'MT203', fields: fiTransferFields },
  MT204: { messageType: 'MT204', fields: fiTransferFields },
  MT205: { messageType: 'MT205', fields: fiTransferFields },
  MT206: { messageType: 'MT206', fields: [
    { key: 'referenceNumber', label: '20 — Transaction Reference', type: 'text', required: true },
    { key: 'relatedReference', label: '21 — Related Reference', type: 'text' },
    { key: 'chequeTruncationInfo', label: '79 — Cheque Truncation Info', type: 'textarea', required: true },
    { key: 'senderBic', label: 'Sender BIC', type: 'bic' },
    { key: 'receiverBic', label: 'Receiver BIC', type: 'bic' },
  ]},
  MT207: { messageType: 'MT207', fields: fiTransferFields },
  MT210: { messageType: 'MT210', fields: [
    { key: 'referenceNumber', label: '20 — Transaction Reference', type: 'text', required: true },
    { key: 'relatedReference', label: '21 — Related Reference', type: 'text' },
    { key: 'amount', label: '32A — Amount', type: 'number', required: true },
    { key: 'currency', label: '32A — Currency', type: 'select', required: true, options: CURRENCIES.map((c) => ({ value: c, label: c })) },
    { key: 'noticeText', label: '79 — Notice Text', type: 'textarea', required: true },
    { key: 'senderBic', label: 'Sender BIC', type: 'bic' },
    { key: 'receiverBic', label: 'Receiver BIC', type: 'bic' },
  ]},
  MT256: { messageType: 'MT256', fields: [
    { key: 'referenceNumber', label: '20 — Transaction Reference', type: 'text', required: true },
    { key: 'relatedReference', label: '21 — Related Reference', type: 'text' },
    { key: 'nonPaymentReason', label: '79 — Non-Payment Reason', type: 'textarea', required: true },
    { key: 'senderBic', label: 'Sender BIC', type: 'bic' },
    { key: 'receiverBic', label: 'Receiver BIC', type: 'bic' },
  ]},
  MT290: { messageType: 'MT290', fields: narrativeFields },
  MT291: { messageType: 'MT291', fields: narrativeFields },
  MT292: { messageType: 'MT292', fields: [
    { key: 'referenceNumber', label: '20 — Transaction Reference', type: 'text', required: true },
    { key: 'relatedReference', label: '21 — Related Reference', type: 'text' },
    { key: 'cancellationReason', label: '79 — Cancellation Reason', type: 'textarea', required: true },
    { key: 'senderBic', label: 'Sender BIC', type: 'bic' },
    { key: 'receiverBic', label: 'Receiver BIC', type: 'bic' },
  ]},
  MT295: { messageType: 'MT295', fields: [
    { key: 'referenceNumber', label: '20 — Transaction Reference', type: 'text', required: true },
    { key: 'queryText', label: '79 — Query Text', type: 'textarea', required: true },
    { key: 'senderBic', label: 'Sender BIC', type: 'bic' },
    { key: 'receiverBic', label: 'Receiver BIC', type: 'bic' },
  ]},
  MT296: { messageType: 'MT296', fields: [
    { key: 'referenceNumber', label: '20 — Transaction Reference', type: 'text', required: true },
    { key: 'relatedReference', label: '21 — Related Reference', type: 'text' },
    { key: 'answerText', label: '79 — Answer Text', type: 'textarea', required: true },
    { key: 'senderBic', label: 'Sender BIC', type: 'bic' },
    { key: 'receiverBic', label: 'Receiver BIC', type: 'bic' },
  ]},
  MT298: { messageType: 'MT298', fields: [
    { key: 'referenceNumber', label: '20 — Transaction Reference', type: 'text', required: true },
    { key: 'proprietaryContent', label: '79 — Proprietary Content', type: 'textarea', required: true },
    { key: 'senderBic', label: 'Sender BIC', type: 'bic' },
    { key: 'receiverBic', label: 'Receiver BIC', type: 'bic' },
  ]},
  MT299: { messageType: 'MT299', fields: freeFormatFields },
  // MT3xx - Tesouraria/FX
  MT300: { messageType: 'MT300', fields: fxTradeFields },
  MT303: { messageType: 'MT303', fields: fxTradeFields },
  MT304: { messageType: 'MT304', fields: fxTradeFields },
  MT305: { messageType: 'MT305', fields: fxTradeFields },
  MT307: { messageType: 'MT307', fields: fxTradeFields },
  MT308: { messageType: 'MT308', fields: fxTradeFields },
  MT320: { messageType: 'MT320', fields: fxTradeFields },
  MT330: { messageType: 'MT330', fields: fxTradeFields },
  MT340: { messageType: 'MT340', fields: fxTradeFields },
  MT350: { messageType: 'MT350', fields: fxTradeFields },
  MT360: { messageType: 'MT360', fields: fxTradeFields },
  MT380: { messageType: 'MT380', fields: fxTradeFields },
  MT381: { messageType: 'MT381', fields: fxTradeFields },
  MT390: { messageType: 'MT390', fields: fxTradeFields },
  MT395: { messageType: 'MT395', fields: [
    { key: 'referenceNumber', label: '20 — Transaction Reference', type: 'text', required: true },
    { key: 'queryText', label: '79 — Query Text', type: 'textarea', required: true },
    { key: 'senderBic', label: 'Sender BIC', type: 'bic' },
    { key: 'receiverBic', label: 'Receiver BIC', type: 'bic' },
  ]},
  MT396: { messageType: 'MT396', fields: [
    { key: 'referenceNumber', label: '20 — Transaction Reference', type: 'text', required: true },
    { key: 'relatedReference', label: '21 — Related Reference', type: 'text' },
    { key: 'answerText', label: '79 — Answer Text', type: 'textarea', required: true },
    { key: 'senderBic', label: 'Sender BIC', type: 'bic' },
    { key: 'receiverBic', label: 'Receiver BIC', type: 'bic' },
  ]},
  MT398: { messageType: 'MT398', fields: [
    { key: 'referenceNumber', label: '20 — Transaction Reference', type: 'text', required: true },
    { key: 'proprietaryContent', label: '79 — Proprietary Content', type: 'textarea', required: true },
    { key: 'senderBic', label: 'Sender BIC', type: 'bic' },
    { key: 'receiverBic', label: 'Receiver BIC', type: 'bic' },
  ]},
  MT399: { messageType: 'MT399', fields: freeFormatFields },
  // MT4xx - Trade/Collections
  MT400: { messageType: 'MT400', fields: fxTradeFields },
  MT405: { messageType: 'MT405', fields: fxTradeFields },
  MT410: { messageType: 'MT410', fields: fxTradeFields },
  MT412: { messageType: 'MT412', fields: fxTradeFields },
  MT416: { messageType: 'MT416', fields: fxTradeFields },
  MT420: { messageType: 'MT420', fields: fxTradeFields },
  MT430: { messageType: 'MT430', fields: fxTradeFields },
  MT450: { messageType: 'MT450', fields: fxTradeFields },
  MT455: { messageType: 'MT455', fields: fxTradeFields },
  MT456: { messageType: 'MT456', fields: fxTradeFields },
  MT490: { messageType: 'MT490', fields: fxTradeFields },
  MT491: { messageType: 'MT491', fields: fxTradeFields },
  MT492: { messageType: 'MT492', fields: [
    { key: 'referenceNumber', label: '20 — Transaction Reference', type: 'text', required: true },
    { key: 'relatedReference', label: '21 — Related Reference', type: 'text' },
    { key: 'cancellationReason', label: '79 — Cancellation Reason', type: 'textarea', required: true },
    { key: 'senderBic', label: 'Sender BIC', type: 'bic' },
    { key: 'receiverBic', label: 'Receiver BIC', type: 'bic' },
  ]},
  MT495: { messageType: 'MT495', fields: [
    { key: 'referenceNumber', label: '20 — Transaction Reference', type: 'text', required: true },
    { key: 'queryText', label: '79 — Query Text', type: 'textarea', required: true },
    { key: 'senderBic', label: 'Sender BIC', type: 'bic' },
    { key: 'receiverBic', label: 'Receiver BIC', type: 'bic' },
  ]},
  MT496: { messageType: 'MT496', fields: [
    { key: 'referenceNumber', label: '20 — Transaction Reference', type: 'text', required: true },
    { key: 'relatedReference', label: '21 — Related Reference', type: 'text' },
    { key: 'answerText', label: '79 — Answer Text', type: 'textarea', required: true },
    { key: 'senderBic', label: 'Sender BIC', type: 'bic' },
    { key: 'receiverBic', label: 'Receiver BIC', type: 'bic' },
  ]},
  MT498: { messageType: 'MT498', fields: [
    { key: 'referenceNumber', label: '20 — Transaction Reference', type: 'text', required: true },
    { key: 'proprietaryContent', label: '79 — Proprietary Content', type: 'textarea', required: true },
    { key: 'senderBic', label: 'Sender BIC', type: 'bic' },
    { key: 'receiverBic', label: 'Receiver BIC', type: 'bic' },
  ]},
  MT499: { messageType: 'MT499', fields: freeFormatFields },
  // MT5xx - Securities
  MT500: { messageType: 'MT500', fields: fxTradeFields },
  MT501: { messageType: 'MT501', fields: fxTradeFields },
  MT502: { messageType: 'MT502', fields: fxTradeFields },
  MT520: { messageType: 'MT520', fields: fxTradeFields },
  MT530: { messageType: 'MT530', fields: fxTradeFields },
  MT540: { messageType: 'MT540', fields: fxTradeFields },
  MT541: { messageType: 'MT541', fields: fxTradeFields },
  MT542: { messageType: 'MT542', fields: fxTradeFields },
  MT543: { messageType: 'MT543', fields: fxTradeFields },
  MT544: { messageType: 'MT544', fields: fxTradeFields },
  MT545: { messageType: 'MT545', fields: fxTradeFields },
  MT546: { messageType: 'MT546', fields: fxTradeFields },
  MT547: { messageType: 'MT547', fields: fxTradeFields },
  MT548: { messageType: 'MT548', fields: fxTradeFields },
  MT550: { messageType: 'MT550', fields: fxTradeFields },
  MT560: { messageType: 'MT560', fields: fxTradeFields },
  MT564: { messageType: 'MT564', fields: fxTradeFields },
  MT599: { messageType: 'MT599', fields: freeFormatFields },
};
