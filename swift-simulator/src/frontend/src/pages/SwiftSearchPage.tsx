/**
 * Página de resultados da busca global SWIFT
 */

import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
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
} from '@mui/material';
import { swiftSearch, type SwiftSearchResult, type SwiftSearchType } from '../services/swiftHeaderService';

const SwiftSearchPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const q = searchParams.get('q') || '';
  const type = (searchParams.get('type') || 'ALL') as SwiftSearchType;
  const [results, setResults] = useState<SwiftSearchResult[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!q || q.length < 2) {
      setResults([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    swiftSearch(q, type)
      .then((r) => setResults(r.data?.results ?? []))
      .catch(() => setResults([]))
      .finally(() => setLoading(false));
  }, [q, type]);

  const handleRowClick = (r: SwiftSearchResult) => {
    if (r.direction === 'IN') {
      navigate(`/inbox/${r.messageId}`);
    } else if (r.mtType === 'MT103') {
      navigate(`/mt103/${r.messageId}`);
    } else if (r.mtType === 'MT101') {
      navigate(`/mt101/${r.messageId}`);
    } else if (r.mtType === 'MT109') {
      navigate(`/mt109/${r.messageId}`);
    } else if (['MT199', 'MT299', 'MT999'].includes(r.mtType)) {
      navigate(`/free/${r.messageId}`);
    }
  };

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
        Busca: {q || '(vazio)'}
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        {results.length} resultado(s) encontrado(s)
      </Typography>
      <Paper sx={{ overflow: 'hidden' }}>
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Tipo</TableCell>
                <TableCell>Direção</TableCell>
                <TableCell>:20</TableCell>
                <TableCell>UETR</TableCell>
                <TableCell>BIC Dest.</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Criado</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {results.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 4, color: 'text.secondary' }}>
                    Nenhum resultado
                  </TableCell>
                </TableRow>
              ) : (
                results.map((r) => (
                  <TableRow
                    key={`${r.direction}-${r.messageId}`}
                    hover
                    sx={{ cursor: 'pointer' }}
                    onClick={() => handleRowClick(r)}
                  >
                    <TableCell sx={{ fontFamily: 'monospace' }}>{r.mtType}</TableCell>
                    <TableCell>
                      <Chip label={r.direction} size="small" variant="outlined" />
                    </TableCell>
                    <TableCell sx={{ fontFamily: 'monospace', maxWidth: 120, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {r.reference20 ?? '-'}
                    </TableCell>
                    <TableCell sx={{ fontFamily: 'monospace', fontSize: '0.75rem', maxWidth: 100, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {r.uetr ?? '-'}
                    </TableCell>
                    <TableCell sx={{ fontFamily: 'monospace' }}>{r.receiverBic ?? r.senderBic ?? '-'}</TableCell>
                    <TableCell>
                      <Chip label={r.status} size="small" />
                    </TableCell>
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

export default SwiftSearchPage;
