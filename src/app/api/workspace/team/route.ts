import { NextResponse } from "next/server";
import { getCurrentWorkspaceContextOrNull } from "@/lib/auth/server";
import { getMembershipForUser, readWorkspaceTeam } from "@/lib/workspace-team";

export async function GET() {
  const authContext = await getCurrentWorkspaceContextOrNull();
  if (!authContext?.user || !authContext.workspace?.id) {
    return NextResponse.json({ ok: false, message: "Unauthorized." }, { status: 401 });
  }

  const team = await readWorkspaceTeam(authContext.workspace.id);
  const membership = await getMembershipForUser(authContext.workspace.id, authContext.user.id);
  return NextResponse.json({
    ok: true,
    ...team,
    canManage: membership?.role === "owner" || membership?.role === "admin",
  });
}
