// ব্যাজের তালিকা ও শর্ত (বিশুদ্ধ; stats অবজেক্ট থেকে কোন ব্যাজ অর্জিত তা বের করে)
export const CATALOG = [
  { key: 'FIRST_POST', title: 'প্রথম পোস্ট', icon: 'message', hint: 'ফোরামে প্রথম পোস্ট করুন', test: (s) => s.forumPosts >= 1 },
  { key: 'FIRST_SUBMISSION', title: 'প্রথম সাবমিশন', icon: 'rocket', hint: 'প্রথম কাজ জমা দিন', test: (s) => s.submissions >= 1 },
  { key: 'FIRST_APPROVED', title: 'প্রথম অনুমোদন', icon: 'check', hint: 'একটি সাবমিশন অনুমোদন পান', test: (s) => s.approved >= 1 },
  { key: 'TASKS_5', title: '৫টি টাস্ক সম্পন্ন', icon: 'award', hint: '৫টি টাস্ক সম্পন্ন করুন', test: (s) => s.completedTasks >= 5 },
  { key: 'TASKS_20', title: '২০টি টাস্ক সম্পন্ন', icon: 'award', hint: '২০টি টাস্ক সম্পন্ন করুন', test: (s) => s.completedTasks >= 20 },
  { key: 'STREAK_3', title: '৩ দিনের স্ট্রিক', icon: 'flame', hint: 'টানা ৩ দিন শেখার কাজ করুন', test: (s) => s.longestStreak >= 3 },
  { key: 'STREAK_7', title: '৭ দিনের স্ট্রিক', icon: 'flame', hint: 'টানা ৭ দিন শেখার কাজ করুন', test: (s) => s.longestStreak >= 7 },
  { key: 'STREAK_30', title: '৩০ দিনের স্ট্রিক', icon: 'flame', hint: 'টানা ৩০ দিন শেখার কাজ করুন', test: (s) => s.longestStreak >= 30 },
  { key: 'HELPER_1', title: 'সহায়ক', icon: 'heart', hint: 'একটি উত্তর গৃহীত হোক', test: (s) => s.helpful >= 1 },
  { key: 'HELPER_10', title: 'কমিউনিটির সহায়ক', icon: 'heart', hint: '১০টি উত্তর গৃহীত হোক', test: (s) => s.helpful >= 10 },
  { key: 'POINTS_100', title: '১০০ পয়েন্ট', icon: 'star', hint: '১০০ পয়েন্ট অর্জন করুন', test: (s) => s.points >= 100 },
  { key: 'POINTS_500', title: '৫০০ পয়েন্ট', icon: 'star', hint: '৫০০ পয়েন্ট অর্জন করুন', test: (s) => s.points >= 500 },
  { key: 'POINTS_1000', title: '১০০০ পয়েন্ট', icon: 'trophy', hint: '১০০০ পয়েন্ট অর্জন করুন', test: (s) => s.points >= 1000 },
];

export const earnedKeys = (stats) => CATALOG.filter((a) => a.test(stats)).map((a) => a.key);
export const catalogItem = (key) => CATALOG.find((a) => a.key === key);
