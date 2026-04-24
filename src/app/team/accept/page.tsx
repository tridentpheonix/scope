import Link from "next/link";
import type { Metadata } from "next";
import { AcceptInvitationForm } from "@/components/accept-invitation-form";
import { SiteHeader } from "@/components/site-header";
import { getCurrentUser } from "@/lib/auth/server";

export const metadata: Metadata = {
  title: "Accept workspace invite",
  robots: { index: false, follow: false },
};

type AcceptInvitePageProps = {
  searchParams?: { token?: string } | Promise<{ token?: string }>;
};

export default async function AcceptInvitePage({ searchParams }: AcceptInvitePageProps) {
  const user = await getCurrentUser();
  const resolvedSearchParams = await searchParams;
  const token = resolvedSearchParams?.token ?? "";

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,rgba(69,137,255,0.14),transparent_24%),linear-gradient(180deg,#eef4fb_0%,#f8fbff_40%,#eef3fa_100%)] text-slate-950">
      <SiteHeader ctaHref="/auth/sign-in" ctaLabel="Sign in" />
      <section className="section-shell grid max-w-3xl gap-6 py-12 md:py-[4.5rem]">
        <div className="grid gap-3">
          <span className="eyebrow">Team invite</span>
          <h1 className="m-0 text-4xl font-semibold tracking-[-0.05em] text-slate-950 md:text-6xl" style={{ fontFamily: "var(--font-display)" }}>
            Join a ScopeOS workspace.
          </h1>
        </div>
        {!token ? (
          <div className="rounded-[2rem] border border-rose-200 bg-rose-50 p-6 text-sm leading-7 text-rose-900">
            This invite link is missing a token.
          </div>
        ) : user ? (
          <AcceptInvitationForm token={token} />
        ) : (
          <div className="rounded-[2rem] border border-amber-200 bg-amber-50 p-6 text-sm leading-7 text-amber-950">
            Sign in or create an account with the invited email, then reopen this invite link.
          </div>
        )}
        <Link href="/auth/sign-in" className="text-sm font-semibold text-sky-700 underline underline-offset-4">
          Sign in to continue
        </Link>
      </section>
    </main>
  );
}
