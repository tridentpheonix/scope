import type { Route } from "next";
import Link from "next/link";
import { DealDeleteButton } from "@/components/deal-delete-button";
import { SiteHeader } from "@/components/site-header";
import { getCurrentWorkspaceContext } from "@/lib/auth/server";
import { canAccessSavedHistory } from "@/lib/billing-gates";
import { formatDateTimeLabel } from "@/lib/risk-check-presenters";
import { readSavedDealSummaries } from "@/lib/saved-deals";

export const dynamic = "force-dynamic";

type SavedDealsPageProps = {
  searchParams?: {
    page?: string;
  };
};

export default async function SavedDealsPage({ searchParams }: SavedDealsPageProps) {
  const authContext = await getCurrentWorkspaceContext();
  const planKey = authContext.workspace?.planKey;
  const hasHistoryAccess = canAccessSavedHistory(planKey);
  const pageSize = 10;
  const requestedPage = Number.parseInt(searchParams?.page ?? "1", 10);
  const currentPage = Number.isFinite(requestedPage) && requestedPage > 0 ? requestedPage : 1;

  if (!hasHistoryAccess) {
    return (
      <main className="min-h-screen bg-[radial-gradient(circle_at_top,rgba(69,137,255,0.14),transparent_24%),linear-gradient(180deg,#eef4fb_0%,#f8fbff_40%,#eef3fa_100%)] text-slate-950">
        <SiteHeader compact ctaHref="/pricing" ctaLabel="Upgrade workspace" />

        <section className="section-shell grid gap-8 py-12 md:py-[4.5rem]">
          <div className="grid gap-4">
            <div className="status-chip w-fit border-sky-400/30 bg-sky-400/10 text-slate-900">
              <span className="size-2 rounded-full bg-sky-500" />
              Saved deal history
            </div>
            <div className="grid gap-3">
              <span className="eyebrow">Deals dashboard</span>
              <h1
                className="m-0 text-4xl font-semibold tracking-[-0.05em] text-slate-950 md:text-6xl"
                style={{ fontFamily: "var(--font-display)" }}
              >
                Keep history across active proposals.
              </h1>
            </div>
          </div>

          <div className="grid gap-4 rounded-[2rem] border border-slate-200 bg-white px-6 py-8 shadow-sm md:px-8">
            <div className="grid gap-2">
              <span className="eyebrow">How to unlock this view</span>
              <h2
                className="m-0 text-3xl font-semibold tracking-[-0.04em] text-slate-950"
                style={{ fontFamily: "var(--font-display)" }}
              >
                Saved history is a paid workspace feature.
              </h2>
              <p className="m-0 max-w-2xl text-sm leading-7 text-slate-600 md:text-base">
                Upgrade the workspace to keep review and proposal history across deals. You can
                still start a fresh brief from the launchpad while you decide whether saved
                history is worth it.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <Link
                href="/pricing"
                className="inline-flex min-h-11 items-center justify-center rounded-full bg-slate-950 px-5 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:bg-slate-800"
              >
                Compare plans
              </Link>
              <Link
                href="/"
                className="inline-flex min-h-11 items-center justify-center rounded-full border border-slate-300 bg-white px-5 text-sm font-semibold text-slate-900 transition hover:-translate-y-0.5 hover:border-slate-400"
              >
                Back to launchpad
              </Link>
            </div>
          </div>
        </section>
      </main>
    );
  }


  const allDeals = await readSavedDealSummaries(undefined, authContext.workspace?.id, 100);
  const totalDeals = allDeals.length;
  const totalPages = Math.max(1, Math.ceil(totalDeals / pageSize));
  const page = Math.min(currentPage, totalPages);
  const startIndex = (page - 1) * pageSize;
  const deals = allDeals.slice(startIndex, startIndex + pageSize);
  const hasPreviousPage = page > 1;
  const hasNextPage = startIndex + pageSize < totalDeals;

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,rgba(69,137,255,0.14),transparent_24%),linear-gradient(180deg,#eef4fb_0%,#f8fbff_40%,#eef3fa_100%)] text-slate-950">
      <SiteHeader compact ctaHref="/risk-check" ctaLabel="New Scope Risk Check" />

      <section className="section-shell grid gap-8 py-12 md:py-[4.5rem]">
        <div className="grid gap-4">
          <div className="status-chip w-fit border-sky-400/30 bg-sky-400/10 text-slate-900">
            <span className="size-2 rounded-full bg-sky-500" />
            Phase 05 - export, history, and concierge ops
          </div>

          <div className="grid gap-3">
            <span className="eyebrow">Saved deals</span>
            <h1
              className="m-0 text-4xl font-semibold tracking-[-0.05em] text-slate-950 md:text-6xl"
              style={{ fontFamily: "var(--font-display)" }}
            >
              Reopen proposal work without hunting for IDs.
            </h1>
            <p className="m-0 max-w-3xl text-base leading-7 text-slate-700 md:text-lg">
              This list keeps the MVP operational: founders can reopen the most recent intake
              submissions, internal review, and proposal drafts from one place while ScopeOS is
              still in concierge-first mode.
            </p>
          </div>

          <div className="rounded-[1.75rem] border border-amber-200 bg-amber-50 px-5 py-5 text-sm leading-7 text-amber-950 shadow-sm">
            <strong className="block text-base">Branded export now live</strong>
            Founders can open a branded proposal export from the draft editor and print to PDF
            when they need a client-ready file. Copy + markdown remain available for fast handoff.
          </div>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/analytics"
              className="inline-flex min-h-11 items-center justify-center rounded-full border border-slate-300 bg-white px-5 text-sm font-semibold text-slate-900 transition hover:-translate-y-0.5 hover:border-slate-400"
            >
              View analytics dashboard
            </Link>
          </div>
          {totalDeals > 0 ? (
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-3xl border border-slate-200 bg-white px-5 py-4 text-sm text-slate-600 shadow-sm">
              <span>
                Showing {startIndex + 1}-{Math.min(startIndex + pageSize, totalDeals)} of {totalDeals} recent deals
              </span>
              <div className="flex flex-wrap gap-2">
                <Link
                  href={`/deals?page=${Math.max(1, page - 1)}`}
                  aria-disabled={!hasPreviousPage}
                  className={`inline-flex min-h-10 items-center justify-center rounded-full border px-4 text-sm font-semibold transition ${
                    hasPreviousPage
                      ? "border-slate-300 bg-white text-slate-900 hover:border-slate-400"
                      : "pointer-events-none border-slate-200 bg-slate-100 text-slate-400"
                  }`}
                >
                  Previous
                </Link>
                <Link
                  href={`/deals?page=${Math.min(totalPages, page + 1)}`}
                  aria-disabled={!hasNextPage}
                  className={`inline-flex min-h-10 items-center justify-center rounded-full border px-4 text-sm font-semibold transition ${
                    hasNextPage
                      ? "border-slate-300 bg-white text-slate-900 hover:border-slate-400"
                      : "pointer-events-none border-slate-200 bg-slate-100 text-slate-400"
                  }`}
                >
                  Next
                </Link>
              </div>
            </div>
          ) : null}
        </div>

        {deals.length === 0 ? (
          <div className="grid gap-6 rounded-[2rem] border border-slate-200 bg-white px-6 py-8 shadow-sm md:px-8 md:py-10">
            <div className="grid gap-3">
              <span className="eyebrow">No saved deals yet</span>
              <h2
                className="m-0 text-3xl font-semibold tracking-[-0.04em] text-slate-950"
                style={{ fontFamily: "var(--font-display)" }}
              >
                Start with one real brief and the workspace fills itself in.
              </h2>
              <p className="m-0 max-w-2xl text-sm leading-7 text-slate-600 md:text-base">
                Submit the first Scope Risk Check, review the extracted scope, and the intake,
                review, and proposal draft will all appear here for fast reopening later.
              </p>
            </div>

            <div className="grid gap-3 rounded-3xl border border-slate-200 bg-slate-50 px-5 py-5 text-sm leading-7 text-slate-700">
              <strong className="block text-base text-slate-950">Suggested first run</strong>
              <ul className="m-0 grid gap-2 pl-5">
                <li>Paste a transcript, brief, or Loom summary into Scope Risk Check.</li>
                <li>Review missing scope and risk flags in extraction review.</li>
                <li>Generate the proposal pack and come back here to reopen it later.</li>
              </ul>
            </div>

            <div className="flex flex-wrap gap-3">
              <Link
                href="/risk-check"
                className="inline-flex min-h-11 items-center justify-center rounded-full bg-slate-950 px-5 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:bg-slate-800"
              >
                Start the first risk check
              </Link>
              <Link
                href="/"
                className="inline-flex min-h-11 items-center justify-center rounded-full border border-slate-300 bg-white px-5 text-sm font-semibold text-slate-900 transition hover:-translate-y-0.5 hover:border-slate-400"
              >
                Back to launchpad
              </Link>
            </div>
          </div>
        ) : (
          <div className="grid gap-5">
            {deals.map((deal) => {
              const primaryHref = (deal.hasSavedProposalPack
                ? `/proposal-pack/${deal.submissionId}`
                : deal.hasSavedReview
                  ? `/proposal-pack/${deal.submissionId}`
                  : `/extraction-review/${deal.submissionId}`) as Route;
              const primaryLabel = deal.hasSavedProposalPack
                ? "Reopen proposal draft"
                : deal.hasSavedReview
                  ? "Open proposal draft"
                  : "Open extraction review";

              return (
                <article
                  key={deal.submissionId}
                  className="grid gap-5 rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm md:grid-cols-[1fr_auto] md:items-start md:p-6"
                >
                  <div className="grid gap-4">
                    <div className="flex flex-wrap items-center gap-3">
                      <div className="status-chip border-slate-300/60 bg-slate-100 text-slate-900">
                        <span className="size-2 rounded-full bg-slate-950" />
                        {deal.currentStageLabel}
                      </div>
                      <span className="text-sm text-slate-500">
                        Last touched {formatDateTimeLabel(deal.lastTouchedAt)}
                      </span>
                    </div>

                    <div className="grid gap-2">
                      <h2
                        className="m-0 text-2xl font-semibold tracking-[-0.03em] text-slate-950"
                        style={{ fontFamily: "var(--font-display)" }}
                      >
                        {deal.agencyName}
                      </h2>
                      <p className="m-0 text-sm text-slate-500">
                        {deal.projectTypeLabel} • {deal.briefSourceLabel} • Submitted {formatDateTimeLabel(deal.createdAt)}
                      </p>
                    </div>

                    <p className="m-0 max-w-3xl text-sm leading-7 text-slate-700">
                      {deal.summaryPreview}
                    </p>

                    <div className="flex flex-wrap gap-2 text-xs font-medium uppercase tracking-[0.16em] text-slate-500">
                      <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-2">
                        Intake saved
                      </span>
                      <span
                        className={`rounded-full border px-3 py-2 ${
                          deal.hasAttachment
                            ? "border-amber-200 bg-amber-50 text-amber-800"
                            : "border-slate-200 bg-slate-50"
                        }`}
                      >
                        {deal.hasAttachment
                          ? deal.attachmentLabel ?? "Client materials saved"
                          : "No attachment"}
                      </span>
                      <span
                        className={`rounded-full border px-3 py-2 ${
                          deal.hasSavedReview
                            ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                            : "border-slate-200 bg-slate-50"
                        }`}
                      >
                        {deal.hasSavedReview ? "Review saved" : "Review not saved"}
                      </span>
                      <span
                        className={`rounded-full border px-3 py-2 ${
                          deal.hasSavedProposalPack
                            ? "border-sky-200 bg-sky-50 text-sky-800"
                            : "border-slate-200 bg-slate-50"
                        }`}
                      >
                        {deal.hasSavedProposalPack
                          ? "Proposal draft saved"
                          : "Proposal draft not saved"}
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-3 md:w-[16rem] md:flex-col">
                    <Link
                      href={primaryHref}
                      className="inline-flex min-h-11 items-center justify-center rounded-full bg-slate-950 px-5 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:bg-slate-800"
                    >
                      {primaryLabel}
                    </Link>
                    <Link
                      href={`/extraction-review/${deal.submissionId}` as Route}
                      className="inline-flex min-h-11 items-center justify-center rounded-full border border-slate-300 bg-white px-5 text-sm font-semibold text-slate-900 transition hover:-translate-y-0.5 hover:border-slate-400"
                    >
                      Open extraction review
                    </Link>
                    <Link
                      href={`/proposal-pack/${deal.submissionId}` as Route}
                      className="inline-flex min-h-11 items-center justify-center rounded-full border border-slate-200 bg-slate-50 px-5 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-white"
                    >
                      Open proposal draft
                    </Link>
                    {deal.hasAttachment ? (
                      <a
                        href={`/api/deals/${deal.submissionId}/attachment`}
                        className="inline-flex min-h-11 items-center justify-center rounded-full border border-amber-200 bg-amber-50 px-5 text-sm font-semibold text-amber-900 transition hover:border-amber-300 hover:bg-amber-100"
                      >
                        Download client materials
                      </a>
                    ) : null}
                    <DealDeleteButton submissionId={deal.submissionId} />
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>
    </main>
  );
}

