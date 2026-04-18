import { NextResponse } from "next/server";
import { getCurrentWorkspaceContextOrNull } from "@/lib/auth/server";
import { readAiRunsForSubmission } from "@/lib/ai-runs";
import { recordDiagnostic } from "@/lib/diagnostics";

export const runtime = "nodejs";

type RouteProps = {
  params: Promise<{ id: string }>;
};

export async function GET(request: Request, { params }: RouteProps) {
  const { id } = await params;

  try {
    const authContext = await getCurrentWorkspaceContextOrNull();
    if (!authContext?.user) {
      void recordDiagnostic("warn", "ai", "ai_runs_unauthorized", {
        route: "/api/ai/runs/[id]",
        submissionId: id,
        message: "Unauthorized AI run history request.",
      });
      return NextResponse.json({ ok: false, message: "Unauthorized." }, { status: 401 });
    }

    if (!authContext.workspace?.id) {
      void recordDiagnostic("warn", "ai", "ai_runs_workspace_missing", {
        route: "/api/ai/runs/[id]",
        submissionId: id,
        message: "Workspace missing for AI run history request.",
      });
      return NextResponse.json(
        { ok: false, message: "We could not resolve the current workspace for this account." },
        { status: 400 },
      );
    }

    const url = new URL(request.url);
    const runType = url.searchParams.get("runType") ?? undefined;
    const limit = Number(url.searchParams.get("limit") ?? "5");
    const offset = Number(url.searchParams.get("offset") ?? "0");
    const normalizedLimit = Number.isFinite(limit) && limit > 0 ? Math.min(limit, 10) : 5;
    const normalizedOffset = Number.isFinite(offset) && offset > 0 ? offset : 0;

    const runs = await readAiRunsForSubmission(
      authContext.workspace.id,
      id,
      runType,
      normalizedLimit + normalizedOffset,
    );

    return NextResponse.json(
      { ok: true, runs: runs.slice(normalizedOffset, normalizedOffset + normalizedLimit) },
      { status: 200 },
    );
  } catch (error) {
    void recordDiagnostic("error", "ai", "ai_runs_read_failed", {
      route: "/api/ai/runs/[id]",
      submissionId: id,
      message: "We could not load the saved AI runs right now.",
      error,
    });
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
