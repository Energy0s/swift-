import api from './api';

export interface Bank {
  bic: string;
  name: string;
  city: string;
  country: string;
}

export const searchBanks = (q: string, limit = 20) => {
  return api.get<{ status: string; data: { banks: Bank[] } }>(
    `/banks/search?q=${encodeURIComponent(q)}&limit=${limit}`
  );
};

export const lookupBank = (bic: string) => {
  return api.get<{ status: string; data: { bank: Bank } }>(
    `/banks/lookup?bic=${encodeURIComponent(bic)}`
  );
};
