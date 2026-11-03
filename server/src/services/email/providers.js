import { env, services } from "../../config/env.js";

/**
 * Common HTTP POST helper
 */
async function postJson(name, url, headers, body) {
  let response;

  try {
    response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        ...headers,
      },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(15000),
    });
  } catch (error) {
    throw Object.assign(
      new Error(`${name}: Network/timeout error - ${error.message}`),
      {
        permanent: false,
        status: 0,
      },
    );
  }

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const permanent =
      response.status >= 400 &&
      response.status < 500 &&
      response.status !== 429;

    const message =
      data.message ||
      data.error ||
      data.name ||
      response.statusText ||
      "Unknown provider error";

    throw Object.assign(
      new Error(`${name}: HTTP ${response.status} - ${message}`),
      {
        permanent,
        status: response.status,
        providerResponse: data,
      },
    );
  }

  return data;
}

/**
 * Validate recipient email
 */
function validateRecipient(to) {
  if (typeof to !== "string" || !to.trim()) {
    throw Object.assign(
      new Error("সঠিক recipient email address প্রদান করা হয়নি।"),
      { permanent: true },
    );
  }

  const email = to.trim();

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (!emailRegex.test(email)) {
    throw Object.assign(new Error("Recipient email address সঠিক নয়।"), {
      permanent: true,
    });
  }

  return email;
}

/**
 * BREVO TRANSACTIONAL EMAIL PROVIDER
 */
const brevo = {
  name: "brevo",

  configured: () => services.brevo(),

  async send({ to, subject, html, text }) {
    const recipient = validateRecipient(to);

    const data = await postJson(
      "Brevo",
      "https://api.brevo.com/v3/smtp/email",
      {
        "api-key": env.brevo.apiKey,
      },
      {
        sender: {
          name: env.brevo.senderName || "DevForge",
          email: env.brevo.senderEmail,
        },

        to: [
          {
            email: recipient,
          },
        ],

        subject,
        htmlContent: html,
        textContent: text,
      },
    );

    if (!data.messageId) {
      throw Object.assign(
        new Error(
          "Brevo email গ্রহণ করেছে কিনা নিশ্চিত হওয়া যায়নি: messageId পাওয়া যায়নি।",
        ),
        { permanent: false },
      );
    }

    return {
      id: data.messageId,
      messageId: data.messageId,
    };
  },
};

/**
 * RESEND EMAIL PROVIDER
 */
const resend = {
  name: "resend",

  configured: () => services.resend(),

  async send({ to, subject, html, text }) {
    const recipient = validateRecipient(to);

    const data = await postJson(
      "Resend",
      "https://api.resend.com/emails",
      {
        Authorization: `Bearer ${env.resend.apiKey}`,
      },
      {
        from: env.resend.fromEmail,
        to: [recipient],
        subject,
        html,
        text,
      },
    );

    if (!data.id) {
      throw Object.assign(
        new Error("Resend response-এ email ID পাওয়া যায়নি।"),
        { permanent: false },
      );
    }

    return {
      id: data.id,
      messageId: data.id,
    };
  },
};

/**
 * DEVELOPMENT CONSOLE PROVIDER
 *
 * শুধুমাত্র development environment-এ ব্যবহার হবে।
 */
const consoleProvider = {
  name: "console",

  configured: () => true,

  async send({ to, subject, text }) {
    console.log(
      `\n========== DEV EMAIL ==========`,
      `\nTo: ${to}`,
      `\nSubject: ${subject}`,
      `\n${text}`,
      `\n===============================\n`,
    );

    return {
      id: "console",
      messageId: "console",
    };
  },
};

/**
 * Resolve active provider
 */
export function resolveProvider() {
  let chosen;

  switch (env.emailProvider) {
    case "brevo":
      chosen = brevo;
      break;

    case "resend":
      chosen = resend;
      break;

    default:
      throw Object.assign(
        new Error(`Unsupported email provider: ${env.emailProvider}`),
        { permanent: true },
      );
  }

  if (chosen.configured()) {
    return chosen;
  }

  if (!env.isProd) {
    console.warn(
      `[EMAIL] ${chosen.name} is not configured. Using console provider.`,
    );

    return consoleProvider;
  }

  throw Object.assign(
    new Error(`ইমেইল প্রোভাইডার (${chosen.name}) কনফিগার করা হয়নি।`),
    { permanent: false },
  );
}

/**
 * Email provider configuration status
 */
export function emailProviderStatus() {
  return {
    selected: env.emailProvider,
    brevoConfigured: services.brevo(),
    resendConfigured: services.resend(),
    activeProvider: env.emailProvider === "resend" ? "resend" : "brevo",
  };
}
