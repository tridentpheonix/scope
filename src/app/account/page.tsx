import Link from "next/link";
import { BillingActions } from "@/components/billing-actions";
import { SignOutButton } from "@/components/sign-out-button";
import { SiteHeader } from "@/components/site-header";
import { getCurrentWorkspaceContext } from "@/lib/auth/server";
import { getPlanLabel, isPaidPlan } from "@/lib/billing-gates";
import { canUseStripeBilling } from "@/lib/stripe";

export const dynamic = "force-dynamic";

export default async function AccountPage() {
  const authContext = await getCurrentWorkspaceContext();
  const workspace = authContext.workspace;
  const currentPlan = getPlanLabel(workspace?.planKey);
  const isPaid = isPaidPlan(workspace?.planKey);

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,rgba(69,137,255,0.14),transparent_24%),linear-gradient(180deg,#eef4fb_0%,#f8fbff_40%,#eef3fa_100%)] text-slate-950">
      <SiteHeader compact ctaHref="/risk-check" ctaLabel="New Scope Risk Check" />

      <section className="section-shell grid gap-8 py-12 md:py-[4.5rem]">
        <div className="grid gap-4">
          <div className="status-chip w-fit border-sky-400/30 bg-sky-400/10 text-slate-900">
            <span className="size-2 rounded-full bg-sky-500" />
            Workspace account
          </div>

          <div className="grid gap-3">
            <span className="eyebrow">Authentication + billing</span>
            <h1
              className="m-0 text-4xl font-semibold tracking-[-0.05em] text-slate-950 md:text-6xl"
              style={{ fontFamily: "var(--font-display)" }}
            >
              Manage your ScopeOS workspace.
            </h1>
            <p className="m-0 max-w-3xl text-base leading-7 text-slate-700 md:text-lg">
              This page is the control surface for plan state and account access. Manage your subscription, view saved deals, or sign out.
            </p>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="grid gap-5 rounded-[2rem] border border-slate-200 bg-white px-6 py-6 shadow-sm md:px-8">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
                <div className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                  Workspace
                </div>
                <div className="mt-2 text-lg font-semibold text-slate-950">
                  {workspace?.name ?? "Workspace not initialized"}
                </div>
                <div className="mt-1 text-sm text-slate-600">{authContext.user.email}</div>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
                <div className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                  Current plan
                </div>
                <div className="mt-2 text-lg font-semibold text-slate-950">{currentPlan}</div>
                <div className="mt-1 text-sm text-slate-600">
                  Status: {workspace?.subscriptionStatus ?? "none"}
                </div>
              </div>
            </div>

            <div className={`rounded-[1.75rem] border px-5 py-5 text-sm leading-7 ${isPaid ? 'border-sky-200 bg-sky-50 text-sky-900' : 'border-slate-200 bg-white text-slate-700'}`}>
              <strong className="block text-base text-slate-950">
                {isPaid ? "Paid workspace benefits" : "Free workspace limits"}
              </strong>
              {isPaid
                ? "Your workspace has full access to saved history, branded export, and the analytics dashboard."
                : "Free workspaces are limited to 1 live deal. Upgrade to unlock saved deal history and branded exports."}
            </div>

            <div className="pt-4 border-t border-slate-100">
              <div className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500 mb-4">
                Billing management
              </div>
              {canUseStripeBilling() ? (
                <div className="grid gap-4">
                  <BillingActions canManageBilling={Boolean(workspace?.stripeCustomerId)} />
                  {!isPaid && (
                   <Link 
                     href="/pricing"
                     className="text-sm font-semibold text-sky-600 hover:text-sky-700 underline underline-offset-4"
                   >
                     Compare all plans &rarr;
                   </Link>
                  )}
                </div>
              ) : (
                <div className="rounded-[1.75rem] border border-amber-200 bg-amber-50 px-5 py-5 text-sm leading-7 text-amber-950">
                  <strong className="block text-base">Stripe billing is not configured yet.</strong>
                  Add the Stripe secret and monthly price IDs to enable subscription payments.
                </div>
              )}
            </div>
          </div>

          <div className="grid gap-5">
            <div className="rounded-[2rem] border border-slate-200 bg-white px-6 py-6 shadow-sm">
              <div className="grid gap-4">
                <div>
                  <div className="text-sm font-semibold uppercase tracking-[0.16em] text-slate-500">
                    Workspace shortcuts
                  </div>
                  <h2
                    className="m-0 mt-2 text-2xl font-semibold text-slate-950"
                    style={{ fontFamily: "var(--font-display)" }}
                  >
                    Quick access.
                  </h2>
                </div>

                <div className="flex flex-wrap gap-3">
                  <Link
                    href="/risk-check"
                    className="btn btn-dark"
                  >
                    New Scope Risk Check
                  </Link>
                  <Link
                    href="/deals"
                    className="btn btn-outline"
                  >
                    Saved deals
                  </Link>
                  <Link
                    href="/analytics"
                    className="btn btn-outline"
                  >
                    Analytics
                  </Link>
                  <Link
                    href="/feedback"
                    className="btn btn-outline"
                  >
                    Pilot feedback
                  </Link>
                </div>
              </div>
            </div>

            <div className="rounded-[2rem] border border-slate-200 bg-white px-6 py-6 shadow-sm">
              <div className="grid gap-4">
                <div className="text-sm font-semibold uppercase tracking-[0.16em] text-slate-500">
                  Account security
                </div>
                <p className="m-0 text-sm leading-7 text-slate-700">
                  Signed in as <strong>{authContext.user.email}</strong>.
                </p>
                <SignOutButton />
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}



