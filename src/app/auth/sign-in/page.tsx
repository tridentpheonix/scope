import { redirect } from "next/navigation";
import { AuthPanel } from "@/components/auth-panel";
import { SiteHeader } from "@/components/site-header";
import { getCurrentUser } from "@/lib/auth/server";
import { isNeonAuthConfigured } from "@/lib/env";

export const dynamic = "force-dynamic";

export default async function SignInPage() {
  const user = await getCurrentUser();

  if (user) {
    redirect("/risk-check");
  }

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,rgba(69,137,255,0.14),transparent_24%),linear-gradient(180deg,#eef4fb_0%,#f8fbff_40%,#eef3fa_100%)] text-slate-950">
      <SiteHeader ctaHref="/pricing" ctaLabel="View pricing" />

      <section className="section-shell grid gap-8 py-12 md:py-[4.5rem]">
        {isNeonAuthConfigured() ? (
          <AuthPanel />
        ) : (
          <div className="rounded-[2rem] border border-amber-200 bg-amber-50 p-6 text-sm leading-7 text-amber-950 shadow-sm md:p-8">
            <strong className="block text-base">Authentication is not configured yet.</strong>
            <p className="m-0 mt-1">
              To enable sign-up and sign-in, you must add the <code>NEON_AUTH_BASE_URL</code> and <code>NEON_AUTH_COOKIE_SECRET</code> to your <code>.env</code> file.
            </p>
            <p className="mt-4">
              1. Open your <strong>Neon Console</strong> &gt; <strong>Auth</strong>.<br />
              2. Copy the <strong>Auth URL</strong> and paste it into <code>NEON_AUTH_BASE_URL</code>.<br />
              3. Generate a random string (e.g., using <code>openssl rand -base64 32</code>) for <code>NEON_AUTH_COOKIE_SECRET</code>.
            </p>
          </div>
        )}
      </section>
    </main>
  );
}
