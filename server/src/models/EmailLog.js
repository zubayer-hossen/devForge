import mongoose from 'mongoose';
import { EMAIL_TYPES } from '../constants/index.js';

const schema = new mongoose.Schema(
  {
    to: { type: String, required: true, lowercase: true, index: true },
    type: { type: String, enum: EMAIL_TYPES, required: true },
    subject: { type: String, maxlength: 300 },
    provider: { type: String, enum: ['brevo', 'resend', 'console'] },
    providerMessageId: String,
    status: { type: String, enum: ['SENT', 'FAILED', 'DELIVERED', 'BOUNCED'], required: true, index: true },
    error: { type: String, maxlength: 1000 },
    attempt: { type: Number, default: 1 },
    job: { type: mongoose.Schema.Types.ObjectId, ref: 'EmailJob' },
  },
  { timestamps: true }
);

schema.index({ createdAt: -1 });

export default mongoose.model('EmailLog', schema);
