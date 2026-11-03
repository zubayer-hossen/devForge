import crypto from 'node:crypto';

export const sha256 = (value) => crypto.createHash('sha256').update(String(value)).digest('hex');
export const hmacSha256 = (value, secret) =>
  crypto.createHmac('sha256', secret).update(String(value)).digest('hex');

// crypto.randomInt নিরাপদ র‍্যান্ডম সংখ্যা দেয় (Math.random নয়)
export const generateOtp = () => String(crypto.randomInt(0, 1_000_000)).padStart(6, '0');
export const randomToken = (bytes = 32) => crypto.randomBytes(bytes).toString('hex');

export function safeEqualHex(a, b) {
  if (typeof a !== 'string' || typeof b !== 'string') return false;
  const ba = Buffer.from(a, 'hex');
  const bb = Buffer.from(b, 'hex');
  return ba.length === bb.length && ba.length > 0 && crypto.timingSafeEqual(ba, bb);
}
