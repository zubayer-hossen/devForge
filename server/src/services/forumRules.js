// ফোরামের বিশুদ্ধ নিয়ম (কোনো বাইরের নির্ভরতা নেই, তাই সহজে টেস্টযোগ্য)
export const STAFF_ROLES = ['SUPER_ADMIN', 'ADMIN', 'MODERATOR'];
export const LANGUAGES = ['javascript', 'jsx', 'typescript', 'tsx', 'html', 'css', 'json', 'bash', 'python', 'sql', 'text'];
export const MAX_TAGS = 5;
export const HELPFUL_DAILY_CAP = 5; // একজন সদস্য দিনে সর্বোচ্চ এত বার "সহায়ক উত্তর" পয়েন্ট পাবেন

export const isStaff = (role) => STAFF_ROLES.includes(role);

const idOf = (v) => String(v?._id ?? v);

export const isAuthor = (user, content) => idOf(content.author) === idOf(user._id);
export const canDelete = (user, content) => isStaff(user.role) || isAuthor(user, content);
export const canEdit = (user, content) => isAuthor(user, content); // মডারেটর শুধু লুকাতে/মুছতে পারে, অন্যের লেখা বদলাতে নয়

// উত্তরের উত্তর (reply) শুধু এক স্তর: পিতা-মন্তব্য নিজে কারও reply হতে পারবে না
export const replyAllowed = (parent) => Boolean(parent) && !parent.parent;

export function dedupeTags(tags = []) {
  return [...new Set(tags.map((t) => t.trim().toLowerCase()).filter(Boolean))].slice(0, MAX_TAGS);
}

// "সহায়ক উত্তর" পয়েন্টের জালিয়াতি-প্রতিরোধ: নিজের উত্তরে নয়, দৈনিক সীমা, ধনাত্মক পরিমাণ
export function helpfulAwardProblem({ accepterId, answererId, awardedToday = 0, amount, cap = HELPFUL_DAILY_CAP }) {
  if (idOf(accepterId) === idOf(answererId)) return 'নিজের উত্তরে পয়েন্ট দেওয়া হয় না';
  if (!Number.isInteger(amount) || amount <= 0) return 'এই মুহূর্তে সহায়ক উত্তরের পয়েন্ট বন্ধ আছে';
  if (awardedToday >= cap) return 'এই সদস্য আজকের সীমা পর্যন্ত সহায়ক-পয়েন্ট পেয়ে গেছেন';
  return null;
}

// বাংলাদেশ সময়ে "আজ" কখন শুরু (দৈনিক সীমা গণনার জন্য)
export function startOfDhakaDay(now = new Date()) {
  const day = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Dhaka' }).format(now); // YYYY-MM-DD
  return new Date(`${day}T00:00:00+06:00`);
}
