import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { PrismaClient } from '@prisma/client';
import authRouter from './routes/auth';
import usersRouter from './routes/users';
import assetsRouter from './routes/assets';
import ticketsRouter from './routes/tickets';
import commentsRouter from './routes/comments';

const app = express();
const prisma = new PrismaClient();

app.use(express.json());

app.get('/health', async (_req, res) => {
  const now = await prisma.$queryRaw`SELECT NOW()`;
  res.json({ status: 'ok', now });
});

app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true
}));

app.use('/api/auth', authRouter);
app.use('/api/users', usersRouter);
app.use('/api/assets', assetsRouter);
app.use('/api/tickets', ticketsRouter);
app.use('/api/comments', commentsRouter);

app.get('/api', (_req, res) => {
  res.json({ status: 'ok', message: 'API root' });
});

const port = process.env.PORT ? Number(process.env.PORT) : 4000;
app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});