import { Router } from 'express';
import * as c from '../controllers/gamification.controller.js';
import { validate } from '../middlewares/validate.js';
import { authenticate, requireApproved } from '../middlewares/auth.js';
import { notificationsQuery, leaderboardQuery } from '../validators/gamification.validator.js';
import { idParam } from '../validators/forum.validator.js';

export const notificationsRouter = Router();
notificationsRouter.use(authenticate, requireApproved);
notificationsRouter.get('/', validate(notificationsQuery, 'query'), c.notifications);
notificationsRouter.get('/unread-count', c.unread);
notificationsRouter.post('/read-all', c.readAll);
notificationsRouter.post('/:id/read', validate(idParam, 'params'), c.readOne);

export const leaderboardRouter = Router();
leaderboardRouter.use(authenticate, requireApproved);
leaderboardRouter.get('/', validate(leaderboardQuery, 'query'), c.leaderboard);
