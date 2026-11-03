import mongoose from 'mongoose';
import { ASSIGNMENT_STATUS } from '../constants/index.js';

const schema = new mongoose.Schema(
  {
    task: { type: mongoose.Schema.Types.ObjectId, ref: 'Task', required: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    status: { type: String, enum: ASSIGNMENT_STATUS, default: 'ASSIGNED', index: true },
    startedAt: Date,
    completedAt: Date,
    pointsAwarded: { type: Number, default: 0, min: 0 },
  },
  { timestamps: true }
);

schema.index({ task: 1, user: 1 }, { unique: true });
schema.index({ user: 1, status: 1 });

export default mongoose.model('TaskAssignment', schema);
