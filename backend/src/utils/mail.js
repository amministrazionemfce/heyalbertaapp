import nodemailer from "nodemailer";

/**
 * Marketing / transactional email via SMTP.
 * Set SMTP_HOST, SMTP_PORT (default 587), SMTP_USER, SMTP_PASS, MAIL_FROM (or use SMTP_USER as from).
 * Optional: SMTP_SECURE=true for port 465.
 */
export function isMailConfigured() {
  return Boolean(String(process.env.SMTP_HOST || "").trim());
}

/**
 * @param {{ to: string[], subject: string, text: string }} opts
 */
export async function sendMarketingBatch({ to, subject, text }) {
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
