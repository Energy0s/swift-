import React, { useEffect, useState } from 'react';
import {
  Box,
  Typography,
  Button,
  Paper,
  Skeleton,
  Tabs,
  Tab,
} from '@mui/material';
import { ArrowBack as BackIcon, ContentCopy as CopyIcon, Download as DownloadIcon, PictureAsPdf as PdfIcon } from '@mui/icons-material';
import { useParams, useNavigate } from 'react-router-dom';
import { getMessage } from '../services/messagesService';
import { getMtByCode } from '../constants/swiftMtTypes';
import MtMessageViewer from '../components/swift/MtMessageViewer';
import { useToast } from '../contexts/ToastContext';
import { downloadSwiftReceipt } from '../services/swiftReceiptPdf';

const MessageViewPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { showSuccess } = useToast();
  const [message, setMessage] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [viewTab, setViewTab] = useState(0);

  useEffect(() => {
    if (!id) return;
    getMessage(Number(id))
      .then((r) => setMessage(r.data?.data?.message))
      .catch(() => setMessage(null))
      .finally(() => setLoading(false));
  }, [id]);

  const handleCopy = () => {
    if (message?.rawMessage) {
      navigator.clipboard.writeText(message.rawMessage);
      showSuccess('Mensagem copiada para a área de transferência');
    }
  };

  const handleDownload = () => {
    if (!message) return;
    const blob = new Blob([message.rawMessage], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `SWIFT_${message.messageType}_${message.referenceNumber}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handlePdfReceipt = () => {
    if (!message) return;
    const p = message.payload || {};
    downloadSwiftReceipt({
      messageType: message.messageType || 'MT-103',
      reference: message.referenceNumber || p.referenceNumber,
      valueDate: p.valueDate,
      amount: p.amount,
      currency: p.currency,
      senderBic: p.senderBic || p.sourceBic || 'BOMGBRS1XXX',
      senderIban: p.sourceIban || p.senderIban,
      senderAccount: p.sourceIban || p.senderAccount,
      receiverBic: p.receiverBic || p.destinationBic || p.beneficiaryBic,
      receiverAccount: p.destinationIban || p.beneficiaryIban,
      orderingCustomer: p.orderingCustomer || p.sourceHolderName,
      beneficiaryName: p.beneficiaryName || p.destinationHolderName,
      beneficiaryAddress: p.beneficiaryAddress || p.destinationAddress,
      beneficiaryCity: p.beneficiaryCity || p.destinationCity,
      beneficiaryCountry: p.beneficiaryCountry || p.destinationCountry,
      bankOperationCode: p.bankOperationCode,
      detailsOfCharges: p.detailsOfCharges,
      senderToReceiverInfo: p.senderToReceiverInfo || p.purpose,
      purpose: p.purpose,
      rawMessage: message.rawMessage,
      createdAt: message.createdAt,
    });
  };

  if (loading || !message) {
    return (
      <Box>
        <Skeleton width={100} height={36} sx={{ mb: 2 }} />
        <Skeleton variant="rectangular" height={200} sx={{ borderRadius: 1 }} />
      </Box>
    );
  }

  const mtInfo = getMtByCode(message.messageType);
  const isMt = message.rawMessage?.includes('{4:');

  return (
    <Box>
      <Button startIcon={<BackIcon />} onClick={() => navigate(-1)} sx={{ mb: 2 }}>
        Voltar
      </Button>
      <Typography variant="h5" fontWeight={600} gutterBottom>
        {mtInfo?.label || message.messageType} — {mtInfo?.fullName || 'Mensagem SWIFT'}
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Ref: {message.referenceNumber} · Status: {message.status} · {new Date(message.createdAt).toLocaleString('pt-BR')}
      </Typography>

      <Box sx={{ mb: 2, display: 'flex', gap: 1 }}>
        <Button size="small" startIcon={<CopyIcon />} onClick={handleCopy}>
          Copiar
        </Button>
        <Button size="small" startIcon={<DownloadIcon />} onClick={handleDownload}>
          Baixar TXT
        </Button>
        <Button size="small" variant="outlined" startIcon={<PdfIcon />} onClick={handlePdfReceipt}>
          Recibo PDF (VHS)
        </Button>
      </Box>

      {isMt && (
        <Tabs value={viewTab} onChange={(_, v) => setViewTab(v)} sx={{ mb: 2 }}>
          <Tab label="Por tags" />
          <Tab label="Texto bruto" />
        </Tabs>
      )}

      <Paper sx={{ p: 2 }}>
        {isMt && viewTab === 0 ? (
          <MtMessageViewer message={message.rawMessage} messageType={message.messageType} />
        ) : (
          <Box
            component="pre"
            sx={{
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-all',
              fontFamily: 'monospace',
              fontSize: 12,
              overflow: 'auto',
              maxHeight: 500,
            }}
          >
            {message.rawMessage}
          </Box>
        )}
      </Paper>
    </Box>
  );
};

export default MessageViewPage;
