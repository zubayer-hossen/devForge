import { EmailJob, EmailLog } from "../../models/index.js";
import { resolveProvider } from "./providers.js";
import { renderEmail } from "../../templates/email.templates.js";
import { env } from "../../config/env.js";

// =============================================
// DEVFORGE EMAIL SERVICE
// Queue + Retry + Logging + Brevo
// ES Module Architecture
// =============================================

// ---------------------------------------------
// CONFIGURATION
// ---------------------------------------------

const BASE_DELAY_MS = 30_000;
const MAX_DELAY_MS = 60 * 60 * 1000;

const MAX_ERROR_LENGTH = 1000;

// ---------------------------------------------
// EXPONENTIAL BACKOFF
// 30s, 1m, 2m, 4m, 8m...
// Maximum: 1 hour
// ---------------------------------------------

export const backoffDelay = (attempt) => {
  const safeAttempt = Math.max(1, Number(attempt) || 1);

  return Math.min(BASE_DELAY_MS * 2 ** (safeAttempt - 1), MAX_DELAY_MS);
};

// ---------------------------------------------
// ERROR HELPERS
// ---------------------------------------------

const getErrorMessage = (error) => {
  const message =
    error?.response?.body?.message ||
    error?.response?.data?.message ||
    error?.message ||
    "Unknown email provider error";

  return String(message).slice(0, MAX_ERROR_LENGTH);
};

// Permanent errors should not be retried.
// Network errors, rate limits and server errors
// are generally retryable.
const isPermanentError = (error) => {
  if (error?.permanent === true) return true;
  if (error?.permanent === false) return false;

  const status =
    error?.status ||
    error?.statusCode ||
    error?.response?.status ||
    error?.response?.statusCode;

  return [400, 401, 403, 404, 405, 422].includes(Number(status));
};

// ---------------------------------------------
// RECIPIENT VALIDATION
// ---------------------------------------------

const validateRecipient = (to) => {
  const recipients = Array.isArray(to) ? to : [to];

  if (!recipients.length) {
    throw new Error("At least one recipient is required");
  }

  for (const recipient of recipients) {
    const email = typeof recipient === "string" ? recipient : recipient?.email;

    if (
      typeof email !== "string" ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
    ) {
      throw new Error(`Invalid recipient email: ${String(email)}`);
    }
  }

  return to;
};

// =============================================
// 1. ENQUEUE EMAIL
// =============================================

/**
 * Creates an email job and optionally processes it immediately.
 *
 * @param {Object} options
 * @param {string|string[]} options.to
 * @param {string} options.type
 * @param {Object} options.data
 * @param {string} options.dedupeKey
 * @param {boolean} options.processNow
 */

export async function enqueueEmail({
  to,
  type,
  data = {},
  dedupeKey,
  processNow = true,
}) {
  // Validate recipient
  validateRecipient(to);

  if (!type || typeof type !== "string") {
    throw new Error("Email type is required");
  }

  // Generate email from template
  const mail = renderEmail(type, data, env.clientUrl);

  if (!mail?.subject || !mail?.html) {
    throw new Error(`Invalid email template: ${type}`);
  }

  let job;

  try {
    // Save email in database
    job = await EmailJob.create({
      to,
      type,
      subject: mail.subject,
      html: mail.html,
      text: mail.text || "",

      ...(dedupeKey ? { dedupeKey } : {}),
    });
  } catch (error) {
    // Prevent duplicate jobs
    if (error?.code === 11000) {
      console.warn(`Duplicate email job skipped: ${dedupeKey || type}`);

      return null;
    }

    throw error;
  }

  // Process asynchronously
  if (processNow) {
    setImmediate(() => {
      processJob(job._id).catch((error) => {
        console.error(
          "Email background processing error:",
          getErrorMessage(error),
        );
      });
    });
  }

  return job;
}

// =============================================
// 2. PROCESS EMAIL JOB
// =============================================

/**
 * Atomically claims a pending job and sends it.
 *
 * Prevents multiple workers from processing
 * the same pending job simultaneously.
 */

