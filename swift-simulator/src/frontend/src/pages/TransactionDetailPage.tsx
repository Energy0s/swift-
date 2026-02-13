import React, { useEffect, useState } from 'react';
import {
  Box,
  Typography,
  Button,
  Paper,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Skeleton,
  Chip,
  Stepper,
  Step,
  StepLabel,
  Tabs,
  Tab,
} from '@mui/material';
import { ArrowBack as BackIcon, ContentCopy as CopyIcon, Download as DownloadIcon, Print as PrintIcon } from '@mui/icons-material';
import { useParams, useNavigate } from 'react-router-dom';
import { getTransfer, getSwiftMessage } from '../services/transfersService';
import MtMessageViewer from '../components/swift/MtMessageViewer';

const formatDate = (d: string) => new Date(d).toLocaleString('pt-BR');
const formatAmount = (v: number, c: string) =>
  new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 2 }).format(v) + ` ${c}`;
const statusLabel: Record<string, string> = {
  created: 'Criado',
  pending: 'Pendente',
  processing: 'Processando',
  completed: 'Concluído',
  failed: 'Falhou',
  cancelled: 'Cancelado',
};

const TIMELINE_STEPS = ['Criado', 'Validado', 'Mensagem gerada', 'Enviado', 'Concluído'];
const statusToStep: Record<string, number> = {
  created: 0,
  pending: 1,
  processing: 2,
  completed: 4,
  failed: 2,
  cancelled: 2,
};

const FORMATS = [
  { value: 'xml', label: 'pacs.008 (XML)' },
  { value: 'mt103', label: 'MT103' },
  { value: 'mt202', label: 'MT202' },
  { value: 'sepa-epc-ct', label: 'SEPA' },
  { value: 'cbpr', label: 'CBPR+' },
  { value: 'rtgs', label: 'TARGET2' },
  { value: 'fednow', label: 'FedNow' },
  { value: 'sic-eurosic', label: 'SIC/euroSIC' },
  { value: 'bahtnet', label: 'BAHTNET' },
];

const TransactionDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [transfer, setTransfer] = useState<any>(null);
  const [swiftMessage, setSwiftMessage] = useState('');
  const [format, setFormat] = useState('mt103');
  const [loading, setLoading] = useState(true);
  const [viewTab, setViewTab] = useState(0);

  useEffect(() => {
    if (!id) return;
    getTransfer(Number(id))
      .then((r) => setTransfer(r.data?.data?.transfer))
      .catch(() => setTransfer(null))
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    if (!id || !transfer) return;
    getSwiftMessage(Number(id), format)
      .then((r) => setSwiftMessage(typeof r.data === 'string' ? r.data : ''))
      .catch(() => setSwiftMessage('Erro ao carregar mensagem'));
  }, [id, transfer, format]);

  const handleCopy = () => {
    navigator.clipboard.writeText(swiftMessage);
  };

  const generateComprovante = () => {
    const lines = [
      '=== COMPROVANTE DE TRANSFERÊNCIA SWIFT ===',
      '',
      `Referência: ${transfer.referenceNumber}`,
      `Status: ${statusLabel[transfer.status] || transfer.status}`,
      `Data: ${formatDate(transfer.createdAt)}`,
      '',
      'Origem:',
      `  Conta: ${transfer.sourceAccount?.accountNumber}`,
      `  IBAN: ${transfer.sourceAccount?.iban}`,
      '',
      'Destinatário:',
      `  Nome: ${transfer.destinationHolderName}`,
      `  IBAN: ${transfer.destinationIban}`,
      `  BIC: ${transfer.destinationBic}`,
      '',
      `Valor: ${formatAmount(transfer.amount, transfer.currency)}`,
      `Taxa: ${formatAmount(transfer.fees, transfer.currency)}`,
      `Total debitado: ${formatAmount(transfer.totalAmount, transfer.currency)}`,
      transfer.purpose ? `Propósito: ${transfer.purpose}` : '',
      '',
      '=== FIM DO COMPROVANTE ===',
    ].filter(Boolean);
    return lines.join('\n');
  };

  const handleDownloadComprovante = () => {
    const blob = new Blob([generateComprovante()], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `comprovante-${transfer.referenceNumber}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handlePrintComprovante = () => {
    const content = generateComprovante();
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`<pre style="font-family:monospace;padding:20px;">${content.replace(/</g, '&lt;')}</pre>`);
      printWindow.document.close();
      printWindow.print();
      printWindow.close();
    }
  };

  if (loading || !transfer) {
    return (
      <Box>
        <Skeleton width={100} height={36} sx={{ mb: 2 }} />
        <Skeleton variant="rectangular" height={200} sx={{ borderRadius: 1 }} />
      </Box>
    );
  }

  return (
    <Box>
      <Button startIcon={<BackIcon />} onClick={() => navigate('/transactions')} sx={{ mb: 2 }}>
        Voltar
      </Button>
      <Typography variant="h5" fontWeight={600} gutterBottom>
        Detalhes da transação
      </Typography>
      <Paper sx={{ p: 3, mb: 3 }}>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mb: 2 }}>
          <Chip label={statusLabel[transfer.status] || transfer.status} color="primary" size="small" />
          <Typography variant="body2" color="text.secondary">
            Ref: {transfer.referenceNumber}
          </Typography>
        </Box>
        <Typography variant="body2">Data: {formatDate(transfer.createdAt)}</Typography>
        <Typography variant="body2">Conta origem: {transfer.sourceAccount?.accountNumber}</Typography>
        <Typography variant="body2">Destinatário: {transfer.destinationHolderName}</Typography>
        <Typography variant="body2">IBAN: {transfer.destinationIban}</Typography>
        <Typography variant="body2">BIC: {transfer.destinationBic}</Typography>
        <Typography variant="body2">Valor: {formatAmount(transfer.amount, transfer.currency)}</Typography>
        <Typography variant="body2">Taxa: {formatAmount(transfer.fees, transfer.currency)}</Typography>
        <Typography variant="body2" fontWeight={600}>
          Total: {formatAmount(transfer.totalAmount, transfer.currency)}
        </Typography>
        {transfer.purpose && (
          <Typography variant="body2" color="text.secondary">
            Propósito: {transfer.purpose}
          </Typography>
        )}
        <Box sx={{ mt: 2, display: 'flex', gap: 1 }}>
          <Button
            variant="outlined"
            size="small"
            startIcon={<DownloadIcon />}
            onClick={handleDownloadComprovante}
          >
            Baixar comprovante
          </Button>
          <Button
            variant="outlined"
            size="small"
            startIcon={<PrintIcon />}
            onClick={handlePrintComprovante}
          >
            Imprimir
          </Button>
        </Box>
      </Paper>

      <Typography variant="subtitle1" fontWeight={600} gutterBottom sx={{ mt: 3 }}>
        Status
      </Typography>
      <Paper sx={{ p: 2, mb: 3 }}>
        <Stepper activeStep={statusToStep[transfer.status] ?? 0} alternativeLabel>
          {TIMELINE_STEPS.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>
        <Typography variant="caption" color="text.secondary">
          Criado em {formatDate(transfer.createdAt)} · Atualizado em {formatDate(transfer.updatedAt)}
        </Typography>
      </Paper>

      <Typography variant="subtitle1" fontWeight={600} gutterBottom>
        Mensagem SWIFT
      </Typography>
      <FormControl size="small" sx={{ minWidth: 180, mb: 2 }}>
        <InputLabel>Formato</InputLabel>
        <Select value={format} onChange={(e) => { setFormat(e.target.value); setViewTab(0); }} label="Formato">
          {FORMATS.map((f) => (
            <MenuItem key={f.value} value={f.value}>{f.label}</MenuItem>
          ))}
        </Select>
      </FormControl>
      {(format === 'mt103' || format === 'mt202') && swiftMessage && (
        <Tabs value={viewTab} onChange={(_, v) => setViewTab(v)} sx={{ mb: 2 }}>
          <Tab label="Por tags" />
          <Tab label="Texto bruto" />
        </Tabs>
      )}
      <Paper sx={{ p: 2, position: 'relative' }}>
        <Button
          size="small"
          startIcon={<CopyIcon />}
          onClick={handleCopy}
          sx={{ position: 'absolute', top: 8, right: 8 }}
        >
          Copiar
        </Button>
        {(format === 'mt103' || format === 'mt202') && viewTab === 0 && swiftMessage ? (
          <MtMessageViewer message={swiftMessage} messageType={format.toUpperCase()} />
        ) : (
          <Box
            component="pre"
            sx={{
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-all',
              fontFamily: 'monospace',
              fontSize: 12,
              overflow: 'auto',
              maxHeight: 400,
              pr: 8,
            }}
          >
            {swiftMessage || 'Carregando...'}
          </Box>
        )}
      </Paper>
    </Box>
  );
};

export default TransactionDetailPage;
