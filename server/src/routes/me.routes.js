import { Router } from 'express';
import * as c from '../controllers/me.controller.js';
import * as g from '../controllers/gamification.controller.js';
import { validate } from '../middlewares/validate.js';
import { authenticate, requireApproved } from '../middlewares/auth.js';
import { uploadSingle } from '../middlewares/upload.js';
import { uploadLimiter } from '../middlewares/rateLimiters.js';
import { profileSchema } from '../validators/me.validator.js';

const r = Router();
r.use(authenticate, requireApproved);

r.get('/dashboard', c.dashboard);
r.get('/progress', g.progress);
r.patch('/profile', validate(profileSchema), c.updateProfile);
r.post('/avatar', uploadLimiter, uploadSingle('avatar', { imagesOnly: true, maxMB: 5 }), c.uploadAvatar);
r.delete('/avatar', c.deleteAvatar);

export default r;
