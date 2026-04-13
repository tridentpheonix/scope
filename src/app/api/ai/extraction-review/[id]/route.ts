import { NextResponse } from "next/server";
import { getCurrentWorkspaceContextOrNull } from "@/lib/auth/server";
import { saveAiRun } from "@/lib/ai-runs";
import { recordDiagnostic } from "@/lib/diagnostics";
import {
  generateExtractionReviewAiSuggestion,
  type ExtractionReviewAiSuggestion,
} from "@/lib/extraction-review-ai";
import { createExtractionReviewDraft } from "@/lib/extraction-review";
import { readExtractionReviewRecord } from "@/lib/extraction-review-storage";
import { readRiskCheckSubmissionById } from "@/lib/risk-check-storage";

export const runtime = "nodejs";

type RouteProps = {
  params: Promise<{ id: string }>;
};

type AiRunResponse = ExtractionReviewAiSuggestion & {
  ok: true;
  submissionId: string;
  analysisPreview: {
    internalSummary: string;
    recommendedApproach: string;
    pricingConfidence: "low" | "medium" | "high";
    topQuestions: string[];
    topRisks: string[];
  };
  runId: string;
};

export async function POST(_request: Request, { params }: RouteProps) {
  try {
    const authContext = await getCurrentWorkspaceContextOrNull();
    if (!authContext?.user) {
      void recordDiagnostic("warn", "ai", "extraction_review_ai_unauthorized", {
        route: "/api/ai/extraction-review/[id]",
        status: 401,
        message: "Unauthorized.",
      });
      return NextResponse.json({ ok: false, message: "Unauthorized." }, { status: 401 });
    }

    if (!authContext.workspace?.id) {
      void recordDiagnostic("warn", "ai", "extraction_review_ai_workspace_missing", {
        route: "/api/ai/extraction-review/[id]",
        status: 400,
        message: "We could not resolve the current workspace for this account.",
      });
      return NextResponse.json(
        {
          ok: false,
          message: "We could not resolve the current workspace for this account.",
        },
        { status: 400 },
      );
    }

    const { id } = await params;
    const submission = await readRiskCheckSubmissionById(
      id,
      undefined,
      authContext.workspace.id,
    );

    if (!submission) {
      void recordDiagnostic("warn", "ai", "extraction_review_ai_submission_missing", {
        route: "/api/ai/extraction-review/[id]",
        status: 404,
        submissionId: id,
        workspaceId: authContext.workspace.id,
        message: "We could not find this brief for the current workspace.",
      });
      return NextResponse.json(
        {
          ok: false,
          message: "We could not find this brief for the current workspace.",
        },
        { status: 404 },
      );
    }

    const savedReview = await readExtractionReviewRecord(
      id,
      undefined,
      authContext.workspace.id,
    );

    const review = savedReview?.review ?? createExtractionReviewDraft(submission);
    const suggestion = await generateExtractionReviewAiSuggestion({
      submission,
      review,
    });

    const run = await saveAiRun({
      workspaceId: authContext.workspace.id,
      submissionId: id,
      runType: "extraction_review",
      modelName: suggestion.modelName,
      status: suggestion.mode,
      inputJson: {
        submissionId: submission.id,
        agencyName: submission.payload.agencyName,
        projectType: submission.payload.projectType,
        briefSource: submission.payload.briefSource,
        provider: suggestion.provider,
        review,
      },
      outputJson: {
        mode: suggestion.mode,
        provider: suggestion.provider,
        confidence: suggestion.confidence,
        suggestedReview: suggestion.suggestedReview,
        rationale: suggestion.rationale,
        notes: suggestion.notes,
      },
    });

    const response: AiRunResponse = {
      ok: true,
      submissionId: id,
      runId: run.id,
      analysisPreview: {
        internalSummary: submission.analysis.internalSummary,
        recommendedApproach: submission.analysis.pricingGuidance.recommendedApproach,
        pricingConfidence: submission.analysis.pricingGuidance.pricingConfidence,
        topQuestions: submission.analysis.missingInfoPrompts
          .slice(0, 3)
          .map((item) => item.question),
        topRisks: submission.analysis.riskFlags.slice(0, 3).map((item) => item.label),
      },
      ...suggestion,
    };

    console.info("extraction_review_ai_generated", {
      submissionId: submission.id,
      mode: suggestion.mode,
      confidence: suggestion.confidence,
      modelName: suggestion.modelName,
    });

    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    console.error("extraction_review_ai_failed", error);
    void recordDiagnostic("error", "ai", "extraction_review_ai_failed", {
      route: "/api/ai/extraction-review/[id]",
      status: 500,
      error,
      message: "We could not generate an AI-assisted extraction review right now.",
    });
    return NextResponse.json(
      {
        ok: false,
        message: "We could not generate an AI-assisted extraction review right now.",
      },
      { status: 500 },
    );
  }
}
