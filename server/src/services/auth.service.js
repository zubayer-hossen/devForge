import bcrypt from "bcryptjs";

import { User, Application, EmailJob } from "../models/index.js";
import { ACCOUNT_STATUS, ROLES } from "../constants/index.js";
import { env } from "../config/env.js";
import { AppError } from "../utils/AppError.js";

import {
  generateOtp,
  hmacSha256,
  safeEqualHex,
  randomToken,
  sha256,
} from "../utils/crypto.js";

import {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
} from "../utils/jwt.js";

import { isDisposableEmail } from "../utils/disposableDomains.js";
import { verifyTurnstile } from "./turnstile.service.js";
import { enqueueEmail } from "./email/email.service.js";
import { getSettings } from "./settings.service.js";
import { logActivity } from "./activity.service.js";
import { notifyAdmins } from "./notification.service.js";

// ==========================================
// CONFIGURATION
// ==========================================

const BCRYPT_COST = 12;

const OTP_TTL_MIN = 10;
const OTP_MAX_ATTEMPTS = 5;
const OTP_RESEND_COOLDOWN_S = 60;

const RESET_TTL_MIN = 30;

const MAX_SESSIONS = 5;

const RESERVED_USERNAMES = new Set([
  "admin",
  "root",
  "support",
  "devforge",
  "moderator",
  "system",
  "administrator",
]);

// Timing attack mitigation
const DUMMY_HASH = bcrypt.hashSync("devforge-timing-equalizer", BCRYPT_COST);

const otpHash = (otp) => hmacSha256(otp, env.cookieSecret);

// ==========================================
// HELPERS
// ==========================================

async function safeActivityLog(data) {
  try {
    await logActivity(data);
  } catch (error) {
    console.error("[AUTH ACTIVITY LOG ERROR]", error.message);
  }
}

function getDuplicateError(error) {
  if (error?.code === 11000) {
    return AppError.conflict(
      "এই ইমেইল অথবা ইউজারনেম আগে থেকেই ব্যবহার করা হয়েছে।",
    );
  }

  return error;
}

function getEmailCooldown(lastSentAt) {
  if (!lastSentAt) return 0;

  const elapsed = Math.floor(
    (Date.now() - new Date(lastSentAt).getTime()) / 1000,
  );

  return Math.max(0, OTP_RESEND_COOLDOWN_S - elapsed);
}

// ==========================================
// OTP SYSTEM
// ==========================================

/**
 * Generate, store and enqueue OTP email.
 *
 * Registration-এর সময় cooldown check প্রয়োজন নেই।
 */
async function issueOtp(user) {
  const otp = generateOtp();
  const now = new Date();

  const result = await User.updateOne(
    {
      _id: user._id,
      emailVerified: { $ne: true },
    },
    {
      $set: {
        otpHash: otpHash(otp),
        otpExpiresAt: new Date(now.getTime() + OTP_TTL_MIN * 60_000),
        otpAttempts: 0,
        otpLastSentAt: now,
      },
    },
  );

  if (!result.matchedCount) {
    throw AppError.badRequest("এই অ্যাকাউন্টে OTP পাঠানো সম্ভব হচ্ছে না।");
  }

  await enqueueEmail({
    to: user.email,
    type: "OTP",
    data: {
      name: user.fullName,
      otp,
      minutes: OTP_TTL_MIN,
    },
    dedupeKey: `otp:${user._id}:${now.getTime()}`,
  });
}

/**
 * Atomically increment failed OTP attempts.
 */
async function incrementOtpAttempts(user) {
  await User.updateOne(
    {
      _id: user._id,
      emailVerified: { $ne: true },
      otpHash: user.otpHash,
      otpExpiresAt: { $gt: new Date() },
      otpAttempts: { $lt: OTP_MAX_ATTEMPTS },
    },
    {
      $inc: {
        otpAttempts: 1,
      },
    },
  );

  const latest = await User.findById(user._id).select("+otpAttempts");

  const attempts = latest?.otpAttempts ?? OTP_MAX_ATTEMPTS;

  if (attempts >= OTP_MAX_ATTEMPTS) {
    throw new AppError(
      "অনেকবার ভুল OTP দেওয়া হয়েছে, নতুন OTP চান",
      429,
      "OTP_LOCKED",
    );
  }

  const left = OTP_MAX_ATTEMPTS - attempts;

  throw new AppError(
    `OTP সঠিক নয় (আর ${left} বার চেষ্টা করতে পারবেন)`,
    400,
    "OTP_INVALID",
  );
}

