import mongoose from "mongoose";
import { ACCOUNT_STATUS_LIST } from "../constants/index.js";

const applicationSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    programmingKnowledge: { type: String, required: true, maxlength: 1000 },
    currentlyLearning: [{ type: String, trim: true, maxlength: 40 }],
    githubUrl: { type: String, trim: true, maxlength: 300 },
    portfolioUrl: { type: String, trim: true, maxlength: 300 },
    dailyCodingHours: { type: Number, required: true, min: 0, max: 24 },
    primaryGoal: { type: String, required: true, maxlength: 300 },
    motivation: { type: String, required: true, maxlength: 2000 },
    agreedToCommitment: { type: Boolean, required: true },
    agreedToRules: { type: Boolean, required: true },
    status: {
      type: String,
      enum: ACCOUNT_STATUS_LIST,
      default: "EMAIL_UNVERIFIED",
      index: true,
    },
    reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    reviewedAt: Date,
    reviewNote: { type: String, maxlength: 500 },
  },
  { timestamps: true },
);

export default mongoose.model("Application", applicationSchema);
