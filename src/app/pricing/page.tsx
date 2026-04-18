import Link from "next/link";
import { BillingActions } from "@/components/billing-actions";
import { PlanCheckoutButton } from "@/components/plan-checkout-button";
import { SiteHeader } from "@/components/site-header";
import { getCurrentWorkspaceContextOrNull } from "@/lib/auth/server";
import { getPlanLabel } from "@/lib/billing-gates";
import { canUseStripeBilling } from "@/lib/stripe";

export const dynamic = "force-dynamic";

const plans = [
  {
    key: "free" as const,
    name: "Free",
    price: "$0",
    cadence: "for one live deal",
    description: "Best for founders validating whether ScopeOS catches real scope gaps.",
    features: [
      "Authenticated workspace in your own MongoDB stack",
      "1 free Scope Risk Check",
      "Extraction review + proposal draft editing",
      "Copy full pack + markdown export",
    ],
    ctaLabel: "Get started",
  },
  {
    key: "solo" as const,
    name: "Solo",
    price: "$39",
    cadence: "/ month",
    description: "Best for a single founder or account lead running recurring website proposals.",
    features: [
      "Everything in Free",
      "Saved deal history",
      "Branded export (HTML + print-to-PDF)",
      "Analytics dashboard",
    ],
    ctaLabel: "Upgrade to Solo",
  },
  {
    key: "team" as const,
    name: "Team",
    price: "$99",
    cadence: "/ month",
    description: "Best for small agencies standardizing proposal quality across multiple users.",
    features: [
      "Everything in Solo",
      "Team billing plan",
      "Shared workspace deal history",
      "Concierge-friendly export + analytics operations",
    ],
    ctaLabel: "Join as Team",
  },
] as const;

export default async function PricingPage() {
  const authContext = await getCurrentWorkspaceContextOrNull();
  const currentPlanKey = authContext?.workspace?.planKey ?? "free";
  const currentPlanLabel = getPlanLabel(currentPlanKey);
  const billingReady = canUseStripeBilling();

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,rgba(69,137,255,0.14),transparent_24%),linear-gradient(180deg,#eef4fb_0%,#f8fbff_40%,#eef3fa_100%)] text-slate-950">
      <SiteHeader
        ctaHref={authContext?.user ? "/account" : "/auth/sign-in"}
        ctaLabel={authContext?.user ? "Open account" : "Sign in"}
      />

      <section className="section-shell grid gap-8 py-12 md:py-[4.5rem]">
        <div className="grid gap-4">
          <div className="status-chip w-fit border-sky-400/30 bg-sky-400/10 text-slate-900">
            <span className="size-2 rounded-full bg-sky-500" />
            ScopeOS pricing
          </div>

          <div className="grid gap-3">
            <span className="eyebrow">Monetization</span>
            <h1
              className="m-0 text-4xl font-semibold tracking-[-0.05em] text-slate-950 md:text-6xl"
              style={{ fontFamily: "var(--font-display)" }}
            >
              Start with one free risk check, then pay when repeat usage is real.
            </h1>
            <p className="m-0 max-w-3xl text-base leading-7 text-slate-700 md:text-lg">
              ScopeOS keeps the wedge narrow: small web design agencies pricing SMB website redesigns.
              Paid plans unlock history, branded export, and analytics once the workflow proves value.
            </p>
          </div>

          {authContext?.workspace ? (
            <div className="rounded-[1.75rem] border border-slate-200 bg-white px-5 py-5 text-sm leading-7 text-slate-700 shadow-sm flex items-center justify-between">
              <div>
                <strong className="block text-base text-slate-950">Current workspace plan</strong>
                {authContext.workspace.name} is currently on the <strong>{currentPlanLabel}</strong> plan.
              </div>
              {authContext.workspace.stripeCustomerId && (
                <div className="hidden md:block">
                  <BillingActions canManageBilling={true} />
                </div>
              )}
            </div>
          ) : null}

          {!billingReady ? (
            <div className="rounded-[1.75rem] border border-amber-200 bg-amber-50 px-5 py-5 text-sm leading-7 text-amber-950 shadow-sm">
              <strong className="block text-base">Stripe billing is not configured yet.</strong>
              Add the Stripe secret and monthly price IDs before checkout can go live.
            </div>
          ) : null}
        </div>

        <div className="grid gap-5 lg:grid-cols-3">
          {plans.map((plan) => (
            <article
              key={plan.name}
              className={`grid gap-5 rounded-[2rem] border p-6 shadow-sm flex flex-col ${
                plan.name === "Solo"
                  ? "border-sky-300 bg-sky-50 shadow-sky-100"
                  : "border-slate-200 bg-white"
              }`}
            >
              <div className="grid gap-2">
                <div className="text-sm font-semibold uppercase tracking-[0.16em] text-slate-500">
                  {plan.name}
                </div>
                <div className="flex items-end gap-2">
                  <span className="text-4xl font-semibold text-slate-950">{plan.price}</span>
                  <span className="pb-1 text-sm text-slate-500">{plan.cadence}</span>
                </div>
                <p className="m-0 text-sm leading-7 text-slate-600">{plan.description}</p>
              </div>

              <ul className="m-0 grid gap-3 pl-5 text-sm leading-6 text-slate-700 flex-grow">
                {plan.features.map((feature) => (
                  <li key={feature}>{feature}</li>
                ))}
              </ul>

              <div className="mt-4 pt-4 border-t border-slate-100">
                {authContext?.user ? (
                  plan.key === "free" ? (
                    <Link
                      href="/risk-check"
                      className="btn btn-outline w-full"
                    >
                      {currentPlanKey === "free" ? "Using free plan" : "Go to dashboard"}
                    </Link>
                  ) : (
                    <PlanCheckoutButton
                      planKey={plan.key}
                      label={plan.ctaLabel}
                      isCurrent={currentPlanKey === plan.key}
                      className="w-full"
                    />
                  )
                ) : (
                  <Link
                    href="/auth/sign-in"
                    className="btn btn-dark w-full"
                  >
                    Sign in to select
                  </Link>
                )}
              </div>
            </article>
          ))}
        </div>

        <div className="grid gap-5 rounded-[2rem] border border-slate-200 bg-white px-6 py-6 shadow-sm md:px-8">
          <div className="grid gap-2 text-center md:text-left">
            <div className="text-sm font-semibold uppercase tracking-[0.16em] text-slate-500">
              Need help choosing?
            </div>
            <p className="m-0 text-sm leading-7 text-slate-700">
              If you are unsure which plan fits your agency, start with Free. You can upgrade any time from your account settings.
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}