// ==========================================
// SESSION SYSTEM
// ==========================================

/**
 * Create a new authentication session.
 *
 * সর্বোচ্চ ৫টি refresh session রাখা হবে।
 */
export async function issueSession(user, res, setCookies) {
  const access = signAccessToken(user);
  const refresh = signRefreshToken(user);

  const result = await User.updateOne(
    { _id: user._id },
    {
      $push: {
        refreshTokenHashes: {
          $each: [sha256(refresh)],
          $slice: -MAX_SESSIONS,
        },
      },
      $set: {
        lastLoginAt: new Date(),
      },
    },
  );

  if (!result.matchedCount) {
    throw AppError.unauthorized("অ্যাকাউন্টটি পাওয়া যায়নি");
  }

  setCookies(res, access, refresh);
}

// ==========================================
// REGISTER
// ==========================================

export async function register(data, ctx) {
  const settings = await getSettings();

  if (!settings.registrationOpen) {
    throw AppError.forbidden("এই মুহূর্তে নতুন আবেদন গ্রহণ বন্ধ আছে");
  }

  await verifyTurnstile(data.turnstileToken, ctx.ip);

  if (isDisposableEmail(data.email)) {
    throw AppError.badRequest(
      "অস্থায়ী (disposable) ইমেইল ব্যবহার করা যাবে না",
    );
  }

  if (RESERVED_USERNAMES.has(String(data.username).toLowerCase())) {
    throw AppError.badRequest("এই ইউজারনেম ব্যবহার করা যাবে না");
  }

  const existing = await User.findOne({
    $or: [{ email: data.email }, { username: data.username }],
  }).select("email username");

  if (existing?.email === data.email) {
    throw AppError.conflict(
      "এই ইমেইল দিয়ে আগেই আবেদন করা হয়েছে। যাচাই বাকি থাকলে OTP পুনরায় পাঠান বা লগইন করুন।",
    );
  }

  if (existing) {
    throw AppError.conflict("এই ইউজারনেমটি আগে থেকেই নেওয়া আছে");
  }

  const passwordHash = await bcrypt.hash(data.password, BCRYPT_COST);

  let user;

  try {
    user = await User.create({
      fullName: data.fullName,
      username: data.username,
      email: data.email,
      phone: data.phone,

      passwordHash,

      githubUrl: data.githubUrl || undefined,
      portfolioUrl: data.portfolioUrl || undefined,

      skills: data.currentlyLearning,

      role: ROLES.MEMBER,
      status: ACCOUNT_STATUS.EMAIL_UNVERIFIED,
    });

    await Application.create({
      user: user._id,

      programmingKnowledge: data.programmingKnowledge,
      currentlyLearning: data.currentlyLearning,

      githubUrl: data.githubUrl || undefined,
      portfolioUrl: data.portfolioUrl || undefined,

      dailyCodingHours: data.dailyCodingHours,
      primaryGoal: data.primaryGoal,
      motivation: data.motivation,

      agreedToCommitment: data.agreedToCommitment,
      agreedToRules: data.agreedToRules,

      status: ACCOUNT_STATUS.EMAIL_UNVERIFIED,
    });

    await issueOtp(user);
  } catch (error) {
    if (user?._id) {
      await Promise.allSettled([
        User.deleteOne({ _id: user._id }),
        Application.deleteOne({ user: user._id }),
      ]);
    }

    throw getDuplicateError(error);
  }

  await safeActivityLog({
    actor: user._id,
    action: "AUTH_REGISTER",
    targetType: "User",
    targetId: user._id,
    req: ctx.req,
  });

  return {
    email: user.email,
  };
}

// ==========================================
// VERIFY EMAIL
// ==========================================

