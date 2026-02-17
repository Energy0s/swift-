import React, { useEffect, useState } from 'react';
import {
  Box,
  Typography,
  Button,
  Paper,
  Chip,
  Skeleton,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TableContainer,
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
  Receipt as ReceiptIcon,
} from '@mui/icons-material';
import { useParams, useNavigate } from 'react-router-dom';
import { mt109Api, type Mt109Message, type AutoFields, type NetworkReport } from '../services/mt109Service';
import { useToast } from '../contexts/ToastContext';

const Mt109DetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { showSuccess, showError } = useToast();
  const [msg, setMsg] = useState<Mt109Message | null>(null);
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
    mt109Api
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

  const runAction = async (key: string, fn: () => Promise<unknown>, successMsg: string) => {
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

  const formatDate = (d: string) => new Date(d).toLocaleString('pt-BR');
  const formatAmount = (n: number, c: string) =>
    `${c} ${n.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;

  const canEdit = msg?.messageStatus === 'Draft' || msg?.repairRequiredFlag;

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
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2, flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography variant="h5" fontWeight={600} gutterBottom>
            {msg.mtType || 'MT109'} — {msg.transactionReferenceNumber}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {msg.messageId} • Status: {msg.messageStatus}
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
          <Button variant="outlined" startIcon={<ReceiptIcon />} onClick={() => navigate(`/swift/receipts/mt109/${id}`)} size="small">
            Ver Recibo
          </Button>
          {canEdit && (
            <Button variant="outlined" startIcon={<EditIcon />} onClick={() => navigate(`/mt109/${id}/edit`)} disabled={!!actionLoading}>
              Editar
            </Button>
          )}
          {['Draft', 'Validated'].includes(msg.messageStatus) && (
            <>
              <Button variant="outlined" startIcon={<ValidateIcon />} onClick={() => runAction('validate', () => mt109Api.validate(Number(id)), 'Validação concluída')} disabled={!!actionLoading}>
                Validar
              </Button>
              <Button variant="outlined" startIcon={<SubmitIcon />} onClick={() => runAction('submit', () => mt109Api.submitApproval(Number(id)), 'Submetido')} disabled={!!actionLoading}>
                Submeter
              </Button>
            </>
          )}
          {msg.messageStatus === 'Pending Approval' && (
            <Button variant="contained" startIcon={<SubmitIcon />} onClick={() => runAction('approve', () => mt109Api.approve(Number(id)), 'Aprovado')} disabled={!!actionLoading}>
              Submeter
            </Button>
          )}
          {msg.messageStatus === 'Approved' && (
            <Button variant="contained" startIcon={<ReleaseIcon />} onClick={() => runAction('release', () => mt109Api.release(Number(id)), 'Liberado')} disabled={!!actionLoading}>
              Liberar
            </Button>
          )}
          {['Released to SWIFT', 'ACK Received', 'NACK Received'].includes(msg.messageStatus) && (
            <>
              <Button variant="outlined" startIcon={<AckIcon />} onClick={() => runAction('ack', () => mt109Api.ack(Number(id)), 'ACK registrado')} disabled={!!actionLoading}>
                Registrar ACK
              </Button>
              <Button variant="outlined" color="error" startIcon={<NackIcon />} onClick={() => runAction('nack', () => mt109Api.nack(Number(id), 'NACK'), 'NACK registrado')} disabled={!!actionLoading}>
                Registrar NACK
              </Button>
            </>
          )}
          {!['Released to SWIFT', 'ACK Received', 'NACK Received', 'Completed', 'Cancelled'].includes(msg.messageStatus) && (
            <Button variant="outlined" color="error" startIcon={<CancelIcon />} onClick={() => runAction('cancel', () => mt109Api.cancel(Number(id)), 'Cancelamento solicitado')} disabled={!!actionLoading}>
              Cancelar
            </Button>
          )}
          {['Released to SWIFT', 'ACK Received', 'NACK Received', 'Completed'].includes(msg.messageStatus) && (
            <Button variant="outlined" startIcon={<FinIcon />} onClick={() => mt109Api.getFin(Number(id)).then((r) => { setFinContent(r.data?.data?.finMessage || ''); setFinDialogOpen(true); }).catch(() => showError('Erro ao obter FIN'))}>
              Ver FIN
            </Button>
          )}
        </Box>
      </Box>

      <Paper sx={{ p: 2, mb: 2 }}>
        <Typography variant="subtitle2" color="text.secondary" gutterBottom>Message Overview</Typography>
        <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
          <Box><Typography variant="caption" color="text.secondary">MT Type</Typography><Typography>{msg.mtType || 'MT109'}</Typography></Box>
          <Box><Typography variant="caption" color="text.secondary">:20 Reference</Typography><Typography sx={{ fontFamily: 'monospace' }}>{msg.transactionReferenceNumber}</Typography></Box>
          <Box><Typography variant="caption" color="text.secondary">:30 Date of Issue</Typography><Typography>{msg.dateOfIssue}</Typography></Box>
          <Box><Typography variant="caption" color="text.secondary">Status</Typography><Typography><Chip label={msg.messageStatus} size="small" /></Typography></Box>
          <Box><Typography variant="caption" color="text.secondary">:71A Charges</Typography><Typography>{msg.detailsOfCharges}</Typography></Box>
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
        <Typography variant="subtitle2" color="text.secondary" gutterBottom>Ordering Customer (:50)</Typography>
        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 2 }}>
          <Box><Typography variant="caption" color="text.secondary">Name</Typography><Typography>{msg.orderingCustomer?.orderingName || '-'}</Typography></Box>
          <Box><Typography variant="caption" color="text.secondary">Account</Typography><Typography>{msg.orderingCustomer?.orderingAccountNumber || '-'}</Typography></Box>
          <Box><Typography variant="caption" color="text.secondary">Address</Typography><Typography>{msg.orderingCustomer?.addressLine1 || '-'}</Typography></Box>
          <Box><Typography variant="caption" color="text.secondary">Country</Typography><Typography>{msg.orderingCustomer?.country || '-'}</Typography></Box>
        </Box>
      </Paper>

      <Paper sx={{ p: 2, mb: 2 }}>
        <Typography variant="subtitle2" color="text.secondary" gutterBottom>Beneficiary (:59)</Typography>
        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 2 }}>
          <Box><Typography variant="caption" color="text.secondary">Name</Typography><Typography>{msg.beneficiary?.beneficiaryName || '-'}</Typography></Box>
          <Box><Typography variant="caption" color="text.secondary">Account</Typography><Typography>{msg.beneficiary?.beneficiaryAccount || '-'}</Typography></Box>
          <Box><Typography variant="caption" color="text.secondary">Address</Typography><Typography>{msg.beneficiary?.addressLine1 || '-'}</Typography></Box>
          <Box><Typography variant="caption" color="text.secondary">Country</Typography><Typography>{msg.beneficiary?.country || '-'}</Typography></Box>
        </Box>
      </Paper>

      <Paper sx={{ p: 2, mb: 2 }}>
        <Typography variant="subtitle2" color="text.secondary" gutterBottom>Cheque List</Typography>
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Cheque Number</TableCell>
                <TableCell>Currency</TableCell>
                <TableCell align="right">Amount</TableCell>
                <TableCell>Issue Date</TableCell>
                <TableCell>Drawee Bank</TableCell>
                <TableCell>Payee</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {msg.cheques?.map((ch) => (
                <TableRow key={ch.id ?? ch.chequeNumber}>
                  <TableCell sx={{ fontFamily: 'monospace' }}>{ch.chequeNumber}</TableCell>
                  <TableCell>{ch.currency}</TableCell>
                  <TableCell align="right">{formatAmount(ch.chequeAmount, ch.currency)}</TableCell>
                  <TableCell>{ch.chequeIssueDate || msg.dateOfIssue}</TableCell>
                  <TableCell>{ch.draweeBankName || ch.draweeBankBic || '-'}</TableCell>
                  <TableCell>{ch.payeeName || '-'}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {(msg.compliance && Object.keys(msg.compliance).length > 0) && (
        <Paper sx={{ p: 2, mb: 2 }}>
          <Typography variant="subtitle2" color="text.secondary" gutterBottom>Compliance Panel</Typography>
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
            {(msg.compliance as Record<string, unknown>)?.sanctionsScreeningResult && (
              <Box><Typography variant="caption" color="text.secondary">Sanctions Screening</Typography><Typography>{(msg.compliance as Record<string, unknown>).sanctionsScreeningResult as string}</Typography></Box>
            )}
            {(msg.compliance as Record<string, unknown>)?.amlRiskScore != null && (
              <Box><Typography variant="caption" color="text.secondary">AML Risk Score</Typography><Typography>{(msg.compliance as Record<string, unknown>).amlRiskScore as number}</Typography></Box>
            )}
            {(msg.compliance as Record<string, unknown>)?.complianceStatus && (
              <Box><Typography variant="caption" color="text.secondary">Status</Typography><Typography>{(msg.compliance as Record<string, unknown>).complianceStatus as string}</Typography></Box>
            )}
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
        <DialogTitle>Mensagem FIN MT109</DialogTitle>
        <DialogContent>
          <Box component="pre" sx={{ fontFamily: 'monospace', fontSize: '0.75rem', whiteSpace: 'pre-wrap', wordBreak: 'break-all', p: 2, bgcolor: '#f5f5f5', borderRadius: 1 }}>
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
                await mt109Api.attachNetworkReport(Number(id), networkReportRawText.trim());
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

export default Mt109DetailPage;
