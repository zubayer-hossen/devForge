import rateLimit from 'express-rate-limit';

const make = (windowMs, max, message, extra = {}) =>
  rateLimit({
    windowMs,
    max,
    ...extra,
    standardHeaders: true,
    legacyHeaders: false,
    message: { success: false, code: 'TOO_MANY_REQUESTS', message },
  });

export const globalLimiter = make(15 * 60 * 1000, 600, 'অনেক বেশি অনুরোধ হয়েছে, কিছুক্ষণ পরে চেষ্টা করুন।');
export const authLimiter = make(15 * 60 * 1000, 30, 'অনেকবার চেষ্টা হয়েছে, ১৫ মিনিট পরে আবার চেষ্টা করুন।', { skipSuccessfulRequests: true });
export const otpLimiter = make(10 * 60 * 1000, 8, 'OTP অনুরোধ সীমা পার হয়েছে, ১০ মিনিট পরে চেষ্টা করুন।');
export const uploadLimiter = make(15 * 60 * 1000, 60, 'অনেক বেশি ফাইল আপলোড হয়েছে, পরে চেষ্টা করুন।');
export const writeLimiter = make(15 * 60 * 1000, 60, 'অনেক বেশি অনুরোধ হয়েছে, কিছুক্ষণ পরে চেষ্টা করুন।');
// স্প্যাম ঠেকাতে: নতুন পোস্ট/মন্তব্য/রিপোর্ট
export const forumLimiter = make(10 * 60 * 1000, 30, 'অনেক দ্রুত লিখছেন, কয়েক মিনিট পরে আবার চেষ্টা করুন।');
