// স্ট্রিকের বিশুদ্ধ নিয়ম (বাংলাদেশ সময়ের তারিখ-স্ট্রিং YYYY-MM-DD দিয়ে কাজ করে)
export const dhakaDay = (d = new Date()) => new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Dhaka' }).format(d);

export function addDays(day, n) {
  const [y, m, d] = day.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d) + n * 86_400_000).toISOString().slice(0, 10);
}

// আজ একটি যোগ্য কাজ হলে স্ট্রিক কী হবে। একই দিনে আবার কাজ করলে কিছু বদলায় না।
export function nextStreak(streak = {}, today) {
  const { lastActiveDate, current = 0, longest = 0 } = streak;
  if (lastActiveDate === today) return { changed: false, current, longest, lastActiveDate };
  const c = lastActiveDate === addDays(today, -1) ? current + 1 : 1;
  return { changed: true, current: c, longest: Math.max(longest, c), lastActiveDate: today };
}

// দেখানোর সময় বর্তমান স্ট্রিক: গতকাল বা আজকের পর কাজ না থাকলে স্ট্রিক ভেঙে গেছে (০)
export function effectiveCurrent(streak = {}, today) {
  const { lastActiveDate, current = 0 } = streak;
  if (!lastActiveDate) return 0;
  return lastActiveDate === today || lastActiveDate === addDays(today, -1) ? current : 0;
}
