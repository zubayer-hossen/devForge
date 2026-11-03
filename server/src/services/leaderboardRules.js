import { addDays, dhakaDay } from './streakRules.js';

// সময়-পরিসরের শুরু (বাংলাদেশ সময়)। সপ্তাহ শুরু শনিবার। 'all' হলে null (পুরো সময়)।
export function periodStart(period, now = new Date()) {
  if (period === 'all') return null;
  const today = dhakaDay(now); // YYYY-MM-DD
  if (period === 'monthly') return new Date(`${today.slice(0, 8)}01T00:00:00+06:00`);
  const [y, m, d] = today.split('-').map(Number);
  const dow = new Date(Date.UTC(y, m - 1, d)).getUTCDay(); // 0=রবি … 6=শনি
  const sinceSaturday = (dow + 1) % 7; // শনি→0, রবি→1 … শুক্র→6
  return new Date(`${addDays(today, -sinceSaturday)}T00:00:00+06:00`);
}

// সমান পয়েন্টে সমান র‍্যাঙ্ক (১, ২, ২, ৪ পদ্ধতি); নাম দিয়ে স্থির ক্রম
export function rankEntries(entries) {
  const sorted = [...entries].sort((a, b) => b.points - a.points || String(a.user.fullName).localeCompare(String(b.user.fullName)));
  let rank = 0;
  return sorted.map((e, i) => {
    if (i === 0 || e.points !== sorted[i - 1].points) rank = i + 1;
    return { ...e, rank };
  });
}
