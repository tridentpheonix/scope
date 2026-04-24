import Link from "next/link";
import type { Metadata } from "next";
import { SiteHeader } from "@/components/site-header";
import { getCurrentWorkspaceContextOrNull } from "@/lib/auth/server";
import { getSiteUrl } from "@/lib/site";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Support",
  description:
    "Get ScopeOS pilot support for sign-in, billing, feedback, and manual account recovery during early production use.",
  alternates: {
    canonical: getSiteUrl("/support"),
  },
  openGraph: {
    title: "ScopeOS support",
    description: "Support routing for ScopeOS sign-in, billing, and product feedback.",
    url: getSiteUrl("/support"),
  },
};

const supportPaths = [
  {
    title: "I cannot sign in",
    body: "Retry with Google sign-in first. If email/password is blocked by rate limiting, wait for the retry window instead of repeatedly submitting.",
    action: "Open sign-in",
    href: "/auth/sign-in",
  },
  {
    title: "I have a billing issue",
    body: "Open your account page to confirm the workspace plan, start checkout, or manage Stripe billing when a customer record exists.",
    action: "Open account",
    href: "/account",
  },
  {
    title: "I found a product bug",
    body: "Use the pilot feedback inbox with the exact page, what you tried, what you expected, and what happened instead.",
    action: "Record feedback",
    href: "/feedback",
  },
] as const;

export default async function SupportPage() {
  const authContext = await getCurrentWorkspaceContextOrNull();

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,rgba(69,137,255,0.14),transparent_24%),linear-gradient(180deg,#eef4fb_0%,#f8fbff_40%,#eef3fa_100%)] text-slate-950">
      <SiteHeader
        ctaHref={authContext?.user ? "/feedback" : "/auth/sign-in"}
        ctaLabel={authContext?.user ? "Record feedback" : "Sign in"}
      />

      <section className="section-shell grid gap-8 py-12 md:py-[4.5rem]">
        <div className="grid gap-4">
          <div className="status-chip w-fit border-sky-400/30 bg-sky-400/10 text-slate-900">
            <span className="size-2 rounded-full bg-sky-500" />
            Support path
          </div>

          <div className="grid gap-3">
            <span className="eyebrow">Pilot support</span>
            <h1
              className="m-0 text-4xl font-semibold tracking-[-0.05em] text-slate-950 md:text-6xl"
              style={{ fontFamily: "var(--font-display)" }}
            >
              Get unstuck fast during the ScopeOS pilot.
            </h1>
            <p className="m-0 max-w-3xl text-base leading-7 text-slate-700 md:text-lg">
              ScopeOS is in early production. Use this page to route login, billing, and product
              feedback to the right operational surface without guessing where to report it.
            </p>
          </div>
        </div>

        <div className="grid gap-5 lg:grid-cols-3">
          {supportPaths.map((item) => (
            <article
              key={item.title}
              className="flex flex-col justify-between gap-5 rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm"
            >
              <div className="grid gap-3">
                <h2
                  className="m-0 text-2xl font-semibold text-slate-950"
                  style={{ fontFamily: "var(--font-display)" }}
                >
                  {item.title}
                </h2>
                <p className="m-0 text-sm leading-7 text-slate-700">{item.body}</p>
              </div>
              <Link href={item.href} className="btn btn-dark w-fit">
                {item.action}
              </Link>
            </article>
          ))}
        </div>

        <div className="rounded-[2rem] border border-amber-200 bg-amber-50 px-6 py-6 text-sm leading-7 text-amber-950 shadow-sm">
          <strong className="block text-base text-slate-950">Manual recovery note</strong>
          Password reset email is intentionally not enabled yet. During the pilot, use Google
          sign-in when possible, or ask the operator to verify the account and perform a controlled
          manual recovery using the runbook.
        </div>
      </section>
    </main>
  );
}
