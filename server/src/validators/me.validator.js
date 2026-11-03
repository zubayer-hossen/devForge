import { z } from 'zod';
import { optionalUrl } from '../utils/validators.js';
import { githubUrlSchema } from './auth.validator.js';

// সদস্য শুধু এই ক্ষেত্রগুলো বদলাতে পারে। রোল/স্ট্যাটাস/পয়েন্ট পাঠালে .strict() অনুরোধটিই প্রত্যাখ্যান করে।
export const profileSchema = z.object({
  bio: z.string().trim().max(500, 'বায়ো সর্বোচ্চ ৫০০ অক্ষর').optional(),
  githubUrl: githubUrlSchema,
  portfolioUrl: optionalUrl,
  skills: z.array(z.string().trim().min(1).max(40)).max(30).optional(),
  learningInterests: z.array(z.string().trim().min(1).max(40)).max(30).optional(),
}).strict();
