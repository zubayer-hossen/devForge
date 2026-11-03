import mongoose from 'mongoose';
import { DEFAULT_POINT_RULES } from '../constants/index.js';

// সিঙ্গেলটন ডকুমেন্ট (key: 'main')
const schema = new mongoose.Schema(
  {
    key: { type: String, default: 'main', unique: true },
    siteName: { type: String, default: 'DevForge', maxlength: 60 },
    siteDescription: { type: String, default: 'Learn Together. Build Together. Grow Together.', maxlength: 300 },
    logo: { url: String, publicId: String },
    registrationOpen: { type: Boolean, default: true },
    maintenanceMode: { type: Boolean, default: false },
    theme: { type: String, enum: ['dark', 'light', 'system'], default: 'dark' },
    communityRules: { type: String, default: '', maxlength: 20000 },
    upload: {
      maxFileSizeMB: { type: Number, default: 5, min: 1, max: 25 },
      allowedMimeTypes: { type: [String], default: ['image/jpeg', 'image/png', 'image/webp', 'application/pdf', 'application/zip'] },
    },
    emailProvider: { type: String, enum: ['brevo', 'resend'], default: 'brevo' },
    notifications: {
      inApp: { type: Boolean, default: true },
      emailOnNewTask: { type: Boolean, default: true },
      emailOnReview: { type: Boolean, default: true },
      emailOnDeadline: { type: Boolean, default: true },
      deadlineReminderHours: { type: Number, default: 24, min: 1, max: 168 },
    },
    pointRules: {
      peerReview: { type: Number, default: DEFAULT_POINT_RULES.peerReview, min: 0 },
      helpfulAnswer: { type: Number, default: DEFAULT_POINT_RULES.helpfulAnswer, min: 0 },
      dailyStreakBonus: { type: Number, default: DEFAULT_POINT_RULES.dailyStreakBonus, min: 0 },
    },
    timezone: { type: String, default: 'Asia/Dhaka' },
  },
  { timestamps: true }
);

schema.statics.getMain = async function getMain() {
  return this.findOneAndUpdate({ key: 'main' }, { $setOnInsert: { key: 'main' } }, { upsert: true, new: true });
};

export default mongoose.model('SystemSetting', schema);
