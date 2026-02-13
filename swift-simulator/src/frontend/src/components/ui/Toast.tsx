import React from 'react';
import { Snackbar, Alert, AlertColor, Button, Typography } from '@mui/material';

export interface ToastState {
  open: boolean;
  message: string;
  severity?: AlertColor;
  ref?: string;
  onAction?: () => void;
  actionLabel?: string;
}

interface ToastProps {
  state: ToastState;
  onClose: () => void;
}

const Toast: React.FC<ToastProps> = ({ state, onClose }) => {
  return (
    <Snackbar
      open={state.open}
      autoHideDuration={5000}
      onClose={onClose}
      anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      TransitionProps={{ timeout: 300 }}
    >
      <Alert
        onClose={onClose}
        severity={state.severity || 'info'}
        action={
          state.onAction && state.actionLabel ? (
            <Button color="inherit" size="small" onClick={state.onAction}>
              {state.actionLabel}
            </Button>
          ) : undefined
        }
      >
        {state.message}
        {state.ref && (
          <Typography component="span" variant="body2" sx={{ display: 'block', mt: 0.5 }}>
            Ref: {state.ref}
          </Typography>
        )}
      </Alert>
    </Snackbar>
  );
};

export default Toast;
