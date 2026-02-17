/**
 * Página Runbook - documentação interna do módulo SWIFT
 */

import React from 'react';
import { Box, Typography, Paper, List, ListItem, ListItemText } from '@mui/material';

const SwiftRunbookPage: React.FC = () => {
  const docs = [
    { title: 'MT103 - Single Customer Credit Transfer', path: '/mt103' },
    { title: 'MT101 - Request for Transfer', path: '/mt101' },
    { title: 'MT109 - Advice of Cheque(s)', path: '/mt109' },
    { title: 'MT Free (199/299/999)', path: '/free' },
    { title: 'Inbox - Mensagens recebidas', path: '/inbox' },
    { title: 'Busca global', path: '/swift/search' },
  ];

  return (
    <Box>
      <Typography variant="h5" fontWeight={600} gutterBottom>
        Runbook - Módulo SWIFT
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Documentação interna e procedimentos operacionais
      </Typography>
      <Paper sx={{ p: 2 }}>
        <List dense>
          {docs.map((d) => (
            <ListItem key={d.path}>
              <ListItemText primary={d.title} secondary={d.path} />
            </ListItem>
          ))}
        </List>
      </Paper>
    </Box>
  );
};

export default SwiftRunbookPage;
