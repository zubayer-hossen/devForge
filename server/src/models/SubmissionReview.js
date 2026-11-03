import mongoose from 'mongoose';
import { REVIEW_DECISIONS } from '../constants/index.js';

const schema = new mongoose.Schema(
  {
    submission: { type: mongoose.Schema.Types.ObjectId, ref: 'Submission', required: true, index: true },
    reviewer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    decision: { type: String, enum: REVIEW_DECISIONS, required: true },
    feedback: { type: String, maxlength: 5000, default: '' },
    points: { type: Number, default: 0, min: 0 },
    submissionVersion: { type: Number, default: 1 },
  },
  { timestamps: true }
);

export default mongoose.model('SubmissionReview', schema);
