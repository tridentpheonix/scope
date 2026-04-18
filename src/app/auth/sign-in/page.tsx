import { AuthPanel } from "@/components/auth-panel";
import { SiteHeader } from "@/components/site-header";
import { getCurrentUser } from "@/lib/auth/server";
import { isAuthConfigured } from "@/lib/env";

export const dynamic = "force-dynamic";

export default async function SignInPage() {
  const user = await getCurrentUser();

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,rgba(69,137,255,0.14),transparent_24%),linear-gradient(180deg,#eef4fb_0%,#f8fbff_40%,#eef3fa_100%)] text-slate-950">
      <SiteHeader ctaHref="/pricing" ctaLabel="View pricing" />

      <section className="section-shell grid gap-8 py-12 md:py-[4.5rem]">
        {user ? (
          <div className="rounded-[2rem] border border-sky-200 bg-white p-6 text-sm leading-7 text-slate-700 shadow-sm md:p-8">
            <strong className="block text-base text-slate-950">You are already signed in.</strong>
            <p className="m-0 mt-2">
              Continue to your workspace or billing settings. If this looks wrong, use the header sign-out action first and then sign in again.
            </p>
            <div className="mt-5 flex flex-col gap-3 sm:flex-row">
              <a href="/risk-check" className="btn btn-dark">
                Open workspace
              </a>
              <a href="/account" className="btn btn-outline">
                Open account
              </a>
            </div>
          </div>
        ) : isAuthConfigured() ? (
          <AuthPanel />
        ) : (
          <div className="rounded-[2rem] border border-amber-200 bg-amber-50 p-6 text-sm leading-7 text-amber-950 shadow-sm md:p-8">
            <strong className="block text-base">Authentication is not configured yet.</strong>
            <p className="m-0 mt-1">
              To enable sign-up and sign-in, you must add <code>MONGODB_URI</code> and <code>MONGODB_DB_NAME</code> to your <code>.env</code> file.
            </p>
            <p className="mt-4">
              1. Provision your own <strong>MongoDB</strong> database.<br />
              2. Paste the connection string into <code>MONGODB_URI</code>.<br />
              3. Set the database name in <code>MONGODB_DB_NAME</code>.
            </p>
          </div>
        )}
      </section>
    </main>
  );
}
