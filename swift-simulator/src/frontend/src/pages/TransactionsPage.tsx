import React, { useEffect, useState, useRef } from 'react';
import {
  Box,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Pagination,
  Skeleton,
  TextField,
  InputAdornment,
} from '@mui/material';
import { Search as SearchIcon } from '@mui/icons-material';
import { Add as AddIcon } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { getTransfers } from '../services/transfersService';
import type { Transfer } from '../services/transfersService';

const formatDate = (d: string) => new Date(d).toLocaleDateString('pt-BR');
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

const statusOptions = [
  { value: '', label: 'Todos' },
  { value: 'completed', label: 'Concluído' },
  { value: 'pending', label: 'Pendente' },
  { value: 'failed', label: 'Falhou' },
];

const TransactionsPage: React.FC = () => {
  const navigate = useNavigate();
  const [transfers, setTransfers] = useState<Transfer[]>([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, pages: 0 });
  const [status, setStatus] = useState('');
  const [reference, setReference] = useState('');
  const [referenceDebounced, setReferenceDebounced] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => setReferenceDebounced(reference), 400);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [reference]);

  const load = (page = 1) => {
    setLoading(true);
    setError(false);
    getTransfers({ page, limit: 10, status: status || undefined, reference: referenceDebounced || undefined })
      .then((r) => {
        setTransfers(r.data?.data?.transfers ?? []);
        setPagination(r.data?.data?.pagination ?? { page: 1, limit: 10, total: 0, pages: 0 });
      })
      .catch(() => {
        setTransfers([]);
        setPagination({ page: 1, limit: 10, total: 0, pages: 0 });
        setError(true);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load(1);
  }, [status, referenceDebounced]);

  const handlePageChange = (_: unknown, p: number) => load(p);

  if (loading && transfers.length === 0) {
    return (
      <Box>
        <Skeleton width={200} height={40} sx={{ mb: 2 }} />
        <Skeleton variant="rectangular" height={300} sx={{ borderRadius: 1 }} />
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
        <Typography variant="h5" fontWeight={600}>
          Histórico de transações
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => navigate('/transfer')}
        >
          Nova transferência
        </Button>
      </Box>
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mb: 2 }}>
        <TextField
          size="small"
          placeholder="Buscar por referência"
          value={reference}
          onChange={(e) => setReference(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon fontSize="small" />
              </InputAdornment>
            ),
          }}
          sx={{ minWidth: 220 }}
        />
        <FormControl size="small" sx={{ minWidth: 140 }}>
          <InputLabel>Status</InputLabel>
          <Select value={status} onChange={(e) => setStatus(e.target.value)} label="Status">
            {statusOptions.map((o) => (
              <MenuItem key={o.value || 'all'} value={o.value}>{o.label}</MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Data</TableCell>
              <TableCell>Referência</TableCell>
              <TableCell>Destinatário</TableCell>
              <TableCell>Valor</TableCell>
              <TableCell>Moeda</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Ações</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {error ? (
              <TableRow>
                <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                  <Typography color="error" gutterBottom>
                    Erro ao carregar. Verifique sua conexão.
                  </Typography>
                  <Button variant="outlined" size="small" onClick={() => load(1)}>
                    Tentar novamente
                  </Button>
                </TableCell>
              </TableRow>
            ) : transfers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                  <Typography color="text.secondary">
                    Nenhuma transação encontrada.
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              transfers.map((t) => (
                <TableRow
                  key={t.id}
                  hover
                  sx={{ cursor: 'pointer' }}
                  onClick={() => navigate(`/transactions/${t.id}`)}
                >
                  <TableCell>{formatDate(t.createdAt)}</TableCell>
                  <TableCell>{t.referenceNumber}</TableCell>
                  <TableCell>{t.destinationHolderName}</TableCell>
                  <TableCell>{formatAmount(t.amount, t.currency)}</TableCell>
                  <TableCell>{t.currency}</TableCell>
                  <TableCell>{statusLabel[t.status] || t.status}</TableCell>
                  <TableCell>
                    <Button size="small" onClick={(e) => { e.stopPropagation(); navigate(`/transactions/${t.id}`); }}>
                      Ver detalhes
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 2, flexWrap: 'wrap', gap: 1 }}>
        <Typography variant="caption" color="text.secondary">
          Mostrando {(pagination.page - 1) * pagination.limit + 1}–
          {Math.min(pagination.page * pagination.limit, pagination.total)} de {pagination.total}
        </Typography>
        {pagination.pages > 1 && (
          <Pagination
            count={pagination.pages}
            page={pagination.page}
            onChange={handlePageChange}
            color="primary"
          />
        )}
      </Box>
    </Box>
  );
};

export default TransactionsPage;
