import { notFound } from "next/navigation";
import { ExtractionReviewEditor } from "@/components/extraction-review-editor";
import { SiteHeader } from "@/components/site-header";
import { getCurrentWorkspaceContext } from "@/lib/auth/server";
import { createExtractionReviewDraft } from "@/lib/extraction-review";
import { readExtractionReviewRecord } from "@/lib/extraction-review-storage";
import { readRiskCheckSubmissionById } from "@/lib/risk-check-storage";

export const dynamic = "force-dynamic";

type ExtractionReviewPageProps = {
  params: Promise<{ id: string }>;
};

export default async function ExtractionReviewPage({
  params,
}: ExtractionReviewPageProps) {
  const authContext = await getCurrentWorkspaceContext();
  const { id } = await params;
  const submission = await readRiskCheckSubmissionById(id, undefined, authContext.workspace?.id);

  if (!submission) {
    notFound();
  }

  const generatedDraft = createExtractionReviewDraft(submission);
  const savedReview = await readExtractionReviewRecord(id, undefined, authContext.workspace?.id);
  const draft = savedReview?.review ?? generatedDraft;

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,rgba(69,137,255,0.14),transparent_24%),linear-gradient(180deg,#eef4fb_0%,#f8fbff_40%,#eef3fa_100%)] text-slate-950">
      <SiteHeader compact ctaHref="/risk-check" ctaLabel="New Scope Risk Check" />

      <section className="section-shell grid gap-8 py-12 md:py-[4.5rem]">
        <div className="grid gap-4">
          <div className="status-chip w-fit border-sky-400/30 bg-sky-400/10 text-slate-900">
            <span className="size-2 rounded-full bg-sky-500" />
            Extraction review
          </div>
          <div className="grid gap-3">
            <span className="eyebrow">Phase 03 - review first</span>
            <p className="m-0 max-w-3xl text-base leading-7 text-slate-700 md:text-lg">
              ScopeOS now includes a dedicated internal review step so the founder can tighten
              assumptions, risk framing, and pricing posture before opening the proposal-pack
              draft.
            </p>
          </div>
        </div>

        <ExtractionReviewEditor
          submissionId={submission.id}
          draft={draft}
          workspaceUpdatedAt={savedReview?.updatedAt ?? null}
        />
      </section>
    </main>
  );
}
