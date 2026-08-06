import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import { existsSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

import authRoutes from './routes/authRoutes.js';
import roomRoutes from './routes/roomRoutes.js';
import messageRoutes from './routes/messageRoutes.js';
import noteRoutes from './routes/noteRoutes.js';
import { errorHandler, notFound } from './middleware/errorHandler.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const clientDistPath = path.resolve(__dirname, '../../client/dist');
const clientIndexPath = path.join(clientDistPath, 'index.html');

export function createApp() {
  const app = express();

  app.use(helmet());
  app.use(morgan('dev'));

  const origins = process.env.CLIENT_ORIGIN?.split(',').map((s) => s.trim()).filter(Boolean);

  app.use(
    cors({
      origin: origins?.length ? origins : true,
      credentials: true,
    })
  );

  app.use(express.json({ limit: '1mb' }));
  app.use(cookieParser());

  app.get('/api/health', (req, res) => {
    res.json({ ok: true, service: 'devcollab-api' });
  });

  app.use('/api/auth', authRoutes);
  app.use('/api/rooms', roomRoutes);
  app.use('/api/rooms/:roomId/messages', messageRoutes);
  app.use('/api/rooms/:roomId/notes', noteRoutes);

  if (process.env.NODE_ENV === 'production' && existsSync(clientIndexPath)) {
    app.use(express.static(clientDistPath));

    app.get(/^\/(?!api(?:\/|$)|socket\.io(?:\/|$)).*/, (req, res) => {
      res.sendFile(clientIndexPath);
    });
  }

  app.use(notFound);
  app.use(errorHandler);

  return app;
}
