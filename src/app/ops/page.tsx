import Link from "next/link";
import { OpsAlertTest } from "@/components/ops-alert-test";
import { SiteHeader } from "@/components/site-header";
import { getIncidentVisibilitySnapshot } from "@/lib/incident-visibility";
import { getCurrentOperatorContext } from "@/lib/operator-access";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "ScopeOS Ops",
  robots: {
    index: false,
    follow: false,
  },
};

function statusTone(ok: boolean) {
  return ok
    ? "border-emerald-200 bg-emerald-50 text-emerald-900"
    : "border-rose-200 bg-rose-50 text-rose-900";
}

function statusDot(ok: boolean) {
  return ok ? "bg-emerald-500" : "bg-rose-500";
}

export default async function OpsPage() {
  const authContext = await getCurrentOperatorContext();
  const snapshot = await getIncidentVisibilitySnapshot({ recentLimit: 8 });
  const { health, recentDiagnostics, recentStripeWebhookEvents } = snapshot;

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,rgba(69,137,255,0.14),transparent_24%),linear-gradient(180deg,#eef4fb_0%,#f8fbff_40%,#eef3fa_100%)] text-slate-950">
      <SiteHeader compact ctaHref="/account" ctaLabel="Workspace account" />

      <section className="section-shell grid gap-8 py-12 md:py-[4.5rem]">
        <div className="grid gap-4">
          <div className="status-chip w-fit border-sky-400/30 bg-sky-400/10 text-slate-900">
            <span className="size-2 rounded-full bg-sky-500" />
            Incident visibility
          </div>

          <div className="grid gap-3">
            <span className="eyebrow">Operations + health</span>
            <h1
              className="m-0 text-4xl font-semibold tracking-[-0.05em] text-slate-950 md:text-6xl"
              style={{ fontFamily: "var(--font-display)" }}
            >
              Live ops view for ScopeOS.
            </h1>
            <p className="m-0 max-w-3xl text-base leading-7 text-slate-700 md:text-lg">
              Use this dashboard to check readiness, confirm critical dependencies, and review recent warnings or errors without leaving the app.
            </p>
          </div>
        </div>

        <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
          <div className="grid gap-5 rounded-[2rem] border border-slate-200 bg-white px-6 py-6 shadow-sm md:px-8">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <div className="text-sm font-semibold uppercase tracking-[0.16em] text-slate-500">
                  Overall status
                </div>
                <h2
                  className="m-0 mt-2 text-2xl font-semibold text-slate-950"
                  style={{ fontFamily: "var(--font-display)" }}
                >
                  {health.status === "healthy" ? "All core checks are healthy." : "One or more core checks need attention."}
                </h2>
              </div>
              <div className={`status-chip ${statusTone(health.ok)}`}>
                <span className={`size-2 rounded-full ${statusDot(health.ok)}`} />
                {health.status}
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {[
                ["MongoDB", health.checks.mongo.configured && health.checks.mongo.ok, health.checks.mongo.ok ? `Latency ${health.checks.mongo.latencyMs ?? "?"}ms` : health.checks.mongo.error ?? "Not reachable"],
                ["Auth", health.checks.auth.configured && health.checks.auth.ok, health.checks.auth.ok ? "Sign-in ready" : "Auth is unavailable"],
                [
                  "Stripe",
                  health.checks.stripe.checkoutConfigured && health.checks.stripe.webhookConfigured,
                  health.checks.stripe.checkoutConfigured && health.checks.stripe.webhookConfigured
                    ? "Checkout + webhooks configured"
                    : health.checks.stripe.checkoutConfigured
                      ? "Checkout ready; webhook secret missing"
                      : "Billing env missing",
                ],
                ["Maintenance", health.checks.maintenance.configured, health.checks.maintenance.configured ? "Cron secret configured" : "Cron secret missing"],
                ["Observability", health.checks.observability.configured, health.checks.observability.configured ? "Webhook configured" : "Not configured"],
                ["Alerting", health.checks.alerting.configured, health.checks.alerting.configured ? "Critical alerts enabled" : "Not configured"],
                ["Operator access", health.checks.operatorAccess.configured, health.checks.operatorAccess.configured ? "Allowlist configured" : "No allowlist configured"],
              ].map(([label, ok, note]) => (
                <div key={String(label)} className={`rounded-[1.5rem] border px-4 py-4 ${statusTone(Boolean(ok))}`}>
                  <div className="text-xs font-semibold uppercase tracking-[0.16em] opacity-80">
                    {label}
                  </div>
                  <div className="mt-2 flex items-center gap-2 text-sm font-semibold">
                    <span className={`size-2 rounded-full ${statusDot(Boolean(ok))}`} />
                    {ok ? "Ready" : "Needs attention"}
                  </div>
                  <p className="m-0 mt-2 text-sm leading-6 opacity-90">{note}</p>
                </div>
              ))}
            </div>

            <div className="rounded-[1.75rem] border border-slate-200 bg-slate-50 px-5 py-5 text-sm leading-7 text-slate-700">
              <strong className="block text-base text-slate-950">Quick incident checks</strong>
              <ul className="mt-3 grid gap-2 pl-5">
                <li>
                  <Link href="/api/health" className="font-semibold text-sky-700 underline underline-offset-4">
                    Open the health JSON
                  </Link>
                </li>
                <li>Use the runbook to confirm backup/restore and webhook replay steps.</li>
                <li>Rotate secrets if a credential has been exposed or rotated recently.</li>
              </ul>
            </div>
          </div>

          <div className="grid gap-5">
            <div className="rounded-[2rem] border border-slate-200 bg-white px-6 py-6 shadow-sm">
              <div className="grid gap-4">
                <div>
                  <div className="text-sm font-semibold uppercase tracking-[0.16em] text-slate-500">
                    Operator context
                  </div>
                  <h2
                    className="m-0 mt-2 text-2xl font-semibold text-slate-950"
                    style={{ fontFamily: "var(--font-display)" }}
                  >
                    Current session.
                  </h2>
                </div>

                <div className="grid gap-3 rounded-[1.5rem] border border-slate-200 bg-slate-50 px-4 py-4 text-sm leading-7 text-slate-700">
                  <div>
                    Signed in as <strong className="text-slate-950">{authContext.user.email}</strong>.
                  </div>
                  <div>
                    Workspace: <strong className="text-slate-950">{authContext.workspace?.name ?? "uninitialized"}</strong>.
                  </div>
                </div>

                <div className="flex flex-wrap gap-3">
                  <Link href="/account" className="btn btn-dark">
                    Workspace account
                  </Link>
                  <Link href="/pricing" className="btn btn-outline">
                    Pricing
                  </Link>
                </div>
              </div>
            </div>

            <OpsAlertTest />

            <div className="rounded-[2rem] border border-slate-200 bg-white px-6 py-6 shadow-sm">
              <div className="grid gap-4">
                <div>
                  <div className="text-sm font-semibold uppercase tracking-[0.16em] text-slate-500">
                    Billing webhook ledger
                  </div>
                  <h2
                    className="m-0 mt-2 text-2xl font-semibold text-slate-950"
                    style={{ fontFamily: "var(--font-display)" }}
                  >
                    Recent Stripe event handling.
                  </h2>
                </div>

                {recentStripeWebhookEvents.length > 0 ? (
                  <div className="grid gap-3">
                    {recentStripeWebhookEvents.map((entry) => (
                      <article key={entry.id} className="rounded-[1.5rem] border border-slate-200 bg-slate-50 px-4 py-4">
                        <div className="flex flex-wrap items-center justify-between gap-3">
                          <div className="flex items-center gap-2 text-sm font-semibold text-slate-950">
                            <span
                              className={`size-2 rounded-full ${
                                entry.status === "processed"
                                  ? "bg-emerald-500"
                                  : entry.status === "failed"
                                    ? "bg-rose-500"
                                    : "bg-amber-500"
                              }`}
                            />
                            {entry.status.toUpperCase()}
                          </div>
                          <div className="text-xs text-slate-500">
                            Attempts: {entry.attemptCount}
                          </div>
                        </div>

                        <div className="mt-3 text-sm font-semibold text-slate-950">
                          {entry.eventType}
                        </div>
                        <div className="mt-2 break-all text-xs text-slate-500">
                          {entry.id}
                        </div>
                        <div className="mt-3 grid gap-1 text-xs text-slate-500">
                          <div>Last attempt: {new Date(entry.lastAttemptAt).toLocaleString()}</div>
                          {entry.processedAt ? <div>Processed: {new Date(entry.processedAt).toLocaleString()}</div> : null}
                          {entry.failedAt ? <div>Failed: {new Date(entry.failedAt).toLocaleString()}</div> : null}
                          {entry.lastError?.message ? <div>Error: {entry.lastError.message}</div> : null}
                        </div>
                      </article>
                    ))}
                  </div>
                ) : (
                  <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50 px-4 py-5 text-sm leading-7 text-slate-700">
                    No Stripe webhook events have been recorded yet. After checkout or a replay smoke, this panel should show processed events.
                  </div>
                )}
              </div>
            </div>

            <div className="rounded-[2rem] border border-slate-200 bg-white px-6 py-6 shadow-sm">
              <div className="grid gap-4">
                <div>
                  <div className="text-sm font-semibold uppercase tracking-[0.16em] text-slate-500">
                    Recent incidents
                  </div>
                  <h2
                    className="m-0 mt-2 text-2xl font-semibold text-slate-950"
                    style={{ fontFamily: "var(--font-display)" }}
                  >
                    Latest warnings and errors.
                  </h2>
                </div>

                {recentDiagnostics.length > 0 ? (
                  <div className="grid gap-3">
                    {recentDiagnostics.map((entry) => (
                      <article key={entry.id} className="rounded-[1.5rem] border border-slate-200 bg-slate-50 px-4 py-4">
                        <div className="flex flex-wrap items-center justify-between gap-3">
                          <div className="flex items-center gap-2 text-sm font-semibold text-slate-950">
                            <span className={`size-2 rounded-full ${entry.level === "error" ? "bg-rose-500" : "bg-amber-500"}`} />
                            {entry.level.toUpperCase()} · {entry.area}
                          </div>
                          <div className="text-xs text-slate-500">
                            {new Date(entry.at).toLocaleString()}
                          </div>
                        </div>

                        <div className="mt-3 text-sm font-semibold text-slate-950">
                          {entry.event}
                        </div>

                        {entry.message ? (
                          <p className="m-0 mt-2 text-sm leading-6 text-slate-700">
                            {entry.message}
                          </p>
                        ) : null}

                        <div className="mt-3 grid gap-1 text-xs text-slate-500">
                          {entry.route ? <div>Route: {entry.route}</div> : null}
                          {entry.workspaceId ? <div>Workspace: {entry.workspaceId}</div> : null}
                          {entry.submissionId ? <div>Submission: {entry.submissionId}</div> : null}
                        </div>
                      </article>
                    ))}
                  </div>
                ) : (
                  <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50 px-4 py-5 text-sm leading-7 text-slate-700">
                    No recent warnings or errors were found. That usually means the current release is quiet.
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
