import mongoose from 'mongoose';

const schema = new mongoose.Schema(
  {
    author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    type: { type: String, enum: ['DISCUSSION', 'QUESTION'], default: 'DISCUSSION', index: true },
    title: { type: String, required: true, trim: true, maxlength: 200 },
    body: { type: String, required: true, maxlength: 10000 },
    codeSnippets: [{ language: { type: String, maxlength: 30 }, code: { type: String, maxlength: 10000 }, _id: false }],
    tags: [{ type: String, trim: true, lowercase: true, maxlength: 30 }],
    likes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    bookmarks: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    commentCount: { type: Number, default: 0 },
    isResolved: { type: Boolean, default: false },
    acceptedAnswer: { type: mongoose.Schema.Types.ObjectId, ref: 'Comment' },
    reports: [
      { user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, reason: { type: String, maxlength: 300 }, at: { type: Date, default: Date.now }, _id: false },
    ],
    isHidden: { type: Boolean, default: false, index: true },
    isPinned: { type: Boolean, default: false },
  },
  { timestamps: true }
);

schema.index({ title: 'text', body: 'text', tags: 'text' });

export default mongoose.model('DiscussionPost', schema);
