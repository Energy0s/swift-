/**
 * Store de contas com persistência em JSON
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';

export interface Account {
  id: number;
  userId: number;
  accountNumber: string;
  iban: string;
  bic: string;
  balance: number;
  currency: string;
  dailyLimit: number;
}

const DATA_DIR = join(process.cwd(), 'data');
const ACCOUNTS_FILE = join(DATA_DIR, 'accounts.json');

interface AccountsData {
  accounts: Account[];
  accountIdCounter: number;
}

let accounts: Account[] = [];
let accountIdCounter = 1;

function loadData(): void {
  try {
    if (existsSync(ACCOUNTS_FILE)) {
      const raw = readFileSync(ACCOUNTS_FILE, 'utf-8');
      const data: AccountsData = JSON.parse(raw);
      accounts = data.accounts || [];
      accountIdCounter = data.accountIdCounter ?? Math.max(1, ...accounts.map((a) => a.id), 0) + 1;
    }
  } catch {
    accounts = [];
  }
}

function saveData(): void {
  try {
    if (!existsSync(DATA_DIR)) {
      mkdirSync(DATA_DIR, { recursive: true });
    }
    writeFileSync(ACCOUNTS_FILE, JSON.stringify({ accounts, accountIdCounter }, null, 2), 'utf-8');
  } catch {
    // in-memory only
  }
}

loadData();

export const accountStore = {
  create: (data: Omit<Account, 'id'>) => {
    const account: Account = {
      ...data,
      id: accountIdCounter++,
    };
    accounts.push(account);
    saveData();
    return account;
  },
  findByUserId: (userId: number) => accounts.filter((a) => a.userId === userId),
  findById: (id: number) => accounts.find((a) => a.id === id),
  updateBalance: (id: number, newBalance: number) => {
    const idx = accounts.findIndex((a) => a.id === id);
    if (idx >= 0) {
      accounts[idx].balance = newBalance;
      saveData();
      return accounts[idx];
    }
    return null;
  },
};
