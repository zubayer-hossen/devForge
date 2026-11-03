import mongoose from "mongoose";
import {
  ROLE_LIST,
  ROLES,
  ACCOUNT_STATUS_LIST,
  ACCOUNT_STATUS,
} from "../constants/index.js";

const userSchema = new mongoose.Schema(
  {
    fullName: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 80,
    },
    username: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      minlength: 3,
      maxlength: 30,
      match: /^[a-z0-9_]+$/,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      maxlength: 254,
    },
    phone: { type: String, trim: true, maxlength: 20 },
    passwordHash: { type: String, required: true, select: false },
    avatar: { url: String, publicId: String },
    bio: { type: String, maxlength: 500, default: "" },
    skills: [{ type: String, trim: true, maxlength: 40 }],
    learningInterests: [{ type: String, trim: true, maxlength: 40 }],
    githubUrl: { type: String, trim: true, maxlength: 300 },
    portfolioUrl: { type: String, trim: true, maxlength: 300 },

    role: { type: String, enum: ROLE_LIST, default: ROLES.MEMBER, index: true },
    status: {
      type: String,
      enum: ACCOUNT_STATUS_LIST,
      default: ACCOUNT_STATUS.EMAIL_UNVERIFIED,
      index: true,
    },
    emailVerified: { type: Boolean, default: false },

    otpHash: { type: String, select: false },
    otpExpiresAt: { type: Date, select: false },
    otpAttempts: { type: Number, default: 0, select: false },
    otpLastSentAt: { type: Date, select: false },
    resetTokenHash: { type: String, select: false },
    resetTokenExpiresAt: { type: Date, select: false },
    refreshTokenHashes: { type: [String], select: false, default: [] },

    points: { type: Number, default: 0, min: 0, index: true },
    streak: {
      current: { type: Number, default: 0 },
      longest: { type: Number, default: 0 },
      lastActiveDate: { type: String }, // YYYY-MM-DD (Asia/Dhaka)
    },

    approvedAt: Date,
    approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    suspendedReason: { type: String, maxlength: 300 },
    lastLoginAt: Date,
    lastActiveAt: Date,
  },
  { timestamps: true },
);

userSchema.index({ fullName: "text", username: "text", email: "text" });

userSchema.methods.toSafeJSON = function toSafeJSON() {
  const o = this.toObject();
  delete o.passwordHash;
  delete o.otpHash;
  delete o.otpExpiresAt;
  delete o.otpAttempts;
  delete o.otpLastSentAt;
  delete o.resetTokenHash;
  delete o.resetTokenExpiresAt;
  delete o.refreshTokenHashes;
  delete o.__v;
  return o;
};

export default mongoose.model("User", userSchema);
