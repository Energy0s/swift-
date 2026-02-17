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
import { Add as AddIcon, Visibility as ViewIcon, Search as SearchIcon } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { mt103Api, type Mt103Message } from '../services/mt103Service';

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

const MT103_TYPES: { value: string; label: string }[] = [
  { value: '', label: 'Todos' },
  { value: 'MT103', label: 'MT103' },
  { value: 'MT103REMIT', label: 'MT103+ (REMIT)' },
  { value: 'MT103STP', label: 'MT103+ (STP)' },
];

const Mt103ListPage: React.FC = () => {
  const navigate = useNavigate();
  const [messages, setMessages] = useState<Mt103Message[]>([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, pages: 0 });
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [mtTypeFilter, setMtTypeFilter] = useState<string>('');
  const [referenceFilter, setReferenceFilter] = useState('');
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    setLoading(true);
    mt103Api
      .list({
        status: statusFilter || undefined,
        mtType: mtTypeFilter || undefined,
        reference: referenceFilter || undefined,
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
  }, [statusFilter, mtTypeFilter, referenceFilter, refreshKey]);

  const formatDate = (d: string) => new Date(d).toLocaleDateString('pt-BR');
  const formatAmount = (m: Mt103Message) =>
    `${m.currency} ${m.interbankSettledAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;

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
            Transferência de Crédito
          </Typography>
          <Typography variant="body2" color="text.secondary">
            MT103 / MT103+ (REMIT) / MT103+ (STP)
          </Typography>
        </Box>
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => navigate('/mt103/new')}>
          Nova mensagem
        </Button>
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
          <FormControl size="small" sx={{ minWidth: 160 }}>
            <InputLabel>MT Type</InputLabel>
            <Select value={mtTypeFilter} onChange={(e) => setMtTypeFilter(e.target.value)} label="MT Type">
              {MT103_TYPES.map((t) => (
                <MenuItem key={t.value || 'all'} value={t.value}>{t.label}</MenuItem>
              ))}
            </Select>
          </FormControl>
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
              <TableCell>MT</TableCell>
              <TableCell>:20 Ref</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>:32A</TableCell>
              <TableCell align="right">Amount</TableCell>
              <TableCell>Ordering</TableCell>
              <TableCell>Beneficiary</TableCell>
              <TableCell align="right">Ações</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {messages.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} align="center" sx={{ py: 4 }}>
                  <Typography color="text.secondary">Nenhuma mensagem encontrada.</Typography>
                  <Button variant="contained" startIcon={<AddIcon />} onClick={() => navigate('/mt103/new')} sx={{ mt: 2 }}>
                    Nova MT103
                  </Button>
                </TableCell>
              </TableRow>
            ) : (
              messages.map((m) => (
                <TableRow key={m.id} hover>
                  <TableCell sx={{ fontFamily: 'monospace', fontWeight: 600 }}>{m.mtType || 'MT103'}</TableCell>
                  <TableCell sx={{ fontFamily: 'monospace' }}>{m.transactionReferenceNumber}</TableCell>
                  <TableCell>
                    <Chip label={m.messageStatus} size="small" color={STATUS_COLORS[m.messageStatus] || 'default'} />
                  </TableCell>
                  <TableCell>{m.valueDate}</TableCell>
                  <TableCell align="right" sx={{ fontFamily: 'monospace' }}>{formatAmount(m)}</TableCell>
                  <TableCell sx={{ maxWidth: 120, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {m.orderingCustomer?.orderingName || m.orderingCustomer?.orderingIban || '-'}
                  </TableCell>
                  <TableCell sx={{ maxWidth: 120, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {m.beneficiaryCustomer?.beneficiaryName || m.beneficiaryCustomer?.beneficiaryIban || '-'}
                  </TableCell>
                  <TableCell align="right">
                    <Button size="small" startIcon={<ViewIcon />} onClick={() => navigate(`/mt103/${m.id}`)}>
                      Ver
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

export default Mt103ListPage;
