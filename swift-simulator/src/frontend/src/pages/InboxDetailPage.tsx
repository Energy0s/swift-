import React, { useEffect, useState } from 'react';
import {
  Box,
  Typography,
  Button,
  Paper,
  Chip,
  Skeleton,
  Tabs,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Alert,
} from '@mui/material';
import {
  ArrowBack as BackIcon,
  Refresh as ReparseIcon,
  Flag as ReviewIcon,
  Archive as ArchiveIcon,
} from '@mui/icons-material';
import { useParams, useNavigate } from 'react-router-dom';
import { incomingApi, type IncomingMessage, type IncomingAuditEntry } from '../services/incomingService';
import { useToast } from '../contexts/ToastContext';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel({ children, value, index }: TabPanelProps) {
  return (
    <div role="tabpanel" hidden={value !== index}>
      {value === index && <Box sx={{ py: 2 }}>{children}</Box>}
    </div>
  );
}

const InboxDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { showSuccess, showError } = useToast();
  const [msg, setMsg] = useState<IncomingMessage | null>(null);
  const [auditLog, setAuditLog] = useState<IncomingAuditEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [tabValue, setTabValue] = useState(0);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const load = () => {
    if (!id) return;
    setLoading(true);
    incomingApi
      .get(id)
      .then((r) => {
        setMsg(r.data?.data?.message ?? null);
        setAuditLog(r.data?.data?.auditLog ?? []);
      })
      .catch(() => setMsg(null))
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
      <Button startIcon={<BackIcon />} onClick={() => navigate('/inbox')} sx={{ mb: 2 }}>
        Voltar
      </Button>

      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2, flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography variant="h5" fontWeight={600} gutterBottom>
            Mensagem Recebida — {msg.mtType || 'N/A'}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            ID: {msg.id} • Recebido: {formatDate(msg.receivedAt)}
          </Typography>
          <Box sx={{ display: 'flex', gap: 1, mt: 1, flexWrap: 'wrap' }}>
            <Chip label={msg.status} size="small" color={msg.status === 'PARSE_ERROR' ? 'error' : msg.status === 'REVIEW_REQUIRED' ? 'warning' : 'default'} />
            {msg.status === 'PARSE_ERROR' && msg.parseErrors?.length ? (
              <Chip label="Erros de parse" size="small" color="error" />
            ) : null}
          </Box>
        </Box>
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
          <Button
            variant="outlined"
            startIcon={<ReparseIcon />}
            onClick={() => runAction('reparse', () => incomingApi.reparse(msg.id), 'Reparse concluído')}
            disabled={!!actionLoading}
          >
            Reparse
          </Button>
          <Button
            variant="outlined"
            startIcon={<ReviewIcon />}
            onClick={() => runAction('review', () => incomingApi.markReviewRequired(msg.id), 'Marcado para revisão')}
            disabled={!!actionLoading}
          >
            Mark Review Required
          </Button>
          {msg.status !== 'ARCHIVED' && (
            <Button
              variant="outlined"
              startIcon={<ArchiveIcon />}
              onClick={() => runAction('archive', () => incomingApi.archive(msg.id), 'Arquivado')}
              disabled={!!actionLoading}
            >
              Arquivar
            </Button>
          )}
        </Box>
      </Box>

      <Paper sx={{ mb: 2 }}>
        <Tabs value={tabValue} onChange={(_, v) => setTabValue(v)}>
          <Tab label="Overview" />
          <Tab label="Parsed" />
          <Tab label="Tags" />
          <Tab label="Raw" />
          <Tab label="Audit Trail" />
        </Tabs>

        <TabPanel value={tabValue} index={0}>
          <Box sx={{ p: 2, display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 2 }}>
            <Box>
              <Typography variant="caption" color="text.secondary">MT Type</Typography>
              <Typography>{msg.mtType || '-'}</Typography>
            </Box>
            <Box>
              <Typography variant="caption" color="text.secondary">Status</Typography>
              <Typography>{msg.status}</Typography>
            </Box>
            <Box>
              <Typography variant="caption" color="text.secondary">Sender BIC</Typography>
              <Typography sx={{ fontFamily: 'monospace' }}>{msg.senderBic || '-'}</Typography>
            </Box>
            <Box>
              <Typography variant="caption" color="text.secondary">Receiver BIC</Typography>
              <Typography sx={{ fontFamily: 'monospace' }}>{msg.receiverBic || '-'}</Typography>
            </Box>
            <Box>
              <Typography variant="caption" color="text.secondary">:20 Reference</Typography>
              <Typography sx={{ fontFamily: 'monospace' }}>{msg.ref20 || '-'}</Typography>
            </Box>
            <Box>
              <Typography variant="caption" color="text.secondary">:21 Reference</Typography>
              <Typography sx={{ fontFamily: 'monospace' }}>{msg.ref21 || '-'}</Typography>
            </Box>
            <Box>
              <Typography variant="caption" color="text.secondary">UETR</Typography>
              <Typography sx={{ fontFamily: 'monospace', fontSize: '0.85rem' }}>{msg.uetr || '-'}</Typography>
            </Box>
            <Box>
              <Typography variant="caption" color="text.secondary">Value Date / Amount</Typography>
              <Typography>
                {msg.valueDate || '-'} {msg.currency && msg.amount != null ? `• ${msg.currency} ${msg.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : ''}
              </Typography>
            </Box>
            <Box>
              <Typography variant="caption" color="text.secondary">Ingest Source</Typography>
              <Typography>{msg.ingestSource}</Typography>
            </Box>
            <Box>
              <Typography variant="caption" color="text.secondary">Checksum SHA256</Typography>
              <Typography sx={{ fontFamily: 'monospace', fontSize: '0.75rem', wordBreak: 'break-all' }}>{msg.checksumSha256}</Typography>
            </Box>
          </Box>
          {msg.parseErrors?.length ? (
            <Alert severity="error" sx={{ mx: 2, mb: 2 }}>
              <Typography variant="subtitle2">Erros de parse:</Typography>
              <ul style={{ margin: 0, paddingLeft: 20 }}>
                {msg.parseErrors.map((e, i) => (
                  <li key={i}>{e}</li>
                ))}
              </ul>
            </Alert>
          ) : null}
        </TabPanel>

        <TabPanel value={tabValue} index={1}>
          <Box sx={{ p: 2 }}>
            <Typography
              component="pre"
              sx={{
                fontFamily: 'monospace',
                fontSize: '0.85rem',
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word',
                bgcolor: 'grey.50',
                p: 2,
                borderRadius: 1,
                overflow: 'auto',
                maxHeight: 400,
              }}
            >
              {msg.normalizedText || '(Nenhum texto normalizado)'}
            </Typography>
          </Box>
        </TabPanel>

        <TabPanel value={tabValue} index={2}>
          <Box sx={{ p: 2 }}>
            {msg.normalizedJson?.length ? (
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Tag</TableCell>
                    <TableCell>Value</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {msg.normalizedJson.map((t, i) => (
                    <TableRow key={i}>
                      <TableCell sx={{ fontFamily: 'monospace', fontWeight: 600 }}>:{t.tag}:</TableCell>
                      <TableCell sx={{ fontFamily: 'monospace', whiteSpace: 'pre-wrap' }}>{t.valueLines.join('\n')}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <Typography color="text.secondary">Nenhum tag extraído.</Typography>
            )}
          </Box>
        </TabPanel>

        <TabPanel value={tabValue} index={3}>
          <Box sx={{ p: 2 }}>
            <Typography
              component="pre"
              sx={{
                fontFamily: 'monospace',
                fontSize: '0.8rem',
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word',
                bgcolor: 'grey.100',
                p: 2,
                borderRadius: 1,
                overflow: 'auto',
                maxHeight: 500,
              }}
            >
              {msg.rawPayload}
            </Typography>
          </Box>
        </TabPanel>

        <TabPanel value={tabValue} index={4}>
          <Box sx={{ p: 2 }}>
            {auditLog.length ? (
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Evento</TableCell>
                    <TableCell>Data/Hora</TableCell>
                    <TableCell>Actor</TableCell>
                    <TableCell>Detalhes</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {auditLog.map((e) => (
                    <TableRow key={e.id}>
                      <TableCell>{e.eventType}</TableCell>
                      <TableCell>{formatDate(e.eventTimestamp)}</TableCell>
                      <TableCell>{e.actorUserId ?? 'system'}</TableCell>
                      <TableCell>
                        {e.detailsJson ? (
                          <Typography variant="caption" sx={{ fontFamily: 'monospace' }}>
                            {JSON.stringify(e.detailsJson)}
                          </Typography>
                        ) : '-'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <Typography color="text.secondary">Nenhum evento de auditoria.</Typography>
            )}
          </Box>
        </TabPanel>
      </Paper>
    </Box>
  );
};

export default InboxDetailPage;
