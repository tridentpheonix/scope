import { NextResponse } from "next/server";
import { getCurrentWorkspaceContextOrNull } from "@/lib/auth/server";
import { recordDiagnostic } from "@/lib/diagnostics";
import {
  savePilotFeedbackEntry,
  type PilotFeedbackBucket,
  type PilotFeedbackReproducibility,
  type PilotFeedbackSeverity,
} from "@/lib/pilot-feedback-storage";
import { readJsonBody } from "@/lib/request-body";

export const runtime = "nodejs";

type PilotFeedbackBody = {
  submissionId?: string;
  severity?: PilotFeedbackSeverity;
  bucket?: PilotFeedbackBucket;
  whereHappened?: string;
  triedToDo?: string;
  expectedResult?: string;
  actualResult?: string;
  reproducibility?: PilotFeedbackReproducibility;
  note?: string;
};

const allowedSeverities = new Set<PilotFeedbackSeverity>(["blocker", "high", "medium", "low"]);
const allowedBuckets = new Set<PilotFeedbackBucket>([
  "auth",
  "billing",
  "intake",
  "ai",
  "deals",
  "analytics",
  "maintenance",
  "performance",
  "copy",
  "data-integrity",
  "support",
]);
const allowedReproducibility = new Set<PilotFeedbackReproducibility>([
  "always",
  "sometimes",
  "once",
  "unknown",
]);

function hasText(value: unknown, minLength = 1) {
  return typeof value === "string" && value.trim().length >= minLength;
}

export async function POST(request: Request) {
  try {
    const authContext = await getCurrentWorkspaceContextOrNull();
    if (!authContext?.user) {
      void recordDiagnostic("warn", "support", "pilot_feedback_unauthorized", {
        route: "/api/pilot-feedback",
        message: "Unauthorized pilot feedback submission.",
      });
      return NextResponse.json({ ok: false, message: "Unauthorized." }, { status: 401 });
    }

    const body = await readJsonBody<PilotFeedbackBody>(request);
    const workspaceId = authContext.workspace?.id ?? "local-workspace";
    const severity = body?.severity ?? "medium";
    const bucket = body?.bucket ?? "support";
    const reproducibility = body?.reproducibility ?? "sometimes";

    if (
      !body ||
      !allowedSeverities.has(severity) ||
      !allowedBuckets.has(bucket) ||
      !allowedReproducibility.has(reproducibility) ||
      !hasText(body.whereHappened, 3) ||
      !hasText(body.triedToDo, 8) ||
      !hasText(body.expectedResult, 3) ||
      !hasText(body.actualResult, 3) ||
      !hasText(body.note, 8)
    ) {
      void recordDiagnostic("warn", "support", "pilot_feedback_invalid_payload", {
        route: "/api/pilot-feedback",
        workspaceId: authContext.workspace?.id,
        message: "Pilot feedback payload is invalid.",
      });
      return NextResponse.json(
        {
          ok: false,
          message: "Fill in the required feedback fields before sending.",
        },
        { status: 400 },
      );
    }

    const whereHappened = body.whereHappened?.trim() ?? "";
    const triedToDo = body.triedToDo?.trim() ?? "";
    const expectedResult = body.expectedResult?.trim() ?? "";
    const actualResult = body.actualResult?.trim() ?? "";
    const note = body.note?.trim() ?? "";

    const record = await savePilotFeedbackEntry(
      {
        userId: authContext.user.id,
        submissionId: body.submissionId?.trim() || undefined,
        severity,
        bucket,
        whereHappened,
        triedToDo,
        expectedResult,
        actualResult,
        reproducibility,
        note,
      },
      {
        workspaceId,
      },
    );

    return NextResponse.json({ ok: true, record }, { status: 200 });
  } catch (error) {
    void recordDiagnostic("error", "support", "pilot_feedback_save_failed", {
      route: "/api/pilot-feedback",
      message: "We could not save this pilot feedback.",
      error,
    });
    console.error("pilot_feedback_save_failed", error);
    return NextResponse.json(
      {
        ok: false,
        message: "We could not save this pilot feedback.",
      },
      { status: 500 },
    );
  }
}
