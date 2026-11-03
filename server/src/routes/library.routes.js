import { Router } from 'express';
import * as c from '../controllers/library.controller.js';
import { validate } from '../middlewares/validate.js';
import { authenticate, requireApproved } from '../middlewares/auth.js';
import { resourcesQuery, memberAnnouncementsQuery } from '../validators/library.validator.js';

// অনুমোদিত সদস্যদের জন্য (পড়ার অ্যাক্সেস)
export const resourcesRouter = Router();
resourcesRouter.use(authenticate, requireApproved);
resourcesRouter.get('/', validate(resourcesQuery, 'query'), c.resourceList);
resourcesRouter.get('/meta', c.resourceMeta);

export const announcementsRouter = Router();
announcementsRouter.use(authenticate, requireApproved);
announcementsRouter.get('/', validate(memberAnnouncementsQuery, 'query'), c.annMemberList);
