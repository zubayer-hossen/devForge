import mongoose from 'mongoose';
import { POINT_REASONS } from '../constants/index.js';

// পয়েন্ট ম্যানিপুলেশন ঠেকাতে প্রতিটি পয়েন্ট পরিবর্তনের রেকর্ড এবং sourceKey দিয়ে ডুপ্লিকেট প্রতিরোধ।
const schema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    amount: { type: Number, required: true },
    reason: { type: String, enum: POINT_REASONS, required: true },
    sourceKey: { type: String, required: true, unique: true },
    note: { type: String, maxlength: 300 },
    awardedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

schema.index({ user: 1, createdAt: -1 });

export default mongoose.model('PointTransaction', schema);