export async function verifyEmail({ email, otp }, ctx) {
  const user = await User.findOne({ email }).select(
    "+otpHash +otpExpiresAt +otpAttempts",
  );

  const generic = AppError.badRequest("OTP সঠিক নয় বা মেয়াদ শেষ");

  if (!user || user.emailVerified || !user.otpHash) {
    throw generic;
  }

  const now = new Date();

  if (!user.otpExpiresAt || user.otpExpiresAt <= now) {
    throw new AppError(
      "OTP-র মেয়াদ শেষ হয়েছে, নতুন OTP চান",
      400,
      "OTP_EXPIRED",
    );
  }

  if ((user.otpAttempts ?? 0) >= OTP_MAX_ATTEMPTS) {
    throw new AppError(
      "অনেকবার ভুল OTP দেওয়া হয়েছে, নতুন OTP চান",
      429,
      "OTP_LOCKED",
    );
  }

  const submittedHash = otpHash(String(otp));

  if (!safeEqualHex(submittedHash, user.otpHash)) {
    await incrementOtpAttempts(user);
  }

  /**
   * Atomic OTP consumption.
   *
   * একই OTP concurrent request-এ দ্বিতীয়বার
   * ব্যবহার করা যাবে না।
   */
  const verifiedUser = await User.findOneAndUpdate(
    {
      _id: user._id,
      emailVerified: { $ne: true },

      otpHash: user.otpHash,
      otpExpiresAt: { $gt: now },

      otpAttempts: { $lt: OTP_MAX_ATTEMPTS },
    },
    {
      $set: {
        emailVerified: true,
        status: ACCOUNT_STATUS.PENDING_APPROVAL,
      },
      $unset: {
        otpHash: 1,
        otpExpiresAt: 1,
        otpAttempts: 1,
        otpLastSentAt: 1,
      },
    },
    {
      new: true,
    },
  );

  if (!verifiedUser) {
    throw generic;
  }

  await Application.updateOne(
    { user: verifiedUser._id },
    {
      $set: {
        status: ACCOUNT_STATUS.PENDING_APPROVAL,
      },
    },
  );

  // Admin notification must not undo successful verification.
  try {
    const admins = await notifyAdmins({
      type: "SYSTEM",
      title: "নতুন আবেদন",
      message: `${verifiedUser.fullName} আবেদন জমা দিয়েছেন`,
      link: "/admin/applications",
    });

    await Promise.all(
      admins.map((admin) =>
        enqueueEmail({
          to: admin.email,
          type: "NEW_APPLICATION",
          data: {
            adminName: admin.fullName,
            applicantName: verifiedUser.fullName,
            applicantEmail: verifiedUser.email,
          },
          dedupeKey: `new-app:${verifiedUser._id}:${admin._id}`,
        }),
      ),
    );
  } catch (error) {
    console.error("[AUTH ADMIN NOTIFICATION ERROR]", error.message);
  }

  await safeActivityLog({
    actor: verifiedUser._id,
    action: "AUTH_EMAIL_VERIFIED",
    targetType: "User",
    targetId: verifiedUser._id,
    req: ctx.req,
  });

  return User.findById(verifiedUser._id);
}

// ==========================================
// RESEND OTP
// ==========================================

export async function resendOtp({ email, turnstileToken }, ctx) {
  await verifyTurnstile(turnstileToken, ctx.ip);

  const user = await User.findOne({ email }).select("+otpLastSentAt");

  // Account enumeration protection
  if (!user || user.emailVerified) {
    return;
  }

  const otp = generateOtp();
  const now = new Date();

  const cooldownBefore = new Date(now.getTime() - OTP_RESEND_COOLDOWN_S * 1000);

  /**
   * Atomically enforce cooldown.
   *
   * Multiple simultaneous resend requests-এর মধ্যে
   * কেবল একটি request সফল হবে।
   */
  const updated = await User.findOneAndUpdate(
    {
      _id: user._id,
      emailVerified: { $ne: true },

      $or: [
        { otpLastSentAt: { $exists: false } },
        { otpLastSentAt: null },
        { otpLastSentAt: { $lte: cooldownBefore } },
      ],
    },
    {
      $set: {
        otpHash: otpHash(otp),
        otpExpiresAt: new Date(now.getTime() + OTP_TTL_MIN * 60_000),
        otpAttempts: 0,
        otpLastSentAt: now,
      },
    },
    {
      new: true,
    },
  );

  if (!updated) {
    const latest = await User.findById(user._id).select("+otpLastSentAt");

    if (!latest || latest.emailVerified) {
      return;
    }

    const wait = getEmailCooldown(latest.otpLastSentAt);

    if (wait > 0) {
      throw AppError.tooMany(`আর ${wait} সেকেন্ড পরে নতুন OTP চাইতে পারবেন`);
    }

    return;
  }

  await enqueueEmail({
    to: updated.email,
    type: "OTP",
    data: {
      name: updated.fullName,
      otp,
      minutes: OTP_TTL_MIN,
    },
    dedupeKey: `otp:${updated._id}:${now.getTime()}`,
  });

  await safeActivityLog({
    actor: updated._id,
    action: "AUTH_OTP_RESENT",
    targetType: "User",
    targetId: updated._id,
    req: ctx.req,
  });
}

