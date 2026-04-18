import { NextResponse } from "next/server";
import { getCurrentWorkspaceContextOrNull } from "@/lib/auth/server";
import { createAttachmentDownloadResponse } from "@/lib/attachment-storage";
import { recordDiagnostic } from "@/lib/diagnostics";
import { readRiskCheckSubmissionById } from "@/lib/risk-check-storage";

export const runtime = "nodejs";

type RouteProps = {
  params: Promise<{ id: string }>;
};

export async function GET(_request: Request, { params }: RouteProps) {
  const { id } = await params;

  try {
    const authContext = await getCurrentWorkspaceContextOrNull();
    if (!authContext?.user) {
      void recordDiagnostic("warn", "deals", "deal_attachment_unauthorized", {
        route: "/api/deals/[id]/attachment",
        message: "Unauthorized attachment download attempt.",
      });
      return NextResponse.json({ ok: false, message: "Unauthorized." }, { status: 401 });
    }

    const submission = await readRiskCheckSubmissionById(id, undefined, authContext.workspace?.id);

    if (!submission?.attachment) {
      void recordDiagnostic("warn", "deals", "deal_attachment_missing", {
        route: "/api/deals/[id]/attachment",
        workspaceId: authContext.workspace?.id,
        submissionId: id,
        message: "Attachment missing for deal download.",
      });
      return NextResponse.json(
        { ok: false, message: "Attachment not found." },
        { status: 404 },
      );
    }

    const response = await createAttachmentDownloadResponse(
      submission.attachment,
      submission.attachmentContentBase64 ?? null,
    );

    if (!response) {
      void recordDiagnostic("warn", "deals", "deal_attachment_unavailable", {
        route: "/api/deals/[id]/attachment",
        workspaceId: authContext.workspace?.id,
        submissionId: id,
        message: "Attachment is no longer available.",
      });
      return NextResponse.json(
        { ok: false, message: "Attachment is no longer available." },
        { status: 404 },
      );
    }

    return response;
  } catch (error) {
    void recordDiagnostic("error", "deals", "deal_attachment_download_failed", {
      route: "/api/deals/[id]/attachment",
      submissionId: id,
      message: "Could not load deal attachment.",
      error,
    });
    console.error("deal_attachment_download_failed", error);
    return NextResponse.json(
      {
        ok: false,
        message: "We could not load this attachment right now.",
      },
      { status: 500 },
    );
  }
}
