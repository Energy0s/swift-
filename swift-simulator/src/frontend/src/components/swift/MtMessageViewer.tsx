import React from 'react';
import { Box, Typography, Paper, Table, TableBody, TableCell, TableRow } from '@mui/material';

/**
 * Visualizador de mensagem SWIFT MT por tags
 * Exibe cada tag com nome e valor — design profissional
 */
const MT_TAG_LABELS: Record<string, string> = {
  '20': 'Transaction Reference (Sender\'s Reference)',
  '21': 'Related Reference',
  '23B': 'Bank Operation Code',
  '23E': 'Instruction Code',
  '26T': 'Transaction Type',
  '32A': 'Value Date / Currency / Amount',
  '33B': 'Currency / Instructed Amount',
  '36': 'Exchange Rate',
  '50': 'Ordering Customer',
  '50K': 'Ordering Customer (Name & Address)',
  '51A': 'Sender\'s Correspondent',
  '52A': 'Ordering Institution',
  '53A': 'Sender\'s Correspondent',
  '54A': 'Receiver\'s Correspondent',
  '56A': 'Intermediary',
  '57A': 'Account With Institution',
  '58A': 'Beneficiary Institution',
  '59': 'Beneficiary Customer',
  '59F': 'Beneficiary Customer (Account + Name)',
  '70': 'Remittance Information',
  '71A': 'Details of Charges',
  '71F': 'Sender\'s Charges',
  '71G': 'Receiver\'s Charges',
  '72': 'Sender to Receiver Information',
  '77B': 'Regulatory Reporting',
};

/** Extrai Block 4 da mensagem SWIFT (entre {4: e -}) */
function extractBlock4(text: string): string {
  const m = text.match(/\{4:([\s\S]*?)\n-\}/);
  return m ? m[1].trim() : text;
}

/** Parse tags MT — linhas que começam com :XX: são novas tags; demais são continuação */
function parseMtBlock4(text: string): { tag: string; value: string }[] {
  const block4 = extractBlock4(text);
  const result: { tag: string; value: string }[] = [];
  let currentTag = '';
  let currentValue = '';
  const lines = block4.split('\n');
  for (const line of lines) {
    const tagMatch = line.match(/^:(\d{2}[A-Z]?):(.*)$/);
    if (tagMatch) {
      if (currentTag) result.push({ tag: currentTag, value: currentValue.trim() });
      currentTag = tagMatch[1];
      currentValue = tagMatch[2] || '';
    } else if (currentTag) {
      currentValue += (currentValue ? '\n' : '') + line;
    }
  }
  if (currentTag) result.push({ tag: currentTag, value: currentValue.trim() });
  return result;
}

interface MtMessageViewerProps {
  message: string;
  messageType?: string;
}

const MtMessageViewer: React.FC<MtMessageViewerProps> = ({ message, messageType = 'MT103' }) => {
  const tags = parseMtBlock4(message);

  if (tags.length === 0) {
    return (
      <Paper sx={{ p: 2 }}>
        <Typography variant="body2" color="text.secondary" fontFamily="monospace" component="pre" sx={{ whiteSpace: 'pre-wrap' }}>
          {message}
        </Typography>
      </Paper>
    );
  }

  return (
    <Paper sx={{ overflow: 'hidden' }}>
      <Box sx={{ bgcolor: '#F7F7F7', px: 2, py: 1, borderBottom: '1px solid #E0E0E0' }}>
        <Typography variant="caption" fontWeight={600} color="#6B6B6B">
          {messageType} — Campos (Tags)
        </Typography>
      </Box>
      <Table size="small">
        <TableBody>
          {tags.map(({ tag, value }) => (
            <TableRow key={tag}>
              <TableCell sx={{ width: 80, fontFamily: 'monospace', fontWeight: 600, color: '#006BA6' }}>
                :{tag}:
              </TableCell>
              <TableCell sx={{ color: '#6B6B6B', fontSize: '0.75rem' }}>
                {MT_TAG_LABELS[tag] || tag}
              </TableCell>
              <TableCell sx={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>
                {value}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Paper>
  );
};

export default MtMessageViewer;
