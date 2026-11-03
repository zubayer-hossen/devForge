import mongoose from 'mongoose';
import { TASK_CATEGORIES, TASK_PRIORITIES, TASK_STATUS } from '../constants/index.js';

const linkSchema = new mongoose.Schema(
  { label: { type: String, trim: true, maxlength: 80 }, url: { type: String, required: true, trim: true, maxlength: 500 } },
  { _id: false }
);

const fileSchema = new mongoose.Schema(
  { name: String, url: String, publicId: String, size: Number, mimeType: String },
  { _id: false }
);

const taskSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true, minlength: 3, maxlength: 150 },
    description: { type: String, required: true, maxlength: 5000 },
    instructions: { type: String, maxlength: 10000, default: '' },
    category: { type: String, enum: TASK_CATEGORIES, required: true, index: true },
    priority: { type: String, enum: TASK_PRIORITIES, default: 'MEDIUM' },
    status: { type: String, enum: TASK_STATUS, default: 'DRAFT', index: true },
    deadline: { type: Date, index: true },
    points: { type: Number, default: 10, min: 0, max: 1000 },
    figmaLinks: [linkSchema],
    githubLinks: [linkSchema],
    driveLinks: [linkSchema],
    docLinks: [linkSchema],
    attachments: [fileSchema],
    evaluationCriteria: [
      { title: { type: String, required: true, maxlength: 120 }, maxPoints: { type: Number, min: 0, default: 0 }, _id: false },
    ],
    allowLateSubmission: { type: Boolean, default: false },
    assignTo: { type: String, enum: ['ALL', 'SELECTED', 'GROUPS'], default: 'ALL' },
    assignedUsers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    assignedGroups: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Group' }],
    publishedAt: Date,
    reminderSentAt: Date,
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

taskSchema.index({ title: 'text', description: 'text' });

export default mongoose.model('Task', taskSchema);
