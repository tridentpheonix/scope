import { NextResponse } from "next/server";
import { processBackgroundTasks } from "@/lib/background-tasks";
import { recordDiagnostic } from "@/lib/diagnostics";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function getCronAuthHeader(request: Request) {
  return request.headers.get("authorization");
}

function isAuthorized(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    return false;
  }

  return getCronAuthHeader(request) === `Bearer ${secret}`;
}

export async function GET(request: Request) {
  if (!isAuthorized(request)) {
    void recordDiagnostic("warn", "maintenance", "background_tasks_unauthorized", {
      route: "/api/maintenance/background-tasks",
      message: "Unauthorized background task request.",
    });
    return NextResponse.json({ ok: false, message: "Unauthorized." }, { status: 401 });
  }

  try {
    const url = new URL(request.url);
    const limitValue = Number(url.searchParams.get("limit") ?? "10");
    const limit = Number.isFinite(limitValue) && limitValue > 0 ? Math.min(limitValue, 25) : 10;
    const summary = await processBackgroundTasks({ limit });

    return NextResponse.json(
      {
        ok: true,
        ...summary,
      },
      {
        status: 200,
        headers: {
          "Cache-Control": "no-store, max-age=0",
        },
      },
    );
  } catch (error) {
    void recordDiagnostic("error", "maintenance", "background_tasks_failed", {
      route: "/api/maintenance/background-tasks",
      message: "Background task processing failed.",
      error,
    });
    return NextResponse.json(
      {
        ok: false,
        message: "Background task processing failed.",
      },
      { status: 500 },
    );
  }
}
