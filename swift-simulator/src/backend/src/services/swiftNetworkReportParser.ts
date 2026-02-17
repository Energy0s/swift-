/**
 * Parser para Network Report / Message Trailer
 * Apenas parse e extrai campos - NUNCA gera valores
 */

export interface ParsedNetworkReport {
  chk: string | null;
  tracking: string | null;
  pki_signature: string | null;
  access_code: string | null;
  release_code: string | null;
  category: string | null;
  creation_time: string | null;
  application: string | null;
  operator: string | null;
  raw_text: string;
  parsed_text_blocks: Record<string, string> | null;
}

function extractField(text: string, label: string): string | null {
  const patterns = [
    new RegExp(`\\{?CHK\\}?\\s*:\\s*([^\\s\\n]+)`, 'i'),
    new RegExp(`TRACKING\\s*:\\s*([^\\s\\n]+)`, 'i'),
    new RegExp(`PKI SIGNATURE\\s*:\\s*([^\\n]+)`, 'i'),
    new RegExp(`ACCESS CODE\\s*:\\s*([^\\s\\n]+)`, 'i'),
    new RegExp(`RELEASE CODE\\s*:\\s*([^\\s\\n]+)`, 'i'),
    new RegExp(`Category\\s*:\\s*([^\\n]+)`, 'i'),
    new RegExp(`Creation Time\\s*:\\s*([^\\n]+)`, 'i'),
    new RegExp(`Application\\s*:\\s*([^\\n]+)`, 'i'),
    new RegExp(`Operator\\s*:\\s*([^\\n]+)`, 'i'),
  ];
  const labelMap: Record<string, RegExp> = {
    chk: patterns[0],
    tracking: patterns[1],
    pki_signature: patterns[2],
    access_code: patterns[3],
    release_code: patterns[4],
    category: patterns[5],
    creation_time: patterns[6],
    application: patterns[7],
    operator: patterns[8],
  };
  const re = labelMap[label.toLowerCase()];
  if (!re) return null;
  const m = text.match(re);
  return m ? m[1].trim() : null;
}

function parseCreationTime(s: string | null): string | null {
  if (!s) return null;
  const m = s.match(/(\d{2})\/(\d{2})\/(\d{4})\s*-\s*(\d{2}):(\d{2}):(\d{2})/);
  if (!m) return s;
  const [, d, mo, y, h, mi, sec] = m;
  return `${y}-${mo}-${d}T${h}:${mi}:${sec}.000Z`;
}

function extractSwiftBlocks(text: string): Record<string, string> | null {
  const blocks: Record<string, string> = {};
  const re = /\{(\d):([^}]*)\}/g;
  let m;
  while ((m = re.exec(text)) !== null) {
    blocks[m[1]] = m[2];
  }
  if (Object.keys(blocks).length === 0) return null;
  return blocks;
}

export function parseNetworkReport(rawText: string): ParsedNetworkReport {
  const chk = extractField(rawText, 'chk');
  const tracking = extractField(rawText, 'tracking');
  const pkiSignature = extractField(rawText, 'pki_signature');
  const accessCode = extractField(rawText, 'access_code');
  const releaseCode = extractField(rawText, 'release_code');
  const category = extractField(rawText, 'category');
  const creationTimeRaw = extractField(rawText, 'creation_time');
  const application = extractField(rawText, 'application');
  const operator = extractField(rawText, 'operator');

  const creationTime = parseCreationTime(creationTimeRaw);

  const parsedTextBlocks = extractSwiftBlocks(rawText);

  return {
    chk,
    tracking,
    pki_signature: pkiSignature,
    access_code: accessCode,
    release_code: releaseCode,
    category,
    creation_time: creationTime,
    application,
    operator,
    raw_text: rawText,
    parsed_text_blocks: parsedTextBlocks,
  };
}
