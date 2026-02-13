import React from 'react';
import { Card, CardContent, Typography, Button, Box } from '@mui/material';
import { ContentCopy as CopyIcon } from '@mui/icons-material';
import type { Account } from '../../services/accountsService';

interface AccountCardProps {
  account: Account;
  onViewDetails?: (id: number) => void;
}

const maskAccount = (num: string) => {
  if (num.length <= 4) return num;
  return `•••• ${num.slice(-4)}`;
};

const formatIban = (iban: string) => {
  return iban.replace(/(.{4})/g, '$1 ').trim();
};

const formatBalance = (value: number, currency: string) => {
  return new Intl.NumberFormat('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value) + ` ${currency}`;
};

const AccountCard: React.FC<AccountCardProps> = ({ account, onViewDetails }) => {
  const handleCopy = () => {
    navigator.clipboard.writeText(account.iban);
  };

  return (
    <Card sx={{ height: '100%' }}>
      <CardContent>
        <Typography variant="subtitle2" color="text.secondary" gutterBottom>
          Conta Corrente
        </Typography>
        <Typography variant="h6">{maskAccount(account.accountNumber)}</Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.5 }}>
          <Typography variant="body2" color="text.secondary" fontFamily="monospace">
            {formatIban(account.iban)}
          </Typography>
          <Button size="small" variant="text" sx={{ color: '#6B6B6B', minWidth: 'auto', p: 0.5 }} onClick={handleCopy}>
            <CopyIcon sx={{ fontSize: 14, mr: 0.5 }} />
            Copiar
          </Button>
        </Box>
        <Typography variant="body1" fontWeight={600} sx={{ mt: 1 }}>
          {formatBalance(account.balance, account.currency)}
        </Typography>
        <Typography variant="caption" color="text.secondary">
          BIC: {account.bic}
        </Typography>
        {onViewDetails && (
          <Button size="small" variant="text" sx={{ mt: 1, display: 'block', color: '#006BA6' }} onClick={() => onViewDetails(account.id)}>
            Ver detalhes
          </Button>
        )}
      </CardContent>
    </Card>
  );
};

export default AccountCard;
