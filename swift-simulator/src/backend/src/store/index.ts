/**
 * Armazenamento in-memory (substituir por PostgreSQL/Sequelize depois)
 */

export interface User {
  id: number;
  name: string;
  email: string;
  passwordHash: string;
  createdAt: string;
}

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

export interface Transfer {
  id: number;
  userId: number;
  referenceNumber: string;
  sourceAccountId: number;
  destinationIban: string;
  destinationBic: string;
  destinationHolderName: string;
  amount: number;
  currency: string;
  fees: number;
  totalAmount: number;
  purpose?: string;
  status: 'created' | 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';
  swiftMessageXml: string;
  swiftMessageMt103: string;
  swiftMessageMt202?: string;
  swiftMessageSepaEpcCt: string;
  swiftMessageCbpr: string;
  swiftMessageRtgs: string;
  swiftMessageFednow: string;
  swiftMessageSicEurosic?: string;
  swiftMessageBahtnet?: string;
  messageType: string;
  createdAt: string;
  updatedAt: string;
}

const users: User[] = [];
const accounts: Account[] = [];
const transfers: Transfer[] = [];

let userIdCounter = 1;
let accountIdCounter = 1;
let transferIdCounter = 1;

export const userStore = {
  create: (data: Omit<User, 'id' | 'createdAt'>) => {
    const user: User = {
      ...data,
      id: userIdCounter++,
      createdAt: new Date().toISOString(),
    };
    users.push(user);
    return user;
  },
  findByEmail: (email: string) => users.find((u) => u.email === email),
  findById: (id: number) => users.find((u) => u.id === id),
  update: (id: number, data: Partial<Pick<User, 'name' | 'email' | 'passwordHash'>>) => {
    const idx = users.findIndex((u) => u.id === id);
    if (idx >= 0) {
      users[idx] = { ...users[idx], ...data };
      return users[idx];
    }
    return null;
  },
};

export const accountStore = {
  create: (data: Omit<Account, 'id'>) => {
    const account: Account = {
      ...data,
      id: accountIdCounter++,
    };
    accounts.push(account);
    return account;
  },
  findByUserId: (userId: number) => accounts.filter((a) => a.userId === userId),
  findById: (id: number) => accounts.find((a) => a.id === id),
  updateBalance: (id: number, newBalance: number) => {
    const idx = accounts.findIndex((a) => a.id === id);
    if (idx >= 0) {
      accounts[idx].balance = newBalance;
      return accounts[idx];
    }
    return null;
  },
};

export const transferStore = {
  create: (data: Omit<Transfer, 'id' | 'createdAt' | 'updatedAt'>) => {
    const now = new Date().toISOString();
    const transfer: Transfer = {
      ...data,
      id: transferIdCounter++,
      createdAt: now,
      updatedAt: now,
    };
    transfers.push(transfer);
    return transfer;
  },
  findByUserId: (userId: number, options?: { status?: string; limit?: number; page?: number; accountId?: number; reference?: string }) => {
    let list = transfers.filter((t) => t.userId === userId);
    if (options?.status) {
      list = list.filter((t) => t.status === options.status);
    }
    if (options?.accountId) {
      list = list.filter((t) => t.sourceAccountId === options.accountId);
    }
    if (options?.reference) {
      const q = options.reference.toUpperCase().trim();
      list = list.filter((t) => t.referenceNumber.toUpperCase().includes(q));
    }
    const limit = options?.limit ?? 10;
    const page = options?.page ?? 1;
    const total = list.length;
    const pages = Math.ceil(total / limit);
    const start = (page - 1) * limit;
    const paginated = list.slice(start, start + limit);
    return { transfers: paginated, pagination: { page, limit, total, pages } };
  },
  findById: (id: number) => transfers.find((t) => t.id === id),
  findByAccountId: (accountId: number) =>
    transfers.filter((t) => t.sourceAccountId === accountId).sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    ),
  getDailyUsedByAccount: (accountId: number): number => {
    const today = new Date().toISOString().slice(0, 10);
    return transfers
      .filter((t) => t.sourceAccountId === accountId && t.createdAt.startsWith(today))
      .reduce((sum, t) => sum + t.totalAmount, 0);
  },
  update: (id: number, data: Partial<Pick<Transfer, 'status' | 'updatedAt'>>) => {
    const idx = transfers.findIndex((t) => t.id === id);
    if (idx >= 0) {
      transfers[idx] = { ...transfers[idx], ...data, updatedAt: new Date().toISOString() };
      return transfers[idx];
    }
    return null;
  },
};
