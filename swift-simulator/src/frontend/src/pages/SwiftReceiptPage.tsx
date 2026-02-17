/**
 * Página de Recibo Técnico SWIFT
 * SWIFT_RECEIPT_SPEC_v1.0
 */

import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button, Box, Skeleton } from '@mui/material';
import { ArrowBack as BackIcon, PictureAsPdf as PdfIcon } from '@mui/icons-material';
import { getReceipt, type SwiftReceiptData, type ReceiptMtType } from '../services/swiftReceiptService';
import SwiftReceiptView from '../components/swift/SwiftReceiptView';
import { exportSwiftReceiptPdf } from '../utils/swiftReceiptPdfExport';

const SwiftReceiptPage: React.FC = () => {
  const { mtType, id } = useParams<{ mtType: string; id: string }>();
  const navigate = useNavigate();
  const [data, setData] = useState<SwiftReceiptData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!mtType || !id) return;
    getReceipt(mtType as ReceiptMtType, Number(id))
      .then((r) => setData(r.data?.data?.receipt ?? null))
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, [mtType, id]);

  const handleExportPdf = () => {
    if (data) exportSwiftReceiptPdf(data);
  };

  if (loading || !data) {
    return (
      <Box sx={{ p: 2 }}>
        <Skeleton width={200} height={40} sx={{ mb: 2 }} />
        <Skeleton variant="rectangular" height={400} sx={{ borderRadius: 0 }} />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 2, bgcolor: '#fff' }}>
      <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
        <Button startIcon={<BackIcon />} onClick={() => navigate(-1)} size="small">
          Voltar
        </Button>
        <Button startIcon={<PdfIcon />} onClick={handleExportPdf} variant="outlined" size="small">
          Exportar PDF
        </Button>
      </Box>
      <SwiftReceiptView data={data} id="swift-receipt-print" />
    </Box>
  );
};

export default SwiftReceiptPage;
