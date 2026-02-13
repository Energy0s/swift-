/**
 * Store de bancos (BIC) para busca e autocomplete
 */

import banksData from '../data/banks.json';

export interface Bank {
  bic: string;
  name: string;
  city: string;
  country: string;
}

const banks: Bank[] = Array.isArray(banksData) ? banksData : [];

export function searchBanks(query: string, limit = 20): Bank[] {
  const q = query.replace(/\s/g, '').toUpperCase();
  if (q.length < 2) return [];
  return banks
    .filter(
      (b) =>
        b.bic.toUpperCase().includes(q) ||
        b.name.toUpperCase().includes(q) ||
        b.city.toUpperCase().includes(q) ||
        b.country.toUpperCase().includes(q)
    )
    .slice(0, limit);
}

export function findBankByBic(bic: string): Bank | null {
  const cleanBic = bic.replace(/\s/g, '').toUpperCase();
  const bic8 = cleanBic.substring(0, 8);
  return banks.find((b) => b.bic.toUpperCase().startsWith(bic8) || b.bic.toUpperCase() === cleanBic) ?? null;
}