// ==========================================
// LOGIN
// ==========================================

export async function login({ identifier, password }, ctx) {
  const query = identifier.includes("@")
    ? { email: identifier }
    : { username: identifier };

  const user = await User.findOne(query).select("+passwordHash");

  const valid = await bcrypt.compare(
    password,
    user?.passwordHash || DUMMY_HASH,
  );

  if (!user || !valid) {
    await safeActivityLog({
      action: "AUTH_LOGIN_FAILED",
      metadata: {
        identifier,
      },
      req: ctx.req,
    });

    throw AppError.unauthorized("ইমেইল/ইউজারনেম বা পাসওয়ার্ড সঠিক নয়");
  }

  if (!user.emailVerified) {
    throw new AppError(
      "আপনার ইমেইল এখনো যাচাই করা হয়নি",
      403,
      "EMAIL_NOT_VERIFIED",
      {
        email: user.email,
      },
    );
  }

  await safeActivityLog({
    actor: user._id,
    action: "AUTH_LOGIN",
    targetType: "User",
    targetId: user._id,
    req: ctx.req,
  });

  return user;
}

// ==========================================
// REFRESH SESSION
// ==========================================

export async function refreshSession(
  refreshToken,
  res,
  setCookies,
  clearCookies,
) {
  if (!refreshToken) {
    throw AppError.unauthorized();
  }

  let payload;

  try {
    payload = verifyRefreshToken(refreshToken);
  } catch {
    clearCookies(res);

    throw AppError.unauthorized("সেশন শেষ, আবার লগইন করুন");
  }

  const user = await User.findById(payload.sub).select("+refreshTokenHashes");

  const hash = sha256(refreshToken);

  if (!user) {
    clearCookies(res);
    throw AppError.unauthorized();
  }

  /**
   * Atomic token consumption.
   *
   * A refresh token can only be consumed once.
   */
  const consumed = await User.updateOne(
    {
      _id: user._id,
      refreshTokenHashes: hash,
    },
    {
      $pull: {
        refreshTokenHashes: hash,
      },
    },
  );

  if (!consumed.modifiedCount) {
    // Possible refresh-token reuse.
    // Revoke all refresh sessions for this account.
    await User.updateOne(
      { _id: user._id },
      {
        $set: {
          refreshTokenHashes: [],
        },
      },
    );

    clearCookies(res);

    throw AppError.unauthorized("সেশন অবৈধ, আবার লগইন করুন");
  }

  // Old token consumed; issue a new session.
  await issueSession(user, res, setCookies);

  return user;
}

// ==========================================
// LOGOUT / REVOKE SESSION
// ==========================================

export async function revokeRefreshToken(refreshToken) {
  if (!refreshToken) {
    return;
  }

  try {
    const { sub } = verifyRefreshToken(refreshToken);

    await User.updateOne(
      { _id: sub },
      {
        $pull: {
          refreshTokenHashes: sha256(refreshToken),
        },
      },
    );
  } catch {
    // Already invalid or expired.
  }
}

// ==========================================
// FORGOT PASSWORD
// ==========================================

