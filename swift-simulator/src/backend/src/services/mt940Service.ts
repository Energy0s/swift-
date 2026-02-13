/**
 * Serviço de geração de mensagens SWIFT MT940
 * Customer Statement Message — extrato de conta
 */

export interface Mt940Transaction {
  valueDate: string;
  bookingDate: string;
  isDebit: boolean;
  amount: number;
  currency: string;
  reference: string;
  description: string;
}

export interface Mt940Input {
  accountIban: string;
  statementNumber: string;
  sequenceNumber: string;
  openingBalance: number;
  openingBalanceDate: string;
  openingBalanceIsDebit: boolean;
  currency: string;
  transactions: Mt940Transaction[];
}

function formatSwiftAmount(amount: number): string {
  return amount.toFixed(2).replace('.', ',');
}

function formatSwiftDate(date: string): string {
  const d = new Date(date);
  const yy = d.getFullYear().toString().slice(-2);
  const mm = (d.getMonth() + 1).toString().padStart(2, '0');
  const dd = d.getDate().toString().padStart(2, '0');
  return `${yy}${mm}${dd}`;
}

/**
 * Gera tag 61 no formato: DDMMYY MMDD C/D amount,N reference
 * MT940: 6n value date, 4n entry date, 1a D/C, 15d amount, 1a funds, 3a type, 16x reference
 */
function formatTag61(tx: Mt940Transaction): string {
  const d = new Date(tx.valueDate);
  const dd = d.getDate().toString().padStart(2, '0');
  const mm = (d.getMonth() + 1).toString().padStart(2, '0');
  const yy = d.getFullYear().toString().slice(-2);
  const valDate = dd + mm + yy;
  const b = new Date(tx.bookingDate);
  const bookDate = (b.getMonth() + 1).toString().padStart(2, '0') + b.getDate().toString().padStart(2, '0');
  const dc = tx.isDebit ? 'D' : 'C';
  const amount = formatSwiftAmount(tx.amount);
  const ref = (tx.reference || 'NONREF').substring(0, 16);
  return `${valDate}${bookDate}${dc}${amount}NTRF${ref}`;
}

/**
 * Gera mensagem MT940 (Customer Statement)
 */
export function generateMt940(statement: Mt940Input): string {
  const lines: string[] = [];
  const ref = statement.statementNumber.substring(0, 16);

  lines.push(`:20:${ref}`);
  lines.push(`:25:${statement.accountIban.replace(/\s/g, '')}`);
  lines.push(`:28C:${statement.statementNumber}/${statement.sequenceNumber}`);
  const obDC = statement.openingBalanceIsDebit ? 'D' : 'C';
  const obAmount = formatSwiftAmount(Math.abs(statement.openingBalance));
  const obDate = formatSwiftDate(statement.openingBalanceDate).replace(/\//g, '');
  lines.push(`:60F:${obDC}${obDate}${statement.currency}${obAmount}`);

  let runningBalance = statement.openingBalance;
  for (const tx of statement.transactions) {
    lines.push(`:61:${formatTag61(tx)}`);
    lines.push(`:86:${tx.description.substring(0, 65)}`);
    runningBalance += tx.isDebit ? -tx.amount : tx.amount;
  }

  const cbDC = runningBalance >= 0 ? 'C' : 'D';
  const cbAmount = formatSwiftAmount(Math.abs(runningBalance));
  const today = formatSwiftDate(new Date().toISOString().slice(0, 10)).replace(/\//g, '');
  lines.push(`:62F:${cbDC}${today}${statement.currency}${cbAmount}`);

  const block4 = lines.join('\n');

  const block1 = `{1:F01BANKBIC0000000000}`;
  const block2 = `{2:I940BANKBIC0N}`;
  const block4Formatted = `{4:\n${block4}\n-}`;

  return `${block1}${block2}${block4Formatted}`;
}
