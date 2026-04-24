import Link from "next/link";
import type { Metadata } from "next";
import { ForgotPasswordForm } from "@/components/forgot-password-form";
import { SiteHeader } from "@/components/site-header";

export const metadata: Metadata = {
  title: "Forgot password",
  robots: { index: false, follow: false },
};

export default function ForgotPasswordPage() {
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
            Reset your password.
          </h1>
          <p className="m-0 text-sm leading-7 text-slate-700">
            Enter your account email. If it exists, ScopeOS will send a secure reset link.
          </p>
        </div>
        <ForgotPasswordForm />
        <Link href="/auth/sign-in" className="text-sm font-semibold text-sky-700 underline underline-offset-4">
          Back to sign in
        </Link>
      </section>
    </main>
  );
}
