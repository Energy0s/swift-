/**
 * Página Outbox SWIFT — mensagens enviadas/pendentes (MT103, MT101, MT109, MT Free)
 */

import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Skeleton,
  Tabs,
  Tab,
} from '@mui/material';
import { mt103Api } from '../services/mt103Service';
import { mt101Api } from '../services/mt101Service';
import { mt109Api } from '../services/mt109Service';
import { mtFreeApi } from '../services/mtFreeService';

interface OutboxRow {
  id: number;
  mtType: string;
  reference20: string;
  status: string;
  createdAt: string;
  route: string;
}

const SwiftOutboxPage: React.FC = () => {
  const navigate = useNavigate();
  const [rows, setRows] = useState<OutboxRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState(0);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      mt103Api.list({ page: 1, limit: 100 }).then((r) => r.data?.data),
      mt101Api.list({ page: 1, limit: 100 }).then((r) => r.data?.data),
      mt109Api.list({ page: 1, limit: 100 }).then((r) => r.data?.data),
      mtFreeApi.list({ page: 1, limit: 100 }).then((r) => r.data?.data),
    ])
      .then(([m103, m101, m109, mFree]) => {
        const list: OutboxRow[] = [];
        (m103?.messages ?? []).forEach((m: { id: number; transactionReferenceNumber?: string; messageStatus: string; createdAt: string }) => {
          list.push({
            id: m.id,
            mtType: 'MT103',
            reference20: m.transactionReferenceNumber ?? '-',
            status: m.messageStatus,
            createdAt: m.createdAt,
            route: 'mt103',
          });
        });
        (m101?.messages ?? []).forEach((m: { id: number; transactionReferenceNumber?: string; messageStatus: string; createdAt: string }) => {
          list.push({
            id: m.id,
            mtType: 'MT101',
            reference20: m.transactionReferenceNumber ?? '-',
            status: m.messageStatus,
            createdAt: m.createdAt,
            route: 'mt101',
          });
        });
        (m109?.messages ?? []).forEach((m: { id: number; transactionReferenceNumber?: string; messageStatus: string; createdAt: string }) => {
          list.push({
            id: m.id,
            mtType: 'MT109',
            reference20: m.transactionReferenceNumber ?? '-',
            status: m.messageStatus,
            createdAt: m.createdAt,
            route: 'mt109',
          });
        });
        (mFree?.messages ?? []).forEach((m: { id: number; transactionReferenceNumber?: string; messageStatus: string; createdAt: string }) => {
          list.push({
            id: m.id,
            mtType: 'MT199',
            reference20: m.transactionReferenceNumber ?? '-',
            status: m.messageStatus,
            createdAt: m.createdAt,
            route: 'free',
          });
        });
        list.sort((a, b) => (b.createdAt > a.createdAt ? 1 : -1));
        setRows(list);
      })
      .catch(() => setRows([]))
      .finally(() => setLoading(false));
  }, []);

  const filtered = tab === 0 ? rows : rows.filter((r) => {
    if (tab === 1) return r.mtType === 'MT103';
    if (tab === 2) return r.mtType === 'MT101';
    if (tab === 3) return r.mtType === 'MT109';
    if (tab === 4) return r.mtType === 'MT199';
    return true;
  });

  const formatDate = (s: string) => {
    try {
      return new Date(s).toLocaleString('pt-BR');
    } catch {
      return s;
    }
  };

  if (loading) {
    return (
      <Box>
        <Skeleton width={300} height={40} sx={{ mb: 2 }} />
        <Skeleton variant="rectangular" height={300} sx={{ borderRadius: 1 }} />
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h5" fontWeight={600} gutterBottom>
        Outbox SWIFT
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Mensagens enviadas e pendentes
      </Typography>
      <Paper sx={{ mb: 2 }}>
        <Tabs value={tab} onChange={(_, v) => setTab(v)}>
          <Tab label="Todos" />
          <Tab label="MT103" />
          <Tab label="MT101" />
          <Tab label="MT109" />
          <Tab label="MT199/299/999" />
        </Tabs>
      </Paper>
      <Paper sx={{ overflow: 'hidden' }}>
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Tipo</TableCell>
                <TableCell>:20</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Criado</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} align="center" sx={{ py: 4, color: 'text.secondary' }}>
                    Nenhuma mensagem
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((r) => (
                  <TableRow
                    key={`${r.route}-${r.id}`}
                    hover
                    sx={{ cursor: 'pointer' }}
                    onClick={() => navigate(`/${r.route}/${r.id}`)}
                  >
                    <TableCell sx={{ fontFamily: 'monospace' }}>{r.mtType}</TableCell>
                    <TableCell sx={{ fontFamily: 'monospace' }}>{r.reference20}</TableCell>
                    <TableCell><Chip label={r.status} size="small" /></TableCell>
                    <TableCell>{formatDate(r.createdAt)}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
    </Box>
  );
};

export default SwiftOutboxPage;
