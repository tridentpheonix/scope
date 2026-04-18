import { NextResponse } from "next/server";
import { z } from "zod";
import { attachSessionCookie, normalizeEmail, verifyPassword } from "@/lib/auth/first-party";
import { ensureMongoIndexes, getMongoCollection } from "@/lib/mongo";
import { isAuthConfigured } from "@/lib/env";
import { readJsonBody } from "@/lib/request-body";

const signInSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

type UserDocument = {
  _id: string;
  email: string;
  emailNormalized: string;
  name: string | null;
  passwordHash: string;
};

export async function POST(request: Request) {
  if (!isAuthConfigured()) {
    return NextResponse.json({ ok: false, message: "MongoDB auth is not configured." }, { status: 503 });
  }

  const body = await readJsonBody<unknown>(request);
  const parsed = signInSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ ok: false, message: "Enter a valid email and password." }, { status: 400 });
  }

  await ensureMongoIndexes();
  const users = await getMongoCollection<UserDocument>("users");
  const user = await users.findOne({ emailNormalized: normalizeEmail(parsed.data.email) });

  if (!user || !verifyPassword(parsed.data.password, user.passwordHash)) {
    return NextResponse.json({ ok: false, message: "Incorrect email or password." }, { status: 401 });
  }

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
