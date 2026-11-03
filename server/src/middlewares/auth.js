import { User } from "../models/index.js";
import { ACCOUNT_STATUS, ROLES } from "../constants/index.js";
import { AppError } from "../utils/AppError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { verifyAccessToken, ACCESS_COOKIE } from "../utils/jwt.js";
import { getSettings } from "../services/settings.service.js";

// লগইন করা আছে কি না (অনুমোদনের অবস্থা নির্বিশেষে)
export const authenticate = asyncHandler(async (req, _res, next) => {
  const token = req.cookies?.[ACCESS_COOKIE];
  if (!token) throw AppError.unauthorized();
  const payload = verifyAccessToken(token); // ব্যর্থ হলে errorHandler 401 দেয়
  const user = await User.findById(payload.sub);
  if (!user) throw AppError.unauthorized();
  req.user = user; // রোল সবসময় ডাটাবেস থেকে, টোকেন থেকে নয়
  // "সক্রিয় সদস্য" গণনার জন্য: ৫ মিনিটে একবারের বেশি লেখা হয় না
  if (
    !user.lastActiveAt ||
    Date.now() - user.lastActiveAt.getTime() > 5 * 60_000
  ) {
    User.updateOne(
      { _id: user._id },
      { $set: { lastActiveAt: new Date() } },
    ).catch(() => {});
  }
  next();
});

const STATUS_MESSAGES = {
  [ACCOUNT_STATUS.EMAIL_UNVERIFIED]: "ইমেইল যাচাই সম্পন্ন করুন",
  [ACCOUNT_STATUS.PENDING_APPROVAL]:
    "আপনার আবেদন অ্যাডমিনের অনুমোদনের অপেক্ষায় আছে",
  [ACCOUNT_STATUS.WAITLISTED]: "আপনি বর্তমানে ওয়েটলিস্টে আছেন",
  [ACCOUNT_STATUS.REJECTED]: "আপনার আবেদন গ্রহণ করা হয়নি",
  [ACCOUNT_STATUS.SUSPENDED]: "আপনার অ্যাকাউন্ট সাময়িকভাবে স্থগিত করা হয়েছে",
};

// শুধু অনুমোদিত সদস্য; মেইনটেনেন্স মোডে সাধারণ সদস্যদের জন্য বন্ধ
export const requireApproved = asyncHandler(async (req, _res, next) => {
  const { user } = req;
  if (!user) throw AppError.unauthorized();
  if (user.status !== ACCOUNT_STATUS.APPROVED) {
    throw new AppError(
      STATUS_MESSAGES[user.status] || "অ্যাক্সেস নেই",
      403,
      "ACCOUNT_NOT_APPROVED",
      { status: user.status },
    );
  }
  if ([ROLES.MEMBER, ROLES.MODERATOR].includes(user.role)) {
    const settings = await getSettings();
    if (settings.maintenanceMode)
      throw new AppError("সাইট এখন রক্ষণাবেক্ষণে আছে", 503, "MAINTENANCE");
  }
  next();
});

export const requireRoles =
  (...roles) =>
  (req, _res, next) => {
    if (!req.user || !roles.includes(req.user.role))
      return next(AppError.forbidden());
    next();
  };

export const requireAdmin = requireRoles(ROLES.SUPER_ADMIN, ROLES.ADMIN);
export const requireStaff = requireRoles(
  ROLES.SUPER_ADMIN,
  ROLES.ADMIN,
  ROLES.MODERATOR,
);
export const requireSuperAdmin = requireRoles(ROLES.SUPER_ADMIN);
