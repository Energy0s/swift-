/**
 * Store de usuários com persistência em JSON
 * Credenciais permanentes nunca mudam
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';
import bcrypt from 'bcrypt';

export interface User {
  id: number;
  name: string;
  email: string;
  passwordHash: string;
  createdAt: string;
}

const DATA_DIR = join(process.cwd(), 'data');
const USERS_FILE = join(DATA_DIR, 'users.json');

interface UsersData {
  users: User[];
  userIdCounter: number;
}

let users: User[] = [];
let userIdCounter = 1;

function loadData(): void {
  try {
    if (existsSync(USERS_FILE)) {
      const raw = readFileSync(USERS_FILE, 'utf-8');
      const data: UsersData = JSON.parse(raw);
      users = data.users || [];
      userIdCounter = data.userIdCounter ?? Math.max(1, ...users.map((u) => u.id), 0) + 1;
    }
  } catch {
    users = [];
  }
}

function saveData(): void {
  try {
    if (!existsSync(DATA_DIR)) {
      mkdirSync(DATA_DIR, { recursive: true });
    }
    writeFileSync(USERS_FILE, JSON.stringify({ users, userIdCounter }, null, 2), 'utf-8');
  } catch {
    // in-memory only
  }
}

loadData();

export const userStore = {
  create: (data: Omit<User, 'id' | 'createdAt'>) => {
    const user: User = {
      ...data,
      id: userIdCounter++,
      createdAt: new Date().toISOString(),
    };
    users.push(user);
    saveData();
    return user;
  },
  findByEmail: (email: string) => users.find((u) => u.email.toLowerCase() === email.toLowerCase()),
  findById: (id: number) => users.find((u) => u.id === id),
  getAllIds: () => users.map((u) => u.id),
  update: (id: number, data: Partial<Pick<User, 'name' | 'email' | 'passwordHash'>>) => {
    const idx = users.findIndex((u) => u.id === id);
    if (idx >= 0) {
      users[idx] = { ...users[idx], ...data };
      saveData();
      return users[idx];
    }
    return null;
  },
};
