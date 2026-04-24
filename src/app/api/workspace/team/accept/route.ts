import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentSession } from "@/lib/auth/server";
import { acceptWorkspaceInvitation } from "@/lib/workspace-team";
import { readJsonBody } from "@/lib/request-body";

const acceptSchema = z.object({
  token: z.string().min(20),
});

export async function POST(request: Request) {
  const session = await getCurrentSession();
  if (!session?.user) {
    return NextResponse.json({ ok: false, message: "Sign in before accepting this invite." }, { status: 401 });
  }

  const body = await readJsonBody<unknown>(request);
  const parsed = acceptSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ ok: false, message: "Invite token is invalid." }, { status: 400 });
  }

  try {
    await acceptWorkspaceInvitation({
      token: parsed.data.token,
      userId: session.user.id,
      userEmail: session.user.email,
    });
    return NextResponse.json({ ok: true });
  } catch (error) {
    const message =
      error instanceof Error && error.message === "invitation_email_mismatch"
        ? "This invite belongs to a different email address."
        : "Invite is invalid, expired, or already used.";
    return NextResponse.json({ ok: false, message }, { status: 400 });
  }
}
