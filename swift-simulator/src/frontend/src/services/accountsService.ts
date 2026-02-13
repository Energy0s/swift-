import api from './api';

export interface Account {
  id: number;
  userId: number;
  accountNumber: string;
  iban: string;
  bic: string;
  balance: number;
  currency: string;
  dailyLimit: number;
  dailyUsed?: number;
}

export const getAccounts = () => {
  return api.get<{ status: string; data: { accounts: Account[] } }>('/accounts');
};

export const getAccount = (id: number) => {
  return api.get<{ status: string; data: { account: Account } }>(`/accounts/${id}`);
};

export const getStatement = (id: number, format = 'mt940') => {
  return api.get(`/accounts/${id}/statement?format=${format}`, {
    responseType: 'text',
  });
};
