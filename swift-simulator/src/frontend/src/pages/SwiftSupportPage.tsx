/**
 * Página Support - contatos internos e abertura de ticket
 */

import React from 'react';
import { Box, Typography, Paper } from '@mui/material';

const SwiftSupportPage: React.FC = () => {
  return (
    <Box>
      <Typography variant="h5" fontWeight={600} gutterBottom>
        Support
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Contatos internos e suporte ao módulo SWIFT
      </Typography>
      <Paper sx={{ p: 2 }}>
        <Typography variant="body2" paragraph>
          Para suporte técnico ou abertura de ticket, entre em contato com a equipe interna de operações SWIFT.
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Canal interno: consulte o diretório da instituição
        </Typography>
      </Paper>
    </Box>
  );
};

export default SwiftSupportPage;
