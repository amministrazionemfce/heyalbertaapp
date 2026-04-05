import nodemailer from "nodemailer";

/**
 * Marketing / transactional email via SMTP.
 * Set SMTP_HOST, SMTP_PORT (default 587), SMTP_USER, SMTP_PASS, MAIL_FROM (or use SMTP_USER as from).
 * Optional: SMTP_SECURE=true for port 465.
 *
 * Local dev without a mailbox: SMTP_MOCK=true (logs only; never use in production).
 */
function isSmtpMock() {
  return String(process.env.SMTP_MOCK || "").trim() === "true";
}

export function isMailConfigured() {
  if (isSmtpMock()) return true;
  return Boolean(String(process.env.SMTP_HOST || "").trim());
}

/** True when we can send real verification emails (not mock-only). */
export function verificationEmailEnabled() {
  return isMailConfigured() && !isSmtpMock();
}

/**
 * @param {{ to: string[], subject: string, text: string }} opts
 */
export async function sendMarketingBatch({ to, subject, text }) {
  if (isSmtpMock()) {
    console.info("[SMTP_MOCK] skipping real send", {
      recipients: to.length,
      sample: to.slice(0, 5),
      subject: subject.slice(0, 120),
    });
    return { sent: to.length, failed: 0, errors: [] };
  }

  if (!isMailConfigured()) {
    const err = new Error("Mail not configured");
    err.code = "MAIL_NOT_CONFIGURED";
    throw err;
  }

  const from = String(process.env.MAIL_FROM || process.env.SMTP_USER || "").trim();
  if (!from) {
    const err = new Error("Set MAIL_FROM or SMTP_USER");
    err.code = "MAIL_NOT_CONFIGURED";
    throw err;
  }

  const transporter = nodemailer.createTransport({
    host: String(process.env.SMTP_HOST || "").trim(),
    port: parseInt(String(process.env.SMTP_PORT || "587"), 10) || 587,
    secure: String(process.env.SMTP_SECURE || "").trim() === "true",
    auth: {
      user: String(process.env.SMTP_USER || "").trim(),
      pass: String(process.env.SMTP_PASS || "").trim(),
    },
  });

  let sent = 0;
  const errors = [];

  for (const email of to) {
    try {
      await transporter.sendMail({
        from,
        to: email,
        subject,
        text,
      });
      sent += 1;
    } catch (e) {
      errors.push({ email, message: e?.message || String(e) });
    }
  }

  return {
    sent,
    failed: errors.length,
    errors: errors.slice(0, 25),
  };
}

/**
 * Single transactional email (verification, password reset, etc.).
 * @param {{ to: string, subject: string, text: string, html?: string }} opts
 */
export async function sendTransactionalMail({ to, subject, text, html }) {
  if (isSmtpMock()) {
    console.info("[SMTP_MOCK] transactional mail", {
      to,
      subject: subject?.slice(0, 120),
      preview: String(text || "").slice(0, 400),
    });
    return { ok: true };
  }

  if (!isMailConfigured()) {
    const err = new Error("Mail not configured");
    err.code = "MAIL_NOT_CONFIGURED";
    throw err;
  }

  const from = String(process.env.MAIL_FROM || process.env.SMTP_USER || "").trim();
  if (!from) {
    const err = new Error("Set MAIL_FROM or SMTP_USER");
    err.code = "MAIL_NOT_CONFIGURED";
    throw err;
  }

  const transporter = nodemailer.createTransport({
    host: String(process.env.SMTP_HOST || "").trim(),
    port: parseInt(String(process.env.SMTP_PORT || "587"), 10) || 587,
    secure: String(process.env.SMTP_SECURE || "").trim() === "true",
    auth: {
      user: String(process.env.SMTP_USER || "").trim(),
      pass: String(process.env.SMTP_PASS || "").trim(),
    },
  });

  await transporter.sendMail({
    from,
    to,
    subject,
    text,
    html: html || undefined,
  });
  return { ok: true };
}
