import { Router, Request, Response } from 'express';
import bcrypt from 'bcrypt';
import { authMiddleware } from '../middleware/auth.js';
import { userStore } from '../store/index.js';

const router = Router();

router.use(authMiddleware);

router.get('/profile', (req: Request & { user?: { userId: number } }, res: Response) => {
  const user = userStore.findById(req.user!.userId);
  if (!user) {
    return res.status(404).json({ status: 'error', message: 'Usuário não encontrado' });
  }
  res.json({
    status: 'success',
    data: {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        createdAt: user.createdAt,
      },
    },
  });
});

router.put('/profile', async (req: Request & { user?: { userId: number } }, res: Response) => {
  try {
    const { name, email } = req.body;
    const updated = userStore.update(req.user!.userId, { name, email });
    if (!updated) {
      return res.status(404).json({ status: 'error', message: 'Usuário não encontrado' });
    }
    res.json({
      status: 'success',
      data: {
        user: {
          id: updated.id,
          name: updated.name,
          email: updated.email,
          createdAt: updated.createdAt,
        },
      },
    });
  } catch (err) {
    res.status(500).json({ status: 'error', message: 'Erro interno' });
  }
});

export default router;
