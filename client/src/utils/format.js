const num = new Intl.NumberFormat('bn-BD');
const date = new Intl.DateTimeFormat('bn-BD', { timeZone: 'Asia/Dhaka', dateStyle: 'medium' });
const dateTime = new Intl.DateTimeFormat('bn-BD', { timeZone: 'Asia/Dhaka', dateStyle: 'medium', timeStyle: 'short' });

export const formatNumber = (n) => num.format(n ?? 0);
export const formatDate = (d) => (d ? date.format(new Date(d)) : '—');
export const formatDateTime = (d) => (d ? dateTime.format(new Date(d)) : '—');
export const initials = (name = '') =>
  name.trim().split(/\s+/).slice(0, 2).map((p) => p[0]).join('').toUpperCase() || '?';

// ডেডলাইন পর্যন্ত বাকি সময় (বাংলায়)
export const timeLeft = (deadline) => {
  const diff = new Date(deadline).getTime() - Date.now();
  if (diff <= 0) return 'ডেডলাইন পেরিয়ে গেছে';
  const min = Math.floor(diff / 60000);
  if (min < 60) return `আর ${num.format(Math.max(min, 1))} মিনিট`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `আর ${num.format(hr)} ঘণ্টা`;
  return `আর ${num.format(Math.floor(hr / 24))} দিন`;
};

// ISO তারিখ → <input type="datetime-local"> এর মান (ব্রাউজারের স্থানীয় সময়ে)
export const toLocalInput = (iso) => {
  if (!iso) return '';
  const d = new Date(iso);
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};
