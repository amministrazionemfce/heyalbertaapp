/** Must stay in sync with `buildVerificationEmail` in `backend/src/routes/auth.routes.js`. */
export const DEFAULT_EMAIL_VERIFICATION_SUBJECT = 'Verify your Hey Alberta email';

export const DEFAULT_EMAIL_VERIFICATION_BODY =
  'Hi {{name}},\n\nPlease verify your email for Hey Alberta:\n{{verifyUrl}}\n\nThis link expires in 48 hours.\n';

export function effectiveEmailVerificationSubject(settings) {
  const t = String(settings?.emailVerificationEmailSubject ?? '').trim();
  return t || DEFAULT_EMAIL_VERIFICATION_SUBJECT;
}

export function effectiveEmailVerificationBody(settings) {
  const t = String(settings?.emailVerificationEmailBody ?? '').trim();
  return t || DEFAULT_EMAIL_VERIFICATION_BODY;
}
