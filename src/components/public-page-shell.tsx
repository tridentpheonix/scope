import Link from "next/link";
import { SiteHeader } from "@/components/site-header";

export function PublicPageShell({
  eyebrow,
  title,
  description,
  children,
}: {
  eyebrow: string;
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,rgba(69,137,255,0.16),transparent_28%),linear-gradient(180deg,#f3f8ff_0%,#ffffff_46%,#eef4fb_100%)] text-slate-950">
      <SiteHeader />
      <section className="section-shell grid gap-10 py-14 md:py-20">
        <div className="grid max-w-4xl gap-5">
          <div className="status-chip w-fit border-sky-300/50 bg-white/70 text-slate-900">
            <span className="size-2 rounded-full bg-sky-500" />
            {eyebrow}
          </div>
          <h1
            className="m-0 text-4xl font-semibold tracking-[-0.05em] text-slate-950 md:text-6xl"
            style={{ fontFamily: "var(--font-display)" }}
          >
            {title}
          </h1>
          <p className="m-0 max-w-3xl text-base leading-8 text-slate-700 md:text-lg">
            {description}
          </p>
          <div className="flex flex-wrap gap-3 pt-2">
            <Link href="/demo" className="btn btn-dark">
              See sample demo
            </Link>
            <Link href="/risk-check" className="btn btn-outline bg-white">
              Run your own brief
            </Link>
          </div>
        </div>
        {children}
      </section>
    </main>
  );
}

export function PublicFooterLinks() {
  return (
    <div className="section-shell flex flex-wrap gap-4 border-t border-slate-200 py-8 text-sm text-slate-600">
      <Link href="/privacy" className="hover:text-slate-950">
        Privacy
      </Link>
      <Link href="/terms" className="hover:text-slate-950">
        Terms
      </Link>
      <Link href="/about" className="hover:text-slate-950">
        About
      </Link>
      <Link href="/support" className="hover:text-slate-950">
        Support
      </Link>
    </div>
  );
}
