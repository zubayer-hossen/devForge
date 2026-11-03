import dotenv from "dotenv";

dotenv.config();

/* =========================================
   ENVIRONMENT HELPERS
========================================= */

const get = (key, fallback = "") =>
  (process.env[key] ?? fallback).toString().trim();

const normalizeUrl = (value, key, required = false) => {
  if (!value) {
    if (required) {
      throw new Error(`${key} Environment Variable সেট করা হয়নি।`);
    }
    return "";
  }

  try {
    const url = new URL(value);

    if (!["http:", "https:"].includes(url.protocol)) {
      throw new Error();
    }

    return url.origin;
  } catch {
    throw new Error(`${key} একটি Valid HTTP/HTTPS URL হতে হবে।`);
  }
};

/* =========================================
   ENVIRONMENT CONFIGURATION
========================================= */

const nodeEnv = get("NODE_ENV", "development").toLowerCase();

if (!["development", "production", "test"].includes(nodeEnv)) {
  throw new Error(
    `Invalid NODE_ENV: ${nodeEnv}. Use development, production or test.`,
  );
}

const isProd = nodeEnv === "production";

const port = Number(get("PORT", "5000"));

if (!Number.isInteger(port) || port <= 0 || port > 65535) {
  throw new Error("PORT একটি Valid Port Number হতে হবে।");
}

export const env = Object.freeze({
  nodeEnv,
  isProd,
  port,

  mongoUri: get("MONGODB_URI"),

  clientUrl: normalizeUrl(
    get("CLIENT_URL", isProd ? "" : "http://localhost:5173"),
    "CLIENT_URL",
    isProd,
  ),

  appUrl: normalizeUrl(
    get("APP_URL", isProd ? "" : `http://localhost:${port}`),
    "APP_URL",
    isProd,
  ),

  jwtAccessSecret: get("JWT_ACCESS_SECRET"),
  jwtRefreshSecret: get("JWT_REFRESH_SECRET"),
  cookieSecret: get("COOKIE_SECRET"),

  emailProvider: get("EMAIL_PROVIDER", "brevo").toLowerCase(),

  brevo: {
    apiKey: get("BREVO_API_KEY"),
    senderEmail: get("BREVO_SENDER_EMAIL"),
    senderName: get("BREVO_SENDER_NAME", "DevForge"),
  },

  resend: {
    apiKey: get("RESEND_API_KEY"),
    fromEmail: get("RESEND_FROM_EMAIL"),
  },

  cloudinary: {
    cloudName: get("CLOUDINARY_CLOUD_NAME"),
    apiKey: get("CLOUDINARY_API_KEY"),
    apiSecret: get("CLOUDINARY_API_SECRET"),
  },

  turnstileSecret: get("TURNSTILE_SECRET_KEY"),

  admin: {
    name: get("ADMIN_NAME"),
    email: get("ADMIN_EMAIL"),
    password: get("ADMIN_PASSWORD"),
  },

  timezone: get("TZ", "Asia/Dhaka"),
});

/* =========================================
   REQUIRED ENVIRONMENT VALIDATION
========================================= */

export function validateRequiredEnv() {
  const required = {
    MONGODB_URI: env.mongoUri,
    JWT_ACCESS_SECRET: env.jwtAccessSecret,
    JWT_REFRESH_SECRET: env.jwtRefreshSecret,
    COOKIE_SECRET: env.cookieSecret,
  };

  const missing = Object.entries(required)
    .filter(([, value]) => !value)
    .map(([key]) => key);

  if (missing.length) {
    throw new Error(
      `Required Environment Variables missing: ${missing.join(", ")}`,
    );
  }

  for (const key of [
    "JWT_ACCESS_SECRET",
    "JWT_REFRESH_SECRET",
    "COOKIE_SECRET",
  ]) {
    if (required[key].length < 32) {
      throw new Error(`${key} কমপক্ষে ৩২ অক্ষরের হতে হবে।`);
    }
  }

  if (isProd) {
    if (!env.clientUrl || !env.appUrl) {
      throw new Error("Production-এর জন্য CLIENT_URL এবং APP_URL বাধ্যতামূলক।");
    }
  }
}

/* =========================================
   OPTIONAL SERVICES
========================================= */

export const services = Object.freeze({
  brevo: () => Boolean(env.brevo.apiKey && env.brevo.senderEmail),

  resend: () => Boolean(env.resend.apiKey && env.resend.fromEmail),

  cloudinary: () =>
    Boolean(
      env.cloudinary.cloudName &&
      env.cloudinary.apiKey &&
      env.cloudinary.apiSecret,
    ),

  turnstile: () => Boolean(env.turnstileSecret),
});
