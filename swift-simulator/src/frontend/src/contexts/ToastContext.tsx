import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import Toast, { type ToastState } from '../components/ui/Toast';

interface ToastContextType {
  showSuccess: (message: string, ref?: string, onAction?: () => void, actionLabel?: string) => void;
  showError: (message: string, onRetry?: () => void) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, setState] = useState<ToastState>({ open: false, message: '' });

  const showSuccess = useCallback(
    (message: string, ref?: string, onAction?: () => void, actionLabel?: string) => {
      setState({
        open: true,
        message,
        severity: 'success',
        ref,
        onAction,
        actionLabel,
      });
    },
    []
  );

  const showError = useCallback((message: string, onRetry?: () => void) => {
    setState({
      open: true,
      message,
      severity: 'error',
      onAction: onRetry,
      actionLabel: onRetry ? 'Tentar novamente' : undefined,
    });
  }, []);

  const handleClose = useCallback(() => {
    setState((s) => ({ ...s, open: false }));
  }, []);

  return (
    <ToastContext.Provider value={{ showSuccess, showError }}>
      {children}
      <Toast state={state} onClose={handleClose} />
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
};
