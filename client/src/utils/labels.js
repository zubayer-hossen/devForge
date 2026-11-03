export const STATUS_LABEL = {
  EMAIL_UNVERIFIED: 'ইমেইল যাচাই বাকি', PENDING_APPROVAL: 'রিভিউয়ের অপেক্ষায়', APPROVED: 'অনুমোদিত',
  REJECTED: 'প্রত্যাখ্যাত', WAITLISTED: 'ওয়েটলিস্ট', SUSPENDED: 'স্থগিত',
};
export const STATUS_TONE = {
  EMAIL_UNVERIFIED: 'slate', PENDING_APPROVAL: 'amber', APPROVED: 'green',
  REJECTED: 'red', WAITLISTED: 'blue', SUSPENDED: 'red',
};
export const ROLE_LABEL = { SUPER_ADMIN: 'সুপার অ্যাডমিন', ADMIN: 'অ্যাডমিন', MODERATOR: 'মডারেটর', MEMBER: 'সদস্য' };
export const ROLE_TONE = { SUPER_ADMIN: 'violet', ADMIN: 'blue', MODERATOR: 'amber', MEMBER: 'slate' };

const ACTIONS = {
  AUTH_REGISTER: 'আবেদন জমা', AUTH_EMAIL_VERIFIED: 'ইমেইল যাচাই', AUTH_LOGIN: 'লগইন', AUTH_LOGIN_FAILED: 'ব্যর্থ লগইন চেষ্টা',
  AUTH_PASSWORD_RESET_REQUESTED: 'পাসওয়ার্ড রিসেটের অনুরোধ', AUTH_PASSWORD_RESET: 'পাসওয়ার্ড রিসেট', AUTH_PASSWORD_CHANGED: 'পাসওয়ার্ড পরিবর্তন',
  APPLICATION_APPROVED: 'আবেদন অনুমোদন', APPLICATION_REJECTED: 'আবেদন প্রত্যাখ্যান', APPLICATION_WAITLISTED: 'আবেদন ওয়েটলিস্টে',
  MEMBER_UPDATED: 'সদস্যের প্রোফাইল সম্পাদনা', MEMBER_SUSPENDED: 'সদস্য স্থগিত', MEMBER_REACTIVATED: 'সদস্য সক্রিয়',
  MEMBER_ROLE_CHANGED: 'রোল পরিবর্তন',
  TASK_CREATED: 'টাস্ক তৈরি', TASK_UPDATED: 'টাস্ক সম্পাদনা', TASK_PUBLISHED: 'টাস্ক প্রকাশ', TASK_UNPUBLISHED: 'টাস্ক ড্রাফটে ফেরানো',
  TASK_CLOSED: 'টাস্ক বন্ধ', TASK_REOPENED: 'টাস্ক আবার খোলা', TASK_DELETED: 'টাস্ক মুছে ফেলা', TASK_ATTACHMENT_ADDED: 'টাস্কে ফাইল সংযুক্ত', TASK_ATTACHMENT_REMOVED: 'টাস্ক থেকে ফাইল সরানো',
  GROUP_CREATED: 'গ্রুপ তৈরি', GROUP_UPDATED: 'গ্রুপ সম্পাদনা', GROUP_DELETED: 'গ্রুপ মুছে ফেলা', GROUP_MEMBERS_ADDED: 'গ্রুপে সদস্য যোগ', GROUP_MEMBER_REMOVED: 'গ্রুপ থেকে সদস্য সরানো',
  POINTS_ADJUSTED: 'পয়েন্ট সমন্বয়',
  FORUM_POST_DELETED: 'ফোরাম পোস্ট মুছে ফেলা', FORUM_COMMENT_DELETED: 'ফোরাম মন্তব্য মুছে ফেলা', FORUM_POST_HIDDEN: 'ফোরাম পোস্ট লুকানো',
  FORUM_POST_UNHIDDEN: 'ফোরাম পোস্ট আবার দেখানো', FORUM_POST_PINNED: 'ফোরাম পোস্ট পিন', FORUM_POST_UNPINNED: 'ফোরাম পোস্ট আনপিন',
  FORUM_COMMENT_HIDDEN: 'ফোরাম মন্তব্য লুকানো', FORUM_COMMENT_UNHIDDEN: 'ফোরাম মন্তব্য আবার দেখানো', FORUM_REPORTS_DISMISSED: 'রিপোর্ট নিষ্পত্তি',
  RESOURCE_CREATED: 'রিসোর্স যোগ', RESOURCE_UPDATED: 'রিসোর্স সম্পাদনা', RESOURCE_DELETED: 'রিসোর্স মুছে ফেলা',
  ANNOUNCEMENT_CREATED: 'ঘোষণা তৈরি', ANNOUNCEMENT_UPDATED: 'ঘোষণা সম্পাদনা', ANNOUNCEMENT_DELETED: 'ঘোষণা মুছে ফেলা', ANNOUNCEMENT_PUBLISHED: 'ঘোষণা প্রকাশ',
  ANNOUNCEMENT_SCHEDULED: 'ঘোষণার সময় নির্ধারণ', ANNOUNCEMENT_UNSCHEDULED: 'নির্ধারিত প্রকাশ বাতিল', ANNOUNCEMENT_UNPUBLISHED: 'ঘোষণা ড্রাফটে ফেরানো',
  SUBMISSION_CREATED: 'সাবমিশন জমা', SUBMISSION_UPDATED: 'সাবমিশন সম্পাদনা', SUBMISSION_RESUBMITTED: 'সাবমিশন আবার জমা',
  SUBMISSION_MEDIA_ADDED: 'সাবমিশনে ফাইল যোগ', SUBMISSION_MEDIA_REMOVED: 'সাবমিশন থেকে ফাইল সরানো', SUBMISSION_REVIEW_STARTED: 'রিভিউ শুরু',
  SUBMISSION_APPROVED: 'সাবমিশন অনুমোদন', SUBMISSION_REJECTED: 'সাবমিশন প্রত্যাখ্যান', SUBMISSION_REVISION_REQUESTED: 'রিভিশন চাওয়া হয়েছে',
  PROFILE_UPDATED: 'প্রোফাইল সম্পাদনা', PROFILE_AVATAR_UPDATED: 'প্রোফাইল ছবি হালনাগাদ', PROFILE_AVATAR_REMOVED: 'প্রোফাইল ছবি সরানো', MEMBER_DELETED: 'অ্যাকাউন্ট মুছে ফেলা', SETTINGS_UPDATED: 'সেটিংস হালনাগাদ', TEST_EMAIL_SENT: 'টেস্ট ইমেইল',
};
export const actionLabel = (a) => ACTIONS[a] || a;

