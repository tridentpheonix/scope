import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentWorkspaceContextOrNull } from "@/lib/auth/server";
import { createWorkspaceInvitation } from "@/lib/workspace-team";
import { readJsonBody } from "@/lib/request-body";

const inviteSchema = z.object({
  email: z.string().email(),
  role: z.enum(["admin", "member"]),
});

export async function POST(request: Request) {
  const authContext = await getCurrentWorkspaceContextOrNull();
  if (!authContext?.user || !authContext.workspace?.id) {
    return NextResponse.json({ ok: false, message: "Unauthorized." }, { status: 401 });
  }

  const body = await readJsonBody<unknown>(request);
  const parsed = inviteSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ ok: false, message: "Enter a valid email and role." }, { status: 400 });
  }

  try {
    const result = await createWorkspaceInvitation({
      workspaceId: authContext.workspace.id,
      createdByUserId: authContext.user.id,
      email: parsed.data.email,
      role: parsed.data.role,
      request,
    });
    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        message:
          error instanceof Error && error.message === "workspace_admin_required"
            ? "Only workspace owners/admins can invite teammates."
            : "Could not create invitation.",
      },
      { status: 403 },
    );
  }
}
