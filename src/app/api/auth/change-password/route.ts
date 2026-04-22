import { NextResponse } from "next/server";
import { z } from "zod";
import { changePasswordForUser, clearAuthCookie } from "@/lib/auth/first-party";
import { getCurrentSession } from "@/lib/auth/server";
import { recordDiagnostic } from "@/lib/diagnostics";
import { isAuthConfigured } from "@/lib/env";
import { readJsonBody } from "@/lib/request-body";

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(8),
});

export async function POST(request: Request) {
  if (!isAuthConfigured()) {
    return NextResponse.json({ ok: false, message: "MongoDB auth is not configured." }, { status: 503 });
  }

  const session = await getCurrentSession();
  if (!session?.user) {
    return NextResponse.json({ ok: false, message: "You must be signed in to change your password." }, { status: 401 });
  }

  const body = await readJsonBody<unknown>(request);
  const parsed = changePasswordSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ ok: false, message: "Enter your current password and a new password." }, { status: 400 });
  }

  if (parsed.data.currentPassword === parsed.data.newPassword) {
    return NextResponse.json({ ok: false, message: "Choose a new password that is different from your current one." }, { status: 400 });
  }

  try {
    await changePasswordForUser({
      userId: session.user.id,
      currentPassword: parsed.data.currentPassword,
      newPassword: parsed.data.newPassword,
    });
  } catch (error) {
    if (error instanceof Error && error.message === "invalid_current_password") {
      return NextResponse.json({ ok: false, message: "Your current password was not correct." }, { status: 401 });
    }

    void recordDiagnostic("error", "auth", "auth_change_password_failed", {
      route: "/api/auth/change-password",
      status: 500,
      message: error instanceof Error ? error.message : "Password change failed.",
      details: {
        userId: session.user.id,
      },
    });

    return NextResponse.json({ ok: false, message: "Could not change your password right now." }, { status: 500 });
  }

  const response = NextResponse.json({
    ok: true,
    message: "Password changed. Please sign in again.",
  });
  clearAuthCookie(response);
  await recordDiagnostic("info", "auth", "auth_change_password_success", {
    route: "/api/auth/change-password",
    status: 200,
    message: "Password changed and sessions revoked.",
    details: {
      userId: session.user.id,
    },
  });

  return response;
}
