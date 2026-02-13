import React, { useEffect, useState } from 'react';
import {
  Box,
  Typography,
  Button,
  Grid,
  Skeleton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
} from '@mui/material';
import { Add as AddIcon, Message as MessageIcon } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { getAccounts } from '../services/accountsService';
import { getTransfers } from '../services/transfersService';
import type { Account } from '../services/accountsService';
import type { Transfer } from '../services/transfersService';
import AccountCard from '../components/cards/AccountCard';

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

const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [transfers, setTransfers] = useState<Transfer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const load = async () => {
    setError(false);
    setLoading(true);
    try {
      const [accRes, trRes] = await Promise.all([
        getAccounts(),
        getTransfers({ limit: 5 }),
      ]);
      setAccounts(accRes.data?.data?.accounts ?? []);
      setTransfers(trRes.data?.data?.transfers ?? []);
    } catch {
      setAccounts([]);
      setTransfers([]);
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  if (loading) {
    return (
      <Box>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Skeleton width={180} height={40} />
          <Skeleton width={180} height={36} />
        </Box>
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Skeleton variant="rectangular" height={160} sx={{ borderRadius: 1 }} />
          </Grid>
          <Grid item xs={12} md={6}>
            <Skeleton variant="rectangular" height={160} sx={{ borderRadius: 1 }} />
          </Grid>
          <Grid item xs={12}>
            <Skeleton variant="rectangular" height={200} sx={{ borderRadius: 1 }} />
          </Grid>
        </Grid>
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 1 }}>
        <Typography variant="h5" fontWeight={600}>
          Dashboard
        </Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            variant="outlined"
            startIcon={<MessageIcon />}
            onClick={() => navigate('/messages')}
          >
            Mensagens SWIFT
          </Button>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => navigate('/transfer')}
          >
            Nova transferência
          </Button>
        </Box>
      </Box>
      <Grid container spacing={3}>
        {accounts.map((acc) => (
          <Grid item xs={12} md={6} key={acc.id}>
            <AccountCard
              account={acc}
              onViewDetails={(id) => navigate(`/accounts/${id}`)}
            />
          </Grid>
        ))}
        {error && (
          <Grid item xs={12}>
            <Typography color="error" gutterBottom>
              Erro ao carregar. Verifique sua conexão.
            </Typography>
            <Button variant="outlined" size="small" onClick={load}>
              Tentar novamente
            </Button>
          </Grid>
        )}
        {!error && accounts.length === 0 && (
          <Grid item xs={12}>
            <Typography color="text.secondary">Nenhuma conta encontrada.</Typography>
          </Grid>
        )}
        <Grid item xs={12}>
          <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 2 }}>
            Últimas transações
          </Typography>
          <TableContainer component={Paper}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Data</TableCell>
                  <TableCell>Referência</TableCell>
                  <TableCell>Destinatário</TableCell>
                  <TableCell>Valor</TableCell>
                  <TableCell>Status</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {transfers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} align="center" sx={{ py: 3 }}>
                      <Typography color="text.secondary">
                        Nenhuma transação recente.
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
                      <TableCell>{statusLabel[t.status] || t.status}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
          <Button size="small" sx={{ mt: 1 }} onClick={() => navigate('/transactions')}>
            Ver histórico completo
          </Button>
        </Grid>
      </Grid>
    </Box>
  );
};

export default DashboardPage;
