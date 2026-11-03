import mongoose from 'mongoose';
import { RESOURCE_TYPES } from '../constants/index.js';

const schema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true, maxlength: 150 },
    description: { type: String, maxlength: 1000, default: '' },
    type: { type: String, enum: RESOURCE_TYPES, default: 'OTHER', index: true },
    category: { type: String, trim: true, maxlength: 60, index: true },
    url: { type: String, trim: true, maxlength: 500 },
    file: { name: String, url: String, publicId: String, size: Number, mimeType: String },
    tags: [{ type: String, trim: true, lowercase: true, maxlength: 30 }],
    pinned: { type: Boolean, default: false, index: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

schema.index({ title: 'text', description: 'text', tags: 'text' });

export default mongoose.model('Resource', schema);
