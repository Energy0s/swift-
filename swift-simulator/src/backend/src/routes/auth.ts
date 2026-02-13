import { Router, Request, Response } from 'express';
import bcrypt from 'bcrypt';
import { userStore, accountStore } from '../store/index.js';
import { generateToken } from '../middleware/auth.js';

const router = Router();

router.post('/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ status: 'error', message: 'Email e senha são obrigatórios' });
    }
    const user = userStore.findByEmail(email);
    if (!user) {
      return res.status(401).json({ status: 'error', message: 'Credenciais inválidas' });
    }
    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      return res.status(401).json({ status: 'error', message: 'Credenciais inválidas' });
    }
    const token = generateToken(user.id, user.email);
    res.json({
      status: 'success',
      data: {
        user: { id: user.id, name: user.name, email: user.email, createdAt: user.createdAt },
        token,
      },
    });
  } catch (err) {
    res.status(500).json({ status: 'error', message: 'Erro interno' });
  }
});

router.post('/register', async (req: Request, res: Response) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ status: 'error', message: 'Nome, email e senha são obrigatórios' });
    }
    if (userStore.findByEmail(email)) {
      return res.status(400).json({ status: 'error', message: 'Email já cadastrado' });
    }
    const passwordHash = await bcrypt.hash(password, 10);
    const user = userStore.create({ name, email, passwordHash });
    // Criar conta de exemplo para o usuário
    accountStore.create({
      userId: user.id,
      accountNumber: `ACC${user.id.toString().padStart(6, '0')}`,
      iban: `BR${user.id.toString().padStart(2, '0')}0000000000000000000000000`,
      bic: 'COBADEFFXXX',
      balance: 10000,
      currency: 'USD',
      dailyLimit: 50000,
    });
    const token = generateToken(user.id, user.email);
    res.status(201).json({
      status: 'success',
      message: 'Usuário registrado com sucesso',
      data: {
        user: { id: user.id, name: user.name, email: user.email, createdAt: user.createdAt },
        token,
      },
    });
  } catch (err) {
    res.status(500).json({ status: 'error', message: 'Erro interno' });
  }
});

router.post('/logout', (_req: Request, res: Response) => {
  res.json({ status: 'success', message: 'Logout realizado com sucesso' });
});

export default router;
