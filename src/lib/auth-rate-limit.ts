import { type Collection } from "mongodb";
import { ensureMongoIndexes, getMongoCollection } from "./mongo";

export type AuthRateLimitScope =
  | "auth_sign_in_ip"
  | "auth_sign_in_email"
  | "auth_sign_up_ip"
  | "auth_sign_up_email"
  | "auth_password_reset_ip"
  | "auth_password_reset_email";

export type AuthRateLimitRule = {
  scope: AuthRateLimitScope;
  subject: string;
  limit: number;
  windowMs: number;
};

export type AuthRateLimitDecision =
  | {
      allowed: true;
      key: string;
      attempts: number;
      remaining: number;
      resetAt: string;
      retryAfterSeconds: number;
    }
  | {
      allowed: false;
      key: string;
      attempts: number;
      remaining: 0;
      limit: number;
      resetAt: string;
      retryAfterSeconds: number;
    };

type AuthRateLimitDocument = {
  _id: string;
  scope: AuthRateLimitScope;
  subject: string;
  attempts: number;
  windowStartedAt: string;
  expiresAt: Date;
  updatedAt: string;
  lastAttemptAt: string;
  createdAt: string;
};

type AuthRateLimitCollection = Collection<AuthRateLimitDocument>;

export const AUTH_RATE_LIMIT_RULES = {
  signIn: {
    ip: { scope: "auth_sign_in_ip", limit: 8, windowMs: 15 * 60 * 1000 },
    email: { scope: "auth_sign_in_email", limit: 5, windowMs: 15 * 60 * 1000 },
  },
  signUp: {
    ip: { scope: "auth_sign_up_ip", limit: 5, windowMs: 60 * 60 * 1000 },
    email: { scope: "auth_sign_up_email", limit: 3, windowMs: 60 * 60 * 1000 },
  },
  passwordReset: {
    ip: { scope: "auth_password_reset_ip", limit: 6, windowMs: 60 * 60 * 1000 },
    email: { scope: "auth_password_reset_email", limit: 3, windowMs: 60 * 60 * 1000 },
  },
} as const;

export function normalizeRateLimitSubject(subject: string) {
  return subject.trim().toLowerCase();
}

export function buildAuthRateLimitKey(scope: AuthRateLimitScope, subject: string) {
  return `${scope}:${normalizeRateLimitSubject(subject)}`;
}

export function getRequestIp(request: Request) {
  const forwardedFor = request.headers.get("x-forwarded-for");
  if (forwardedFor) {
    const firstForwarded = forwardedFor.split(",")[0]?.trim();
    if (firstForwarded) {
      return firstForwarded;
    }
  }

  const realIp = request.headers.get("x-real-ip")?.trim();
  if (realIp) {
    return realIp;
  }

  const cloudflareIp = request.headers.get("cf-connecting-ip")?.trim();
  if (cloudflareIp) {
    return cloudflareIp;
  }

  return "unknown";
}

function getRetryAfterSeconds(resetAt: Date, now: Date) {
  return Math.max(1, Math.ceil((resetAt.getTime() - now.getTime()) / 1000));
}

async function getAuthRateLimitCollection() {
  await ensureMongoIndexes();
  return getMongoCollection<AuthRateLimitDocument>("auth_rate_limits");
}

function toRateLimitDocument(
  key: string,
  rule: AuthRateLimitRule,
  now: Date,
  attempts: number,
) {
  const resetAt = new Date(now.getTime() + rule.windowMs);

  return {
    _id: key,
    scope: rule.scope,
    subject: normalizeRateLimitSubject(rule.subject),
    attempts,
    windowStartedAt: now.toISOString(),
    expiresAt: resetAt,
    updatedAt: now.toISOString(),
    lastAttemptAt: now.toISOString(),
    createdAt: now.toISOString(),
  } satisfies AuthRateLimitDocument;
}

async function checkAuthRateLimitRule(
  collection: AuthRateLimitCollection,
  rule: AuthRateLimitRule,
  now: Date,
): Promise<AuthRateLimitDecision> {
  const key = buildAuthRateLimitKey(rule.scope, rule.subject);
  const existing = await collection.findOne({ _id: key });
  const existingExpiresAt = existing?.expiresAt instanceof Date ? existing.expiresAt : null;

  if (!existing || !existingExpiresAt || existingExpiresAt.getTime() <= now.getTime()) {
    const document = toRateLimitDocument(key, rule, now, 1);
    await collection.updateOne({ _id: key }, { $set: document }, { upsert: true });

    return {
      allowed: true,
      key,
      attempts: 1,
      remaining: Math.max(0, rule.limit - 1),
      resetAt: document.expiresAt.toISOString(),
      retryAfterSeconds: getRetryAfterSeconds(document.expiresAt, now),
    };
  }

  if (existing.attempts >= rule.limit) {
    return {
      allowed: false,
      key,
      attempts: existing.attempts,
      remaining: 0,
      limit: rule.limit,
      resetAt: existingExpiresAt.toISOString(),
      retryAfterSeconds: getRetryAfterSeconds(existingExpiresAt, now),
    };
  }

  const attempts = existing.attempts + 1;
  const updatedAt = now.toISOString();
  await collection.updateOne(
    { _id: key },
    {
      $set: {
        attempts,
        updatedAt,
        lastAttemptAt: updatedAt,
      },
    },
  );

  return {
    allowed: true,
    key,
    attempts,
    remaining: Math.max(0, rule.limit - attempts),
    resetAt: existingExpiresAt.toISOString(),
    retryAfterSeconds: getRetryAfterSeconds(existingExpiresAt, now),
  };
}

export async function checkAuthRateLimits(rules: AuthRateLimitRule[], now = new Date()) {
  const collection = await getAuthRateLimitCollection();

  for (const rule of rules) {
    const decision = await checkAuthRateLimitRule(collection, rule, now);
    if (!decision.allowed) {
      return decision;
    }
  }

  return {
    allowed: true as const,
  };
}
