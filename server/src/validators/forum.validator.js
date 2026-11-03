import { z } from 'zod';
import { objectId } from '../utils/validators.js';
import { LANGUAGES, MAX_TAGS } from '../services/forumRules.js';

const snippet = z.object({
  language: z.enum(LANGUAGES).default('javascript'),
  code: z.string().min(1, 'কোড ফাঁকা রাখা যাবে না').max(10000),
});

const tags = z.array(z.string().trim().toLowerCase().min(1).max(30)).max(MAX_TAGS, `সর্বোচ্চ ${MAX_TAGS}টি ট্যাগ`).default([]);

export const postSchema = z.object({
  type: z.enum(['DISCUSSION', 'QUESTION']),
  title: z.string().trim().min(5, 'শিরোনাম কমপক্ষে ৫ অক্ষর').max(200),
  body: z.string().trim().min(10, 'বিবরণ কমপক্ষে ১০ অক্ষর').max(10000),
  tags,
  codeSnippets: z.array(snippet).max(3, 'সর্বোচ্চ ৩টি কোড স্নিপেট').default([]),
});

export const commentSchema = z.object({
  body: z.string().trim().min(1, 'কিছু লিখুন').max(5000),
  codeSnippet: snippet.optional(),
  parentId: objectId.nullable().optional(),
});
export const commentEditSchema = z.object({ body: z.string().trim().min(1, 'কিছু লিখুন').max(5000), codeSnippet: snippet.nullable().optional() });

export const reportSchema = z.object({ reason: z.string().trim().min(5, 'কারণ কমপক্ষে ৫ অক্ষর').max(300) });
export const acceptSchema = z.object({ commentId: objectId });
export const hideSchema = z.object({ hidden: z.boolean() });
export const pinSchema = z.object({ pinned: z.boolean() });

const bool = z.enum(['true', 'false']).optional().transform((v) => v === 'true');
export const postsQuery = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(12),
  type: z.enum(['DISCUSSION', 'QUESTION']).optional(),
  tag: z.string().trim().toLowerCase().max(30).optional(),
  search: z.string().trim().max(80).optional(),
  sort: z.enum(['latest', 'popular']).default('latest'),
  mine: bool, bookmarked: bool, unanswered: bool,
});

export const moderationQuery = z.object({ kind: z.enum(['posts', 'comments']).default('posts') });
export const kindIdParam = z.object({ kind: z.enum(['posts', 'comments']), id: objectId });
export const idParam = z.object({ id: objectId });