export const EMAIL_STATUS_LABEL = { SENT: 'পাঠানো হয়েছে', FAILED: 'ব্যর্থ', DELIVERED: 'পৌঁছেছে', BOUNCED: 'ফেরত এসেছে' };
export const EMAIL_STATUS_TONE = { SENT: 'green', FAILED: 'red', DELIVERED: 'green', BOUNCED: 'amber' };

export const TASK_STATUS_LABEL = { DRAFT: 'ড্রাফট', PUBLISHED: 'প্রকাশিত', CLOSED: 'বন্ধ' };
export const TASK_STATUS_TONE = { DRAFT: 'slate', PUBLISHED: 'green', CLOSED: 'amber' };
export const PRIORITY_LABEL = { LOW: 'কম', MEDIUM: 'মাঝারি', HIGH: 'বেশি', URGENT: 'জরুরি' };
export const PRIORITY_TONE = { LOW: 'slate', MEDIUM: 'blue', HIGH: 'amber', URGENT: 'red' };
export const ASSIGNMENT_LABEL = { ASSIGNED: 'অ্যাসাইন করা', IN_PROGRESS: 'চলমান', SUBMITTED: 'জমা দেওয়া', COMPLETED: 'সম্পন্ন', OVERDUE: 'ডেডলাইন পেরোনো' };
export const ASSIGNMENT_TONE = { ASSIGNED: 'slate', IN_PROGRESS: 'blue', SUBMITTED: 'amber', COMPLETED: 'green', OVERDUE: 'red' };
export const ASSIGN_TO_LABEL = { ALL: 'সব সদস্য', SELECTED: 'নির্বাচিত সদস্য', GROUPS: 'গ্রুপ' };

export const SUBMISSION_STATUS_LABEL = {
  SUBMITTED: 'জমা হয়েছে', UNDER_REVIEW: 'রিভিউতে', APPROVED: 'অনুমোদিত', REJECTED: 'প্রত্যাখ্যাত', REVISION_REQUESTED: 'রিভিশন প্রয়োজন',
};
export const SUBMISSION_STATUS_TONE = { SUBMITTED: 'blue', UNDER_REVIEW: 'amber', APPROVED: 'green', REJECTED: 'red', REVISION_REQUESTED: 'amber' };

export const RESOURCE_TYPE_LABEL = {
  FIGMA: 'Figma', GITHUB: 'GitHub', GOOGLE_DRIVE: 'Google Drive', GOOGLE_DOCS: 'Google Docs', PDF: 'PDF', YOUTUBE: 'YouTube',
  DOCUMENTATION: 'ডকুমেন্টেশন', ROADMAP: 'রোডম্যাপ', CODING_CHALLENGE: 'কোডিং চ্যালেঞ্জ', OTHER: 'অন্যান্য',
};
export const ANNOUNCEMENT_STATUS_LABEL = { DRAFT: 'ড্রাফট', SCHEDULED: 'নির্ধারিত', PUBLISHED: 'প্রকাশিত' };
export const ANNOUNCEMENT_STATUS_TONE = { DRAFT: 'slate', SCHEDULED: 'blue', PUBLISHED: 'green' };

export const POINT_REASON_LABEL = {
  TASK_COMPLETION: 'টাস্ক সম্পন্ন', PEER_REVIEW: 'পিয়ার রিভিউ', HELPFUL_CONTRIBUTION: 'সহায়ক অবদান',
  ADMIN_ADJUSTMENT: 'অ্যাডমিন সমন্বয়', STREAK_BONUS: 'স্ট্রিক বোনাস',
};
