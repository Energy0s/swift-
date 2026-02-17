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
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  InputAdornment,
  IconButton,
} from '@mui/material';
import {
  Visibility as ViewIcon,
  Search as SearchIcon,
  Archive as ArchiveIcon,
  Add as AddIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { incomingApi, type IncomingMessage } from '../services/incomingService';
import { useToast } from '../contexts/ToastContext';

const STATUS_COLORS: Record<string, 'default' | 'primary' | 'success' | 'warning' | 'error'> = {
  RECEIVED: 'default',
  PARSED: 'success',
  PARSE_ERROR: 'error',
  REVIEW_REQUIRED: 'warning',
  ARCHIVED: 'default',
};

const InboxListPage: React.FC = () => {
  const navigate = useNavigate();
  const { showError } = useToast();
  const [messages, setMessages] = useState<IncomingMessage[]>([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, pages: 0 });
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [mtTypeFilter, setMtTypeFilter] = useState<string>('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [freeText, setFreeText] = useState('');
  const [ref20Filter, setRef20Filter] = useState('');
  const [archiving, setArchiving] = useState<string | null>(null);

  const load = () => {
    setLoading(true);
    incomingApi
      .list({
        status: statusFilter || undefined,
        mt_type: mtTypeFilter || undefined,
        date_from: dateFrom || undefined,
        date_to: dateTo || undefined,
        free_text: freeText || undefined,
        ref_20: ref20Filter || undefined,
        page: 1,
        limit: 20,
        sort: 'receivedAt',
        sort_order: 'desc',
      })
      .then((r) => {
        const data = r.data?.data;
        setMessages(data?.messages ?? []);
        setPagination(data?.pagination ?? { page: 1, limit: 20, total: 0, pages: 0 });
      })
      .catch(() => {
        setMessages([]);
        setPagination({ page: 1, limit: 20, total: 0, pages: 0 });
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  const handleArchive = async (id: string) => {
    setArchiving(id);
    try {
      await incomingApi.archive(id);
      load();
    } catch (e: unknown) {
      const err = e as { response?: { data?: { message?: string } } };
      showError(err?.response?.data?.message || 'Erro ao arquivar');
    } finally {
      setArchiving(null);
    }
  };

  const formatDate = (d: string) => new Date(d).toLocaleString('pt-BR');
  const formatAmount = (m: IncomingMessage) =>
    m.currency && m.amount != null
      ? `${m.currency} ${m.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
      : '-';

  if (loading && messages.length === 0) {
    return (
      <Box>
        <Skeleton width={200} height={40} sx={{ mb: 2 }} />
        <Skeleton variant="rectangular" height={300} sx={{ borderRadius: 1 }} />
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2, flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography variant="h5" fontWeight={600} gutterBottom>
            Caixa de Entrada — Mensagens Recebidas
          </Typography>
          <Typography variant="body2" color="text.secondary">
            SWIFT Inbox — Recebimento e visualização
          </Typography>
        </Box>
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => navigate('/inbox/ingest')}>
          Receber Mensagem
        </Button>
      </Box>

      <Paper sx={{ p: 2, mb: 2 }}>
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
          <TextField
            size="small"
            placeholder="Busca livre (texto normalizado/RAW)"
            value={freeText}
            onChange={(e) => setFreeText(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon fontSize="small" />
                </InputAdornment>
              ),
            }}
            sx={{ minWidth: 220 }}
          />
          <TextField
            size="small"
            placeholder=":20 Ref"
            value={ref20Filter}
            onChange={(e) => setRef20Filter(e.target.value)}
            sx={{ minWidth: 140 }}
          />
          <TextField
            size="small"
            type="date"
            label="De"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            InputLabelProps={{ shrink: true }}
            sx={{ minWidth: 140 }}
          />
          <TextField
            size="small"
            type="date"
            label="Até"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            InputLabelProps={{ shrink: true }}
            sx={{ minWidth: 140 }}
          />
          <FormControl size="small" sx={{ minWidth: 140 }}>
            <InputLabel>MT Type</InputLabel>
            <Select value={mtTypeFilter} onChange={(e) => setMtTypeFilter(e.target.value)} label="MT Type">
              <MenuItem value="">Todos</MenuItem>
              <MenuItem value="MT103">MT103</MenuItem>
              <MenuItem value="MT199">MT199</MenuItem>
              <MenuItem value="MT202">MT202</MenuItem>
              <MenuItem value="MT299">MT299</MenuItem>
              <MenuItem value="MT999">MT999</MenuItem>
            </Select>
          </FormControl>
          <FormControl size="small" sx={{ minWidth: 160 }}>
            <InputLabel>Status</InputLabel>
            <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} label="Status">
              <MenuItem value="">Todos</MenuItem>
              <MenuItem value="RECEIVED">RECEIVED</MenuItem>
              <MenuItem value="PARSED">PARSED</MenuItem>
              <MenuItem value="PARSE_ERROR">PARSE_ERROR</MenuItem>
              <MenuItem value="REVIEW_REQUIRED">REVIEW_REQUIRED</MenuItem>
              <MenuItem value="ARCHIVED">ARCHIVED</MenuItem>
            </Select>
          </FormControl>
          <Button variant="outlined" onClick={() => load()}>
            Filtrar
          </Button>
        </Box>
      </Paper>

      <TableContainer component={Paper}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Received At</TableCell>
              <TableCell>MT Type</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Sender BIC</TableCell>
              <TableCell>Receiver BIC</TableCell>
              <TableCell>:20 Ref</TableCell>
              <TableCell>UETR</TableCell>
              <TableCell align="right">Amount</TableCell>
              <TableCell align="right">Ações</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {messages.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} align="center" sx={{ py: 4 }}>
                  <Typography color="text.secondary">Nenhuma mensagem recebida.</Typography>
                  <Button variant="contained" startIcon={<AddIcon />} onClick={() => navigate('/inbox/ingest')} sx={{ mt: 2 }}>
                    Receber Mensagem
                  </Button>
                </TableCell>
              </TableRow>
            ) : (
              messages.map((m) => (
                <TableRow key={m.id} hover>
                  <TableCell sx={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>{formatDate(m.receivedAt)}</TableCell>
                  <TableCell>{m.mtType || '-'}</TableCell>
                  <TableCell>
                    <Chip
                      label={m.status}
                      size="small"
                      color={STATUS_COLORS[m.status] || 'default'}
                    />
                    {m.status === 'PARSE_ERROR' && (
                      <Chip label="Parse Error" size="small" color="error" sx={{ ml: 0.5 }} />
                    )}
                    {m.status === 'REVIEW_REQUIRED' && (
                      <Chip label="Review" size="small" color="warning" sx={{ ml: 0.5 }} />
                    )}
                  </TableCell>
                  <TableCell sx={{ fontFamily: 'monospace' }}>{m.senderBic || '-'}</TableCell>
                  <TableCell sx={{ fontFamily: 'monospace' }}>{m.receiverBic || '-'}</TableCell>
                  <TableCell sx={{ fontFamily: 'monospace' }}>{m.ref20 || '-'}</TableCell>
                  <TableCell sx={{ fontFamily: 'monospace', fontSize: '0.75rem' }}>{m.uetr ? m.uetr.slice(0, 12) + '…' : '-'}</TableCell>
                  <TableCell align="right" sx={{ fontFamily: 'monospace' }}>{formatAmount(m)}</TableCell>
                  <TableCell align="right">
                    <Button size="small" startIcon={<ViewIcon />} onClick={() => navigate(`/inbox/${m.id}`)}>
                      Abrir
                    </Button>
                    {m.status !== 'ARCHIVED' && (
                      <IconButton
                        size="small"
                        onClick={() => handleArchive(m.id)}
                        disabled={archiving === m.id}
                        title="Arquivar"
                      >
                        <ArchiveIcon fontSize="small" />
                      </IconButton>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>
      {pagination.total > 0 && (
        <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
          {pagination.total} registro(s)
        </Typography>
      )}
    </Box>
  );
};

export default InboxListPage;
