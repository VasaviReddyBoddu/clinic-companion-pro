/* ---------------------------------------------------------------------------
 * PROTOTYPE ADMIN CREDENTIAL — DEVELOPMENT / DEMO ONLY
 * ---------------------------------------------------------------------------
 * This credential is isolated in this single module on purpose so it can be
 * deleted in one step when a real backend is connected.
 *
 * Production requirements (NOT satisfied by this file):
 *   - authentication on the server, never in the browser bundle
 *   - password hashing with Argon2id or bcrypt
 *   - HttpOnly + Secure session cookies, HTTPS only
 *   - server-side role authorization on every request
 *   - database row-level security for medical data, plus audit logging
 *   - optional second factor (the verify() signature below is OTP-ready)
 *
 * A browser-only check can always be bypassed by a determined user. Treat the
 * role guards in this app as prototype-level UX protection, not security.
 * ------------------------------------------------------------------------- */
/* eslint-disable */

const DEMO_ADMIN = {
  email: "admin@meridian.demo",
  password: "MeridianAdmin@2026",
};

/** Never render this value anywhere in the UI. */
export function verifyAdminCredentials(email, password /*, otp */) {
  const e = String(email || "").trim().toLowerCase();
  const p = String(password || "");
  return e === DEMO_ADMIN.email && p === DEMO_ADMIN.password;
}

export function adminEmailHint() {
  // Email only — the password is never exposed to the UI.
  return DEMO_ADMIN.email;
}

/** Applied to the seeded demo database so the weak seed password cannot be used. */
export function syncSeedAdminUser(users) {
  const u = users.find((x) => x.role === "admin");
  if (u) {
    u.email = DEMO_ADMIN.email;
    u.password = DEMO_ADMIN.password;
  }
}
