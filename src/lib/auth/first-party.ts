import { randomBytes, scryptSync, timingSafeEqual, createHash } from "node:crypto";
import { cookies } from "next/headers";
import type { NextResponse } from "next/server";
import { ensureMongoIndexes, getMongoCollection } from "../mongo";

export const AUTH_COOKIE_NAME = "scopeos-session";
const SESSION_TTL_MS = 1000 * 60 * 60 * 24 * 30;

export type AuthUserRecord = {
  _id: string;
  email: string;
  emailNormalized: string;
  name: string | null;
  passwordHash: string;
  createdAt: string;
  updatedAt: string;
};

type SessionDocument = {
  _id: string;
  userId: string;
  tokenHash: string;
  createdAt: string;
  updatedAt: string;
  expiresAt: Date;
};

export function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

function hashSessionToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const derived = scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${derived}`;
}

export function verifyPassword(password: string, storedHash: string) {
  const [salt, expected] = storedHash.split(":");
  if (!salt || !expected) {
    return false;
  }

  const actual = scryptSync(password, salt, 64);
  const expectedBuffer = Buffer.from(expected, "hex");
  return (
    actual.length === expectedBuffer.length &&
    timingSafeEqual(actual, expectedBuffer)
  );
}

function getCookieOptions() {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: new Date(Date.now() + SESSION_TTL_MS),
  };
}

export function clearAuthCookie(response: NextResponse) {
  response.cookies.set({
    name: AUTH_COOKIE_NAME,
    value: "",
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: new Date(0),
    maxAge: 0,
  });
}

export async function attachSessionCookie(response: NextResponse, userId: string) {
  await ensureMongoIndexes();

  const sessions = await getMongoCollection<SessionDocument>("sessions");
  const rawToken = randomBytes(32).toString("base64url");
  const now = new Date();

  await sessions.insertOne({
    _id: crypto.randomUUID(),
    userId,
    tokenHash: hashSessionToken(rawToken),
    createdAt: now.toISOString(),
    updatedAt: now.toISOString(),
    expiresAt: new Date(now.getTime() + SESSION_TTL_MS),
  });

  response.cookies.set({
    name: AUTH_COOKIE_NAME,
    value: rawToken,
    ...getCookieOptions(),
  });
}

export async function revokeAllSessionsForUser(userId: string) {
  await ensureMongoIndexes();

  const sessions = await getMongoCollection<SessionDocument>("sessions");
  await sessions.deleteMany({ userId });
}

export async function changePasswordForUser(options: {
  userId: string;
  currentPassword: string;
  newPassword: string;
}) {
  await ensureMongoIndexes();

  const users = await getMongoCollection<AuthUserRecord>("users");
  const user = await users.findOne({ _id: options.userId });

  if (!user || !verifyPassword(options.currentPassword, user.passwordHash)) {
    throw new Error("invalid_current_password");
  }

  const nextPasswordHash = hashPassword(options.newPassword);
  const now = new Date().toISOString();

  await users.updateOne(
    { _id: options.userId },
    {
      $set: {
        passwordHash: nextPasswordHash,
        updatedAt: now,
      },
    },
  );

  await revokeAllSessionsForUser(options.userId);

  return {
    user: {
      id: user._id,
      email: user.email,
      name: user.name,
    },
  };
}

export async function revokeSessionFromRequest() {
  await ensureMongoIndexes();

  const cookieStore = await cookies();
  const token = cookieStore.get(AUTH_COOKIE_NAME)?.value;
  if (!token) {
    return;
  }

  const sessions = await getMongoCollection<SessionDocument>("sessions");
  await sessions.deleteOne({ tokenHash: hashSessionToken(token) });
}

export async function readAuthenticatedUserFromCookies() {
  await ensureMongoIndexes();

  const cookieStore = await cookies();
  const token = cookieStore.get(AUTH_COOKIE_NAME)?.value;
  if (!token) {
    return null;
  }

  const sessions = await getMongoCollection<SessionDocument>("sessions");
  const users = await getMongoCollection<AuthUserRecord>("users");
  const now = new Date();
  const session = await sessions.findOne({
    tokenHash: hashSessionToken(token),
    expiresAt: { $gt: now },
  });

  if (!session) {
    return null;
  }

  const user = await users.findOne({ _id: session.userId });
  if (!user) {
    return null;
  }

  await sessions.updateOne(
    { _id: session._id },
    {
      $set: {
        updatedAt: now.toISOString(),
      },
    },
  );

  return {
    session: {
      id: session._id,
      userId: session.userId,
      expiresAt: session.expiresAt.toISOString(),
    },
    user: {
      id: user._id,
      email: user.email,
      name: user.name,
    },
  };
}
