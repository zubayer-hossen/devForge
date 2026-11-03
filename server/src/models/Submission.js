import mongoose from 'mongoose';
import { SUBMISSION_STATUS } from '../constants/index.js';

const fileSchema = new mongoose.Schema(
  { name: String, url: String, publicId: String, size: Number, mimeType: String },
  { _id: false }
);

const submissionSchema = new mongoose.Schema(
  {
    task: { type: mongoose.Schema.Types.ObjectId, ref: 'Task', index: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    title: { type: String, required: true, trim: true, maxlength: 150 },
    description: { type: String, required: true, maxlength: 5000 },
    githubUrl: { type: String, trim: true, maxlength: 500 },
    liveUrl: { type: String, trim: true, maxlength: 500 },
    driveUrl: { type: String, trim: true, maxlength: 500 },
    additionalLinks: [{ type: String, trim: true, maxlength: 500 }],
    screenshots: [fileSchema],
    files: [fileSchema],
    technologies: [{ type: String, trim: true, maxlength: 40 }],
    challenges: { type: String, maxlength: 3000, default: '' },
    lessons: { type: String, maxlength: 3000, default: '' },
    notes: { type: String, maxlength: 2000, default: '' },
    status: { type: String, enum: SUBMISSION_STATUS, default: 'SUBMITTED', index: true },
    isLate: { type: Boolean, default: false },
    version: { type: Number, default: 1 },
    pointsAwarded: { type: Number, default: 0, min: 0 },
    history: [
      { status: String, at: { type: Date, default: Date.now }, by: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, _id: false },
    ],
  },
  { timestamps: true }
);

submissionSchema.index({ title: 'text', description: 'text' });

export default mongoose.model('Submission', submissionSchema);