export async function forgotPassword({ email, turnstileToken }, ctx) {
  await verifyTurnstile(turnstileToken, ctx.ip);

  const user = await User.findOne({ email });

  // Avoid account enumeration
  if (!user || !user.emailVerified) {
    return;
  }

  const dedupeKey = `reset:${user._id}:${Math.floor(Date.now() / 120_000)}`;

  const existingJob = await EmailJob.exists({
    dedupeKey,
  });

  if (existingJob) {
    return;
  }

  const token = randomToken(32);

  const now = new Date();

  await User.updateOne(
    {
      _id: user._id,
      emailVerified: true,
    },
    {
      $set: {
        resetTokenHash: sha256(token),
        resetTokenExpiresAt: new Date(now.getTime() + RESET_TTL_MIN * 60_000),
      },
    },
  );

  await enqueueEmail({
    to: user.email,
    type: "PASSWORD_RESET",
    data: {
      name: user.fullName,
      link: `${env.clientUrl}/reset-password?token=${encodeURIComponent(token)}`,
      minutes: RESET_TTL_MIN,
    },
    dedupeKey,
  });

  await safeActivityLog({
    actor: user._id,
    action: "AUTH_PASSWORD_RESET_REQUESTED",
    targetType: "User",
    targetId: user._id,
    req: ctx.req,
  });
}

// ==========================================
// RESET PASSWORD
// ==========================================

export async function resetPassword({ token, password }, ctx) {
  if (!token || typeof token !== "string") {
    throw AppError.badRequest("রিসেট লিংকটি অবৈধ বা মেয়াদোত্তীর্ণ");
  }

  const tokenHash = sha256(token);
  const now = new Date();

  const user = await User.findOne({
    resetTokenHash: tokenHash,
    resetTokenExpiresAt: { $gt: now },
  }).select("_id");

  if (!user) {
    throw AppError.badRequest("রিসেট লিংকটি অবৈধ বা মেয়াদোত্তীর্ণ");
  }

  const passwordHash = await bcrypt.hash(password, BCRYPT_COST);

  /**
   * Atomic reset token consumption.
   * The same reset token cannot be used twice.
   */
  const updated = await User.findOneAndUpdate(
    {
      _id: user._id,
      resetTokenHash: tokenHash,
      resetTokenExpiresAt: { $gt: new Date() },
    },
    {
      $set: {
        passwordHash,
        refreshTokenHashes: [],
      },
      $unset: {
        resetTokenHash: 1,
        resetTokenExpiresAt: 1,
      },
    },
    {
      new: true,
    },
  );

  if (!updated) {
    throw AppError.badRequest(
      "রিসেট লিংকটি অবৈধ বা ইতিমধ্যে ব্যবহার করা হয়েছে",
    );
  }

  await safeActivityLog({
    actor: updated._id,
    action: "AUTH_PASSWORD_RESET",
    targetType: "User",
    targetId: updated._id,
    req: ctx.req,
  });
}

// ==========================================
// CHANGE PASSWORD
// ==========================================

export async function changePassword(
  userId,
  { currentPassword, newPassword },
  ctx,
) {
  const user = await User.findById(userId).select("+passwordHash");

  if (!user) {
    throw AppError.unauthorized();
  }

  const valid = await bcrypt.compare(currentPassword, user.passwordHash);

  if (!valid) {
    throw AppError.badRequest("বর্তমান পাসওয়ার্ড সঠিক নয়");
  }

  const passwordHash = await bcrypt.hash(newPassword, BCRYPT_COST);

  /**
   * Conditional update prevents concurrent password changes
   * from silently overwriting one another.
   */
  const updated = await User.findOneAndUpdate(
    {
      _id: user._id,
      passwordHash: user.passwordHash,
    },
    {
      $set: {
        passwordHash,
        refreshTokenHashes: [],
      },
    },
    {
      new: true,
    },
  ).select("+passwordHash");

  if (!updated) {
    throw AppError.conflict(
      "পাসওয়ার্ড ইতিমধ্যে পরিবর্তন হয়েছে। আবার চেষ্টা করুন।",
    );
  }

  await safeActivityLog({
    actor: updated._id,
    action: "AUTH_PASSWORD_CHANGED",
    targetType: "User",
    targetId: updated._id,
    req: ctx.req,
  });

  return updated;
}

// ==========================================
// GET CURRENT USER
// ==========================================

export async function getMe(user) {
  const application = await Application.findOne({
    user: user._id,
  })
    .select("status reviewNote reviewedAt")
    .lean();

  return {
    user: user.toSafeJSON(),
    application,
  };
}
