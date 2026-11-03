import { z } from 'zod';
import { objectId, optionalUrl } from '../utils/validators.js';
import { ACCOUNT_STATUS_LIST } from '../constants/index.js';

export const idParam = z.object({ id: objectId });

const page = z.coerce.number().int().min(1).default(1);
const limit = z.coerce.number().int().min(1).max(100).default(20);
const search = z.string().trim().max(80).optional();

export const applicationsQuery = z.object({
  page, limit, search,
  status: z.enum(['PENDING_APPROVAL', 'WAITLISTED', 'REJECTED', 'APPROVED']).optional(),
});

export const membersQuery = z.object({
  page, limit, search,
  status: z.enum(ACCOUNT_STATUS_LIST).optional(),
  role: z.enum(['SUPER_ADMIN', 'ADMIN', 'MODERATOR', 'MEMBER']).optional(),
  sort: z.string().max(30).optional(),
});

export const activityQuery = z.object({
  page, limit: z.coerce.number().int().min(1).max(100).default(30),
  audit: z.enum(['true', 'false']).optional(),
  search,
});

export const emailLogsQuery = z.object({ page, limit, status: z.enum(['SENT', 'FAILED', 'DELIVERED', 'BOUNCED']).optional() });

export const decisionSchema = z.object({
  decision: z.enum(['APPROVED', 'REJECTED', 'WAITLISTED']),
  note: z.string().trim().max(500).optional(),
});

export const suspendSchema = z.object({ reason: z.string().trim().min(3, 'কারণ লিখুন').max(300) });

export const roleSchema = z.object({ role: z.enum(['ADMIN', 'MODERATOR', 'MEMBER']) });

export const memberUpdateSchema = z.object({
  fullName: z.string().trim().min(2).max(80).optional(),
  phone: z.string().trim().regex(/^\+?[0-9]{7,15}$/, 'সঠিক ফোন নম্বর দিন').optional(),
  bio: z.string().trim().max(500).optional(),
  githubUrl: optionalUrl,
  portfolioUrl: optionalUrl,
  skills: z.array(z.string().trim().min(1).max(40)).max(30).optional(),
  learningInterests: z.array(z.string().trim().min(1).max(40)).max(30).optional(),
}).strict();

// SVG/HTML আপলোড XSS ঝুঁকি তৈরি করে, তাই অনুমোদিত MIME তালিকা সীমিত
export const ALLOWED_UPLOAD_MIME = [
  'image/jpeg', 'image/png', 'image/webp', 'image/gif',
  'application/pdf', 'application/zip', 'text/plain', 'application/json',
];

const timezone = z.string().max(60).refine((tz) => {
  try { new Intl.DateTimeFormat('en', { timeZone: tz }); return true; } catch { return false; }
}, 'অবৈধ টাইমজোন');

export const settingsSchema = z.object({
  siteName: z.string().trim().min(2).max(60),
  siteDescription: z.string().trim().max(300),
  registrationOpen: z.boolean(),
  maintenanceMode: z.boolean(),
  theme: z.enum(['dark', 'light', 'system']),
  communityRules: z.string().max(20000),
  timezone,
  upload: z.object({
    maxFileSizeMB: z.number().min(1).max(25),
    allowedMimeTypes: z.array(z.enum(ALLOWED_UPLOAD_MIME)).min(1),
  }),
  notifications: z.object({
    inApp: z.boolean(),
    emailOnNewTask: z.boolean(),
    emailOnReview: z.boolean(),
    emailOnDeadline: z.boolean().optional(),
    deadlineReminderHours: z.number().int().min(1).max(168),
  }),
  pointRules: z.object({
    peerReview: z.number().int().min(0).max(1000),
    helpfulAnswer: z.number().int().min(0).max(1000),
    dailyStreakBonus: z.number().int().min(0).max(1000),
  }),
}).partial().strict();

export const testEmailSchema = z.object({ to: z.string().trim().toLowerCase().email('সঠিক ইমেইল দিন').max(254) });
