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
import { useParams, useNavigate } from 'react-router-dom';
import { getMessages, type SwiftMessage } from '../services/messagesService';
import { getMtByCode, getGroupByRoute, getGroupByCode } from '../constants/swiftMtTypes';

const STATUS_COLORS: Record<string, 'default' | 'primary' | 'success' | 'warning' | 'error'> = {
  draft: 'default',
  sent: 'success',
  acknowledged: 'primary',
  rejected: 'error',
};

interface PaymentListPageProps {
  title: string;
  subtitle: string;
  codes: string[];
  createPath: string;
  newButtonLabel: string;
}

const PaymentListPage: React.FC<PaymentListPageProps> = ({ title, subtitle, codes, createPath, newButtonLabel }) => {
  const navigate = useNavigate();
  const [messages, setMessages] = useState<SwiftMessage[]>([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, pages: 0 });
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [mtTypeFilter, setMtTypeFilter] = useState<string>('');
  const [referenceFilter, setReferenceFilter] = useState('');
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    setLoading(true);
    const params: any = {
      status: statusFilter || undefined,
      reference: referenceFilter || undefined,
      page: 1,
      limit: 50,
    };
    if (mtTypeFilter) {
      params.messageType = mtTypeFilter;
    } else {
      params.messageTypes = codes;
    }
    getMessages(params)
      .then((r) => {
        const data = r.data?.data;
        const list = data?.messages ?? [];
        setMessages(list);
        setPagination(data?.pagination ?? { page: 1, limit: 20, total: list.length, pages: 1 });
      })
      .catch(() => {
        setMessages([]);
        setPagination({ page: 1, limit: 20, total: 0, pages: 0 });
      })
      .finally(() => setLoading(false));
  }, [codes, statusFilter, mtTypeFilter, referenceFilter, refreshKey]);

  const formatDate = (d: string) => new Date(d).toLocaleDateString('pt-BR');
  const formatAmount = (m: SwiftMessage) => {
    const p = m.payload || {};
    const amt = (p as any).interbankSettledAmount ?? (p as any).amount ?? (p as any).totalAmount ?? 0;
    const curr = (p as any).currency ?? 'EUR';
    return `${curr} ${Number(amt).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
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
            {title}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {subtitle}
          </Typography>
        </Box>
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => navigate(createPath)}>
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
          {codes.length > 1 && (
            <FormControl size="small" sx={{ minWidth: 160 }}>
              <InputLabel>MT Type</InputLabel>
              <Select value={mtTypeFilter} onChange={(e) => setMtTypeFilter(e.target.value)} label="MT Type">
                <MenuItem value="">Todos</MenuItem>
                {codes.map((c) => (
                  <MenuItem key={c} value={c}>{getMtByCode(c)?.label || c}</MenuItem>
                ))}
              </Select>
            </FormControl>
          )}
          <FormControl size="small" sx={{ minWidth: 180 }}>
            <InputLabel>Status</InputLabel>
            <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} label="Status">
              <MenuItem value="">Todos</MenuItem>
              <MenuItem value="draft">Draft</MenuItem>
              <MenuItem value="sent">Sent</MenuItem>
              <MenuItem value="acknowledged">Acknowledged</MenuItem>
              <MenuItem value="rejected">Rejected</MenuItem>
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
                  <Button variant="contained" startIcon={<AddIcon />} onClick={() => navigate(createPath)} sx={{ mt: 2 }}>
                    {newButtonLabel}
                  </Button>
                </TableCell>
              </TableRow>
            ) : (
              messages.map((m) => (
                <TableRow key={m.id} hover>
                  <TableCell sx={{ fontFamily: 'monospace', fontWeight: 600 }}>{m.messageType}</TableCell>
                  <TableCell sx={{ fontFamily: 'monospace' }}>{m.referenceNumber}</TableCell>
                  <TableCell>
                    <Chip label={m.status} size="small" color={STATUS_COLORS[m.status] || 'default'} />
                  </TableCell>
                  <TableCell>{(m.payload as any)?.valueDate || '-'}</TableCell>
                  <TableCell align="right" sx={{ fontFamily: 'monospace' }}>{formatAmount(m)}</TableCell>
                  <TableCell sx={{ maxWidth: 120, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {(m.payload as any)?.orderingCustomer?.orderingName || (m.payload as any)?.orderingName || '-'}
                  </TableCell>
                  <TableCell sx={{ maxWidth: 120, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {(m.payload as any)?.beneficiaryCustomer?.beneficiaryName || (m.payload as any)?.beneficiaryName || '-'}
                  </TableCell>
                  <TableCell align="right">
                    <Button size="small" startIcon={<ViewIcon />} onClick={() => navigate(`/messages/view/${m.id}`)}>
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

const PaymentListPageWrapper: React.FC = () => {
  const { mtCode } = useParams<{ mtCode: string }>();
  const navigate = useNavigate();
  const group = mtCode ? (getGroupByRoute(mtCode) ?? getGroupByCode(mtCode)) : null;
  const mtInfo = mtCode ? getMtByCode(mtCode) : null;

  if (!mtCode) {
    navigate('/messages');
    return null;
  }

  if (group) {
    return (
      <PaymentListPage
        title={group.secondary || group.label}
        subtitle={group.label}
        codes={group.codes}
        createPath={`/messages/${group.route}/new`}
        newButtonLabel={`Nova ${group.route}`}
      />
    );
  }

  if (mtInfo) {
    return (
      <PaymentListPage
        title={mtInfo.fullName}
        subtitle={mtInfo.label}
        codes={[mtInfo.code]}
        createPath={`/messages/${mtCode}/new`}
        newButtonLabel={`Nova ${mtInfo.label}`}
      />
    );
  }

  return (
    <Box>
      <Typography color="error">Tipo MT não encontrado: {mtCode}</Typography>
      <Button onClick={() => navigate(-1)} sx={{ mt: 2 }}>Voltar</Button>
    </Box>
  );
};

export default PaymentListPageWrapper;
