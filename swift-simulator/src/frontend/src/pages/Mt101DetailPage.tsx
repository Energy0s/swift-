import React, { useEffect, useState } from 'react';
import {
  Box,
  Typography,
  Button,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Skeleton,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  Edit as EditIcon,
  CheckCircle as ValidateIcon,
  Send as SubmitIcon,
  RocketLaunch as ReleaseIcon,
  Cancel as CancelIcon,
  Check as AckIcon,
  Close as NackIcon,
  Description as FinIcon,
  PictureAsPdf as PdfIcon,
  Receipt as ReceiptIcon,
} from '@mui/icons-material';
import { useParams, useNavigate } from 'react-router-dom';
import { mt101Api, type Mt101Message, type AutoFields, type NetworkReport } from '../services/mt101Service';
import { useToast } from '../contexts/ToastContext';
import { downloadSwiftReceipt } from '../services/swiftReceiptPdf';

const Mt101DetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { showSuccess, showError } = useToast();
  const [msg, setMsg] = useState<Mt101Message | null>(null);
  const [autoFields, setAutoFields] = useState<AutoFields | null>(null);
  const [networkReport, setNetworkReport] = useState<NetworkReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [finDialogOpen, setFinDialogOpen] = useState(false);
  const [finContent, setFinContent] = useState('');
  const [networkReportDialogOpen, setNetworkReportDialogOpen] = useState(false);
  const [networkReportRawText, setNetworkReportRawText] = useState('');

  const load = () => {
    if (!id) return;
    setLoading(true);
    mt101Api
      .get(Number(id))
      .then((r) => {
        const d = r.data?.data;
        setMsg(d?.message ?? null);
        setAutoFields(d?.auto_fields ?? null);
        setNetworkReport(d?.network_report ?? null);
      })
      .catch(() => {
        setMsg(null);
        setAutoFields(null);
        setNetworkReport(null);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, [id]);

  const runAction = async (
    key: string,
    fn: () => Promise<unknown>,
    successMsg: string
  ) => {
    setActionLoading(key);
    try {
      await fn();
      showSuccess(successMsg);
      load();
    } catch (e: unknown) {
      const err = e as { response?: { data?: { message?: string } } };
      showError(err?.response?.data?.message || 'Erro ao executar ação');
    } finally {
      setActionLoading(null);
    }
  };

  const handleValidate = () =>
    runAction('validate', () => mt101Api.validate(Number(id)), 'Validação concluída');

  const handleSubmitApproval = () =>
    runAction('submit', () => mt101Api.submitApproval(Number(id)), 'Submetido');

  const handleApprove = () =>
    runAction('approve', () => mt101Api.approve(Number(id)), 'Aprovado');

  const handleRelease = () =>
    runAction('release', () => mt101Api.release(Number(id)), 'Liberado para SWIFT');

  const handleAck = () =>
    runAction('ack', () => mt101Api.ack(Number(id)), 'ACK registrado');

  const handleNack = () =>
    runAction('nack', () => mt101Api.nack(Number(id), 'NACK'), 'NACK registrado');

  const handleCancel = () =>
    runAction('cancel', () => mt101Api.cancel(Number(id)), 'Cancelamento solicitado');

  const handleViewFin = () => {
    mt101Api
      .getFin(Number(id))
      .then((r) => {
        setFinContent(r.data?.data?.finMessage || '');
        setFinDialogOpen(true);
      })
      .catch(() => showError('Erro ao obter FIN'));
  };

  const canEdit = msg?.messageStatus === 'Draft' || msg?.repairRequiredFlag;
  const formatDate = (d: string) => new Date(d).toLocaleString('pt-BR');
  const formatAmount = (n: number, c: string) =>
    `${c} ${n.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;

  if (loading || !msg) {
    return (
      <Box>
        <Skeleton width={300} height={40} sx={{ mb: 2 }} />
        <Skeleton variant="rectangular" height={400} sx={{ borderRadius: 1 }} />
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h5" fontWeight={600} gutterBottom>
        Transferência Múltipla
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        MT101 / MT102 / MT102+ (STP)
      </Typography>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2, flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography variant="h6" fontWeight={600} gutterBottom>
            {msg.mtType || 'MT101'} — {msg.transactionReferenceNumber}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {msg.messageId} • Status: {msg.messageStatus}
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
          <Button variant="outlined" startIcon={<ReceiptIcon />} onClick={() => navigate(`/swift/receipts/mt101/${id}`)} size="small">
            Ver Recibo
          </Button>
          {canEdit && (
            <Button
              variant="outlined"
              startIcon={<EditIcon />}
              onClick={() => navigate(`/mt101/${id}/edit`)}
              disabled={!!actionLoading}
            >
              Editar
            </Button>
          )}
          {['Draft', 'Validated'].includes(msg.messageStatus) && (
            <>
              <Button
                variant="outlined"
                startIcon={<ValidateIcon />}
                onClick={handleValidate}
                disabled={!!actionLoading}
              >
                Validar
              </Button>
              <Button
                variant="outlined"
                startIcon={<SubmitIcon />}
                onClick={handleSubmitApproval}
                disabled={!!actionLoading}
              >
                Submeter
              </Button>
            </>
          )}
          {msg.messageStatus === 'Pending Approval' && (
            <Button
              variant="contained"
              startIcon={<SubmitIcon />}
              onClick={handleApprove}
              disabled={!!actionLoading}
            >
              Submeter
            </Button>
          )}
          {msg.messageStatus === 'Approved' && (
            <Button
              variant="contained"
              startIcon={<ReleaseIcon />}
              onClick={handleRelease}
              disabled={!!actionLoading}
            >
              Liberar
            </Button>
          )}
          {['Released to SWIFT', 'ACK Received', 'NACK Received'].includes(msg.messageStatus) && (
            <>
              <Button
                variant="outlined"
                startIcon={<AckIcon />}
                onClick={handleAck}
                disabled={!!actionLoading}
              >
                Registrar ACK
              </Button>
              <Button
                variant="outlined"
                color="error"
                startIcon={<NackIcon />}
                onClick={handleNack}
                disabled={!!actionLoading}
              >
                Registrar NACK
              </Button>
            </>
          )}
          {!['Released to SWIFT', 'ACK Received', 'NACK Received', 'Completed', 'Cancelled'].includes(msg.messageStatus) && (
            <Button
              variant="outlined"
              color="error"
              startIcon={<CancelIcon />}
              onClick={handleCancel}
              disabled={!!actionLoading}
            >
              Cancelar
            </Button>
          )}
          {['Released to SWIFT', 'ACK Received', 'NACK Received', 'Completed'].includes(msg.messageStatus) && (
            <>
              <Button variant="outlined" startIcon={<FinIcon />} onClick={handleViewFin}>
                Ver FIN
              </Button>
              <Button
                variant="outlined"
                startIcon={<PdfIcon />}
                onClick={() => {
                  const tx = msg.transactions[0];
                  downloadSwiftReceipt({
                    messageType: msg.mtType || 'MT101',
                    reference: msg.transactionReferenceNumber,
                    valueDate: msg.executionDetails?.requestedExecutionDate,
                    amount: tx?.amount,
                    currency: tx?.currency,
                    senderBic: 'BOMGBRS1XXX',
                    receiverBic: msg.swiftHeader?.receiverBic,
                    orderingCustomer: msg.orderingCustomer?.orderingCustomerName,
                    beneficiaryName: tx?.beneficiaryName,
                    beneficiaryAddress: tx?.beneficiaryAddressLine1,
                    beneficiaryCity: tx?.beneficiaryCity,
                    beneficiaryCountry: tx?.beneficiaryCountry,
                    detailsOfCharges: tx?.chargesType,
                    senderToReceiverInfo: tx?.remittanceInformation,
                    rawMessage: msg.finMessage,
                    createdAt: msg.createdAt,
                  });
                }}
              >
                Recibo PDF (VHS)
              </Button>
            </>
          )}
        </Box>
      </Box>

      <Paper sx={{ p: 2, mb: 2 }}>
        <Typography variant="subtitle2" color="text.secondary" gutterBottom>
          Message Overview
        </Typography>
        <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
          <Box>
            <Typography variant="caption" color="text.secondary">MT Type</Typography>
            <Typography>{msg.mtType || 'MT101'}</Typography>
          </Box>
          <Box>
            <Typography variant="caption" color="text.secondary">:20 Reference</Typography>
            <Typography sx={{ fontFamily: 'monospace' }}>{msg.transactionReferenceNumber}</Typography>
          </Box>
          <Box>
            <Typography variant="caption" color="text.secondary">Status</Typography>
            <Typography><Chip label={msg.messageStatus} size="small" /></Typography>
          </Box>
          <Box>
            <Typography variant="caption" color="text.secondary">Execution Date</Typography>
            <Typography>{formatDate(msg.executionDetails?.requestedExecutionDate || '')}</Typography>
          </Box>
          <Box>
            <Typography variant="caption" color="text.secondary">Total Transactions</Typography>
            <Typography>{msg.transactions.length}</Typography>
          </Box>
          <Box>
            <Typography variant="caption" color="text.secondary">Total Amount</Typography>
            <Typography sx={{ fontFamily: 'monospace' }}>
              {msg.transactions.reduce((s, t) => s + t.amount, 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}{' '}
              {msg.transactions[0]?.currency || ''}
            </Typography>
          </Box>
        </Box>
      </Paper>

      <Paper sx={{ p: 2, mb: 2 }}>
        <Typography variant="subtitle2" color="text.secondary" gutterBottom>Header SWIFT</Typography>
        <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
          <Box><Typography variant="caption" color="text.secondary">Sender BIC</Typography><Typography sx={{ fontFamily: 'monospace' }}>{msg.swiftHeader?.logicalTerminal || msg.swiftHeader?.senderBic || '-'}</Typography></Box>
          <Box><Typography variant="caption" color="text.secondary">Receiver BIC</Typography><Typography sx={{ fontFamily: 'monospace' }}>{msg.swiftHeader?.receiverBic || '-'}</Typography></Box>
          <Box><Typography variant="caption" color="text.secondary">Priority</Typography><Typography>{msg.swiftHeader?.messagePriority || 'N'}</Typography></Box>
          {(msg.swiftHeader?.sessionNumber || autoFields?.session_number) && <Box><Typography variant="caption" color="text.secondary">Session</Typography><Typography sx={{ fontFamily: 'monospace' }}>{msg.swiftHeader?.sessionNumber || autoFields?.session_number || '-'}</Typography></Box>}
          {(msg.swiftHeader?.sequenceNumber || autoFields?.sequence_number) && <Box><Typography variant="caption" color="text.secondary">Sequence</Typography><Typography sx={{ fontFamily: 'monospace' }}>{msg.swiftHeader?.sequenceNumber || autoFields?.sequence_number || '-'}</Typography></Box>}
          {(msg.swiftHeader?.uetr || autoFields?.uetr) && <Box><Typography variant="caption" color="text.secondary">UETR</Typography><Typography sx={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>{msg.swiftHeader?.uetr || autoFields?.uetr || '-'}</Typography></Box>}
          {(msg.swiftHeader?.chk || networkReport?.chk) && <Box><Typography variant="caption" color="text.secondary">CHK</Typography><Typography sx={{ fontFamily: 'monospace' }}>{msg.swiftHeader?.chk || networkReport?.chk || '-'}</Typography></Box>}
        </Box>
      </Paper>

      {autoFields && (
        <Paper sx={{ p: 2, mb: 2 }}>
          <Typography variant="subtitle2" color="text.secondary" gutterBottom>Auto Fields (Generated)</Typography>
          <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
            <Box><Typography variant="caption" color="text.secondary">Sender LT</Typography><Typography sx={{ fontFamily: 'monospace' }}>{autoFields.sender_lt}</Typography></Box>
            <Box><Typography variant="caption" color="text.secondary">Session</Typography><Typography sx={{ fontFamily: 'monospace' }}>{autoFields.session_number}</Typography></Box>
            <Box><Typography variant="caption" color="text.secondary">Sequence</Typography><Typography sx={{ fontFamily: 'monospace' }}>{autoFields.sequence_number}</Typography></Box>
            <Box><Typography variant="caption" color="text.secondary">UETR</Typography><Typography sx={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>{autoFields.uetr}</Typography></Box>
            {autoFields.mur_108 && <Box><Typography variant="caption" color="text.secondary">MUR</Typography><Typography sx={{ fontFamily: 'monospace' }}>{autoFields.mur_108}</Typography></Box>}
            {autoFields.stp_119 && <Box><Typography variant="caption" color="text.secondary">STP</Typography><Typography sx={{ fontFamily: 'monospace' }}>{autoFields.stp_119}</Typography></Box>}
          </Box>
        </Paper>
      )}

      {networkReport && (
        <Paper sx={{ p: 2, mb: 2 }}>
          <Typography variant="subtitle2" color="text.secondary" gutterBottom>Network Report (Received)</Typography>
          <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap', mb: 2 }}>
            {networkReport.chk && <Box><Typography variant="caption" color="text.secondary">CHK</Typography><Typography sx={{ fontFamily: 'monospace' }}>{networkReport.chk}</Typography></Box>}
            {networkReport.tracking && <Box><Typography variant="caption" color="text.secondary">Tracking</Typography><Typography sx={{ fontFamily: 'monospace' }}>{networkReport.tracking}</Typography></Box>}
            {networkReport.pki_signature && <Box><Typography variant="caption" color="text.secondary">PKI Signature</Typography><Typography sx={{ fontFamily: 'monospace' }}>{networkReport.pki_signature}</Typography></Box>}
            {networkReport.access_code && <Box><Typography variant="caption" color="text.secondary">Access Code</Typography><Typography sx={{ fontFamily: 'monospace' }}>{networkReport.access_code}</Typography></Box>}
            {networkReport.release_code && <Box><Typography variant="caption" color="text.secondary">Release Code</Typography><Typography sx={{ fontFamily: 'monospace' }}>{networkReport.release_code}</Typography></Box>}
            {networkReport.category && <Box><Typography variant="caption" color="text.secondary">Category</Typography><Typography>{networkReport.category}</Typography></Box>}
            {networkReport.creation_time && <Box><Typography variant="caption" color="text.secondary">Creation Time</Typography><Typography>{new Date(networkReport.creation_time).toLocaleString('pt-BR')}</Typography></Box>}
            {networkReport.application && <Box><Typography variant="caption" color="text.secondary">Application</Typography><Typography>{networkReport.application}</Typography></Box>}
            {networkReport.operator && <Box><Typography variant="caption" color="text.secondary">Operator</Typography><Typography>{networkReport.operator}</Typography></Box>}
          </Box>
          {networkReport.raw_text && (
            <Box>
              <Typography variant="caption" color="text.secondary" display="block" gutterBottom>Raw report text</Typography>
              <Box component="pre" sx={{ fontFamily: 'monospace', fontSize: '0.75rem', whiteSpace: 'pre-wrap', wordBreak: 'break-all', p: 1.5, bgcolor: '#f5f5f5', borderRadius: 1 }}>
                {networkReport.raw_text}
              </Box>
            </Box>
          )}
        </Paper>
      )}

      <Paper sx={{ p: 2, mb: 2 }}>
        <Typography variant="subtitle2" color="text.secondary" gutterBottom sx={{ mb: 1 }}>Anexar Network Report</Typography>
        <Button size="small" variant="outlined" onClick={() => setNetworkReportDialogOpen(true)}>
          Colar report do gateway
        </Button>
      </Paper>

      <Paper sx={{ p: 2, mb: 2 }}>
        <Typography variant="subtitle2" color="text.secondary" gutterBottom>
          Ordering Party (Debtor)
        </Typography>
        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 2 }}>
          <Box><Typography variant="caption" color="text.secondary">Name</Typography><Typography>{msg.orderingCustomer?.orderingCustomerName || '-'}</Typography></Box>
          <Box><Typography variant="caption" color="text.secondary">IBAN</Typography><Typography sx={{ fontFamily: 'monospace' }}>{msg.orderingCustomer?.orderingIban || '-'}</Typography></Box>
          <Box><Typography variant="caption" color="text.secondary">Account</Typography><Typography>{msg.orderingCustomer?.orderingAccountNumber || '-'}</Typography></Box>
          <Box><Typography variant="caption" color="text.secondary">Address</Typography><Typography>{msg.orderingCustomer?.addressLine1 || '-'}</Typography></Box>
          <Box><Typography variant="caption" color="text.secondary">City</Typography><Typography>{msg.orderingCustomer?.city || '-'}</Typography></Box>
          <Box><Typography variant="caption" color="text.secondary">Country</Typography><Typography>{msg.orderingCustomer?.country || '-'}</Typography></Box>
        </Box>
      </Paper>

      <Paper sx={{ p: 2, mb: 2 }}>
        <Typography variant="subtitle2" color="text.secondary" gutterBottom>
          Transaction Table
        </Typography>
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Seq</TableCell>
                <TableCell>Currency</TableCell>
                <TableCell align="right">Amount</TableCell>
                <TableCell>Beneficiary</TableCell>
                <TableCell>Account/IBAN</TableCell>
                <TableCell>BIC</TableCell>
                <TableCell>Charges</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {msg.transactions.map((t) => (
                <TableRow key={t.id}>
                  <TableCell>{t.sequenceNumber}</TableCell>
                  <TableCell>{t.currency}</TableCell>
                  <TableCell align="right" sx={{ fontFamily: 'monospace' }}>{formatAmount(t.amount, t.currency)}</TableCell>
                  <TableCell>{t.beneficiaryName || '-'}</TableCell>
                  <TableCell sx={{ fontFamily: 'monospace', fontSize: '0.75rem' }}>{t.beneficiaryIban || t.beneficiaryAccountNumber || '-'}</TableCell>
                  <TableCell sx={{ fontFamily: 'monospace' }}>{t.beneficiaryBankBic || '-'}</TableCell>
                  <TableCell>{t.chargesType}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {msg.compliance && Object.keys(msg.compliance).length > 0 && (
        <Paper sx={{ p: 2, mb: 2 }}>
          <Typography variant="subtitle2" color="text.secondary" gutterBottom>
            Compliance Panel
          </Typography>
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
            {msg.compliance.amlRiskScore !== undefined && <Chip label={`AML: ${msg.compliance.amlRiskScore}`} size="small" />}
            {msg.compliance.manualReviewRequired && <Chip label="Manual Review" size="small" color="warning" />}
          </Box>
        </Paper>
      )}

      <Accordion>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography variant="subtitle2">Audit Trail</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            {msg.auditLog?.map((a) => (
              <Box key={a.id} sx={{ display: 'flex', gap: 2, alignItems: 'center', fontSize: '0.8rem' }}>
                <Typography variant="caption" color="text.secondary">{formatDate(a.timestamp)}</Typography>
                <Chip label={a.event} size="small" />
                {a.userName && <Typography variant="caption">por {a.userName}</Typography>}
              </Box>
            ))}
            {(!msg.auditLog || msg.auditLog.length === 0) && (
              <Typography variant="body2" color="text.secondary">Nenhum evento registrado</Typography>
            )}
          </Box>
        </AccordionDetails>
      </Accordion>

      <Dialog open={finDialogOpen} onClose={() => setFinDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Mensagem FIN {msg.mtType || 'MT101'}</DialogTitle>
        <DialogContent>
          <Box
            component="pre"
            sx={{
              fontFamily: 'monospace',
              fontSize: '0.75rem',
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-all',
              p: 2,
              bgcolor: '#f5f5f5',
              borderRadius: 1,
            }}
          >
            {finContent}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setFinDialogOpen(false)}>Fechar</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={networkReportDialogOpen} onClose={() => setNetworkReportDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Anexar Network Report</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            multiline
            rows={12}
            placeholder="Cole aqui o texto completo do Message Trailer / Network Report recebido do gateway..."
            value={networkReportRawText}
            onChange={(e) => setNetworkReportRawText(e.target.value)}
            sx={{ mt: 1 }}
            inputProps={{ style: { fontFamily: 'monospace', fontSize: '0.8rem' } }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setNetworkReportDialogOpen(false)}>Cancelar</Button>
          <Button
            variant="contained"
            onClick={async () => {
              if (!id || !networkReportRawText.trim()) return;
              try {
                await mt101Api.attachNetworkReport(Number(id), networkReportRawText.trim());
                showSuccess('Network report anexado');
                setNetworkReportDialogOpen(false);
                setNetworkReportRawText('');
                load();
              } catch (e: unknown) {
                const err = e as { response?: { data?: { message?: string } } };
                showError(err?.response?.data?.message || 'Erro ao anexar');
              }
            }}
            disabled={!networkReportRawText.trim()}
          >
            Anexar
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Mt101DetailPage;
