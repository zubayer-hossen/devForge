import { Router } from 'express';
import * as c from '../controllers/forum.controller.js';
import { validate } from '../middlewares/validate.js';
import { authenticate, requireApproved, requireStaff } from '../middlewares/auth.js';
import { forumLimiter, writeLimiter } from '../middlewares/rateLimiters.js';
import {
  postSchema, commentSchema, commentEditSchema, reportSchema, acceptSchema, hideSchema, pinSchema,
  postsQuery, moderationQuery, kindIdParam, idParam,
} from '../validators/forum.validator.js';

const r = Router();
// ফোরামে শুধু অনুমোদিত সদস্য (এবং স্টাফ) অংশ নিতে পারেন
r.use(authenticate, requireApproved);

r.get('/tags', c.tags);
r.get('/posts', validate(postsQuery, 'query'), c.list);
r.post('/posts', forumLimiter, validate(postSchema), c.create);
r.get('/posts/:id', validate(idParam, 'params'), c.get);
r.put('/posts/:id', writeLimiter, validate(idParam, 'params'), validate(postSchema), c.update);
r.delete('/posts/:id', validate(idParam, 'params'), c.remove);
r.post('/posts/:id/like', writeLimiter, validate(idParam, 'params'), c.likePost);
r.post('/posts/:id/bookmark', writeLimiter, validate(idParam, 'params'), c.bookmark);
r.post('/posts/:id/report', forumLimiter, validate(idParam, 'params'), validate(reportSchema), c.reportPost);
r.post('/posts/:id/comments', forumLimiter, validate(idParam, 'params'), validate(commentSchema), c.addComment);
r.post('/posts/:id/accept', writeLimiter, validate(idParam, 'params'), validate(acceptSchema), c.accept);
r.delete('/posts/:id/accept', writeLimiter, validate(idParam, 'params'), c.unaccept);

r.put('/comments/:id', writeLimiter, validate(idParam, 'params'), validate(commentEditSchema), c.editComment);
r.delete('/comments/:id', validate(idParam, 'params'), c.removeComment);
r.post('/comments/:id/like', writeLimiter, validate(idParam, 'params'), c.likeComment);
r.post('/comments/:id/report', forumLimiter, validate(idParam, 'params'), validate(reportSchema), c.reportComment);

// ---- মডারেশন: শুধু স্টাফ (সুপার অ্যাডমিন, অ্যাডমিন, মডারেটর) ----
r.post('/posts/:id/hide', requireStaff, validate(idParam, 'params'), validate(hideSchema), c.hidePost);
r.post('/posts/:id/pin', requireStaff, validate(idParam, 'params'), validate(pinSchema), c.pinPost);
r.post('/comments/:id/hide', requireStaff, validate(idParam, 'params'), validate(hideSchema), c.hideComment);
r.get('/moderation/reports', requireStaff, validate(moderationQuery, 'query'), c.queue);
r.post('/moderation/:kind/:id/dismiss', requireStaff, validate(kindIdParam, 'params'), c.dismiss);

export default r;
