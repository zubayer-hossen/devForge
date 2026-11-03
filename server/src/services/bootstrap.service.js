import bcrypt from 'bcryptjs';
import { User } from '../models/index.js';
import { ROLES, ACCOUNT_STATUS } from '../constants/index.js';
import { env } from '../config/env.js';
import { passwordSchema } from '../validators/auth.validator.js';
import { randomToken } from '../utils/crypto.js';

// ওয়ান-টাইম Super Admin তৈরি: শুধু তখনই চলে যখন ডাটাবেসে কোনো SUPER_ADMIN নেই।
export async function bootstrapSuperAdmin() {
  const { name, email, password } = env.admin;
  if (!name || !email || !password) return;
  if (await User.exists({ role: ROLES.SUPER_ADMIN })) return;

  const normalizedEmail = email.toLowerCase();
  const parsed = passwordSchema.safeParse(password);
  if (!parsed.success) {
    console.warn(`ADMIN_PASSWORD দুর্বল, Super Admin তৈরি হয়নি: ${parsed.error.issues[0].message}`);
    return;
  }
  // একই ইমেইলে আগে থেকে সাধারণ অ্যাকাউন্ট থাকলে স্বয়ংক্রিয়ভাবে প্রমোট করা হয় না (নিরাপত্তার জন্য)
  if (await User.exists({ email: normalizedEmail })) {
    console.warn('ADMIN_EMAIL দিয়ে আগে থেকেই একটি অ্যাকাউন্ট আছে। অন্য ইমেইল ব্যবহার করুন।');
    return;
  }

  let username = normalizedEmail.split('@')[0].toLowerCase().replace(/[^a-z0-9_]/g, '').slice(0, 20) || 'founder';
  if (username.length < 3) username = `founder_${username}`;
  if (await User.exists({ username })) username = `${username}_${randomToken(2)}`;

  await User.create({
    fullName: name, username, email: normalizedEmail,
    passwordHash: await bcrypt.hash(password, 12),
    role: ROLES.SUPER_ADMIN, status: ACCOUNT_STATUS.APPROVED, emailVerified: true, approvedAt: new Date(),
  });
  console.log(`Super Admin তৈরি হয়েছে: ${normalizedEmail}`);
  console.log('নিরাপত্তার জন্য এখন .env থেকে ADMIN_PASSWORD মুছে ফেলুন (ভবিষ্যতে এটি আর ব্যবহৃত হবে না)।');
}
