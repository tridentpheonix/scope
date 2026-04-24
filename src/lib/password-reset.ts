import { createHash, randomBytes } from "node:crypto";
import { appEnv, isAuthConfigured, resolveAppOrigin } from "./env";
import { isEmailConfigured, sendTransactionalEmail } from "./email";
import { recordDiagnostic } from "./diagnostics";
import { hashPassword, normalizeEmail, revokeAllSessionsForUser } from "./auth/first-party";
import { ensureMongoIndexes, getMongoCollection } from "./mongo";

const RESET_TOKEN_TTL_MS = 1000 * 60 * 45;

type UserDocument = {
  _id: string;
  email: string;
  emailNormalized: string;
  name: string | null;
  passwordHash: string | null;
  googleSubject: string | null;
  authProviders?: ("password" | "google")[];
  updatedAt: string;
};

type PasswordResetTokenDocument = {
  _id: string;
  userId: string;
  emailNormalized: string;
  tokenHash: string;
  createdAt: string;
  expiresAt: Date;
  usedAt: string | null;
};

function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

function buildResetEmail(resetUrl: string) {
  return {
    subject: "Reset your ScopeOS password",
    text: [
      "Reset your ScopeOS password",
      "",
      "Use this secure link to choose a new password:",
      resetUrl,
      "",
      "This link expires in 45 minutes. If you did not request it, you can ignore this email.",
    ].join("\n"),
    html: [
      "<h1>Reset your ScopeOS password</h1>",
      "<p>Use this secure link to choose a new password:</p>",
      `<p><a href="${resetUrl}">Reset password</a></p>`,
      "<p>This link expires in 45 minutes. If you did not request it, you can ignore this email.</p>",
    ].join(""),
  };
}

export async function requestPasswordReset(options: {
  email: string;
  request: Request;
  now?: Date;
}) {
  if (!isAuthConfigured()) {
    throw new Error("auth_not_configured");
  }

  await ensureMongoIndexes();
  const users = await getMongoCollection<UserDocument>("users");
  const emailNormalized = normalizeEmail(options.email);
  const user = await users.findOne({ emailNormalized });

  if (!user) {
    return { ok: true as const, emailSent: false, reason: "user_not_found" };
  }

  const now = options.now ?? new Date();
  const rawToken = randomBytes(32).toString("base64url");
  const tokenHash = hashToken(rawToken);
  const tokenId = crypto.randomUUID();
  const tokens = await getMongoCollection<PasswordResetTokenDocument>("password_reset_tokens");

  await tokens.insertOne({
    _id: tokenId,
    userId: user._id,
    emailNormalized,
    tokenHash,
    createdAt: now.toISOString(),
    expiresAt: new Date(now.getTime() + RESET_TOKEN_TTL_MS),
    usedAt: null,
  });

  const origin = resolveAppOrigin(options.request);
  const resetUrl = new URL("/auth/reset-password", origin);
  resetUrl.searchParams.set("token", rawToken);

  if (!isEmailConfigured()) {
    await recordDiagnostic("warn", "auth", "password_reset_email_not_configured", {
      route: "/api/auth/password-reset/request",
      status: 202,
      message: "Password reset requested but Resend env vars are not configured.",
      details: {
        userId: user._id,
        hasResendApiKey: Boolean(appEnv.resendApiKey),
        hasResendFromEmail: Boolean(appEnv.resendFromEmail),
      },
    });
    return { ok: true as const, emailSent: false, reason: "email_not_configured" };
  }

  const email = buildResetEmail(resetUrl.toString());
  const sent = await sendTransactionalEmail({
    to: user.email,
    subject: email.subject,
    text: email.text,
    html: email.html,
    idempotencyKey: `password-reset-${tokenId}`,
  });

  if (!sent.ok) {
    await recordDiagnostic("error", "auth", "password_reset_email_failed", {
      route: "/api/auth/password-reset/request",
      status: 502,
      message: sent.reason,
      details: { userId: user._id },
    });
  }

  return {
    ok: true as const,
    emailSent: sent.ok,
    reason: sent.ok ? null : sent.reason,
  };
}

export async function confirmPasswordReset(options: {
  token: string;
  newPassword: string;
  now?: Date;
}) {
  if (!isAuthConfigured()) {
    throw new Error("auth_not_configured");
  }

  const now = options.now ?? new Date();
  const tokenHash = hashToken(options.token);

  await ensureMongoIndexes();
  const tokens = await getMongoCollection<PasswordResetTokenDocument>("password_reset_tokens");
  const resetToken = await tokens.findOne({ tokenHash });

  if (
    !resetToken ||
    resetToken.usedAt ||
    !(resetToken.expiresAt instanceof Date) ||
    resetToken.expiresAt.getTime() <= now.getTime()
  ) {
    throw new Error("invalid_or_expired_token");
  }

  const users = await getMongoCollection<UserDocument>("users");
  const user = await users.findOne({ _id: resetToken.userId });
  if (!user) {
    throw new Error("invalid_or_expired_token");
  }

  const providers = new Set(user.authProviders ?? []);
  providers.add("password");
  await users.updateOne(
    { _id: user._id },
    {
      $set: {
        passwordHash: hashPassword(options.newPassword),
        authProviders: [...providers],
        updatedAt: now.toISOString(),
      },
    },
  );

  await tokens.updateOne(
    { _id: resetToken._id, usedAt: null },
    { $set: { usedAt: now.toISOString() } },
  );
  await revokeAllSessionsForUser(user._id);

  return { ok: true as const, userId: user._id };
}
