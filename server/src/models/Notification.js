import mongoose from 'mongoose';
import { NOTIFICATION_TYPES } from '../constants/index.js';

const schema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    type: { type: String, enum: NOTIFICATION_TYPES, required: true },
    title: { type: String, required: true, maxlength: 150 },
    message: { type: String, maxlength: 500, default: '' },
    link: { type: String, maxlength: 300 },
    isRead: { type: Boolean, default: false },
    readAt: Date,
    dedupeKey: { type: String, index: true, sparse: true },
  },
  { timestamps: true }
);

schema.index({ user: 1, isRead: 1, createdAt: -1 });

export default mongoose.model('Notification', schema);
