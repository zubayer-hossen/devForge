import mongoose from 'mongoose';

const schema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true, maxlength: 150 },
    body: { type: String, required: true, maxlength: 10000 },
    pinned: { type: Boolean, default: false, index: true },
    status: { type: String, enum: ['DRAFT', 'SCHEDULED', 'PUBLISHED'], default: 'DRAFT', index: true },
    publishAt: { type: Date, index: true },
    publishedAt: Date,
    audienceGroups: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Group' }],
    sendEmail: { type: Boolean, default: false },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

schema.index({ title: 'text', body: 'text' });

export default mongoose.model('Announcement', schema);
