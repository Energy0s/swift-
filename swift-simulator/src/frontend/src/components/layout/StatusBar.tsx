import React, { useState, useEffect } from 'react';
import { Box, Typography } from '@mui/material';
import { AccessTime as ClockIcon, CloudDone as NetworkIcon, ScheduleSend as QueueIcon } from '@mui/icons-material';
import { getTransferStats } from '../../services/transfersService';

/**
 * Barra de status SWIFT — relógio, status da rede, fila de mensagens
 * Design profissional idêntico a sistemas SWIFT Alliance
 */
const StatusBar: React.FC = () => {
  const [time, setTime] = useState(new Date());
  const [stats, setStats] = useState<{ sentToday: number; pending: number } | null>(null);

  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    getTransferStats()
      .then((r) => setStats(r.data?.data ?? null))
      .catch(() => setStats(null));
    const interval = setInterval(() => {
      getTransferStats()
        .then((r) => setStats(r.data?.data ?? null))
        .catch(() => setStats(null));
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  const formatTime = (d: Date) =>
    d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  const formatDate = (d: Date) =>
    d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
  const formatUtc = (d: Date) => d.toISOString().slice(11, 19) + ' UTC';

  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 3,
        px: 2,
        py: 1,
        bgcolor: '#F7F7F7',
        borderBottom: '1px solid #E0E0E0',
        fontSize: '0.75rem',
        color: '#6B6B6B',
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
        <ClockIcon sx={{ fontSize: 14 }} />
        <Typography component="span" variant="caption" fontFamily="monospace">
          {formatDate(time)} {formatTime(time)}
        </Typography>
        <Typography component="span" variant="caption" sx={{ color: '#9E9E9E', ml: 0.5 }}>
          ({formatUtc(time)})
        </Typography>
      </Box>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
        <NetworkIcon sx={{ fontSize: 14, color: '#2E7D32' }} />
        <Typography component="span" variant="caption">
          FIN Core: Operacional
        </Typography>
      </Box>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
        <QueueIcon sx={{ fontSize: 14 }} />
        <Typography component="span" variant="caption">
          Pendentes: {stats?.pending ?? '—'}
        </Typography>
        <Typography component="span" variant="caption">
          Enviadas hoje: {stats?.sentToday ?? '—'}
        </Typography>
      </Box>
    </Box>
  );
};

export default StatusBar;
