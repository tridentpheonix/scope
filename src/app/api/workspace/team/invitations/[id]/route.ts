import { NextResponse } from "next/server";
import { getCurrentWorkspaceContextOrNull } from "@/lib/auth/server";
import { revokeWorkspaceInvitation } from "@/lib/workspace-team";

type RouteProps = {
  params: Promise<{ id: string }>;
};

export async function DELETE(_request: Request, { params }: RouteProps) {
  const authContext = await getCurrentWorkspaceContextOrNull();
  if (!authContext?.user || !authContext.workspace?.id) {
    return NextResponse.json({ ok: false, message: "Unauthorized." }, { status: 401 });
  }

  const { id } = await params;
  try {
    await revokeWorkspaceInvitation({
      workspaceId: authContext.workspace.id,
      invitationId: id,
      actorUserId: authContext.user.id,
    });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false, message: "Could not revoke invite." }, { status: 403 });
  }
}
