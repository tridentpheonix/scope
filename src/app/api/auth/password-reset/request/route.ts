import { NextResponse } from "next/server";
import { z } from "zod";
import { AUTH_RATE_LIMIT_RULES, checkAuthRateLimits, getRequestIp } from "@/lib/auth-rate-limit";
import { normalizeEmail } from "@/lib/auth/first-party";
import { isAuthConfigured } from "@/lib/env";
import { requestPasswordReset } from "@/lib/password-reset";
import { readJsonBody } from "@/lib/request-body";

const requestSchema = z.object({
  email: z.string().email(),
});

function rateLimited(retryAfterSeconds: number) {
  return NextResponse.json(
    {
      ok: false,
      message: "Too many reset requests. Try again later.",
      retryAfterSeconds,
    },
    { status: 429, headers: { "Retry-After": String(retryAfterSeconds) } },
  );
}

export async function POST(request: Request) {
  if (!isAuthConfigured()) {
    return NextResponse.json({ ok: false, message: "MongoDB auth is not configured." }, { status: 503 });
  }

  const ipDecision = await checkAuthRateLimits([
    { ...AUTH_RATE_LIMIT_RULES.passwordReset.ip, subject: getRequestIp(request) },
  ]);
  if (!ipDecision.allowed) {
    return rateLimited(ipDecision.retryAfterSeconds);
  }

  const body = await readJsonBody<unknown>(request);
  const parsed = requestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ ok: false, message: "Enter a valid email." }, { status: 400 });
  }

  const emailDecision = await checkAuthRateLimits([
    { ...AUTH_RATE_LIMIT_RULES.passwordReset.email, subject: normalizeEmail(parsed.data.email) },
  ]);
  if (!emailDecision.allowed) {
    return rateLimited(emailDecision.retryAfterSeconds);
  }

  const result = await requestPasswordReset({ email: parsed.data.email, request });
  return NextResponse.json({
    ok: true,
    emailSent: result.emailSent,
    message: "If an account exists, a reset link will be sent.",
  });
}