export async function processJob(jobId) {
  if (!jobId) {
    throw new Error("Email job ID is required");
  }

  // Atomic job claim
  const job = await EmailJob.findOneAndUpdate(
    {
      _id: jobId,
      status: "PENDING",
      nextAttemptAt: { $lte: new Date() },
    },
    {
      $set: {
        status: "PROCESSING",
      },

      $inc: {
        attempts: 1,
      },
    },
    {
      new: true,
    },
  );

  // Another worker may already have claimed it
  if (!job) {
    return null;
  }

  let provider;

  // -------------------------------------------
  // SEND EMAIL
  // -------------------------------------------

  try {
    provider = resolveProvider();

    if (!provider || typeof provider.send !== "function") {
      throw new Error("Email provider is not configured correctly");
    }

    // Provider sends the saved job
    const result = await provider.send(job);

    if (!result) {
      throw new Error("Email provider returned an empty response");
    }

    const messageId =
      result.id || result.messageId || result.message_id || null;

    // -----------------------------------------
    // MARK JOB AS SENT
    // -----------------------------------------

    await EmailJob.updateOne(
      {
        _id: job._id,
        status: "PROCESSING",
      },
      {
        $set: {
          status: "SENT",
          sentAt: new Date(),
        },

        $unset: {
          lastError: 1,
        },
      },
    );

    console.log("DevForge email sent successfully:", {
      jobId: String(job._id),
      type: job.type,
      provider: provider.name,
      messageId,
    });

    // -----------------------------------------
    // SAVE SUCCESS LOG
    // -----------------------------------------

    // Logging failure must NOT trigger another send.
    // Otherwise recipients may receive duplicate emails.

    try {
      await EmailLog.create({
        to: job.to,
        type: job.type,
        subject: job.subject,
        provider: provider.name,
        providerMessageId: messageId,
        status: "SENT",
        attempt: job.attempts,
        job: job._id,
      });
    } catch (logError) {
      console.error(
        "Email sent, but success log could not be saved:",
        getErrorMessage(logError),
      );
    }

    return {
      success: true,
      jobId: job._id,
      provider: provider.name,
      messageId,
    };
  } catch (error) {
    // -----------------------------------------
    // ERROR HANDLING
    // -----------------------------------------

    const errorMessage = getErrorMessage(error);

    const exhausted = job.attempts >= job.maxAttempts;

    const permanent = isPermanentError(error);

    const final = permanent || exhausted;

    const nextAttemptAt = new Date(Date.now() + backoffDelay(job.attempts));

    // -----------------------------------------
    // UPDATE JOB STATUS
    // -----------------------------------------

    await EmailJob.updateOne(
      {
        _id: job._id,
        status: "PROCESSING",
      },
      {
        $set: {
          status: final ? "FAILED" : "PENDING",

          lastError: errorMessage,

          ...(final ? {} : { nextAttemptAt }),
        },
      },
    );

    // -----------------------------------------
    // SAVE FAILURE LOG
    // -----------------------------------------

    try {
      await EmailLog.create({
        to: job.to,
        type: job.type,
        subject: job.subject,
        provider: provider?.name || "unknown",
        status: "FAILED",
        error: errorMessage,
        attempt: job.attempts,
        job: job._id,
      });
    } catch (logError) {
      console.error(
        "Could not save email failure log:",
        getErrorMessage(logError),
      );
    }

    // -----------------------------------------
    // ERROR REPORT
    // -----------------------------------------

    console.error("DevForge email delivery failed:", {
      jobId: String(job._id),
      type: job.type,
      provider: provider?.name || "unknown",
      attempt: job.attempts,
      maxAttempts: job.maxAttempts,
      status: final ? "FAILED" : "RETRY_PENDING",
      error: errorMessage,
      nextAttemptAt: final ? null : nextAttemptAt,
    });

    return {
      success: false,
      jobId: job._id,
      status: final ? "FAILED" : "PENDING",
      retry: !final,
      error: errorMessage,
    };
  }
}

// =============================================
// 3. TEST EMAIL
// =============================================

/**
 * Sends a test email through the configured provider.
 *
 * @param {string} to Recipient email
 */

export const sendTestEmail = async (to) => {
  if (!to) {
    throw new Error("Test recipient email is required");
  }

  return enqueueEmail({
    to,
    type: "TEST",
    data: {},
    processNow: true,
  });
};

// =============================================
// 4. EXPORT DEFAULT
// =============================================

export default {
  enqueueEmail,
  processJob,
  sendTestEmail,
  backoffDelay,
};
