/**
 * Export PDF do recibo técnico SWIFT
 * Modelo visual OBRIGATÓRIO — PDF idêntico ao HTML
 * Fonte Courier 12pt, layout fixo
 */

import { jsPDF } from 'jspdf';
import { buildSwiftReceiptLines } from './swiftReceiptLines';
import type { SwiftReceiptData } from './swiftReceiptLines';

export function exportSwiftReceiptPdf(data: SwiftReceiptData, filename?: string): void {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  doc.setFont('Courier', 'normal');
  doc.setFontSize(12);
  const lineHeight = 12 * 1.25 * 0.35;
  let y = 15;
  const margin = 15;
  const maxWidth = 180;

  const lines = buildSwiftReceiptLines(data);
  for (const line of lines) {
    if (y > 275) {
      doc.addPage();
      y = 15;
    }
    const wrapped = doc.splitTextToSize(line, maxWidth);
    doc.text(wrapped, margin, y);
    y += wrapped.length * lineHeight;
  }

  const fn = filename || `recibo-swift-${data.mtType || 'MT'}-${Date.now()}.pdf`;
  doc.save(fn);
}
