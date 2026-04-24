import Link from "next/link";
import type { Metadata } from "next";
import { SiteHeader } from "@/components/site-header";
import { PilotFeedbackForm } from "@/components/pilot-feedback-form";
import { getCurrentWorkspaceContext } from "@/lib/auth/server";
import { formatDateTimeLabel } from "@/lib/risk-check-presenters";
import { readPilotFeedbackEntries } from "@/lib/pilot-feedback-storage";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Pilot feedback",
  robots: {
    index: false,
    follow: false,
  },
};

function getSeverityClass(severity: string) {
  switch (severity) {
    case "blocker":
      return "border-rose-300/30 bg-rose-300/10 text-rose-100";
    case "high":
      return "border-amber-300/30 bg-amber-300/10 text-amber-100";
    case "medium":
      return "border-sky-300/30 bg-sky-300/10 text-sky-100";
    default:
      return "border-white/10 bg-white/5 text-slate-300";
  }
}

export default async function FeedbackPage() {
  const authContext = await getCurrentWorkspaceContext();
  const workspaceId = authContext.workspace?.id;
  const feedbackItems = await readPilotFeedbackEntries(undefined, workspaceId, 5);

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,rgba(69,137,255,0.14),transparent_24%),linear-gradient(180deg,#eef4fb_0%,#f8fbff_40%,#eef3fa_100%)] text-slate-950">
      <SiteHeader compact ctaHref="/risk-check" ctaLabel="New Scope Risk Check" />

      <section className="section-shell grid gap-8 py-12 md:py-[4.5rem]">
        <div className="grid gap-4">
          <div className="status-chip w-fit border-sky-400/30 bg-sky-400/10 text-slate-900">
            <span className="size-2 rounded-full bg-sky-500" />
            Pilot feedback inbox
          </div>

          <div className="grid gap-3">
            <span className="eyebrow">Support workflow</span>
            <h1
              className="m-0 text-4xl font-semibold tracking-[-0.05em] text-slate-950 md:text-6xl"
              style={{ fontFamily: "var(--font-display)" }}
            >
              Capture real-user friction while the release is still warm.
            </h1>
            <p className="m-0 max-w-3xl text-base leading-7 text-slate-700 md:text-lg">
              Use this inbox when a pilot user hits a blocker, confusion point, or annoying rough edge.
              Every item is tagged for triage so the next fix is obvious.
            </p>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
          <PilotFeedbackForm />

          <div className="grid gap-5">
            <div className="rounded-[2rem] border border-slate-200 bg-white px-6 py-6 shadow-sm md:px-8">
              <div className="grid gap-4">
                <div>
                  <div className="text-sm font-semibold uppercase tracking-[0.16em] text-slate-500">
                    Recent feedback
                  </div>
                  <h2
                    className="m-0 mt-2 text-2xl font-semibold text-slate-950"
                    style={{ fontFamily: "var(--font-display)" }}
                  >
                    Keep the last few items in view.
                  </h2>
                </div>

                {feedbackItems.length === 0 ? (
                  <div className="rounded-3xl border border-dashed border-slate-200 bg-slate-50 px-5 py-6 text-sm leading-7 text-slate-600">
                    No pilot feedback has been recorded yet. The first item will appear here once a
                    pilot user reports friction.
                  </div>
                ) : (
                  <div className="grid gap-3">
                    {feedbackItems.map((item) => (
                      <article
                        key={item.id}
                        className="rounded-3xl border border-slate-200 bg-slate-50 px-5 py-5"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-3">
                          <div className="grid gap-1">
                            <div className="text-base font-semibold text-slate-950">
                              {item.whereHappened}
                            </div>
                            <div className="text-sm text-slate-600">
                              {item.bucket} · {item.reproducibility}
                            </div>
                          </div>
                          <div
                            className={`rounded-full border px-3 py-1.5 text-xs font-medium uppercase tracking-[0.16em] ${getSeverityClass(item.severity)}`}
                          >
                            {item.severity}
                          </div>
                        </div>

                        <div className="mt-3 grid gap-2 text-sm leading-7 text-slate-700">
                          <p className="m-0">
                            <strong className="text-slate-950">Tried:</strong> {item.triedToDo}
                          </p>
                          <p className="m-0">
                            <strong className="text-slate-950">Expected:</strong>{" "}
                            {item.expectedResult}
                          </p>
                          <p className="m-0">
                            <strong className="text-slate-950">Actual:</strong> {item.actualResult}
                          </p>
                          <p className="m-0">
                            <strong className="text-slate-950">Note:</strong> {item.note}
                          </p>
                        </div>

                        <div className="mt-3 text-xs text-slate-500">
                          {formatDateTimeLabel(item.createdAt)}
                          {item.submissionId ? ` · ${item.submissionId}` : ""}
                        </div>
                      </article>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="rounded-[2rem] border border-amber-300/20 bg-amber-300/8 px-6 py-6 text-sm leading-7 text-amber-950">
              <strong className="block text-base text-slate-950">How to use it</strong>
              Keep the report short, specific, and tied to a real user event. If you can link the
              deal or submission, do that too. If you need the account control surface, go back to
              the{" "}
              <Link href="/account" className="font-semibold underline underline-offset-4">
                account page
              </Link>
              .
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
