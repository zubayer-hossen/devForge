import mongoose from 'mongoose';

const schema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    key: { type: String, required: true, maxlength: 60 },
    title: { type: String, required: true, maxlength: 100 },
    description: { type: String, maxlength: 300, default: '' },
    icon: { type: String, maxlength: 40, default: 'award' },
    awardedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

schema.index({ user: 1, key: 1 }, { unique: true });

export default mongoose.model('Achievement', schema);
