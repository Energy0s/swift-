import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { userStore } from '../store/index.js';

const JWT_SECRET = process.env.JWT_SECRET || 'swift-transfer-secret-change-in-production';

export interface AuthPayload {
  userId: number;
  email: string;
}

export function authMiddleware(req: Request & { user?: AuthPayload }, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ status: 'error', message: 'Token não fornecido' });
  }
  const token = authHeader.substring(7);
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as AuthPayload;
    const user = userStore.findById(decoded.userId);
    if (!user) {
      return res.status(401).json({ status: 'error', message: 'Usuário não encontrado' });
    }
    req.user = decoded;
    next();
  } catch {
    return res.status(401).json({ status: 'error', message: 'Token inválido ou expirado' });
  }
}

export function generateToken(userId: number, email: string): string {
  return jwt.sign({ userId, email }, JWT_SECRET, { expiresIn: '7d' });
}
