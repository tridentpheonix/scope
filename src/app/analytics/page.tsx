import Link from "next/link";
import type { Metadata } from "next";
import { ExportBlockerForm } from "@/components/export-blocker-form";
import { SiteHeader } from "@/components/site-header";
import { getCurrentWorkspaceContext } from "@/lib/auth/server";
import { canAccessAnalytics } from "@/lib/billing-gates";
import { readAnalyticsDashboard } from "@/lib/analytics-storage";
import { formatDateTimeLabel } from "@/lib/risk-check-presenters";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Analytics",
  robots: {
    index: false,
    follow: false,
  },
};

export default async function AnalyticsPage() {
  const authContext = await getCurrentWorkspaceContext();
  const planKey = authContext.workspace?.planKey;
  const hasAnalyticsAccess = canAccessAnalytics(planKey);

  if (!hasAnalyticsAccess) {
    return (
      <main className="min-h-screen bg-[radial-gradient(circle_at_top,rgba(69,137,255,0.14),transparent_24%),linear-gradient(180deg,#eef4fb_0%,#f8fbff_40%,#eef3fa_100%)] text-slate-950">
        <SiteHeader compact ctaHref="/pricing" ctaLabel="Upgrade workspace" />

        <section className="section-shell grid gap-8 py-12 md:py-[4.5rem]">
          <div className="grid gap-4">
            <div className="status-chip w-fit border-sky-400/30 bg-sky-400/10 text-slate-900">
              <span className="size-2 rounded-full bg-sky-500" />
              Analytics dashboard
            </div>
            <div className="grid gap-3">
              <span className="eyebrow">Usage signals</span>
              <h1
                className="m-0 text-4xl font-semibold tracking-[-0.05em] text-slate-950 md:text-6xl"
                style={{ fontFamily: "var(--font-display)" }}
              >
                Track usage across your workspace.
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
                Analytics is a paid workspace feature.
              </h2>
              <p className="m-0 max-w-2xl text-sm leading-7 text-slate-600 md:text-base">
                Upgrade the workspace to track proposal-pack usage, surface export blockers, and
                understand what the team is doing across live deals.
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


  const dashboard = await readAnalyticsDashboard(undefined, authContext.workspace?.id, 25, 5);
  const summary = dashboard.summary;
  const exportBlockers = dashboard.exportBlockers.recentSignals;
  const eventNames = Object.keys(summary.countsByName).sort((left, right) =>
    summary.countsByName[right] - summary.countsByName[left],
  );

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,rgba(69,137,255,0.14),transparent_24%),linear-gradient(180deg,#eef4fb_0%,#f8fbff_40%,#eef3fa_100%)] text-slate-950">
      <SiteHeader compact ctaHref="/risk-check" ctaLabel="New Scope Risk Check" />

      <section className="section-shell grid gap-8 py-12 md:py-[4.5rem]">
        <div className="grid gap-4">
          <div className="status-chip w-fit border-sky-400/30 bg-sky-400/10 text-slate-900">
            <span className="size-2 rounded-full bg-sky-500" />
            Analytics dashboard
          </div>
          <div className="grid gap-3">
            <span className="eyebrow">Usage signals</span>
            <h1
              className="m-0 text-4xl font-semibold tracking-[-0.05em] text-slate-950 md:text-6xl"
              style={{ fontFamily: "var(--font-display)" }}
            >
              Proposal-pack usage in one place.
            </h1>
            <p className="m-0 max-w-3xl text-base leading-7 text-slate-700 md:text-lg">
              This view summarizes how founders are using the proposal pack flow: opens, saves,
              copies, and downloads. It is intentionally minimal for the concierge phase.
            </p>
          </div>
        </div>

        {summary.totalEvents === 0 ? (
          <div className="grid gap-6 rounded-[2rem] border border-slate-200 bg-white px-6 py-8 shadow-sm md:px-8 md:py-10">
            <div className="grid gap-3">
              <span className="eyebrow">No analytics yet</span>
              <h2
                className="m-0 text-3xl font-semibold tracking-[-0.04em] text-slate-950"
                style={{ fontFamily: "var(--font-display)" }}
              >
                Use the proposal pack to generate the first events.
              </h2>
              <p className="m-0 max-w-2xl text-sm leading-7 text-slate-600 md:text-base">
                Events are created when a proposal pack is opened, saved, copied, or downloaded.
                Once you run a brief, this dashboard will show activity counts and recent actions.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <Link
                href="/risk-check"
                className="inline-flex min-h-11 items-center justify-center rounded-full bg-slate-950 px-5 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:bg-slate-800"
              >
                Start a Scope Risk Check
              </Link>
              <Link
                href="/deals"
                className="inline-flex min-h-11 items-center justify-center rounded-full border border-slate-300 bg-white px-5 text-sm font-semibold text-slate-900 transition hover:-translate-y-0.5 hover:border-slate-400"
              >
                View saved deals
              </Link>
            </div>
          </div>
        ) : (
          <div className="grid gap-6">
            <div className="grid gap-4 rounded-[2rem] border border-slate-200 bg-white px-6 py-6 shadow-sm md:grid-cols-3 md:px-8">
              <div className="grid gap-2">
                <div className="text-sm font-semibold uppercase tracking-[0.16em] text-slate-500">
                  Total events
                </div>
                <div className="text-3xl font-semibold text-slate-950">
                  {summary.totalEvents}
                </div>
              </div>
              <div className="grid gap-2">
                <div className="text-sm font-semibold uppercase tracking-[0.16em] text-slate-500">
                  Unique actions
                </div>
                <div className="text-3xl font-semibold text-slate-950">
                  {eventNames.length}
                </div>
              </div>
              <div className="grid gap-2">
                <div className="text-sm font-semibold uppercase tracking-[0.16em] text-slate-500">
                  Most recent
                </div>
                <div className="text-lg font-semibold text-slate-950">
                  {formatDateTimeLabel(summary.recentEvents[0]?.createdAt ?? "")}
                </div>
              </div>
            </div>

            <div className="grid gap-4 rounded-[2rem] border border-slate-200 bg-white px-6 py-6 shadow-sm md:px-8">
              <div className="text-sm font-semibold uppercase tracking-[0.16em] text-slate-500">
                Event counts
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                {eventNames.map((name) => (
                  <div
                    key={name}
                    className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700"
                  >
                    <span className="font-semibold text-slate-900">{name}</span>
                    <span>{summary.countsByName[name]}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid gap-4 rounded-[2rem] border border-slate-200 bg-white px-6 py-6 shadow-sm md:px-8">
              <div className="text-sm font-semibold uppercase tracking-[0.16em] text-slate-500">
                Recent activity
              </div>
              <div className="grid gap-3">
                {summary.recentEvents.map((event) => (
                  <div
                    key={`${event.createdAt}-${event.name}-${event.submissionId ?? "none"}`}
                    className="grid gap-1 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700"
                  >
                    <div className="flex flex-wrap items-center gap-2 text-sm font-semibold text-slate-900">
                      {event.name}
                      {event.submissionId ? (
                        <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs text-slate-600">
                          {event.submissionId}
                        </span>
                      ) : null}
                    </div>
                    <div className="text-xs text-slate-500">
                      {formatDateTimeLabel(event.createdAt)}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid gap-5 rounded-[2rem] border border-slate-200 bg-white px-6 py-6 shadow-sm md:px-8">
              <div className="grid gap-2">
                <div className="text-sm font-semibold uppercase tracking-[0.16em] text-slate-500">
                  Branded export feedback
                </div>
                <p className="m-0 text-sm leading-6 text-slate-700">
                  Branded export is now available. Capture feedback on whether it reduces
                  send-time friction or still needs more polish.
                </p>
              </div>

              <div className="grid gap-4 md:grid-cols-[1.1fr_0.9fr]">
                <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 text-sm text-slate-700">
                  <div className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                    Signals logged
                  </div>
                  <div className="mt-2 text-2xl font-semibold text-slate-950">
                    {dashboard.exportBlockers.totalSignals}
                  </div>
                  <div className="mt-2 text-xs text-slate-500">
                    Last updated {exportBlockers[0] ? formatDateTimeLabel(exportBlockers[0].createdAt) : "—"}
                  </div>
                </div>

                <ExportBlockerForm />
              </div>

              {exportBlockers.length > 0 ? (
                <div className="grid gap-3">
                  {exportBlockers
                    .slice()
                    .sort((left, right) => Date.parse(right.createdAt) - Date.parse(left.createdAt))
                    .slice(0, 5)
                    .map((signal) => (
                      <div
                        key={`${signal.createdAt}-${signal.note}`}
                        className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700"
                      >
                        <div className="text-xs text-slate-500">
                          {formatDateTimeLabel(signal.createdAt)}
                        </div>
                        <div className="mt-2 flex flex-wrap gap-2 text-xs text-slate-500">
                          {signal.outcome ? (
                            <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1">
                              Outcome: {signal.outcome.replace("-", " ")}
                            </span>
                          ) : null}
                          {signal.themePreference ? (
                            <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1">
                              Theme: {signal.themePreference}
                            </span>
                          ) : null}
                        </div>
                        <p className="m-0 mt-1 text-sm leading-6 text-slate-900">
                          {signal.note}
                        </p>
                        {signal.nextStep ? (
                          <p className="m-0 mt-2 text-xs text-slate-500">
                            Next step: {signal.nextStep}
                          </p>
                        ) : null}
                      </div>
                    ))}
                </div>
              ) : null}
            </div>
          </div>
        )}
      </section>
    </main>
  );
}

