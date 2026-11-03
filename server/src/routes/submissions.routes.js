import { Router } from 'express';
import * as c from '../controllers/submission.controller.js';
import { validate } from '../middlewares/validate.js';
import { authenticate, requireApproved } from '../middlewares/auth.js';
import { uploadSingle } from '../middlewares/upload.js';
import { uploadLimiter, writeLimiter } from '../middlewares/rateLimiters.js';
import {
  createSubmissionSchema, updateSubmissionSchema, mySubmissionsQuery, mediaQuery, submissionIdParam,
} from '../validators/submission.validator.js';

const r = Router();
r.use(authenticate, requireApproved);

r.get('/', validate(mySubmissionsQuery, 'query'), c.mine);
r.post('/', writeLimiter, validate(createSubmissionSchema), c.create);
r.get('/:id', validate(submissionIdParam, 'params'), c.mineOne);
r.put('/:id', writeLimiter, validate(submissionIdParam, 'params'), validate(updateSubmissionSchema), c.update);
r.post('/:id/screenshots', validate(submissionIdParam, 'params'), uploadLimiter, uploadSingle('file', { imagesOnly: true }), c.addScreenshot);
r.post('/:id/files', validate(submissionIdParam, 'params'), uploadLimiter, uploadSingle('file'), c.addFile);
r.delete('/:id/media', validate(submissionIdParam, 'params'), validate(mediaQuery, 'query'), c.removeMedia);

export default r;
