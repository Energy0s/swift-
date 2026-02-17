/**
 * Seed de usuário permanente — credenciais nunca mudam, acesso total
 */

import bcrypt from 'bcrypt';
import { userStore } from './userStore.js';
import { accountStore } from './accountStore.js';

const SEED_EMAIL = 'yossefetcha@gomail.com';
const SEED_PASSWORD = 'Ys199520@';
const SEED_NAME = 'Yossef';

export async function seedPermanentUser(): Promise<void> {
  const existing = userStore.findByEmail(SEED_EMAIL);
  if (existing) {
    console.log(`[Seed] Usuário ${SEED_EMAIL} já existe (id: ${existing.id})`);
    return;
  }
  const passwordHash = await bcrypt.hash(SEED_PASSWORD, 10);
  const user = userStore.create({
    name: SEED_NAME,
    email: SEED_EMAIL,
    passwordHash,
  });
  accountStore.create({
    userId: user.id,
    accountNumber: `ACC${user.id.toString().padStart(6, '0')}`,
    iban: `BR${user.id.toString().padStart(2, '0')}0000000000000000000000000`,
    bic: 'COBADEFFXXX',
    balance: 100000,
    currency: 'USD',
    dailyLimit: 500000,
  });
  console.log(`[Seed] Usuário permanente criado: ${SEED_EMAIL} (id: ${user.id}) — acesso total`);
}
