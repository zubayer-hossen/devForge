import * as auth from "../services/auth.service.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ok } from "../utils/response.js";
import {
  setAuthCookies,
  clearAuthCookies,
  REFRESH_COOKIE,
} from "../utils/jwt.js";

const ctx = (req) => ({ ip: req.ip, req });

export const register = asyncHandler(async (req, res) => {
  const { confirmPassword, ...data } = req.body;
  const result = await auth.register(data, ctx(req));
  ok(
    res,
    result,
    "আবেদন গ্রহণ করা হয়েছে। ইমেইলে পাঠানো OTP দিয়ে যাচাই সম্পন্ন করুন।",
    201,
  );
});

export const verifyEmail = asyncHandler(async (req, res) => {
  const user = await auth.verifyEmail(req.body, ctx(req));
  await auth.issueSession(user, res, setAuthCookies);
  ok(
    res,
    { user: user.toSafeJSON() },
    "ইমেইল যাচাই সম্পন্ন হয়েছে। আপনার আবেদন এখন অ্যাডমিনের রিভিউয়ের অপেক্ষায়।",
  );
});

export const resendOtp = asyncHandler(async (req, res) => {
  await auth.resendOtp(req.body, ctx(req));
  ok(res, null, "অ্যাকাউন্টটি যাচাইযোগ্য হলে নতুন OTP পাঠানো হয়েছে।");
});

export const login = asyncHandler(async (req, res) => {
  const user = await auth.login(req.body, ctx(req));
  await auth.issueSession(user, res, setAuthCookies);
  ok(res, { user: user.toSafeJSON() }, "লগইন সফল হয়েছে");
});

export const refresh = asyncHandler(async (req, res) => {
  const user = await auth.refreshSession(
    req.cookies?.[REFRESH_COOKIE],
    res,
    setAuthCookies,
    clearAuthCookies,
  );
  ok(res, { user: user.toSafeJSON() }, "সেশন নবায়ন হয়েছে");
});

export const logout = asyncHandler(async (req, res) => {
  await auth.revokeRefreshToken(req.cookies?.[REFRESH_COOKIE]);
  clearAuthCookies(res);
  ok(res, null, "লগআউট সফল হয়েছে");
});

export const me = asyncHandler(async (req, res) => {
  ok(res, await auth.getMe(req.user));
});

export const forgotPassword = asyncHandler(async (req, res) => {
  await auth.forgotPassword(req.body, ctx(req));
  ok(
    res,
    null,
    "অ্যাকাউন্টটি থাকলে পাসওয়ার্ড রিসেটের লিংক ইমেইলে পাঠানো হয়েছে।",
  );
});

export const resetPassword = asyncHandler(async (req, res) => {
  await auth.resetPassword(req.body, ctx(req));
  ok(res, null, "পাসওয়ার্ড পরিবর্তন হয়েছে। এখন লগইন করুন।");
});

export const changePassword = asyncHandler(async (req, res) => {
  const user = await auth.changePassword(req.user._id, req.body, ctx(req));
  await auth.issueSession(user, res, setAuthCookies);
  ok(
    res,
    null,
    "পাসওয়ার্ড পরিবর্তন হয়েছে। অন্য সব ডিভাইস থেকে লগআউট করা হয়েছে।",
  );
});
