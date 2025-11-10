import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { PrismaClient } from '@prisma/client';
import authRouter from './routes/auth.js';
import usersRouter from './routes/users.js';
import assetsRouter from './routes/assets.js';
import ticketsRouter from './routes/tickets.js';

const app = express();
const prisma = new PrismaClient();

app.use(cors());
app.use(express.json());

app.get('/health', async (_req, res) => {
  const now = await prisma.$queryRaw`SELECT NOW()`;
  res.json({ status: 'ok', now });
});

app.use('/api/auth', authRouter);
app.use('/api/users', usersRouter);
app.use('/api/assets', assetsRouter);
app.use('/api/tickets', ticketsRouter);

// Provide a simple root for /api to avoid 404 on base path
app.get('/api', (_req, res) => {
  res.json({ status: 'ok', message: 'API root' });
});

const port = process.env.PORT ? Number(process.env.PORT) : 4000;
app.listen(port, () => {
  // eslint-disable-next-line no-console
  console.log(`Server running on http://localhost:${port}`);
});
