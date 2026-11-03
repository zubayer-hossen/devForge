import { Router } from 'express';
import * as c from '../controllers/task.controller.js';
import { validate } from '../middlewares/validate.js';
import { authenticate, requireApproved } from '../middlewares/auth.js';
import { memberTasksQuery, taskIdParam } from '../validators/task.validator.js';

const r = Router();
r.use(authenticate, requireApproved);

r.get('/', validate(memberTasksQuery, 'query'), c.memberList);
r.get('/:taskId', validate(taskIdParam, 'params'), c.memberGet);
r.post('/:taskId/start', validate(taskIdParam, 'params'), c.memberStart);

export default r;
