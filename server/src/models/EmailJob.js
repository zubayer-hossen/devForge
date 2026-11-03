import mongoose from 'mongoose';
import { EMAIL_TYPES, EMAIL_JOB_STATUS } from '../constants/index.js';

const schema = new mongoose.Schema(
  {
    to: { type: String, required: true, lowercase: true },
    type: { type: String, enum: EMAIL_TYPES, required: true },
    subject: { type: String, required: true, maxlength: 300 },
    html: { type: String, required: true },
    text: { type: String },
    dedupeKey: { type: String, unique: true, sparse: true }, // ডুপ্লিকেট জব প্রতিরোধ
    status: { type: String, enum: EMAIL_JOB_STATUS, default: 'PENDING', index: true },
    attempts: { type: Number, default: 0 },
    maxAttempts: { type: Number, default: 5 },
    nextAttemptAt: { type: Date, default: Date.now, index: true },
    lastError: { type: String, maxlength: 1000 },
    sentAt: Date,
  },
  { timestamps: true }
);

schema.index({ status: 1, nextAttemptAt: 1 });

export default mongoose.model('EmailJob', schema);
