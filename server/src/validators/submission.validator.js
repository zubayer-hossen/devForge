import { z } from 'zod';
import { objectId, optionalUrl, urlSchema } from '../utils/validators.js';
import { githubUrlSchema } from './auth.validator.js';
import { linkHostAllowed } from '../services/taskRules.js';

const driveUrl = z.union([
  urlSchema.refine((u) => linkHostAllowed(u, ['drive.google.com', 'docs.google.com']), 'শুধু Google Drive/Docs লিংক দিন'),
  z.literal(''),
]).optional();

const tags = z.array(z.string().trim().min(1).max(40)).max(20).default([]);

const fields = {
  title: z.string().trim().min(3, 'শিরোনাম কমপক্ষে ৩ অক্ষর').max(150),
  description: z.string().trim().min(10, 'বিবরণ কমপক্ষে ১০ অক্ষর').max(5000),
  githubUrl: githubUrlSchema,
  liveUrl: optionalUrl,
  driveUrl,
  additionalLinks: z.array(urlSchema).max(10).default([]),
  technologies: tags,
  challenges: z.string().trim().max(3000).default(''),
  lessons: z.string().trim().max(3000).default(''),
  notes: z.string().trim().max(2000).default(''),
};

const needLink = [(d) => Boolean(d.githubUrl || d.liveUrl || d.driveUrl), {
  path: ['githubUrl'], message: 'অন্তত একটি লিংক দিন (GitHub, লাইভ ডেমো বা Google Drive)',
}];

export const createSubmissionSchema = z.object({ taskId: objectId.nullable().optional(), ...fields }).refine(...needLink);
export const updateSubmissionSchema = z.object(fields).refine(...needLink);

export const reviewSchema = z.object({
  decision: z.enum(['APPROVED', 'REJECTED', 'REVISION_REQUESTED']),
  feedback: z.string().trim().max(5000).default(''),
  points: z.number().int().min(0).max(1000).default(0),
});

const page = z.coerce.number().int().min(1).default(1);
const limit = z.coerce.number().int().min(1).max(100).default(12);
const status = z.enum(['SUBMITTED', 'UNDER_REVIEW', 'APPROVED', 'REJECTED', 'REVISION_REQUESTED']).optional();

export const mySubmissionsQuery = z.object({ page, limit, status });
export const adminSubmissionsQuery = z.object({ page, limit, status, taskId: objectId.optional(), search: z.string().trim().max(80).optional() });
export const mediaQuery = z.object({ kind: z.enum(['screenshots', 'files']), publicId: z.string().min(3).max(300) });
export const submissionIdParam = z.object({ id: objectId });
