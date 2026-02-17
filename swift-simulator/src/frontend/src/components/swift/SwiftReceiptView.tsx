/**
 * SwiftReceiptView — Recibo / Print Técnico SWIFT FIN
 * Modelo visual OBRIGATÓRIO — Layout FIXO, NÃO ALTERAR
 * Fonte: Courier New, Consolas, Menlo, Monaco, monospace
 * 12px, line-height 1.25, white-space pre-wrap, fundo branco, texto preto
 */

import React, { useRef } from 'react';
import { buildSwiftReceiptLines, type SwiftReceiptData } from '../../utils/swiftReceiptLines';

export type { SwiftReceiptData, SwiftReceiptNetworkAck } from '../../utils/swiftReceiptLines';

const SwiftReceiptView: React.FC<{
  data: SwiftReceiptData;
  id?: string;
  className?: string;
}> = ({ data, id: elementId, className }) => {
  const ref = useRef<HTMLDivElement>(null);
  const lines = buildSwiftReceiptLines(data);
  const content = lines.join('\n');

  return (
    <div
      ref={ref}
      id={elementId}
      className={className}
      style={{
        fontFamily: '"Courier New", Consolas, Menlo, Monaco, monospace',
        fontSize: '12px',
        lineHeight: 1.25,
        backgroundColor: '#ffffff',
        color: '#000000',
        whiteSpace: 'pre-wrap',
        width: '100%',
        maxWidth: '100%',
        overflowWrap: 'break-word',
        padding: 16,
        margin: 0,
        border: 'none',
        boxShadow: 'none',
      }}
    >
      {content}
    </div>
  );
};

export default SwiftReceiptView;
