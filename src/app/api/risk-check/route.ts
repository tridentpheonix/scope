import { NextResponse } from "next/server";
import { getCurrentWorkspaceContextOrNull } from "@/lib/auth/server";
import { recordDiagnostic } from "@/lib/diagnostics";
import { submitRiskCheck } from "@/lib/risk-check-service";
import { markOnboardingStep } from "@/lib/workspace-onboarding";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const authContext = await getCurrentWorkspaceContextOrNull();
    if (!authContext?.user) {
      void recordDiagnostic("warn", "intake", "risk_check_unauthorized", {
        route: "/api/risk-check",
        status: 401,
        message: "Please sign in to submit a Scope Risk Check.",
      });
      return NextResponse.json(
        { ok: false, message: "Please sign in to submit a Scope Risk Check." },
        { status: 401 },
      );
    }

    const formData = await request.formData();
    const result = await submitRiskCheck(formData, {
      workspaceId: authContext.workspace?.id ?? undefined,
    });

    if (!result.ok) {
      if (result.code === "invalid_attachment") {
        console.info("risk_check_submit_invalid_attachment", {
          message: result.message,
        });
        void recordDiagnostic("warn", "intake", "risk_check_invalid_attachment", {
          route: "/api/risk-check",
          status: result.status,
          message: result.message,
        });
      } else if (result.code === "invalid_payload") {
        console.info("risk_check_submit_invalid_payload", {
          issueCount: Object.keys(result.fieldErrors ?? {}).length,
        });
        void recordDiagnostic("warn", "intake", "risk_check_invalid_payload", {
          route: "/api/risk-check",
          status: result.status,
          message: result.message,
          details: {
            issueCount: Object.keys(result.fieldErrors ?? {}).length,
          },
        });
      } else {
        console.error("risk_check_submit_failed", result.cause ?? result.message);
        void recordDiagnostic("error", "intake", "risk_check_submit_failed", {
          route: "/api/risk-check",
          status: result.status,
          message: result.message,
          error: result.cause ?? result.message,
        });
      }

      return NextResponse.json(
        {
          ok: false,
          message: result.message,
          fieldErrors: result.fieldErrors,
        },
        { status: result.status },
      );
    }

    console.info("risk_check_submitted", {
      id: result.submission.id,
      agencyName: result.submission.payload.agencyName,
      projectType: result.submission.payload.projectType,
      hasAttachment: Boolean(result.submission.attachment),
      pricingConfidence: result.preview.pricingConfidence,
    });

    if (authContext.workspace?.id) {
      await markOnboardingStep(authContext.workspace.id, "create-risk-check");
    }

    return NextResponse.json(
      { ok: true, id: result.submission.id, analysisPreview: result.preview },
      { status: 201 },
    );
  } catch (error) {
    console.error("risk_check_request_failed", error);
    void recordDiagnostic("error", "intake", "risk_check_request_failed", {
      route: "/api/risk-check",
      status: 500,
      message: "We could not save this Scope Risk Check submission. Please retry in a moment.",
      error,
    });
    return NextResponse.json(
      {
        ok: false,
        message:
          "We could not save this Scope Risk Check submission. Please retry in a moment.",
      },
      { status: 500 },
    );
  }
}
