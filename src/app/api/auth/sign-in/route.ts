import { NextResponse } from "next/server";
import { z } from "zod";
import { attachSessionCookie, normalizeEmail, verifyPassword } from "@/lib/auth/first-party";
import { AUTH_RATE_LIMIT_RULES, checkAuthRateLimits, getRequestIp } from "@/lib/auth-rate-limit";
import { recordDiagnostic } from "@/lib/diagnostics";
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
  passwordHash: string | null;
  googleSubject: string | null;
};

function buildRateLimitedResponse(retryAfterSeconds: number) {
  return NextResponse.json(
    {
      ok: false,
      message: "Too many sign-in attempts. Try again later.",
      retryAfterSeconds,
    },
    {
      status: 429,
      headers: {
        "Retry-After": String(retryAfterSeconds),
      },
    },
  );
}

export async function POST(request: Request) {
  if (!isAuthConfigured()) {
    return NextResponse.json({ ok: false, message: "MongoDB auth is not configured." }, { status: 503 });
  }

  const ipDecision = await checkAuthRateLimits([
    {
      ...AUTH_RATE_LIMIT_RULES.signIn.ip,
      subject: getRequestIp(request),
    },
  ]);

  if (!ipDecision.allowed) {
    void recordDiagnostic("warn", "auth", "auth_sign_in_rate_limited", {
      route: "/api/auth/sign-in",
      status: 429,
      message: "Sign-in attempts were rate limited.",
      details: {
        key: ipDecision.key,
        attempts: ipDecision.attempts,
        remaining: 0,
        retryAfterSeconds: ipDecision.retryAfterSeconds,
      },
    });

    return buildRateLimitedResponse(ipDecision.retryAfterSeconds);
  }

  const body = await readJsonBody<unknown>(request);
  const parsed = signInSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ ok: false, message: "Enter a valid email and password." }, { status: 400 });
  }

  const emailDecision = await checkAuthRateLimits([
    {
      ...AUTH_RATE_LIMIT_RULES.signIn.email,
      subject: normalizeEmail(parsed.data.email),
    },
  ]);

  if (!emailDecision.allowed) {
    void recordDiagnostic("warn", "auth", "auth_sign_in_rate_limited", {
      route: "/api/auth/sign-in",
      status: 429,
      message: "Sign-in attempts were rate limited.",
      details: {
        key: emailDecision.key,
        attempts: emailDecision.attempts,
        remaining: 0,
        retryAfterSeconds: emailDecision.retryAfterSeconds,
      },
    });

    return buildRateLimitedResponse(emailDecision.retryAfterSeconds);
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
