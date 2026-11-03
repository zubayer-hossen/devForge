import { z } from 'zod';
import { objectId } from '../utils/validators.js';
import { RESOURCE_TYPES } from '../constants/index.js';
import { linkHostAllowed } from '../services/taskRules.js';

const HOSTS = {
  FIGMA: ['figma.com'], GITHUB: ['github.com'], GOOGLE_DRIVE: ['drive.google.com', 'docs.google.com'],
  GOOGLE_DOCS: ['docs.google.com'], YOUTUBE: ['youtube.com', 'youtu.be'],
};
const HOST_MSG = {
  FIGMA: 'Figma রিসোর্সে figma.com লিংক দিন', GITHUB: 'GitHub রিসোর্সে github.com লিংক দিন',
  GOOGLE_DRIVE: 'Google Drive রিসোর্সে drive.google.com বা docs.google.com লিংক দিন', GOOGLE_DOCS: 'Google Docs রিসোর্সে docs.google.com লিংক দিন',
  YOUTUBE: 'YouTube রিসোর্সে youtube.com বা youtu.be লিংক দিন',
};

const httpUrl = z.string().trim().max(500).refine((u) => {
  try { return ['http:', 'https:'].includes(new URL(u).protocol); } catch { return false; }
}, 'শুধু http বা https লিংক দিন');

export const resourceSchema = z.object({
  title: z.string().trim().min(3, 'শিরোনাম কমপক্ষে ৩ অক্ষর').max(150),
  description: z.string().trim().max(1000).default(''),
  type: z.enum(RESOURCE_TYPES),
  category: z.string().trim().max(60).default(''),
  url: z.union([httpUrl, z.literal('')]).default(''),
  tags: z.array(z.string().trim().toLowerCase().min(1).max(30)).max(15).default([]),
  pinned: z.boolean().default(false),
  removeFile: z.boolean().default(false),
}).superRefine((d, ctx) => {
  if (d.url && HOSTS[d.type] && !linkHostAllowed(d.url, HOSTS[d.type])) {
    ctx.addIssue({ code: 'custom', path: ['url'], message: HOST_MSG[d.type] });
  }
});

const page = z.coerce.number().int().min(1).default(1);
const limit = z.coerce.number().int().min(1).max(100).default(12);

export const resourcesQuery = z.object({
  page, limit,
  search: z.string().trim().max(80).optional(),
  type: z.enum(RESOURCE_TYPES).optional(),
  category: z.string().trim().max(60).optional(),
  tag: z.string().trim().toLowerCase().max(30).optional(),
});

export const announcementSchema = z.object({
  title: z.string().trim().min(3, 'শিরোনাম কমপক্ষে ৩ অক্ষর').max(150),
  body: z.string().trim().min(3, 'ঘোষণার বিবরণ লিখুন').max(10000),
  pinned: z.boolean().default(false),
  sendEmail: z.boolean().default(false),
  audienceGroups: z.array(objectId).max(50).default([]),
});
export const scheduleSchema = z.object({ publishAt: z.coerce.date({ invalid_type_error: 'প্রকাশের সময় সঠিক নয়' }) });
export const adminAnnouncementsQuery = z.object({
  page, limit, search: z.string().trim().max(80).optional(),
  status: z.enum(['DRAFT', 'SCHEDULED', 'PUBLISHED']).optional(),
});
export const memberAnnouncementsQuery = z.object({ page, limit: z.coerce.number().int().min(1).max(50).default(10) });
