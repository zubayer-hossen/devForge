import { z } from 'zod';

// সার্ভারের ভ্যালিডেশনের সঙ্গে মিল রাখা হয়েছে (সার্ভারই চূড়ান্ত যাচাই করে)
export const passwordRule = z
  .string()
  .min(8, 'পাসওয়ার্ড কমপক্ষে ৮ অক্ষরের হতে হবে')
  .refine((p) => /[a-z]/.test(p), 'একটি ছোট হাতের ইংরেজি অক্ষর (a-z) থাকতে হবে')
  .refine((p) => /[A-Z]/.test(p), 'একটি বড় হাতের ইংরেজি অক্ষর (A-Z) থাকতে হবে')
  .refine((p) => /[0-9]/.test(p), 'একটি সংখ্যা থাকতে হবে');

const email = z.string().trim().toLowerCase().min(1, 'ইমেইল দিন').email('সঠিক ইমেইল দিন');

const optionalUrl = z
  .string()
  .trim()
  .refine((v) => v === '' || /^https?:\/\/\S+\.\S+/i.test(v), 'http:// বা https:// দিয়ে শুরু হওয়া সঠিক লিংক দিন');

const githubUrl = optionalUrl.refine(
  (v) => v === '' || /^https?:\/\/(www\.)?github\.com\/\S+/i.test(v),
  'শুধু github.com লিংক দিন'
);

export const registerFields = {
  step1: ['fullName', 'username', 'email', 'phone', 'password', 'confirmPassword'],
  step2: ['programmingKnowledge', 'currentlyLearning', 'githubUrl', 'portfolioUrl', 'dailyCodingHours'],
  step3: ['primaryGoal', 'motivation'],
  step4: ['agreedToCommitment', 'agreedToRules'],
};

export const registerSchema = z
  .object({
    fullName: z.string().trim().min(2, 'পুরো নাম দিন').max(80),
    username: z.string().trim().toLowerCase().regex(/^[a-z0-9_]{3,30}$/, 'ইউজারনেম ৩-৩০ অক্ষর; শুধু a-z, 0-9 ও _'),
    email,
    phone: z.string().trim().regex(/^\+?[0-9]{7,15}$/, 'সঠিক ফোন নম্বর দিন (শুধু সংখ্যা, শুরুতে + চলবে)'),
    password: passwordRule,
    confirmPassword: z.string().min(1, 'পাসওয়ার্ড আবার লিখুন'),
    programmingKnowledge: z.string().trim().min(10, 'আপনার প্রোগ্রামিং জ্ঞান সম্পর্কে অন্তত কিছু লিখুন').max(1000),
    currentlyLearning: z.array(z.string()).max(15, 'সর্বোচ্চ ১৫টি'),
    githubUrl,
    portfolioUrl: optionalUrl,
    dailyCodingHours: z.coerce.number({ invalid_type_error: 'সংখ্যা দিন' }).min(0, 'শূন্যের কম হবে না').max(24, 'সর্বোচ্চ ২৪ ঘণ্টা'),
    primaryGoal: z.string().trim().min(3, 'আপনার প্রধান লক্ষ্য লিখুন').max(300),
    motivation: z.string().trim().min(20, 'কমপক্ষে ২০ অক্ষরে লিখুন').max(2000),
    agreedToCommitment: z.boolean().refine((v) => v === true, 'প্রতিশ্রুতিতে সম্মতি দিতে হবে'),
    agreedToRules: z.boolean().refine((v) => v === true, 'কমিউনিটি নিয়মে সম্মতি দিতে হবে'),
  })
  .refine((d) => d.password === d.confirmPassword, { path: ['confirmPassword'], message: 'পাসওয়ার্ড দুটি মেলেনি' });

export const loginSchema = z.object({
  identifier: z.string().trim().min(3, 'ইমেইল বা ইউজারনেম দিন'),
  password: z.string().min(1, 'পাসওয়ার্ড দিন'),
});

export const emailOnlySchema = z.object({ email });

export const resetSchema = z
  .object({ password: passwordRule, confirmPassword: z.string().min(1, 'পাসওয়ার্ড আবার লিখুন') })
  .refine((d) => d.password === d.confirmPassword, { path: ['confirmPassword'], message: 'পাসওয়ার্ড দুটি মেলেনি' });

export const profileSchema = z.object({
  bio: z.string().trim().max(500, 'বায়ো সর্বোচ্চ ৫০০ অক্ষর'),
  githubUrl,
  portfolioUrl: optionalUrl,
  skills: z.array(z.string()).max(30, 'সর্বোচ্চ ৩০টি'),
  learningInterests: z.array(z.string()).max(30, 'সর্বোচ্চ ৩০টি'),
});

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, 'বর্তমান পাসওয়ার্ড দিন'),
    newPassword: passwordRule,
    confirmPassword: z.string().min(1, 'পাসওয়ার্ড আবার লিখুন'),
  })
  .refine((d) => d.newPassword === d.confirmPassword, { path: ['confirmPassword'], message: 'পাসওয়ার্ড দুটি মেলেনি' });
