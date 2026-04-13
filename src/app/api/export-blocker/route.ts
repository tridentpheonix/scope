import { NextResponse } from "next/server";
import { getCurrentWorkspaceContextOrNull } from "@/lib/auth/server";
import { saveExportBlockerSignal } from "@/lib/export-blocker-storage";

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
      return NextResponse.json({ ok: false, message: "Unauthorized." }, { status: 401 });
    }

    const body = (await request.json()) as ExportBlockerBody;

    if (!body.note || body.note.trim().length < 8) {
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
