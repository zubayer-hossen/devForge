import jwt from "jsonwebtoken";
import { env } from "../config/env.js";
import { randomToken } from "./crypto.js";

export const ACCESS_COOKIE = "df_access";
export const REFRESH_COOKIE = "df_refresh";
export const ACCESS_TTL_MS = 15 * 60 * 1000;
export const REFRESH_TTL_MS = 7 * 24 * 60 * 60 * 1000;

const ISSUER = "devforge";

export const signAccessToken = (user) =>
  jwt.sign({ sub: String(user._id), role: user.role }, env.jwtAccessSecret, {
    algorithm: "HS256",
    expiresIn: Math.floor(ACCESS_TTL_MS / 1000),
    issuer: ISSUER,
  });

export const signRefreshToken = (user) =>
  jwt.sign(
    { sub: String(user._id), jti: randomToken(16) },
    env.jwtRefreshSecret,
    {
      algorithm: "HS256",
      expiresIn: Math.floor(REFRESH_TTL_MS / 1000),
      issuer: ISSUER,
    },
  );

export const verifyAccessToken = (t) =>
  jwt.verify(t, env.jwtAccessSecret, { algorithms: ["HS256"], issuer: ISSUER });
export const verifyRefreshToken = (t) =>
  jwt.verify(t, env.jwtRefreshSecret, {
    algorithms: ["HS256"],
    issuer: ISSUER,
  });

// প্রোডাকশনে ফ্রন্টএন্ড (Vercel) ও ব্যাকএন্ড (Render) আলাদা ডোমেইন হলে SameSite=None + Secure দরকার।
const cookieBase = () => ({
  httpOnly: true,
  secure: env.isProd,
  sameSite: "lax",
});

export function setAuthCookies(res, accessToken, refreshToken) {
  res.cookie(ACCESS_COOKIE, accessToken, {
    ...cookieBase(),
    maxAge: ACCESS_TTL_MS,
    path: "/",
  });
  res.cookie(REFRESH_COOKIE, refreshToken, {
    ...cookieBase(),
    maxAge: REFRESH_TTL_MS,
    path: "/api/auth",
  });
}

export function clearAuthCookies(res) {
  res.clearCookie(ACCESS_COOKIE, { ...cookieBase(), path: "/" });
  res.clearCookie(REFRESH_COOKIE, { ...cookieBase(), path: "/api/auth" });
}
