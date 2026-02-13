import api from './api';

export const validateIban = (iban: string) => {
  return api.post<{
    status: string;
    data: {
      valid: boolean;
      country?: string;
      bankCode?: string;
      accountNumber?: string;
    };
  }>('/validate/iban', { iban });
};

export const validateBic = (bic: string) => {
  return api.post<{
    status: string;
    data: {
      valid: boolean;
      bankName?: string | null;
      city?: string | null;
      country?: string | null;
    };
  }>('/validate/bic', { bic });
};
