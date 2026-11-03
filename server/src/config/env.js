import dotenv from 'dotenv';
dotenv.config();

const get = (key, fallback = '') => (process.env[key] ?? fallback).toString().trim();

export const env = Object.freeze({
  nodeEnv: get('NODE_ENV', 'development'),
  isProd: get('NODE_ENV', 'development') === 'production',
  port: Number(get('PORT', '5000')),
  mongoUri: get('MONGODB_URI'),
  clientUrl: get('CLIENT_URL', 'http://localhost:5173'),
  appUrl: get('APP_URL', 'http://localhost:5000'),
  jwtAccessSecret: get('JWT_ACCESS_SECRET'),
  jwtRefreshSecret: get('JWT_REFRESH_SECRET'),
  cookieSecret: get('COOKIE_SECRET'),
  emailProvider: get('EMAIL_PROVIDER', 'brevo').toLowerCase(),
  brevo: {
    apiKey: get('BREVO_API_KEY'),
    senderEmail: get('BREVO_SENDER_EMAIL'),
    senderName: get('BREVO_SENDER_NAME', 'DevForge'),
  },
  resend: { apiKey: get('RESEND_API_KEY'), fromEmail: get('RESEND_FROM_EMAIL') },
  cloudinary: {
    cloudName: get('CLOUDINARY_CLOUD_NAME'),
    apiKey: get('CLOUDINARY_API_KEY'),
    apiSecret: get('CLOUDINARY_API_SECRET'),
  },
  turnstileSecret: get('TURNSTILE_SECRET_KEY'),
  admin: { name: get('ADMIN_NAME'), email: get('ADMIN_EMAIL'), password: get('ADMIN_PASSWORD') },
  timezone: get('TZ', 'Asia/Dhaka'),
});

// শুধু যে ভ্যারিয়েবল ছাড়া সার্ভার চলতেই পারে না, সেগুলো বাধ্যতামূলক।
export function validateRequiredEnv() {
  const required = {
    MONGODB_URI: env.mongoUri,
    JWT_ACCESS_SECRET: env.jwtAccessSecret,
    JWT_REFRESH_SECRET: env.jwtRefreshSecret,
    COOKIE_SECRET: env.cookieSecret,
  };
  const missing = Object.entries(required).filter(([, v]) => !v).map(([k]) => k);
  if (missing.length) {
    throw new Error(`এই .env ভ্যারিয়েবলগুলো পূরণ করা হয়নি: ${missing.join(', ')}`);
  }
  for (const k of ['JWT_ACCESS_SECRET', 'JWT_REFRESH_SECRET', 'COOKIE_SECRET']) {
    if (required[k].length < 32) {
      throw new Error(`${k} কমপক্ষে ৩২ অক্ষরের হতে হবে।`);
    }
  }
}

// ঐচ্ছিক সার্ভিস: কনফিগার না থাকলে অ্যাপ ক্র্যাশ করবে না, শুধু ফিচার বন্ধ থাকবে।
export const services = Object.freeze({
  brevo: () => Boolean(env.brevo.apiKey && env.brevo.senderEmail),
  resend: () => Boolean(env.resend.apiKey && env.resend.fromEmail),
  cloudinary: () => Boolean(env.cloudinary.cloudName && env.cloudinary.apiKey && env.cloudinary.apiSecret),
  turnstile: () => Boolean(env.turnstileSecret),
});
