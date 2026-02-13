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
} from '@mui/material';
import { Add as AddIcon, Visibility as ViewIcon } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { getMessages } from '../services/messagesService';
import { getMtByCode } from '../constants/swiftMtTypes';
import { PAGAMENTOS, MENSAGENS, TESOURARIA_FX, TRADE_COLLECTIONS, SECURITIES } from '../constants/swiftMtTypes';

const MessagesListPage: React.FC = () => {
  const navigate = useNavigate();
  const [messages, setMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState<string>('');

  useEffect(() => {
    getMessages({ messageType: filterType || undefined, limit: 50 })
      .then((r) => setMessages(r.data?.data?.messages ?? []))
      .catch(() => setMessages([]))
      .finally(() => setLoading(false));
  }, [filterType]);

  const formatDate = (d: string) => new Date(d).toLocaleString('pt-BR');

  if (loading) {
    return (
      <Box>
        <Skeleton width={200} height={40} sx={{ mb: 2 }} />
        <Skeleton variant="rectangular" height={300} sx={{ borderRadius: 1 }} />
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h5" fontWeight={600} gutterBottom>
        Mensagens SWIFT
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Histórico de mensagens geradas
      </Typography>

      <Box sx={{ mb: 2, display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
        <FormControl size="small" sx={{ minWidth: 200 }}>
          <InputLabel>Filtrar por tipo</InputLabel>
          <Select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            label="Filtrar por tipo"
          >
            <MenuItem value="">Todos</MenuItem>
            {PAGAMENTOS.map((mt) => (
              <MenuItem key={mt.code} value={mt.code}>
                {mt.label} — {mt.fullName}
              </MenuItem>
            ))}
            {MENSAGENS.map((mt) => (
              <MenuItem key={mt.code} value={mt.code}>
                {mt.label} — {mt.fullName}
              </MenuItem>
            ))}
            {TESOURARIA_FX.map((mt) => (
              <MenuItem key={mt.code} value={mt.code}>
                {mt.label} — {mt.fullName}
              </MenuItem>
            ))}
            {TRADE_COLLECTIONS.map((mt) => (
              <MenuItem key={mt.code} value={mt.code}>
                {mt.label} — {mt.fullName}
              </MenuItem>
            ))}
            {SECURITIES.map((mt) => (
              <MenuItem key={mt.code} value={mt.code}>
                {mt.label} — {mt.fullName}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => navigate('/dashboard')}
        >
          Usar menu lateral para criar
        </Button>
      </Box>

      <TableContainer component={Paper}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Ref</TableCell>
              <TableCell>Tipo</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Data</TableCell>
              <TableCell align="right">Ações</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {messages.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} align="center" sx={{ py: 4 }}>
                  <Typography color="text.secondary">
                    Nenhuma mensagem encontrada. Use o menu lateral para criar uma nova.
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              messages.map((m) => (
                <TableRow key={m.id} hover>
                  <TableCell sx={{ fontFamily: 'monospace' }}>{m.referenceNumber}</TableCell>
                  <TableCell>
                    {getMtByCode(m.messageType)?.label || m.messageType}
                  </TableCell>
                  <TableCell>
                    <Chip label={m.status} size="small" color={m.status === 'sent' ? 'success' : 'default'} />
                  </TableCell>
                  <TableCell>{formatDate(m.createdAt)}</TableCell>
                  <TableCell align="right">
                    <Button
                      size="small"
                      startIcon={<ViewIcon />}
                      onClick={() => navigate(`/messages/view/${m.id}`)}
                    >
                      Ver
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};

export default MessagesListPage;
