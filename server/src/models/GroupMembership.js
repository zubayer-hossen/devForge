import mongoose from 'mongoose';

const schema = new mongoose.Schema(
  {
    group: { type: mongoose.Schema.Types.ObjectId, ref: 'Group', required: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    role: { type: String, enum: ['LEAD', 'MEMBER'], default: 'MEMBER' },
    addedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

schema.index({ group: 1, user: 1 }, { unique: true });
schema.index({ user: 1 });

export default mongoose.model('GroupMembership', schema);
