import { z } from 'zod';

export const notificationsQuery = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(15),
  unread: z.enum(['true', 'false']).optional().transform((v) => v === 'true'),
});

export const leaderboardQuery = z.object({
  period: z.enum(['weekly', 'monthly', 'all']).default('weekly'),
  limit: z.coerce.number().int().min(1).max(100).default(50),
});

// ঋণাত্মক পয়েন্ট শুধু "অ্যাডমিন সমন্বয়"-এ (ভুল শোধরাতে); পিয়ার রিভিউ/সহায়ক অবদানে শুধু যোগ
export const pointsAdjustSchema = z.object({
  category: z.enum(['ADMIN_ADJUSTMENT', 'PEER_REVIEW', 'HELPFUL_CONTRIBUTION']),
  amount: z.number().int().min(-1000).max(1000).refine((n) => n !== 0, 'পয়েন্ট শূন্য হতে পারে না'),
  reason: z.string().trim().min(3, 'কারণ লিখুন (কমপক্ষে ৩ অক্ষর)').max(200),
}).refine((d) => d.amount > 0 || d.category === 'ADMIN_ADJUSTMENT', {
  path: ['amount'], message: 'পয়েন্ট কাটতে চাইলে ধরন "অ্যাডমিন সমন্বয়" বাছাই করুন',
});
