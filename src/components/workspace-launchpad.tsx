import Link from "next/link";
import type { Route } from "next";
import type { ScopePlanKey } from "@/lib/billing-gates";
import { getPlanLabel } from "@/lib/billing-gates";
import { formatDateTimeLabel } from "@/lib/risk-check-presenters";
import type { SavedDealSummary } from "@/lib/saved-deals";
import { getWorkspaceLaunchpadAction } from "@/lib/workspace-launchpad";

type WorkspaceLaunchpadProps = {
  workspaceName: string;
  planKey: ScopePlanKey | null | undefined;
  deals: SavedDealSummary[];
};

function getLatestTouchedLabel(deals: SavedDealSummary[]) {
  if (deals.length === 0) {
    return "No briefs yet";
  }

  return formatDateTimeLabel(deals[0].lastTouchedAt);
}

export function WorkspaceLaunchpad({
  workspaceName,
  planKey,
  deals,
}: WorkspaceLaunchpadProps) {
  const planLabel = getPlanLabel(planKey);
  const action = getWorkspaceLaunchpadAction(deals);
  const recentDeals = deals.slice(0, 3);

  return (
    <section className="section-shell grid gap-8 py-12 md:py-[4.5rem]">
      <div className="grid gap-5">
        <div className="status-chip w-fit border-sky-400/30 bg-sky-400/10 text-slate-900">
          <span className="size-2 rounded-full bg-sky-500" />
          Signed-in workspace launchpad
        </div>

        <div className="grid gap-3">
          <span className="eyebrow">Welcome back</span>
          <h1
            className="m-0 text-4xl font-semibold tracking-[-0.05em] text-slate-950 md:text-6xl"
            style={{ fontFamily: "var(--font-display)" }}
          >
            {workspaceName}
          </h1>
          <p className="m-0 max-w-3xl text-base leading-7 text-slate-700 md:text-lg">
            Your {planLabel} workspace keeps the brief, review, and proposal flow in one place.
            Continue the latest deal or start a new Scope Risk Check when another brief lands.
          </p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="glass-panel rounded-3xl p-5">
          <div className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
            Saved deals
          </div>
          <div className="mt-3 text-4xl font-semibold text-white">{deals.length}</div>
          <div className="mt-2 text-sm leading-6 text-slate-300">
            Intake, review, and proposal history lives here for the active workspace.
          </div>
        </div>

        <div className="glass-panel rounded-3xl p-5">
          <div className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
            Latest touch
          </div>
          <div className="mt-3 text-xl font-semibold text-white">
            {getLatestTouchedLabel(deals)}
          </div>
          <div className="mt-2 text-sm leading-6 text-slate-300">
            Recent activity is kept visible so the founder always knows what changed last.
          </div>
        </div>

        <div className="glass-panel rounded-3xl p-5">
          <div className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
            Next step
          </div>
          <div className="mt-3 text-xl font-semibold text-white">{action.label}</div>
          <div className="mt-2 text-sm leading-6 text-slate-300">{action.description}</div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
        <div className="rounded-[2rem] border border-white/10 bg-white/6 p-6 md:p-7">
          <div className="grid gap-4">
            <div className="grid gap-2">
              <span className="eyebrow">Next best action</span>
              <h2
                className="m-0 text-3xl font-semibold text-white"
                style={{ fontFamily: "var(--font-display)" }}
              >
                {deals.length === 0
                  ? "Seed the workspace with a real brief."
                  : "Continue the deal that matters right now."}
              </h2>
              <p className="m-0 max-w-2xl text-sm leading-7 text-slate-300">
                {deals.length === 0
                  ? "The fastest way to validate the workflow is to paste one messy website brief, then review the extracted scope before pricing."
                  : "The launchpad keeps the latest deal close so you can move from intake to review to proposal without hunting for IDs."}
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <Link href={action.href} className="btn btn-large btn-primary">
                {action.label}
              </Link>
              <Link href="/deals" className="btn btn-large btn-secondary">
                View saved deals
              </Link>
              <Link href="/analytics" className="btn btn-large btn-secondary">
                Open analytics
              </Link>
              <Link href="/feedback" className="btn btn-large btn-secondary">
                Pilot feedback
              </Link>
            </div>

            {deals.length === 0 ? (
              <div className="grid gap-3 rounded-3xl border border-sky-300/15 bg-sky-400/8 px-5 py-5 text-sm leading-7 text-sky-50">
                <strong className="block text-base text-white">Suggested first run</strong>
                <ul className="m-0 grid gap-2 pl-5">
                  <li>Paste a transcript, brief, or Loom summary.</li>
                  <li>Review missing scope and risk flags in extraction review.</li>
                  <li>Generate the proposal pack and save the result.</li>
                </ul>
              </div>
            ) : null}
          </div>
        </div>

        <div className="grid gap-4">
          <div className="rounded-[2rem] border border-white/10 bg-slate-950/55 p-6 md:p-7">
            <div className="grid gap-3">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <span className="eyebrow">Recent deals</span>
                  <h2
                    className="m-0 mt-2 text-2xl font-semibold text-white"
                    style={{ fontFamily: "var(--font-display)" }}
                  >
                    Keep the last 3 deals close.
                  </h2>
                </div>
                <Link href="/deals" className="text-sm font-semibold text-sky-200 hover:text-white">
                  Open all
                </Link>
              </div>

              {recentDeals.length === 0 ? (
                <div className="rounded-3xl border border-dashed border-white/15 bg-white/4 px-5 py-6 text-sm leading-7 text-slate-300">
                  No saved deals yet. Your first brief will appear here after intake.
                </div>
              ) : (
                <div className="grid gap-3">
                  {recentDeals.map((deal) => {
                    const href = (
                      deal.hasSavedProposalPack
                        ? `/proposal-pack/${deal.submissionId}`
                        : deal.hasSavedReview
                          ? `/proposal-pack/${deal.submissionId}`
                          : `/extraction-review/${deal.submissionId}`
                    ) as Route;
                    const label = deal.hasSavedProposalPack
                      ? "Reopen proposal draft"
                      : deal.hasSavedReview
                        ? "Continue to proposal pack"
                        : "Open extraction review";

                    return (
                      <article
                        key={deal.submissionId}
                        className="rounded-3xl border border-white/10 bg-white/4 px-5 py-5"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-3">
                          <div className="grid gap-1">
                            <div className="text-base font-semibold text-white">
                              {deal.agencyName}
                            </div>
                          </div>
                          <span className="text-xs text-slate-400">
                            {formatDateTimeLabel(deal.lastTouchedAt)}
                          </span>
                        </div>

                        <div className="mt-3 flex flex-wrap gap-2 text-xs font-medium uppercase tracking-[0.16em] text-slate-400">
                          <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5">
                            {deal.currentStageLabel}
                          </span>
                          <span
                            className={`rounded-full border px-3 py-1.5 ${
                              deal.hasAttachment
                                ? "border-amber-300/30 bg-amber-300/10 text-amber-100"
                                : "border-white/10 bg-white/5 text-slate-400"
                            }`}
                          >
                            {deal.hasAttachment
                              ? deal.attachmentLabel ?? "Client materials saved"
                              : "No attachment"}
                          </span>
                        </div>

                        <p className="m-0 mt-3 text-sm leading-7 text-slate-300">
                          {deal.summaryPreview}
                        </p>

                        <div className="mt-4 flex flex-wrap gap-3">
                          <Link href={href} className="btn btn-small btn-primary">
                            {label}
                          </Link>
                          <Link
                            href={`/extraction-review/${deal.submissionId}` as Route}
                            className="btn btn-small btn-secondary"
                          >
                            Extraction review
                          </Link>
                          {deal.hasAttachment ? (
                            <a
                              href={`/api/deals/${deal.submissionId}/attachment`}
                              className="btn btn-small btn-secondary"
                            >
                              Download materials
                            </a>
                          ) : null}
                        </div>
                      </article>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          <div className="rounded-[2rem] border border-amber-300/20 bg-amber-300/8 px-6 py-6 text-sm leading-7 text-amber-50">
            <strong className="block text-base text-white">GA polish focus</strong>
            This workspace view is the first step toward a fuller command center: better onboarding,
            clearer empty states, and stronger verification so real users can trust the flow.
          </div>
        </div>
      </div>
    </section>
  );
}
