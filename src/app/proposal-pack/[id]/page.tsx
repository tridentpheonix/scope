import type { Metadata } from "next";
﻿import { notFound } from "next/navigation";
import { ProposalPackEditor } from "@/components/proposal-pack-editor";
import { SiteHeader } from "@/components/site-header";
import { getCurrentWorkspaceContext } from "@/lib/auth/server";
import { canUseBrandedExport } from "@/lib/billing-gates";
import { readChangeOrderRecord } from "@/lib/change-order-storage";
import { applyExtractionReviewOverridesToProposalDraft } from "@/lib/extraction-review";
import { readExtractionReviewRecord } from "@/lib/extraction-review-storage";
import { readProposalMemory } from "@/lib/proposal-memory";
import { applySavedProposalPackClientBlocks, createProposalPackDraft } from "@/lib/proposal-pack";
import { readProposalPackRecord } from "@/lib/proposal-pack-storage";
import { readRiskCheckSubmissionById } from "@/lib/risk-check-storage";
import { markOnboardingStep } from "@/lib/workspace-onboarding";
import { readWorkspaceBrandSettings } from "@/lib/workspace-settings";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Proposal pack",
  robots: {
    index: false,
    follow: false,
  },
};

type ProposalPackPageProps = {
  params: Promise<{ id: string }>;
};

export default async function ProposalPackPage({ params }: ProposalPackPageProps) {
  const authContext = await getCurrentWorkspaceContext();
  if (!authContext.workspace) {
    throw new Error("Workspace was not initialized for this account.");
  }
  const { id } = await params;
  const submission = await readRiskCheckSubmissionById(id, undefined, authContext.workspace?.id);

  if (!submission) {
    notFound();
  }

  const savedDraft = await readProposalPackRecord(id, undefined, authContext.workspace?.id);
  const changeOrderDraft = await readChangeOrderRecord(id, undefined, authContext.workspace?.id);
  const proposalMemory = await readProposalMemory(id, 3, undefined, authContext.workspace?.id);
  const generatedDraft = createProposalPackDraft(submission);
  const savedReview = await readExtractionReviewRecord(id, undefined, authContext.workspace?.id);
  const brandSettings = await readWorkspaceBrandSettings(authContext.workspace.id);
  if (authContext.workspace?.id) {
    await markOnboardingStep(authContext.workspace.id, "generate-proposal-pack");
  }
  const reviewedDraft = savedReview
    ? applyExtractionReviewOverridesToProposalDraft(generatedDraft, savedReview.review)
    : generatedDraft;
  const draft = savedDraft
    ? applySavedProposalPackClientBlocks(reviewedDraft, savedDraft.clientBlocks)
    : reviewedDraft;

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,rgba(69,137,255,0.14),transparent_24%),linear-gradient(180deg,#eef4fb_0%,#f8fbff_40%,#eef3fa_100%)] text-slate-950">
      <SiteHeader compact ctaHref="/risk-check" ctaLabel="New Scope Risk Check" />

      <section className="section-shell grid gap-8 py-12 md:py-[4.5rem]">
        <div className="grid gap-4">
          <div className="status-chip w-fit border-sky-400/30 bg-sky-400/10 text-slate-900">
            <span className="size-2 rounded-full bg-sky-500" />
            Proposal pack draft
          </div>
          <div className="grid gap-3">
            <span className="eyebrow">Phase 04 - editable export</span>
            <p className="m-0 max-w-3xl text-base leading-7 text-slate-700 md:text-lg">
              This is the first export-ready proposal flow for ScopeOS. It turns one saved website
              brief into editable client-facing blocks while keeping the internal scoping notes off
              the exported draft.
            </p>
          </div>
        </div>

        <ProposalPackEditor
          submissionId={submission.id}
          draft={draft}
          reviewSavedAt={savedReview?.updatedAt ?? null}
          changeOrderDraft={changeOrderDraft?.draft ?? null}
          changeOrderSavedAt={changeOrderDraft?.updatedAt ?? null}
          proposalMemory={proposalMemory}
          canUsePremiumExport={canUseBrandedExport(authContext.workspace?.planKey)}
          brandSettings={brandSettings}
        />
      </section>
    </main>
  );
}

