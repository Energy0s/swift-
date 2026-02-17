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
} from '@mui/material';
import {
  Add as AddIcon,
  Visibility as ViewIcon,
  Search as SearchIcon,
  Delete as DeleteIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { mtFreeApi, type MtFreeMessage } from '../services/mtFreeService';
import { useToast } from '../contexts/ToastContext';

const STATUS_COLORS: Record<string, 'default' | 'primary' | 'success' | 'warning' | 'error'> = {
  Draft: 'default',
  Validated: 'primary',
  'Pending Approval': 'warning',
  Approved: 'primary',
  'Released to SWIFT': 'primary',
  'ACK Received': 'success',
  'NACK Received': 'error',
  Cancelled: 'default',
  Completed: 'success',
};

const MtFreeListPage: React.FC = () => {
  const navigate = useNavigate();
  const { showSuccess, showError } = useToast();
  const [messages, setMessages] = useState<MtFreeMessage[]>([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, pages: 0 });
  const [loading, setLoading] = useState(true);
  const [mtTypeFilter, setMtTypeFilter] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [referenceFilter, setReferenceFilter] = useState('');
  const [senderBicFilter, setSenderBicFilter] = useState('');
  const [receiverBicFilter, setReceiverBicFilter] = useState('');
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    setLoading(true);
    mtFreeApi
      .list({
        mtType: mtTypeFilter || undefined,
        status: statusFilter || undefined,
        reference: referenceFilter || undefined,
        senderBic: senderBicFilter || undefined,
        receiverBic: receiverBicFilter || undefined,
        page: 1,
        limit: 20,
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
  }, [mtTypeFilter, statusFilter, referenceFilter, senderBicFilter, receiverBicFilter, refreshKey]);

  const formatDate = (d: string) => new Date(d).toLocaleDateString('pt-BR');

  const handleDelete = (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm('Excluir esta mensagem?')) return;
    mtFreeApi
      .delete(id)
      .then(() => {
        showSuccess('Mensagem excluída');
        setRefreshKey((k) => k + 1);
      })
      .catch(() => showError('Erro ao excluir'));
  };

  const handleDeleteAll = () => {
    if (!window.confirm('Excluir TODAS as mensagens da lista?')) return;
    mtFreeApi
      .list({ limit: 1000 })
      .then((r) => {
        const list = r.data?.data?.messages ?? [];
        return Promise.all(list.map((m) => mtFreeApi.delete(m.id)));
      })
      .then(() => {
        showSuccess('Todas as mensagens foram excluídas');
        setRefreshKey((k) => k + 1);
      })
      .catch(() => showError('Erro ao excluir'));
  };

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
            Mensagens Livres SWIFT
          </Typography>
          <Typography variant="body2" color="text.secondary">
            MT199 / MT299 / MT999
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          {messages.length > 0 && (
            <Button variant="outlined" color="error" startIcon={<DeleteIcon />} onClick={handleDeleteAll}>
              Excluir todas
            </Button>
          )}
          <Button variant="contained" startIcon={<AddIcon />} onClick={() => navigate('/free/new')}>
            Nova Mensagem
          </Button>
        </Box>
      </Box>

      <Paper sx={{ p: 2, mb: 2 }}>
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
          <TextField
            size="small"
            placeholder="Ref :20"
            value={referenceFilter}
            onChange={(e) => setReferenceFilter(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon fontSize="small" />
                </InputAdornment>
              ),
            }}
            sx={{ minWidth: 180 }}
          />
          <FormControl size="small" sx={{ minWidth: 140 }}>
            <InputLabel>Tipo MT</InputLabel>
            <Select value={mtTypeFilter} onChange={(e) => setMtTypeFilter(e.target.value)} label="Tipo MT">
              <MenuItem value="">Todos</MenuItem>
              <MenuItem value="MT199">MT199</MenuItem>
              <MenuItem value="MT299">MT299</MenuItem>
              <MenuItem value="MT999">MT999</MenuItem>
            </Select>
          </FormControl>
          <TextField
            size="small"
            placeholder="Sender BIC"
            value={senderBicFilter}
            onChange={(e) => setSenderBicFilter(e.target.value.replace(/\s/g, '').toUpperCase())}
            sx={{ minWidth: 140 }}
          />
          <TextField
            size="small"
            placeholder="Receiver BIC"
            value={receiverBicFilter}
            onChange={(e) => setReceiverBicFilter(e.target.value.replace(/\s/g, '').toUpperCase())}
            sx={{ minWidth: 140 }}
          />
          <FormControl size="small" sx={{ minWidth: 180 }}>
            <InputLabel>Status</InputLabel>
            <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} label="Status">
              <MenuItem value="">Todos</MenuItem>
              <MenuItem value="Draft">Draft</MenuItem>
              <MenuItem value="Validated">Validated</MenuItem>
              <MenuItem value="Pending Approval">Pending Approval</MenuItem>
              <MenuItem value="Approved">Approved</MenuItem>
              <MenuItem value="Released to SWIFT">Released to SWIFT</MenuItem>
              <MenuItem value="ACK Received">ACK Received</MenuItem>
              <MenuItem value="NACK Received">NACK Received</MenuItem>
              <MenuItem value="Cancelled">Cancelled</MenuItem>
              <MenuItem value="Completed">Completed</MenuItem>
            </Select>
          </FormControl>
          <Button variant="outlined" onClick={() => setRefreshKey((k) => k + 1)}>
            Filtrar
          </Button>
        </Box>
      </Paper>

      <TableContainer component={Paper}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>MT Type</TableCell>
              <TableCell>:20 Ref</TableCell>
              <TableCell>:21 Related</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Sender BIC</TableCell>
              <TableCell>Receiver BIC</TableCell>
              <TableCell>Created</TableCell>
              <TableCell align="right">Ações</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {messages.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} align="center" sx={{ py: 4 }}>
                  <Typography color="text.secondary">Nenhuma mensagem encontrada.</Typography>
                  <Button variant="contained" startIcon={<AddIcon />} onClick={() => navigate('/free/new')} sx={{ mt: 2 }}>
                    Nova Mensagem
                  </Button>
                </TableCell>
              </TableRow>
            ) : (
              messages.map((m) => (
                <TableRow key={m.id} hover>
                  <TableCell sx={{ fontFamily: 'monospace' }}>{m.mtType}</TableCell>
                  <TableCell sx={{ fontFamily: 'monospace' }}>{m.transactionReferenceNumber}</TableCell>
                  <TableCell sx={{ fontFamily: 'monospace' }}>{m.relatedReference || '-'}</TableCell>
                  <TableCell>
                    <Chip label={m.messageStatus} size="small" color={STATUS_COLORS[m.messageStatus] || 'default'} />
                  </TableCell>
                  <TableCell sx={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>{m.swiftHeader?.senderBic || '-'}</TableCell>
                  <TableCell sx={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>{m.swiftHeader?.receiverBic || '-'}</TableCell>
                  <TableCell>{formatDate(m.createdAt)}</TableCell>
                  <TableCell align="right">
                    <Button size="small" startIcon={<ViewIcon />} onClick={() => navigate(`/free/${m.id}`)}>
                      Ver
                    </Button>
                    <Button size="small" color="error" startIcon={<DeleteIcon />} onClick={(e) => handleDelete(m.id, e)}>
                      Excluir
                    </Button>
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

export default MtFreeListPage;
