import express from 'express';
import { seedPermanentUser } from './store/seed.js';
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
import mt101Routes from './routes/mt101.js';
import mt103Routes from './routes/mt103.js';
import mt109Routes from './routes/mt109.js';
import mtFreeRoutes from './routes/mtFree.js';
import incomingRoutes from './routes/incoming.js';
import swiftReceiptsRoutes from './routes/swiftReceipts.js';
import swiftHeaderRoutes from './routes/swiftHeader.js';
import swiftSearchRoutes from './routes/swiftSearch.js';
import swiftFooterRoutes from './routes/swiftFooter.js';
import swiftAuditRoutes from './routes/swiftAudit.js';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(helmet());
app.use(cors({ origin: true }));
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 10000,
  })
);
app.use('/api/users', usersRoutes);
app.use('/api/accounts', accountsRoutes);
app.use('/api/transfers', transfersRoutes);
app.use('/api/messages', messagesRoutes);
app.use('/api/translate', translateRoutes);
app.use('/api/validate', validateRoutes);
app.use('/api/exchange', exchangeRoutes);
app.use('/api/banks', banksRoutes);
app.use('/api/swift/mt101', mt101Routes);
app.use('/api/swift/mt103', mt103Routes);
app.use('/api/swift/mt109', mt109Routes);
app.use('/api/swift/free', mtFreeRoutes);
app.use('/api/swift/incoming', incomingRoutes);
app.use('/api/swift/receipts', swiftReceiptsRoutes);
app.use('/api/swift/header', swiftHeaderRoutes);
app.use('/api/swift/search', swiftSearchRoutes);
app.use('/api/swift/footer', swiftFooterRoutes);
app.use('/api/swift/audit', swiftAuditRoutes);

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', message: 'SWIFT Transfer API' });
});

app.use((_req, res) => {
  res.status(404).json({ status: 'error', message: 'Rota não encontrada' });
});

app.listen(PORT, async () => {
  console.log(`Server running on http://localhost:${PORT}`);
  await seedPermanentUser();
});
