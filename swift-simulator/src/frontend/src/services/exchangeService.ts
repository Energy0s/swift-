import api from './api';

export const getRates = (base = 'USD', symbols = 'EUR,GBP,JPY,BRL,CHF') => {
  return api.get<{
    status: string;
    data: {
      base: string;
      rates: Record<string, number>;
      timestamp: string;
    };
  }>(`/exchange/rates?base=${base}&symbols=${symbols}`);
};
