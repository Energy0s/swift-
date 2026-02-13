import React, { useState, useRef } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  LinearProgress,
} from '@mui/material';

const STEPS = [
  { progress: 20, label: 'Validando' },
  { progress: 50, label: 'Gerando mensagem' },
  { progress: 80, label: 'Enviando' },
  { progress: 100, label: 'Concluído' },
];

interface TransferProgressModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: (transferId: number, ref: string) => void;
  onError: (message: string) => void;
  onSubmit: () => Promise<{ transferId: number; ref: string }>;
  children: React.ReactNode;
}

const TransferProgressModal: React.FC<TransferProgressModalProps> = ({
  open,
  onClose,
  onSuccess,
  onError,
  onSubmit,
  children,
}) => {
  const [progress, setProgress] = useState(0);
  const [stepLabel, setStepLabel] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const cancelledRef = useRef(false);

  const runFlow = async () => {
    cancelledRef.current = false;
    setSubmitting(true);

    try {
      setStepLabel(STEPS[0].label);
      setProgress(20);
      await new Promise((r) => setTimeout(r, 400));
      if (cancelledRef.current) return;

      setStepLabel(STEPS[1].label);
      setProgress(50);
      await new Promise((r) => setTimeout(r, 400));
      if (cancelledRef.current) return;

      setStepLabel(STEPS[2].label);
      setProgress(80);
      const result = await onSubmit();
      if (cancelledRef.current) return;

      setStepLabel(STEPS[3].label);
      setProgress(100);
      await new Promise((r) => setTimeout(r, 300));
      if (cancelledRef.current) return;

      onSuccess(result.transferId, result.ref);
    } catch (err: any) {
      if (!cancelledRef.current) {
        onError(err.response?.data?.message || 'Erro ao criar transferência');
      }
    } finally {
      if (!cancelledRef.current) setSubmitting(false);
    }
  };

  const handleClose = () => {
    if (submitting) cancelledRef.current = true;
    onClose();
  };

  return (
    <Dialog open={open} onClose={submitting ? undefined : handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>Confirmar transferência</DialogTitle>
      <DialogContent>
        <Box sx={{ py: 1 }}>{children}</Box>
        {submitting && (
          <Box sx={{ mt: 2 }}>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              {stepLabel}
            </Typography>
            <LinearProgress variant="determinate" value={progress} sx={{ height: 8, borderRadius: 1 }} />
          </Box>
        )}
      </DialogContent>
      {!submitting && (
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={handleClose}>Voltar</Button>
          <Button variant="contained" onClick={runFlow}>
            Confirmar e enviar
          </Button>
        </DialogActions>
      )}
    </Dialog>
  );
};

export default TransferProgressModal;
