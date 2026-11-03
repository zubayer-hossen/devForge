import { z } from 'zod';
import { objectId, urlSchema } from '../utils/validators.js';
import { TASK_CATEGORIES, TASK_PRIORITIES } from '../constants/index.js';
import { linkHostAllowed } from '../services/taskRules.js';

const label = z.string().trim().max(80).default('');
const hostLink = (domains, msg) => z.object({ label, url: urlSchema.refine((u) => linkHostAllowed(u, domains), msg) });
const anyLink = z.object({ label, url: urlSchema }); // ডকুমেন্টেশন লিংক: যেকোনো http/https

export const taskSchema = z.object({
  title: z.string().trim().min(3, 'শিরোনাম কমপক্ষে ৩ অক্ষর').max(150),
  description: z.string().trim().min(10, 'বিবরণ কমপক্ষে ১০ অক্ষর').max(5000),
  instructions: z.string().trim().max(10000).default(''),
  category: z.enum(TASK_CATEGORIES),
  priority: z.enum(TASK_PRIORITIES).default('MEDIUM'),
  deadline: z.coerce.date({ invalid_type_error: 'ডেডলাইনের তারিখ সঠিক নয়' }).nullable().optional(),
  points: z.number().int().min(0).max(1000).default(10),
  figmaLinks: z.array(hostLink(['figma.com'], 'শুধু figma.com লিংক দিন')).max(10).default([]),
  githubLinks: z.array(hostLink(['github.com'], 'শুধু github.com লিংক দিন')).max(10).default([]),
  driveLinks: z.array(hostLink(['drive.google.com', 'docs.google.com'], 'শুধু Google Drive/Docs লিংক দিন')).max(10).default([]),
  docLinks: z.array(anyLink).max(10).default([]),
  evaluationCriteria: z.array(z.object({
    title: z.string().trim().min(1, 'মানদণ্ডের নাম দিন').max(120),
    maxPoints: z.number().int().min(0).max(1000),
  })).max(20).default([]),
  allowLateSubmission: z.boolean().default(false),
  assignTo: z.enum(['ALL', 'SELECTED', 'GROUPS']).default('ALL'),
  assignedUsers: z.array(objectId).max(500).default([]),
  assignedGroups: z.array(objectId).max(50).default([]),
}).refine((d) => d.evaluationCriteria.reduce((sum, c) => sum + c.maxPoints, 0) <= d.points, {
  path: ['evaluationCriteria'],
  message: 'মূল্যায়নের মোট পয়েন্ট টাস্কের পয়েন্টের চেয়ে বেশি হতে পারে না',
});

export const reopenSchema = z.object({ deadline: z.coerce.date().nullable().optional() });

const page = z.coerce.number().int().min(1).default(1);
const limit = z.coerce.number().int().min(1).max(100).default(12);
const search = z.string().trim().max(80).optional();
const category = z.enum(TASK_CATEGORIES).optional();

export const adminTasksQuery = z.object({
  page, limit, search, category,
  status: z.enum(['DRAFT', 'PUBLISHED', 'CLOSED']).optional(),
  priority: z.enum(TASK_PRIORITIES).optional(),
  sort: z.string().max(30).optional(),
});

export const memberTasksQuery = z.object({
  page, limit, search, category,
  filter: z.enum(['pending', 'overdue', 'submitted', 'completed']).optional(),
  sort: z.enum(['deadline', 'newest']).default('deadline'),
});

export const taskIdParam = z.object({ taskId: objectId });
export const attachmentQuery = z.object({ publicId: z.string().min(3).max(300) });

export const groupSchema = z.object({
  name: z.string().trim().min(2, 'গ্রুপের নাম কমপক্ষে ২ অক্ষর').max(80),
  description: z.string().trim().max(500).default(''),
});
export const addMembersSchema = z.object({ userIds: z.array(objectId).min(1, 'অন্তত একজন সদস্য নির্বাচন করুন').max(100) });
export const groupMemberParams = z.object({ id: objectId, userId: objectId });
