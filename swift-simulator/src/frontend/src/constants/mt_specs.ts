/**
 * mt_specs.ts — Especificação de campos obrigatórios por MT
 * SWIFT_RECEIPT_SPEC_v1.0
 */

export interface MtFieldSpec {
  tag: string;
  label: string;
  required: boolean;
}

export interface MtSpec {
  mtType: string;
  requiredTags: string[];
  fields: MtFieldSpec[];
}

export const MT_SPECS: Record<string, MtSpec> = {
  MT103: {
    mtType: 'MT103',
    requiredTags: ['20', '23B', '32A', '50', '59', '71A'],
    fields: [
      { tag: '20', label: 'Sender\'s Reference', required: true },
      { tag: '23B', label: 'Bank Operation Code', required: true },
      { tag: '32A', label: 'Value Date/Currency/Amount', required: true },
      { tag: '50', label: 'Ordering Customer', required: true },
      { tag: '59', label: 'Beneficiary Customer', required: true },
      { tag: '71A', label: 'Details of Charges', required: true },
      { tag: '70', label: 'Remittance Information', required: false },
      { tag: '52A', label: 'Ordering Institution', required: false },
      { tag: '57A', label: 'Account With Institution', required: false },
    ],
  },
  MT199: {
    mtType: 'MT199',
    requiredTags: ['20', '79'],
    fields: [
      { tag: '20', label: 'Transaction Reference', required: true },
      { tag: '79', label: 'Narrative', required: true },
      { tag: '21', label: 'Related Reference', required: false },
    ],
  },
  MT299: {
    mtType: 'MT299',
    requiredTags: ['20', '79'],
    fields: [
      { tag: '20', label: 'Transaction Reference', required: true },
      { tag: '79', label: 'Narrative', required: true },
      { tag: '21', label: 'Related Reference', required: false },
    ],
  },
  MT999: {
    mtType: 'MT999',
    requiredTags: ['20', '79'],
    fields: [
      { tag: '20', label: 'Transaction Reference', required: true },
      { tag: '79', label: 'Narrative', required: true },
    ],
  },
  MT730: {
    mtType: 'MT730',
    requiredTags: ['20', '21', '30'],
    fields: [
      { tag: '20', label: 'Sender\'s Reference', required: true },
      { tag: '21', label: 'Related Reference', required: true },
      { tag: '30', label: 'Date of Advice', required: true },
    ],
  },
  MT900: {
    mtType: 'MT900',
    requiredTags: ['20', '32A'],
    fields: [
      { tag: '20', label: 'Sender\'s Reference', required: true },
      { tag: '32A', label: 'Value Date/Currency/Amount', required: true },
    ],
  },
  MT910: {
    mtType: 'MT910',
    requiredTags: ['20', '32A'],
    fields: [
      { tag: '20', label: 'Sender\'s Reference', required: true },
      { tag: '32A', label: 'Value Date/Currency/Amount', required: true },
    ],
  },
  MT940: {
    mtType: 'MT940',
    requiredTags: ['20', '25', '28C', '60F', '62F'],
    fields: [
      { tag: '20', label: 'Transaction Reference', required: true },
      { tag: '25', label: 'Account Identification', required: true },
      { tag: '28C', label: 'Statement Number', required: true },
      { tag: '60F', label: 'Opening Balance', required: true },
      { tag: '62F', label: 'Closing Balance', required: true },
    ],
  },
  MT950: {
    mtType: 'MT950',
    requiredTags: ['20', '25', '28C', '60F', '62F'],
    fields: [
      { tag: '20', label: 'Transaction Reference', required: true },
      { tag: '25', label: 'Account Identification', required: true },
      { tag: '28C', label: 'Statement Number', required: true },
      { tag: '60F', label: 'Opening Balance', required: true },
      { tag: '62F', label: 'Closing Balance', required: true },
    ],
  },
  MT760: {
    mtType: 'MT760',
    requiredTags: ['20', '23', '27', '40A'],
    fields: [
      { tag: '20', label: 'Sender\'s Reference', required: true },
      { tag: '23', label: 'Further Identification', required: true },
      { tag: '27', label: 'Sequence of Total', required: true },
      { tag: '40A', label: 'Form of Documentary Credit', required: true },
    ],
  },
  MT101: {
    mtType: 'MT101',
    requiredTags: ['20', '32A', '50', '59'],
    fields: [
      { tag: '20', label: 'Sender\'s Reference', required: true },
      { tag: '32A', label: 'Value Date/Currency/Amount', required: true },
      { tag: '50', label: 'Ordering Customer', required: true },
      { tag: '59', label: 'Beneficiary', required: true },
    ],
  },
  MT109: {
    mtType: 'MT109',
    requiredTags: ['20', '30', '50', '59', '71A'],
    fields: [
      { tag: '20', label: 'Sender\'s Reference', required: true },
      { tag: '30', label: 'Date of Issue', required: true },
      { tag: '50', label: 'Ordering Customer', required: true },
      { tag: '59', label: 'Beneficiary', required: true },
      { tag: '71A', label: 'Details of Charges', required: true },
    ],
  },
};

export function getMtSpec(mtType: string): MtSpec | undefined {
  const normalized = (mtType || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
  return MT_SPECS[mtType] ?? MT_SPECS[normalized] ?? Object.values(MT_SPECS).find((s) => s.mtType === mtType);
}

export function getMissingRequiredTags(mtType: string, block4Content: string): string[] {
  const spec = getMtSpec(mtType);
  if (!spec) return [];
  const content = block4Content || '';
  return spec.requiredTags.filter((tag) => {
    const re = new RegExp(`:${tag}([A-Z])?:`, 'i');
    return !re.test(content);
  });
}

export function extractBlock4Tags(block4Content: string): string[] {
  const tags: string[] = [];
  const re = /:(\d+[A-Z]?):/g;
  let m;
  while ((m = re.exec(block4Content)) !== null) {
    const tag = m[1].replace(/^(\d+)[A-Z]?$/, '$1');
    if (!tags.includes(tag)) tags.push(tag);
  }
  return tags;
}
