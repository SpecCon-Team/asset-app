import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { prisma } from './lib/prisma';
import authRouter from './routes/auth';
import usersRouter from './routes/users';
import assetsRouter from './routes/assets';
import ticketsRouter from './routes/tickets';
import commentsRouter from './routes/comments';
import notificationsRouter from './routes/notifications';

const app = express();

// Increase body size limit for base64 image uploads
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

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
app.use('/api/notifications', notificationsRouter);

app.get('/api', (_req, res) => {
  res.json({ status: 'ok', message: 'API root' });
});

const port = process.env.PORT ? Number(process.env.PORT) : 4000;
app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});