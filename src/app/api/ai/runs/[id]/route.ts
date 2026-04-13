import { NextResponse } from "next/server";
import { getCurrentWorkspaceContextOrNull } from "@/lib/auth/server";
import { readAiRunsForSubmission } from "@/lib/ai-runs";

export const runtime = "nodejs";

type RouteProps = {
  params: Promise<{ id: string }>;
};

export async function GET(request: Request, { params }: RouteProps) {
  try {
    const authContext = await getCurrentWorkspaceContextOrNull();
    if (!authContext?.user) {
      return NextResponse.json({ ok: false, message: "Unauthorized." }, { status: 401 });
    }

    if (!authContext.workspace?.id) {
      return NextResponse.json(
        { ok: false, message: "We could not resolve the current workspace for this account." },
        { status: 400 },
      );
    }

    const { id } = await params;
    const url = new URL(request.url);
    const runType = url.searchParams.get("runType") ?? undefined;
    const limit = Number(url.searchParams.get("limit") ?? "5");

    const runs = await readAiRunsForSubmission(
      authContext.workspace.id,
      id,
      runType,
      Number.isFinite(limit) && limit > 0 ? Math.min(limit, 10) : 5,
    );

    return NextResponse.json({ ok: true, runs }, { status: 200 });
  } catch (error) {
    console.error("ai_runs_read_failed", error);
    return NextResponse.json(
      {
        ok: false,
        message: "We could not load the saved AI runs right now.",
      },
      { status: 500 },
    );
  }
}
