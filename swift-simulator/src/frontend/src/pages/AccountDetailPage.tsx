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
  Skeleton,
} from '@mui/material';
import { ArrowBack as BackIcon, Add as AddIcon } from '@mui/icons-material';
import { useParams, useNavigate } from 'react-router-dom';
import { getAccount, getStatement } from '../services/accountsService';
import { getTransfers } from '../services/transfersService';
import type { Account } from '../services/accountsService';
import type { Transfer } from '../services/transfersService';

const formatDate = (d: string) => new Date(d).toLocaleDateString('pt-BR');
const formatAmount = (v: number, c: string) =>
  new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 2 }).format(v) + ` ${c}`;
const formatIban = (iban: string) => iban.replace(/(.{4})/g, '$1 ').trim();

const AccountDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [account, setAccount] = useState<Account | null>(null);
  const [transfers, setTransfers] = useState<Transfer[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    const load = async () => {
      try {
        const [accRes, trRes] = await Promise.all([
          getAccount(Number(id)),
          getTransfers({ accountId: Number(id), limit: 20 }),
        ]);
        setAccount(accRes.data?.data?.account ?? null);
        setTransfers(trRes.data?.data?.transfers ?? []);
      } catch {
        setAccount(null);
        setTransfers([]);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  const handleDownloadMt940 = async () => {
    if (!id) return;
    try {
      const res = await getStatement(Number(id), 'mt940');
      const blob = new Blob([res.data], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `extrato-${id}-mt940.txt`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      // ignore
    }
  };

  if (loading || !account) {
    return (
      <Box>
        <Skeleton width={100} height={36} sx={{ mb: 2 }} />
        <Skeleton variant="rectangular" height={200} sx={{ borderRadius: 1 }} />
      </Box>
    );
  }

  return (
    <Box>
      <Button startIcon={<BackIcon />} onClick={() => navigate('/dashboard')} sx={{ mb: 2 }}>
        Voltar
      </Button>
      <Typography variant="h5" fontWeight={600} gutterBottom>
        Detalhes da conta
      </Typography>
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="body2">Número: {account.accountNumber}</Typography>
        <Typography variant="body2">IBAN: {formatIban(account.iban)}</Typography>
        <Typography variant="body2">BIC: {account.bic}</Typography>
        <Typography variant="body2" fontWeight={600}>
          Saldo: {formatAmount(account.balance, account.currency)}
        </Typography>
        <Typography variant="body2">Limite diário: {formatAmount(account.dailyLimit, account.currency)}</Typography>
        <Box sx={{ mt: 2, display: 'flex', gap: 1 }}>
          <Button variant="outlined" size="small" onClick={handleDownloadMt940}>
            Extrato MT940
          </Button>
          <Button variant="contained" size="small" startIcon={<AddIcon />} onClick={() => navigate('/transfer')}>
            Nova transferência
          </Button>
        </Box>
      </Paper>

      <Typography variant="subtitle1" fontWeight={600} gutterBottom>
        Transações desta conta
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
                  <Typography color="text.secondary">Nenhuma transação.</Typography>
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
                  <TableCell>{t.status}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};

export default AccountDetailPage;
