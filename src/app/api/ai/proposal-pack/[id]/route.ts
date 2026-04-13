import { NextResponse } from "next/server";
import { getCurrentWorkspaceContextOrNull } from "@/lib/auth/server";
import { saveAiRun } from "@/lib/ai-runs";
import { recordDiagnostic } from "@/lib/diagnostics";
import { buildChangeOrderSummary } from "@/lib/change-order";
import { applyExtractionReviewOverridesToProposalDraft } from "@/lib/extraction-review";
import { readExtractionReviewRecord } from "@/lib/extraction-review-storage";
import { generateProposalPackAiSuggestion } from "@/lib/proposal-pack-ai";
import { applySavedProposalPackClientBlocks, createProposalPackDraft } from "@/lib/proposal-pack";
import { readProposalPackRecord } from "@/lib/proposal-pack-storage";
import { readProposalMemory } from "@/lib/proposal-memory";
import { readRiskCheckSubmissionById } from "@/lib/risk-check-storage";
import { readChangeOrderRecord } from "@/lib/change-order-storage";

export const runtime = "nodejs";

type RouteProps = {
  params: Promise<{ id: string }>;
};

export async function POST(_request: Request, { params }: RouteProps) {
  try {
    const authContext = await getCurrentWorkspaceContextOrNull();
    if (!authContext?.user) {
      void recordDiagnostic("warn", "ai", "proposal_pack_ai_unauthorized", {
        route: "/api/ai/proposal-pack/[id]",
        status: 401,
        message: "Unauthorized.",
      });
      return NextResponse.json({ ok: false, message: "Unauthorized." }, { status: 401 });
    }

    if (!authContext.workspace?.id) {
      void recordDiagnostic("warn", "ai", "proposal_pack_ai_workspace_missing", {
        route: "/api/ai/proposal-pack/[id]",
        status: 400,
        message: "We could not resolve the current workspace for this account.",
      });
      return NextResponse.json(
        { ok: false, message: "We could not resolve the current workspace for this account." },
        { status: 400 },
      );
    }

    const { id } = await params;
    const submission = await readRiskCheckSubmissionById(id, undefined, authContext.workspace.id);

    if (!submission) {
      void recordDiagnostic("warn", "ai", "proposal_pack_ai_submission_missing", {
        route: "/api/ai/proposal-pack/[id]",
        status: 404,
        submissionId: id,
        workspaceId: authContext.workspace.id,
        message: "We could not find this brief for the current workspace.",
      });
      return NextResponse.json(
        { ok: false, message: "We could not find this brief for the current workspace." },
        { status: 404 },
      );
    }

    const savedReview = await readExtractionReviewRecord(id, undefined, authContext.workspace.id);
    const savedDraft = await readProposalPackRecord(id, undefined, authContext.workspace.id);
    const changeOrderDraft = await readChangeOrderRecord(id, undefined, authContext.workspace.id);
    const proposalMemory = await readProposalMemory(id, 3, undefined, authContext.workspace.id);
    const generatedDraft = createProposalPackDraft(submission);
    const reviewedDraft = savedReview
      ? applyExtractionReviewOverridesToProposalDraft(generatedDraft, savedReview.review)
      : generatedDraft;
    const currentDraft = savedDraft
      ? applySavedProposalPackClientBlocks(reviewedDraft, savedDraft.clientBlocks)
      : reviewedDraft;

    const suggestion = await generateProposalPackAiSuggestion({
      submission,
      draft: currentDraft,
      proposalMemory,
      changeOrderDraft: changeOrderDraft?.draft ?? null,
    });

    const run = await saveAiRun({
      workspaceId: authContext.workspace.id,
      submissionId: id,
      runType: "proposal_pack",
      modelName: suggestion.modelName,
      status: suggestion.mode,
      inputJson: {
        submissionId: submission.id,
        agencyName: submission.payload.agencyName,
        projectType: submission.payload.projectType,
        briefSource: submission.payload.briefSource,
        provider: suggestion.provider,
        draft: currentDraft,
        proposalMemory,
        changeOrderSummary: changeOrderDraft?.draft
          ? buildChangeOrderSummary(changeOrderDraft.draft)
          : null,
      },
      outputJson: {
        mode: suggestion.mode,
        provider: suggestion.provider,
        confidence: suggestion.confidence,
        blockUpdates: suggestion.blockUpdates,
        rationale: suggestion.rationale,
        notes: suggestion.notes,
      },
    });

    console.info("proposal_pack_ai_generated", {
      submissionId: submission.id,
      mode: suggestion.mode,
      confidence: suggestion.confidence,
      modelName: suggestion.modelName,
      blockCount: suggestion.blockUpdates.length,
    });

    return NextResponse.json(
      {
        ok: true,
        submissionId: id,
        runId: run.id,
        ...suggestion,
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("proposal_pack_ai_failed", error);
    void recordDiagnostic("error", "ai", "proposal_pack_ai_failed", {
      route: "/api/ai/proposal-pack/[id]",
      status: 500,
      error,
      message: "We could not generate an AI-assisted proposal pack right now.",
    });
    return NextResponse.json(
      {
        ok: false,
        message: "We could not generate an AI-assisted proposal pack right now.",
      },
      { status: 500 },
    );
  }
}
