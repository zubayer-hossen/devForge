// "a=1; b=2" হেডার থেকে কুকি বের করা (সকেটে cookie-parser চলে না)। বিকৃত মান হলে ঐ কুকিটি বাদ যায়, ত্রুটি ছোঁড়ে না।
export function parseCookieHeader(header = '') {
  const out = {};
  for (const part of String(header).split(';')) {
    const i = part.indexOf('=');
    if (i < 0) continue;
    const key = part.slice(0, i).trim();
    if (!key) continue; // ফাঁকা নামের কুকি বাদ
    const raw = part.slice(i + 1).trim();
    try { out[key] = decodeURIComponent(raw); } catch { /* বিকৃত এনকোডিং উপেক্ষা */ }
  }
  return out;
}
