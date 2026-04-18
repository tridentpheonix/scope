import { NextResponse } from "next/server";
import { z } from "zod";
import { attachSessionCookie, hashPassword, normalizeEmail } from "@/lib/auth/first-party";
import { ensureWorkspaceForUser } from "@/lib/workspace-billing";
import { ensureMongoIndexes, getMongoCollection } from "@/lib/mongo";
import { isAuthConfigured } from "@/lib/env";
import { readJsonBody } from "@/lib/request-body";

const signUpSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().trim().min(1).max(120).optional(),
});

type UserDocument = {
  _id: string;
  email: string;
  emailNormalized: string;
  name: string | null;
  passwordHash: string;
  createdAt: string;
  updatedAt: string;
};

export async function POST(request: Request) {
  if (!isAuthConfigured()) {
    return NextResponse.json({ ok: false, message: "MongoDB auth is not configured." }, { status: 503 });
  }

  const body = await readJsonBody<unknown>(request);
  const parsed = signUpSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ ok: false, message: "Enter a valid name, email, and password." }, { status: 400 });
  }

  await ensureMongoIndexes();
  const users = await getMongoCollection<UserDocument>("users");
  const emailNormalized = normalizeEmail(parsed.data.email);
  const now = new Date().toISOString();
  const existing = await users.findOne({ emailNormalized });
  if (existing) {
    return NextResponse.json({ ok: false, message: "That email is already in use." }, { status: 409 });
  }

  const user = {
    _id: crypto.randomUUID(),
    email: parsed.data.email.trim(),
    emailNormalized,
    name: parsed.data.name?.trim() ?? null,
    passwordHash: hashPassword(parsed.data.password),
    createdAt: now,
    updatedAt: now,
  } satisfies UserDocument;

  await users.insertOne(user);
  await ensureWorkspaceForUser({
    id: user._id,
    email: user.email,
    name: user.name,
  });

  const response = NextResponse.json({
    ok: true,
    user: {
      id: user._id,
      email: user.email,
      name: user.name,
    },
  });

  await attachSessionCookie(response, user._id);
  return response;
}
