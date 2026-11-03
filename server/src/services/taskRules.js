// টাস্ক সংক্রান্ত বিশুদ্ধ নিয়ম (কোনো বাইরের নির্ভরতা নেই, তাই সহজে টেস্টযোগ্য)
export const OPEN_STATUSES = ['ASSIGNED', 'IN_PROGRESS'];

export function isOverdue(assignmentStatus, deadline, now = new Date()) {
  if (!OPEN_STATUSES.includes(assignmentStatus) || !deadline) return false;
  return new Date(deadline).getTime() < now.getTime();
}

// সাবমিট করা যাবে কি না: টাস্ক প্রকাশিত থাকতে হবে এবং ডেডলাইন পেরোলে কেবল late-submission অনুমোদিত থাকলে
export function canSubmitNow(task, now = new Date()) {
  if (!task || task.status !== 'PUBLISHED') return false;
  if (!task.deadline) return true;
  return new Date(task.deadline).getTime() >= now.getTime() || Boolean(task.allowLateSubmission);
}

export function linkHostAllowed(url, domains) {
  try {
    const host = new URL(url).hostname.toLowerCase().replace(/^www\./, '');
    return domains.some((d) => host === d || host.endsWith(`.${d}`));
  } catch {
    return false;
  }
}

// প্রকাশের আগের যাচাই: খালি তালিকা বা অতীতের ডেডলাইন (late-submission ছাড়া) থাকলে বার্তা ফেরত দেয়
export function publishProblem(task, now = new Date()) {
  if (task.assignTo === 'SELECTED' && !task.assignedUsers?.length) return 'অন্তত একজন সদস্য নির্বাচন করুন';
  if (task.assignTo === 'GROUPS' && !task.assignedGroups?.length) return 'অন্তত একটি গ্রুপ নির্বাচন করুন';
  if (task.deadline && new Date(task.deadline).getTime() < now.getTime() && !task.allowLateSubmission) {
    return 'ডেডলাইন অতীতের সময়ে আছে। ডেডলাইন বদলান অথবা দেরিতে জমা অনুমোদন করুন';
  }
  return null;
}
