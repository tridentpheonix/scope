import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentWorkspaceContextOrNull } from "@/lib/auth/server";
import { removeWorkspaceMember, updateWorkspaceMemberRole } from "@/lib/workspace-team";
import { readJsonBody } from "@/lib/request-body";

type RouteProps = {
  params: Promise<{ userId: string }>;
};

const roleSchema = z.object({
  role: z.enum(["owner", "admin", "member"]),
});

function errorResponse(error: unknown) {
  const message =
    error instanceof Error && error.message === "last_owner_required"
      ? "A workspace must keep at least one owner."
      : "Only workspace owners/admins can manage members.";
  return NextResponse.json({ ok: false, message }, { status: 403 });
}

export async function PUT(request: Request, { params }: RouteProps) {
  const authContext = await getCurrentWorkspaceContextOrNull();
  if (!authContext?.user || !authContext.workspace?.id) {
    return NextResponse.json({ ok: false, message: "Unauthorized." }, { status: 401 });
  }
  const body = await readJsonBody<unknown>(request);
  const parsed = roleSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ ok: false, message: "Role payload is invalid." }, { status: 400 });
  }
  const { userId } = await params;
  try {
    await updateWorkspaceMemberRole({
      workspaceId: authContext.workspace.id,
      targetUserId: userId,
      actorUserId: authContext.user.id,
      role: parsed.data.role,
    });
    return NextResponse.json({ ok: true });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function DELETE(_request: Request, { params }: RouteProps) {
  const authContext = await getCurrentWorkspaceContextOrNull();
  if (!authContext?.user || !authContext.workspace?.id) {
    return NextResponse.json({ ok: false, message: "Unauthorized." }, { status: 401 });
  }
  const { userId } = await params;
  try {
    await removeWorkspaceMember({
      workspaceId: authContext.workspace.id,
      targetUserId: userId,
      actorUserId: authContext.user.id,
    });
    return NextResponse.json({ ok: true });
  } catch (error) {
    return errorResponse(error);
  }
}
