import { RiskCheckForm } from "@/components/risk-check-form";
import { SiteHeader } from "@/components/site-header";

export const dynamic = "force-dynamic";

const checklist = [
  "Content ownership and migration responsibility",
  "CMS / platform assumptions",
  "Page count, templates, and custom functionality",
  "Revision boundaries and timeline pressure",
];

export default function RiskCheckPage() {
  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,rgba(69,137,255,0.10),transparent_24%),linear-gradient(180deg,#eef4fb_0%,#f8fbff_40%,#eef3fa_100%)] text-slate-950">
      <SiteHeader compact />

      <section className="section-shell grid gap-10 py-12 md:grid-cols-[0.75fr_1.25fr] md:py-[4.5rem]">
        <div className="grid gap-6">
          <div className="status-chip w-fit border-sky-400/30 bg-sky-400/10 text-slate-900">
            <span className="size-2 rounded-full bg-sky-500" />
            Early concierge intake
          </div>

          <div className="grid gap-4">
            <span className="eyebrow">Free Scope Risk Check</span>
            <h1
              className="m-0 text-4xl font-semibold tracking-[-0.05em] text-slate-950 md:text-6xl"
              style={{ fontFamily: "var(--font-display)" }}
            >
              Submit one real website brief.
            </h1>
            <p className="m-0 text-lg leading-8 text-slate-700">
              This flow captures enough detail to start the ScopeOS wedge: brochure and marketing
              website redesign projects where pricing risk is real and scoping quality matters.
            </p>
          </div>

          <div className="light-panel grid gap-4 rounded-[1.75rem] p-5">
            <div className="text-sm font-semibold uppercase tracking-[0.16em] text-slate-500">
              What we are checking for
            </div>
            <ul className="m-0 grid gap-3 pl-5 text-sm leading-6 text-slate-700">
              {checklist.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>

          <div className="rounded-[1.75rem] border border-slate-200 bg-white px-5 py-5 text-sm leading-7 text-slate-700 shadow-sm">
            <strong className="block text-base text-slate-950">First-release note</strong>
            ScopeOS is still in manual-first build mode. This page collects real briefs so the
            product can be shaped around actual agency scoping pain before the full proposal-pack
            engine is automated.
          </div>
        </div>

        <div className="light-panel rounded-[2rem] p-6 md:p-8">
          <div className="mb-6 grid gap-3">
            <h2
              className="m-0 text-2xl font-semibold text-slate-950 md:text-3xl"
              style={{ fontFamily: "var(--font-display)" }}
            >
              Tell us about the deal
            </h2>
            <p className="m-0 text-sm leading-7 text-slate-600">
              Paste the clearest version of the brief you have. ScopeOS is looking for signals that
              usually break fixed-fee website pricing later.
            </p>
          </div>
          <RiskCheckForm />
        </div>
      </section>
    </main>
  );
}
