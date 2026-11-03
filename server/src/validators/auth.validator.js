import { z } from 'zod';
import { urlSchema, optionalUrl } from '../utils/validators.js';

const email = z.string().trim().toLowerCase().email('সঠিক ইমেইল দিন').max(254);

export const passwordSchema = z
  .string()
  .min(8, 'পাসওয়ার্ড কমপক্ষে ৮ অক্ষরের হতে হবে')
  .refine((p) => Buffer.byteLength(p) <= 72, 'পাসওয়ার্ড অনেক বড় (সর্বোচ্চ ৭২ বাইট)')
  .refine((p) => /[a-z]/.test(p), 'পাসওয়ার্ডে একটি ছোট হাতের ইংরেজি অক্ষর (a-z) থাকতে হবে')
  .refine((p) => /[A-Z]/.test(p), 'পাসওয়ার্ডে একটি বড় হাতের ইংরেজি অক্ষর (A-Z) থাকতে হবে')
  .refine((p) => /[0-9]/.test(p), 'পাসওয়ার্ডে একটি সংখ্যা থাকতে হবে');

export const githubUrlSchema = z
  .union([
    urlSchema.refine((u) => {
      try {
        const h = new URL(u).hostname.toLowerCase();
        return h === 'github.com' || h === 'www.github.com';
      } catch { return false; }
    }, 'শুধু github.com লিংক দিন'),
    z.literal(''),
  ])
  .optional();

export const registerSchema = z
  .object({
    fullName: z.string().trim().min(2, 'পুরো নাম দিন').max(80),
    username: z.string().trim().toLowerCase().regex(/^[a-z0-9_]{3,30}$/, 'ইউজারনেম ৩-৩০ অক্ষর; শুধু a-z, 0-9 ও _'),
    email,
    phone: z.string().trim().regex(/^\+?[0-9]{7,15}$/, 'সঠিক ফোন নম্বর দিন (শুধু সংখ্যা, শুরুতে + চলবে)'),
    password: passwordSchema,
    confirmPassword: z.string(),
    programmingKnowledge: z.string().trim().min(10, 'আপনার প্রোগ্রামিং জ্ঞান সম্পর্কে কিছু লিখুন').max(1000),
    currentlyLearning: z.array(z.string().trim().min(1).max(40)).max(15).default([]),
    githubUrl: githubUrlSchema,
    portfolioUrl: optionalUrl,
    dailyCodingHours: z.coerce.number().min(0).max(24),
    primaryGoal: z.string().trim().min(3).max(300),
    motivation: z.string().trim().min(20, 'কেন যুক্ত হতে চান তা কমপক্ষে ২০ অক্ষরে লিখুন').max(2000),
    agreedToCommitment: z.literal(true, { errorMap: () => ({ message: 'প্রতিশ্রুতি চুক্তিতে সম্মতি দিতে হবে' }) }),
    agreedToRules: z.literal(true, { errorMap: () => ({ message: 'কমিউনিটি নিয়মে সম্মতি দিতে হবে' }) }),
    turnstileToken: z.string().max(4096).optional(),
  })
  .refine((d) => d.password === d.confirmPassword, {
    path: ['confirmPassword'],
    message: 'পাসওয়ার্ড দুটি মেলেনি',
  });

export const verifyEmailSchema = z.object({
  email,
  otp: z.string().trim().regex(/^[0-9]{6}$/, 'OTP ৬ সংখ্যার হতে হবে'),
});

export const resendOtpSchema = z.object({ email, turnstileToken: z.string().max(4096).optional() });

export const loginSchema = z.object({
  identifier: z.string().trim().toLowerCase().min(3).max(254),
  password: z.string().min(1).max(200),
});

export const forgotPasswordSchema = z.object({ email, turnstileToken: z.string().max(4096).optional() });

export const resetPasswordSchema = z
  .object({
    token: z.string().trim().regex(/^[a-f0-9]{64}$/, 'অবৈধ রিসেট লিংক'),
    password: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine((d) => d.password === d.confirmPassword, { path: ['confirmPassword'], message: 'পাসওয়ার্ড দুটি মেলেনি' });

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1).max(200),
    newPassword: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine((d) => d.newPassword === d.confirmPassword, { path: ['confirmPassword'], message: 'পাসওয়ার্ড দুটি মেলেনি' });
