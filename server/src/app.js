import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import mongoSanitize from 'express-mongo-sanitize';
import morgan from 'morgan';
import mongoose from 'mongoose';
import { env } from './config/env.js';
import { globalLimiter } from './middlewares/rateLimiters.js';
import { notFound } from './middlewares/notFound.js';
import { errorHandler } from './middlewares/errorHandler.js';
import { csrfGuard } from './middlewares/csrf.js';
import authRoutes from './routes/auth.routes.js';
import publicRoutes from './routes/public.routes.js';
import adminRoutes from './routes/admin.routes.js';
import meRoutes from './routes/me.routes.js';
import taskRoutes from './routes/tasks.routes.js';
import submissionRoutes from './routes/submissions.routes.js';
import { resourcesRouter, announcementsRouter } from './routes/library.routes.js';
import forumRoutes from './routes/forum.routes.js';
import { notificationsRouter, leaderboardRouter } from './routes/gamification.routes.js';

export function createApp() {
  const app = express();

  // Render-এর মতো প্রক্সির পেছনে সঠিক IP পেতে
  app.set('trust proxy', 1);

  app.use(helmet());
  app.use(
    cors({
      origin: env.clientUrl,
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
      allowedHeaders: ['Content-Type', 'X-Requested-With'],
    })
  );
  app.use(express.json({ limit: '1mb' }));
  app.use(express.urlencoded({ extended: true, limit: '1mb' }));
  app.use(cookieParser(env.cookieSecret));
  app.use(mongoSanitize());
  if (!env.isProd) app.use(morgan('dev'));
  app.use('/api', globalLimiter);
  app.use('/api', csrfGuard);

  app.get('/api/health', (_req, res) => {
    const dbReady = mongoose.connection.readyState === 1;
    res.status(dbReady ? 200 : 503).json({
      success: dbReady,
      service: 'devforge-api',
      database: dbReady ? 'connected' : 'disconnected',
      time: new Date().toISOString(),
    });
  });

  app.use('/api/auth', authRoutes);
  app.use('/api/public', publicRoutes);
  app.use('/api/admin', adminRoutes);
  app.use('/api/me', meRoutes);
  app.use('/api/tasks', taskRoutes);
  app.use('/api/submissions', submissionRoutes);
  app.use('/api/resources', resourcesRouter);
  app.use('/api/announcements', announcementsRouter);
  app.use('/api/forum', forumRoutes);
  app.use('/api/notifications', notificationsRouter);
  app.use('/api/leaderboard', leaderboardRouter);
  // পরবর্তী ধাপগুলোতে /api/admin, /api/tasks ইত্যাদি রুট এখানে যুক্ত হবে।

  app.use(notFound);
  app.use(errorHandler);
  return app;
}
