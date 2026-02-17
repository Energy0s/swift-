/**
 * Formata mensagem FIN SWIFT para exibição com labels e separadores
 * Formato: SWIFT MESSAGE - MTxxx, blocos numerados, Delivery Status
 */

const SEP = '-----------------------------------------------';

export function formatSwiftFinForDisplay(
  rawFin: string,
  mtType: string = 'MT199',
  deliveryStatus: string = 'ACK',
  network: string = 'FIN',
  priority: string = 'Normal'
): string {
  if (!rawFin?.trim()) return rawFin;

  const b1 = rawFin.match(/\{1:([^}]+)\}/)?.[1];
  const b2 = rawFin.match(/\{2:([^}]+)\}/)?.[1];
  const b3 = rawFin.match(/\{3:([^}]+)\}/)?.[1];
  const b4 = rawFin.match(/\{4:([\s\S]*?)-?\}/)?.[1]?.trim();
  const b5 = rawFin.match(/\{5:([^}]+)\}/)?.[1];

  const lines: string[] = [
    `SWIFT MESSAGE - ${mtType}`,
    SEP,
    '',
    'Basic Header Block (1)',
    b1 ? `{1:${b1}}` : '(não encontrado)',
    '',
    'Application Header Block (2)',
    b2 ? `{2:${b2}}` : '(não encontrado)',
    '',
  ];

  if (b3) {
    lines.push('User Header Block (3)');
    lines.push(`{3:${b3}}`);
    lines.push('');
  }

  lines.push('Text Block (4)');
  lines.push(b4 ? `{4:\n${b4}\n-}` : '(não encontrado)');
  lines.push('');
  lines.push('Trailer Block (5)');
  lines.push(b5 ? `{5:${b5}}` : '(não encontrado)');
  lines.push(SEP);
  lines.push(`Delivery Status: ${deliveryStatus}`);
  lines.push(`Network: ${network}`);
  lines.push(`Priority: ${priority}`);
  lines.push(SEP);

  return lines.join('\n');
}
