import { NextResponse } from "next/server";
import { getCurrentWorkspaceContextOrNull } from "@/lib/auth/server";
import { recordDiagnostic } from "@/lib/diagnostics";
import { saveExportBlockerSignal } from "@/lib/export-blocker-storage";
import { readJsonBody } from "@/lib/request-body";

export const runtime = "nodejs";

type ExportBlockerBody = {
  note?: string;
  submissionId?: string;
  outcome?: "reduced-friction" | "needs-theme-options" | "needs-google-docs" | "other";
  themePreference?: "light" | "dark" | "both" | "unspecified";
  nextStep?: string;
};

export async function POST(request: Request) {
  try {
    const authContext = await getCurrentWorkspaceContextOrNull();
    if (!authContext?.user) {
      void recordDiagnostic("warn", "analytics", "export_blocker_unauthorized", {
        route: "/api/export-blocker",
        message: "Unauthorized export blocker submission.",
      });
      return NextResponse.json({ ok: false, message: "Unauthorized." }, { status: 401 });
    }

    const body = await readJsonBody<ExportBlockerBody>(request);

    if (!body || !body.note || body.note.trim().length < 8) {
      void recordDiagnostic("warn", "analytics", "export_blocker_invalid_payload", {
        route: "/api/export-blocker",
        workspaceId: authContext.workspace?.id,
        message: "Export blocker note too short.",
      });
      return NextResponse.json(
        {
          ok: false,
          message: "Add a short note describing the branded export feedback.",
        },
        { status: 400 },
      );
    }

    const record = await saveExportBlockerSignal(
      body.note,
      body.submissionId?.trim() || undefined,
      undefined,
      {
        outcome: body.outcome,
        themePreference: body.themePreference,
        nextStep: body.nextStep?.trim() || undefined,
      },
      authContext.workspace?.id,
    );

    return NextResponse.json({ ok: true, record }, { status: 200 });
  } catch (error) {
    void recordDiagnostic("error", "analytics", "export_blocker_save_failed", {
      route: "/api/export-blocker",
      workspaceId: undefined,
      message: "We could not save this branded export feedback.",
      error,
    });
    console.error("export_blocker_save_failed", error);
    return NextResponse.json(
      {
        ok: false,
        message: "We could not save this branded export feedback.",
      },
      { status: 500 },
    );
  }
}
