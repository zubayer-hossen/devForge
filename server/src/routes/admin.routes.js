import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import * as c from '../controllers/admin.controller.js';
import * as t from '../controllers/task.controller.js';
import * as sub from '../controllers/submission.controller.js';
import * as lib from '../controllers/library.controller.js';
import { validate } from '../middlewares/validate.js';
import { authenticate, requireApproved, requireAdmin, requireSuperAdmin } from '../middlewares/auth.js';
import { uploadSingle, parseDataField } from '../middlewares/upload.js';
import { uploadLimiter } from '../middlewares/rateLimiters.js';
import {
  idParam, applicationsQuery, membersQuery, activityQuery, emailLogsQuery, decisionSchema,
  suspendSchema, roleSchema, memberUpdateSchema, settingsSchema, testEmailSchema,
} from '../validators/admin.validator.js';
import {
  taskSchema, reopenSchema, adminTasksQuery, attachmentQuery, groupSchema, addMembersSchema, groupMemberParams,
} from '../validators/task.validator.js';
import { adminSubmissionsQuery, reviewSchema } from '../validators/submission.validator.js';
import { pointsAdjustSchema } from '../validators/gamification.validator.js';
import { resourceSchema, announcementSchema, scheduleSchema, adminAnnouncementsQuery } from '../validators/library.validator.js';

const testEmailLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, max: 5, standardHeaders: true, legacyHeaders: false,
  message: { success: false, code: 'TOO_MANY_REQUESTS', message: '১০ মিনিটে সর্বোচ্চ ৫টি টেস্ট ইমেইল পাঠানো যায়।' },
});

const r = Router();
// প্রতিটি অ্যাডমিন রুটে: লগইন + অনুমোদিত + অ্যাডমিন রোল (সার্ভারেই যাচাই)
r.use(authenticate, requireApproved, requireAdmin);

r.get('/stats', c.overview);
r.get('/counts', c.counts);

r.get('/applications', validate(applicationsQuery, 'query'), c.applications);
r.post('/applications/:id/decision', validate(idParam, 'params'), validate(decisionSchema), c.decide);

r.get('/members', validate(membersQuery, 'query'), c.members);
r.get('/members/:id', validate(idParam, 'params'), c.member);
r.patch('/members/:id', validate(idParam, 'params'), validate(memberUpdateSchema), c.updateMember);
r.post('/members/:id/suspend', validate(idParam, 'params'), validate(suspendSchema), c.suspend);
r.post('/members/:id/reactivate', validate(idParam, 'params'), c.reactivate);
r.patch('/members/:id/role', requireSuperAdmin, validate(idParam, 'params'), validate(roleSchema), c.changeRole);
r.delete('/members/:id', validate(idParam, 'params'), c.removeMember);
r.get('/members/:id/points', validate(idParam, 'params'), c.pointLedger);
r.post('/members/:id/points', validate(idParam, 'params'), validate(pointsAdjustSchema), c.adjustPoints);

r.get('/activity', validate(activityQuery, 'query'), c.activity);

r.get('/email/logs', validate(emailLogsQuery, 'query'), c.emailLogs);
r.post('/email/test', testEmailLimiter, validate(testEmailSchema), c.testEmail);

r.get('/settings', requireSuperAdmin, c.getSettings);
r.patch('/settings', requireSuperAdmin, validate(settingsSchema), c.updateSettings);
r.post('/settings/logo', requireSuperAdmin, uploadLimiter, uploadSingle('logo', { imagesOnly: true, maxMB: 2 }), c.uploadLogo);
r.delete('/settings/logo', requireSuperAdmin, c.deleteLogo);

// ---- টাস্ক ----
r.get('/tasks', validate(adminTasksQuery, 'query'), t.adminList);
r.post('/tasks', validate(taskSchema), t.adminCreate);
r.get('/tasks/:id', validate(idParam, 'params'), t.adminGet);
r.put('/tasks/:id', validate(idParam, 'params'), validate(taskSchema), t.adminUpdate);
r.delete('/tasks/:id', validate(idParam, 'params'), t.adminDelete);
r.post('/tasks/:id/publish', validate(idParam, 'params'), t.adminPublish);
r.post('/tasks/:id/unpublish', validate(idParam, 'params'), t.adminUnpublish);
r.post('/tasks/:id/close', validate(idParam, 'params'), t.adminClose);
r.post('/tasks/:id/reopen', validate(idParam, 'params'), validate(reopenSchema), t.adminReopen);
r.post('/tasks/:id/attachments', validate(idParam, 'params'), uploadLimiter, uploadSingle('file'), t.adminAddAttachment);
r.delete('/tasks/:id/attachments', validate(idParam, 'params'), validate(attachmentQuery, 'query'), t.adminRemoveAttachment);

// ---- গ্রুপ ----
r.get('/groups', t.groupList);
r.post('/groups', validate(groupSchema), t.groupCreate);
r.get('/groups/:id', validate(idParam, 'params'), t.groupGet);
r.patch('/groups/:id', validate(idParam, 'params'), validate(groupSchema), t.groupUpdate);
r.delete('/groups/:id', validate(idParam, 'params'), t.groupDelete);
r.post('/groups/:id/members', validate(idParam, 'params'), validate(addMembersSchema), t.groupAddMembers);
r.delete('/groups/:id/members/:userId', validate(groupMemberParams, 'params'), t.groupRemoveMember);

// ---- সাবমিশন রিভিউ ----
r.get('/submissions', validate(adminSubmissionsQuery, 'query'), sub.adminList);
r.get('/submissions/:id', validate(idParam, 'params'), sub.adminOne);
r.post('/submissions/:id/start-review', validate(idParam, 'params'), sub.adminStart);
r.post('/submissions/:id/review', validate(idParam, 'params'), validate(reviewSchema), sub.adminReview);

// ---- রিসোর্স (multipart: 'data' = JSON, 'file' = ঐচ্ছিক ফাইল) ----
r.post('/resources', uploadLimiter, uploadSingle('file', { optional: true }), parseDataField, validate(resourceSchema), lib.resourceCreate);
r.put('/resources/:id', validate(idParam, 'params'), uploadLimiter, uploadSingle('file', { optional: true }), parseDataField, validate(resourceSchema), lib.resourceUpdate);
r.delete('/resources/:id', validate(idParam, 'params'), lib.resourceDelete);

// ---- ঘোষণা ----
r.get('/announcements', validate(adminAnnouncementsQuery, 'query'), lib.annAdminList);
r.post('/announcements', validate(announcementSchema), lib.annCreate);
r.put('/announcements/:id', validate(idParam, 'params'), validate(announcementSchema), lib.annUpdate);
r.delete('/announcements/:id', validate(idParam, 'params'), lib.annDelete);
r.post('/announcements/:id/publish', validate(idParam, 'params'), lib.annPublish);
r.post('/announcements/:id/schedule', validate(idParam, 'params'), validate(scheduleSchema), lib.annSchedule);
r.post('/announcements/:id/unschedule', validate(idParam, 'params'), lib.annUnschedule);
r.post('/announcements/:id/unpublish', validate(idParam, 'params'), lib.annUnpublish);

export default r;
