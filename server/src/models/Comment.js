import mongoose from 'mongoose';

const schema = new mongoose.Schema(
  {
    post: { type: mongoose.Schema.Types.ObjectId, ref: 'DiscussionPost', required: true, index: true },
    author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    parent: { type: mongoose.Schema.Types.ObjectId, ref: 'Comment', default: null, index: true },
    body: { type: String, required: true, maxlength: 5000 },
    codeSnippet: { language: { type: String, maxlength: 30 }, code: { type: String, maxlength: 10000 } },
    likes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    isAnswer: { type: Boolean, default: false },
    isHidden: { type: Boolean, default: false },
    reports: [
      { user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, reason: { type: String, maxlength: 300 }, at: { type: Date, default: Date.now }, _id: false },
    ],
  },
  { timestamps: true }
);

export default mongoose.model('Comment', schema);
