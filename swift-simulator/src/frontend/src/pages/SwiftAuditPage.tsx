/**
 * Página Audit Log - eventos de auditoria do módulo SWIFT
 */

import React, { useState, useEffect } from 'react';
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
  Skeleton,
} from '@mui/material';
import api from '../services/api';

interface AuditEntry {
  id: number;
  event: string;
  timestamp: string;
  userId?: number;
  userName?: string;
  details?: Record<string, unknown>;
}

const SwiftAuditPage: React.FC = () => {
  const [entries, setEntries] = useState<AuditEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get<{ data?: { entries?: AuditEntry[] } }>('/swift/audit')
      .then((r) => setEntries(r.data?.data?.entries ?? []))
      .catch(() => setEntries([]))
      .finally(() => setLoading(false));
  }, []);

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
        <Skeleton width={200} height={40} sx={{ mb: 2 }} />
        <Skeleton variant="rectangular" height={200} sx={{ borderRadius: 1 }} />
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h5" fontWeight={600} gutterBottom>
        Audit Log
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Eventos de auditoria do módulo SWIFT
      </Typography>
      <Paper>
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Data/Hora</TableCell>
                <TableCell>Evento</TableCell>
                <TableCell>Usuário</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {entries.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={3} align="center">
                    Nenhum registro de auditoria
                  </TableCell>
                </TableRow>
              ) : (
                entries.map((e) => (
                  <TableRow key={e.id}>
                    <TableCell>{formatDate(e.timestamp)}</TableCell>
                    <TableCell>{e.event}</TableCell>
                    <TableCell>{e.userName ?? e.userId ?? '-'}</TableCell>
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

export default SwiftAuditPage;
