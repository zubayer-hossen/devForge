import { z } from 'zod';

// শুধু http/https লিংক গ্রহণযোগ্য (javascript: ইত্যাদি বাদ)
export const urlSchema = z
  .string()
  .trim()
  .max(500)
  .url()
  .refine((u) => /^https?:\/\//i.test(u), 'শুধু http বা https লিংক দিন');

export const optionalUrl = z.union([urlSchema, z.literal('')]).optional();

export const objectId = z.string().regex(/^[0-9a-fA-F]{24}$/, 'অবৈধ আইডি');
