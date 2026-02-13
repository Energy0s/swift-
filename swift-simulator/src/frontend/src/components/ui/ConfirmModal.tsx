import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  CircularProgress,
} from '@mui/material';

interface ConfirmModalProps {
  open: boolean;
  title: string;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
  loading?: boolean;
  confirmLabel?: string;
  cancelLabel?: string;
  children: React.ReactNode;
}

const ConfirmModal: React.FC<ConfirmModalProps> = ({
  open,
  title,
  onClose,
  onConfirm,
  loading = false,
  confirmLabel = 'Confirmar',
  cancelLabel = 'Voltar',
  children,
}) => {
  const handleConfirm = async () => {
    await onConfirm();
  };

  return (
    <Dialog open={open} onClose={loading ? undefined : onClose} maxWidth="sm" fullWidth>
      <DialogTitle>{title}</DialogTitle>
      <DialogContent>
        <Box sx={{ py: 1 }}>{children}</Box>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} disabled={loading}>
          {cancelLabel}
        </Button>
        <Button variant="contained" onClick={handleConfirm} disabled={loading}>
          {loading ? <CircularProgress size={24} /> : confirmLabel}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ConfirmModal;
