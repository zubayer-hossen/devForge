// ঘোষণার বিশুদ্ধ নিয়ম (কোনো বাইরের নির্ভরতা নেই, তাই সহজে টেস্টযোগ্য)
const MAX_SCHEDULE_AHEAD_MS = 366 * 24 * 60 * 60 * 1000;

// সদস্য কি এই ঘোষণা দেখবে? গ্রুপ-সীমাবদ্ধ হলে শুধু ওই গ্রুপের সদস্য; অ্যাডমিনরা সব দেখেন
export function visibleToUser(announcement, userGroupIds = [], isAdmin = false) {
  if (announcement.status !== 'PUBLISHED') return false;
  if (isAdmin) return true;
  const groups = (announcement.audienceGroups || []).map(String);
  if (groups.length === 0) return true;
  const mine = new Set(userGroupIds.map(String));
  return groups.some((g) => mine.has(g));
}

export function scheduleProblem(publishAt, now = new Date()) {
  const t = new Date(publishAt).getTime();
  if (Number.isNaN(t)) return 'প্রকাশের সময় সঠিক নয়';
  if (t <= now.getTime()) return 'প্রকাশের সময় ভবিষ্যতের হতে হবে';
  if (t - now.getTime() > MAX_SCHEDULE_AHEAD_MS) return 'এক বছরের বেশি আগে থেকে নির্ধারণ করা যায় না';
  return null;
}

const TRANSITIONS = {
  publish: ['DRAFT', 'SCHEDULED'],
  schedule: ['DRAFT', 'SCHEDULED'],
  unschedule: ['SCHEDULED'],
  unpublish: ['PUBLISHED'],
};
export const canTransition = (from, action) => Boolean(TRANSITIONS[action]?.includes(from));
