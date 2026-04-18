import type { Route } from "next";
import Link from "next/link";
import { getCurrentWorkspaceContextOrNull } from "@/lib/auth/server";
import { SignOutButtonInner } from "@/components/sign-out-button";

type SiteHeaderProps = {
  ctaHref?: Route;
  ctaLabel?: string;
  compact?: boolean;
};

export async function SiteHeader({
  ctaHref,
  ctaLabel,
  compact = false,
}: SiteHeaderProps) {
  const authContext = await getCurrentWorkspaceContextOrNull();
  const resolvedCtaHref = ctaHref ?? (authContext?.user ? "/risk-check" : "/auth/sign-in");
  const resolvedCtaLabel = ctaLabel ?? (authContext?.user ? "New Scope Risk Check" : "Sign in");

  return (
    <header
      className={`sticky top-0 z-50 border-b border-white/10 backdrop-blur-xl ${
        compact ? "bg-slate-950/85" : "bg-slate-950/70"
      }`}
    >
      <div className="section-shell flex min-h-[4.5rem] items-center justify-between gap-6 py-4">
        <Link href="/" className="flex flex-col">
          <span
            className="text-lg font-semibold text-white"
            style={{ fontFamily: "var(--font-display)" }}
          >
            ScopeOS
          </span>
          <span className="text-xs text-slate-400">
            proposal scoping for small web agencies
          </span>
        </Link>

        <nav className="hidden items-center gap-6 text-sm text-slate-300 md:flex">
          {compact ? (
            <>
              <Link href="/risk-check" className="transition hover:text-white">
                Risk check
              </Link>
              <Link href="/deals" className="transition hover:text-white">
                Saved deals
              </Link>
              <Link href="/analytics" className="transition hover:text-white">
                Analytics
              </Link>
              <Link href="/account" className="transition hover:text-white">
                Account
              </Link>
            </>
          ) : (
            <>
              <Link href="/#problem" className="transition hover:text-white">
                Problem
              </Link>
              <Link href="/#how-it-works" className="transition hover:text-white">
                How it works
              </Link>
              <Link href="/pricing" className="transition hover:text-white">
                Pricing
              </Link>
              {authContext?.user ? (
                <Link href="/account" className="transition hover:text-white">
                  Account
                </Link>
              ) : null}
            </>
          )}
        </nav>

        <div className="flex items-center gap-2">
          <Link
            href={resolvedCtaHref}
            className="btn btn-small border-sky-300/30 bg-sky-400/12 text-sky-100 hover:bg-sky-400/20"
          >
            {resolvedCtaLabel}
          </Link>
          {authContext?.user ? (
            <SignOutButtonInner
              label="Sign out"
              className="btn-small btn-ghost border-transparent text-slate-300 hover:text-white"
            />
          ) : null}
        </div>
      </div>
    </header>
  );
}

