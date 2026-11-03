import { env, services } from '../config/env.js';
import { AppError } from '../utils/AppError.js';

export async function verifyTurnstile(token, ip) {
  // Turnstile কনফিগার না থাকলে যাচাই বাদ যায় (অ্যাপ ক্র্যাশ করে না); স্টার্টআপে সতর্কবার্তা দেখানো হয়।
  if (!services.turnstile()) return true;
  if (!token) throw AppError.badRequest('বট-যাচাই (Turnstile) সম্পন্ন করুন');

  const form = new URLSearchParams({ secret: env.turnstileSecret, response: token });
  if (ip) form.set('remoteip', ip);

  let data;
  try {
    const res = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST', body: form, signal: AbortSignal.timeout(10000),
    });
    data = await res.json();
  } catch {
    throw new AppError('বট-যাচাই সার্ভারে সংযোগ করা যায়নি, আবার চেষ্টা করুন', 503, 'TURNSTILE_UNAVAILABLE');
  }
  if (!data?.success) throw AppError.badRequest('বট-যাচাই ব্যর্থ হয়েছে, পেজ রিফ্রেশ করে আবার চেষ্টা করুন');
  return true;
}
