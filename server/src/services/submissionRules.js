// সাবমিশনের বিশুদ্ধ নিয়ম (কোনো বাইরের নির্ভরতা নেই, তাই সহজে টেস্টযোগ্য)
export const EDITABLE = ['SUBMITTED', 'REVISION_REQUESTED'];
export const REVIEWABLE = ['SUBMITTED', 'UNDER_REVIEW'];
// এই অবস্থায় একই টাস্কে নতুন সাবমিশন দেওয়া যায় না (REJECTED হলে নতুন করে দেওয়া যায়)
export const BLOCKS_NEW = ['SUBMITTED', 'UNDER_REVIEW', 'APPROVED', 'REVISION_REQUESTED'];
export const FREE_PROJECT_MAX_POINTS = 100;
export const MAX_SCREENSHOTS = 5;
export const MAX_FILES = 3;

export const isEditable = (status) => EDITABLE.includes(status);
export const isReviewable = (status) => REVIEWABLE.includes(status);
export const maxPointsFor = (task) => (task ? task.points : FREE_PROJECT_MAX_POINTS);

export const assignmentStatusAfterReview = (decision) => (decision === 'APPROVED' ? 'COMPLETED' : 'IN_PROGRESS');

// রিভিউ ফর্মের যাচাই: সমস্যা থাকলে বার্তা, না থাকলে null
export function reviewProblem({ decision, points = 0, feedback = '', maxPoints }) {
  if (!['APPROVED', 'REJECTED', 'REVISION_REQUESTED'].includes(decision)) return 'অবৈধ সিদ্ধান্ত';
  if (!Number.isInteger(points) || points < 0) return 'পয়েন্ট ০ বা তার বেশি পূর্ণ সংখ্যা হতে হবে';
  if (decision !== 'APPROVED' && points > 0) return 'শুধু অনুমোদনের সময় পয়েন্ট দেওয়া যায়';
  if (points > maxPoints) return `এই সাবমিশনে সর্বোচ্চ ${maxPoints} পয়েন্ট দেওয়া যায়`;
  if (decision !== 'APPROVED' && feedback.trim().length < 5) return 'প্রত্যাখ্যান বা রিভিশনের কারণ লিখুন (কমপক্ষে ৫ অক্ষর)';
  return null;
}
