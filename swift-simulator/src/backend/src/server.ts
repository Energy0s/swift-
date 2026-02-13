import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import authRoutes from './routes/auth.js';
import usersRoutes from './routes/users.js';
import accountsRoutes from './routes/accounts.js';
import transfersRoutes from './routes/transfers.js';
import messagesRoutes from './routes/messages.js';
import translateRoutes from './routes/translate.js';
import validateRoutes from './routes/validate.js';
import exchangeRoutes from './routes/exchange.js';
import banksRoutes from './routes/banks.js';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(helmet());
app.use(cors({ origin: true }));
app.use(express.json());
app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
  })
);

app.use('/api/auth', authRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/accounts', accountsRoutes);
app.use('/api/transfers', transfersRoutes);
app.use('/api/messages', messagesRoutes);
app.use('/api/translate', translateRoutes);
app.use('/api/validate', validateRoutes);
app.use('/api/exchange', exchangeRoutes);
app.use('/api/banks', banksRoutes);

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', message: 'SWIFT Transfer API' });
});

app.use((_req, res) => {
  res.status(404).json({ status: 'error', message: 'Rota não encontrada' });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
