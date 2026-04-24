import Link from "next/link";
import type { Metadata } from "next";
import { ResetPasswordForm } from "@/components/reset-password-form";
import { SiteHeader } from "@/components/site-header";

export const metadata: Metadata = {
  title: "Reset password",
  robots: { index: false, follow: false },
};

type ResetPasswordPageProps = {
  searchParams?:
    | { token?: string }
    | Promise<{ token?: string }>;
};

export default async function ResetPasswordPage({ searchParams }: ResetPasswordPageProps) {
  const resolvedSearchParams = await searchParams;
  const token = resolvedSearchParams?.token ?? "";

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,rgba(69,137,255,0.14),transparent_24%),linear-gradient(180deg,#eef4fb_0%,#f8fbff_40%,#eef3fa_100%)] text-slate-950">
      <SiteHeader ctaHref="/auth/sign-in" ctaLabel="Sign in" />
      <section className="section-shell grid max-w-3xl gap-6 py-12 md:py-[4.5rem]">
        <div className="grid gap-3">
          <span className="eyebrow">Account recovery</span>
          <h1
            className="m-0 text-4xl font-semibold tracking-[-0.05em] text-slate-950 md:text-6xl"
            style={{ fontFamily: "var(--font-display)" }}
          >
            Choose a new password.
          </h1>
          <p className="m-0 text-sm leading-7 text-slate-700">
            Reset links expire and can only be used once.
          </p>
        </div>
        {token ? (
          <ResetPasswordForm token={token} />
        ) : (
          <div className="rounded-[2rem] border border-rose-200 bg-rose-50 p-6 text-sm leading-7 text-rose-900">
            This reset link is missing a token. Request a new password reset.
          </div>
        )}
        <Link href="/auth/forgot-password" className="text-sm font-semibold text-sky-700 underline underline-offset-4">
          Request a new reset link
        </Link>
      </section>
    </main>
  );
}
