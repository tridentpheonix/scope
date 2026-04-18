import { NextResponse } from "next/server";
import { getCurrentWorkspaceContextOrNull } from "@/lib/auth/server";
import type { AnalyticsEvent } from "@/lib/analytics";
import { saveAnalyticsEvent } from "@/lib/analytics-storage";
import { recordDiagnostic } from "@/lib/diagnostics";
import { readJsonBody } from "@/lib/request-body";

export const runtime = "nodejs";

type EventBody = AnalyticsEvent;

function isValidEvent(value: unknown): value is AnalyticsEvent {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return false;
  }

  const event = value as Record<string, unknown>;

  return (
    typeof event.name === "string" &&
    event.name.length > 2 &&
    event.name.length < 80 &&
    typeof event.createdAt === "string"
  );
}

function safeMetadata(value: unknown) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return undefined;
  }

  const entries = Object.entries(value as Record<string, unknown>).slice(0, 20);
  const filtered: Record<string, string | number | boolean | null> = {};

  for (const [key, item] of entries) {
    if (typeof item === "string" || typeof item === "number" || typeof item === "boolean") {
      filtered[key] = item;
    } else if (item === null) {
      filtered[key] = null;
    }
  }

  return Object.keys(filtered).length ? filtered : undefined;
}

export async function POST(request: Request) {
  try {
    const authContext = await getCurrentWorkspaceContextOrNull();
    if (!authContext?.user) {
      void recordDiagnostic("warn", "analytics", "analytics_event_unauthorized", {
        route: "/api/events",
        message: "Unauthorized analytics event submission.",
      });
      return NextResponse.json({ ok: false, message: "Unauthorized." }, { status: 401 });
    }

    const body = await readJsonBody<EventBody>(request);

    if (!isValidEvent(body)) {
      void recordDiagnostic("warn", "analytics", "analytics_event_invalid_payload", {
        route: "/api/events",
        workspaceId: authContext.workspace?.id,
        message: "Invalid analytics payload.",
      });
      return NextResponse.json(
        {
          ok: false,
          message: "Invalid analytics payload.",
        },
        { status: 400 },
      );
    }

    const payload: AnalyticsEvent = {
      name: body.name,
      submissionId: body.submissionId,
      createdAt: body.createdAt,
      metadata: safeMetadata(body.metadata),
    };

    await saveAnalyticsEvent(payload, {
      workspaceId: authContext.workspace?.id ?? undefined,
    });

    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (error) {
    void recordDiagnostic("error", "analytics", "analytics_event_save_failed", {
      route: "/api/events",
      workspaceId: undefined,
      message: "We could not save the analytics event.",
      error,
    });
    console.error("analytics_event_save_failed", error);
    return NextResponse.json(
      {
        ok: false,
        message: "We could not save the analytics event.",
      },
      { status: 500 },
    );
  }
}
