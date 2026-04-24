import { NextResponse } from "next/server";
import { z } from "zod";
import { isAuthConfigured } from "@/lib/env";
import { confirmPasswordReset } from "@/lib/password-reset";
import { readJsonBody } from "@/lib/request-body";

const confirmSchema = z.object({
  token: z.string().min(20),
  newPassword: z.string().min(8),
});

export async function POST(request: Request) {
  if (!isAuthConfigured()) {
    return NextResponse.json({ ok: false, message: "MongoDB auth is not configured." }, { status: 503 });
  }

  const body = await readJsonBody<unknown>(request);
  const parsed = confirmSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ ok: false, message: "Enter a valid reset token and password." }, { status: 400 });
  }

  try {
    await confirmPasswordReset(parsed.data);
    return NextResponse.json({ ok: true, message: "Password reset. Please sign in again." });
  } catch {
    return NextResponse.json({ ok: false, message: "Reset link is invalid or expired." }, { status: 400 });
  }
}
