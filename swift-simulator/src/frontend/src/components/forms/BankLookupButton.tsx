import React, { useState } from 'react';
import {
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Typography,
  Box,
  CircularProgress,
} from '@mui/material';
import { Search as SearchIcon } from '@mui/icons-material';
import { lookupBank, type Bank } from '../../services/banksService';
import { useToast } from '../../contexts/ToastContext';

interface BankLookupButtonProps {
  /** BIC a ser consultado (8 ou 11 caracteres) */
  bic: string;
  /** Tamanho do botão */
  size?: 'small' | 'medium' | 'large';
  /** Label do botão */
  label?: string;
}

const BankLookupButton: React.FC<BankLookupButtonProps> = ({
  bic,
  size = 'medium',
  label = 'Buscar Banco',
}) => {
  const { showError } = useToast();
  const [loading, setLoading] = useState(false);
  const [bank, setBank] = useState<Bank | null>(null);
  const [open, setOpen] = useState(false);

  const handleClick = async () => {
    const cleanBic = (bic || '').replace(/\s/g, '').toUpperCase();
    if (!cleanBic || cleanBic.length < 8) {
      showError('Informe um BIC válido (8 ou 11 caracteres) para buscar.');
      return;
    }
    setLoading(true);
    setBank(null);
    setOpen(true);
    try {
      const res = await lookupBank(cleanBic);
      const b = res.data?.data?.bank;
      if (b) {
        setBank(b);
      } else {
        showError('BIC não encontrado no banco de dados.');
        setOpen(false);
      }
    } catch {
      showError('Erro ao buscar banco. Verifique o BIC e tente novamente.');
      setOpen(false);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) setOpen(false);
  };

  return (
    <>
      <Button
        variant="outlined"
        size={size}
        startIcon={loading ? <CircularProgress size={18} color="inherit" /> : <SearchIcon />}
        onClick={handleClick}
        disabled={loading}
      >
        {label}
      </Button>
      <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
        <DialogTitle>Dados do Banco Receptor</DialogTitle>
        <DialogContent>
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
              <CircularProgress />
            </Box>
          ) : bank ? (
            <Box sx={{ pt: 1 }}>
              <Typography variant="body1" gutterBottom>
                <strong>BIC:</strong> {bank.bic}
              </Typography>
              <Typography variant="body1" gutterBottom>
                <strong>Nome:</strong> {bank.name}
              </Typography>
              <Typography variant="body1" gutterBottom>
                <strong>Cidade:</strong> {bank.city}
              </Typography>
              <Typography variant="body1">
                <strong>País:</strong> {bank.country}
              </Typography>
            </Box>
          ) : null}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Fechar</Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default BankLookupButton;
