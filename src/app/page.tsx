import Link from "next/link";
import type { Metadata } from "next";
import { SiteHeader } from "@/components/site-header";
import { WorkspaceLaunchpad } from "@/components/workspace-launchpad";
import { getCurrentWorkspaceContextOrNull } from "@/lib/auth/server";
import { readSavedDealSummaries } from "@/lib/saved-deals";
import { getSiteUrl, siteConfig } from "@/lib/site";

const painPoints = [
  "You waste 2–6 hours turning call notes into a proposal draft.",
  "The client brief feels finished, but critical scope assumptions still live in your head.",
  "You only discover vague revisions, CMS migration gaps, or content ambiguity after pricing is already shared.",
];

const steps = [
  {
    title: "Paste the messy source material",
    body: "Start with call notes, transcripts, Loom summaries, or the client’s rough brief — not a perfect intake form.",
  },
  {
    title: "Surface scope gaps before pricing",
    body: "ScopeOS highlights missing details, risky assumptions, and questions that matter for margin protection.",
  },
  {
    title: "Move toward a cleaner proposal pack",
    body: "The end state is a reviewed scope that can become pricing tiers, SOW language, exclusions, and change-order protection.",
  },
];

const differentiators = [
  "Built for small web design agencies, not generic AI copywriting.",
  "Focuses on margin protection, not just prettier proposals.",
  "Manual-first early workflow so founders keep review control.",
  "Designed around brochure and marketing website redesigns, where fixed-fee scoping risk is highest.",
];

const faqs = [
  {
    question: "Who is ScopeOS for right now?",
    answer:
      "The first release is built for small web design agencies and freelancers selling SMB brochure or marketing website redesign projects.",
  },
  {
    question: "What do I get from the free Scope Risk Check?",
    answer:
      "A founder-reviewed read on the biggest scope gaps, hidden delivery risks, and questions you should answer before sharing pricing.",
  },
  {
    question: "Is this replacing my proposal tool?",
    answer:
      "Not in the first release. ScopeOS is focused on upstream scoping clarity, so you can still send the final proposal through your current workflow.",
  },
];

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "ScopeOS | Stop losing margin to messy website briefs",
  description:
    "ScopeOS helps small web design agencies catch scope gaps, vague assumptions, and pricing risk before sending fixed-fee website proposals.",
  alternates: {
    canonical: getSiteUrl("/"),
  },
  openGraph: {
    title: "ScopeOS | Stop losing margin to messy website briefs",
    description: siteConfig.description,
    url: getSiteUrl("/"),
  },
};

export default async function HomePage() {
  const authContext = await getCurrentWorkspaceContextOrNull();
  const deals = authContext?.workspace?.id
    ? await readSavedDealSummaries(undefined, authContext.workspace.id)
    : [];

  if (authContext?.user) {
    return (
      <main>
        <SiteHeader />
        <WorkspaceLaunchpad
          workspaceName={authContext.workspace?.name ?? "Your ScopeOS workspace"}
          planKey={authContext.workspace?.planKey}
          deals={deals}
        />
      </main>
    );
  }

  return (
    <main>
      <SiteHeader />

      <section className="section-shell grid gap-12 py-[4.5rem] md:grid-cols-[1.1fr_0.9fr] md:py-28">
        <div className="grid gap-8">
          <div className="status-chip w-fit">
            <span className="size-2 rounded-full bg-[var(--accent)]" />
            Manual-first Scope Risk Checks for live website deals
          </div>

          <div className="grid gap-6">
            <div className="section-heading">
              <span className="eyebrow">ScopeOS</span>
              <h1
                className="m-0 max-w-4xl text-5xl font-semibold tracking-[-0.05em] text-white md:text-7xl"
                style={{ fontFamily: "var(--font-display)" }}
              >
                Stop losing margin to messy website briefs and vague scope.
              </h1>
              <p className="m-0 max-w-2xl text-lg leading-8 text-slate-300 md:text-xl">
                Turn a client brief, call transcript, or Loom summary into a safer scoping
                workflow — starting with a free Scope Risk Check built for small web design
                agencies.
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <Link
                href="/risk-check"
                className="btn btn-large btn-primary"
              >
                Get a free Scope Risk Check
              </Link>
              <Link
                href="#how-it-works"
                className="btn btn-large btn-secondary"
              >
                See how the workflow works
              </Link>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            {[
              ["2+ hours", "claimed time saved per proposal"],
              ["1 painful miss", "can pay for months of usage"],
              ["1 niche", "SMB website redesigns only"],
            ].map(([value, label]) => (
              <div key={label} className="glass-panel rounded-3xl p-5">
                <div className="text-3xl font-semibold text-white">{value}</div>
                <div className="mt-2 text-sm leading-6 text-slate-300">{label}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="glass-panel rounded-[2rem] p-6 md:p-7">
          <div className="grid gap-6">
            <div>
              <p className="eyebrow">What happens in the first release</p>
              <h2
                className="m-0 text-3xl font-semibold text-white"
                style={{ fontFamily: "var(--font-display)" }}
              >
                Brief in. Scope risk out.
              </h2>
            </div>

            <div className="grid gap-4">
              {steps.map((step, index) => (
                <div
                  key={step.title}
                  className="rounded-3xl border border-white/10 bg-white/4 px-5 py-5"
                >
                  <div className="mb-2 text-sm font-semibold text-sky-200">Step 0{index + 1}</div>
                  <div className="text-lg font-semibold text-white">{step.title}</div>
                  <p className="m-0 mt-2 text-sm leading-6 text-slate-300">{step.body}</p>
                </div>
              ))}
            </div>

            <div className="rounded-3xl border border-amber-300/20 bg-amber-300/8 px-5 py-4 text-sm leading-6 text-amber-50">
              <strong className="block text-base">Founding offer</strong>
              Send one real brief and get a founder-reviewed Scope Risk Check while the product is
              still in manual-first build mode.
            </div>
          </div>
        </div>
      </section>

      <section id="problem" className="section-shell py-8 md:py-[4.5rem]">
        <div className="section-heading">
          <span className="eyebrow">The problem</span>
          <h2
            className="m-0 text-3xl font-semibold text-white md:text-5xl"
            style={{ fontFamily: "var(--font-display)" }}
          >
            Scope creep starts before the contract is even signed.
          </h2>
          <p className="m-0 text-lg leading-8 text-slate-300">
            Small web design agencies are already using AI, but still doing the dangerous part
            manually: deciding what is missing, what is implied, and what should be excluded before
            fixed-fee pricing goes out.
          </p>
        </div>

        <div className="mt-10 grid gap-4 md:grid-cols-3">
          {painPoints.map((item) => (
            <div key={item} className="glass-panel rounded-3xl px-5 py-6">
              <p className="m-0 text-base leading-7 text-slate-100">{item}</p>
            </div>
          ))}
        </div>
      </section>

      <section id="how-it-works" className="section-shell py-8 md:py-[4.5rem]">
        <div className="grid gap-10 rounded-[2rem] border border-white/10 bg-white/5 px-6 py-8 md:grid-cols-[0.8fr_1.2fr] md:px-10 md:py-10">
          <div className="section-heading">
            <span className="eyebrow">Why ScopeOS wins</span>
            <h2
              className="m-0 text-3xl font-semibold text-white md:text-4xl"
              style={{ fontFamily: "var(--font-display)" }}
            >
              It is built to protect margin, not just write prettier proposal copy.
            </h2>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {differentiators.map((item) => (
              <div key={item} className="rounded-3xl border border-white/10 bg-slate-950/55 px-5 py-5">
                <p className="m-0 text-sm leading-7 text-slate-200">{item}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="offer" className="section-shell py-8 md:py-[4.5rem]">
        <div className="rounded-[2rem] bg-slate-50 px-6 py-8 text-slate-950 md:px-10 md:py-10">
          <div className="grid gap-8 md:grid-cols-[1fr_0.8fr] md:items-end">
            <div className="grid gap-4">
              <span className="eyebrow">Founding offer</span>
              <h2
                className="m-0 text-3xl font-semibold tracking-[-0.04em] text-slate-950 md:text-5xl"
                style={{ fontFamily: "var(--font-display)" }}
              >
                Submit one real website brief and get a free Scope Risk Check.
              </h2>
              <p className="m-0 max-w-2xl text-base leading-7 text-slate-700 md:text-lg">
                This is the smallest useful first step: validate real scoping pain, review what a
                founder would actually need to ask before pricing, and turn the best patterns into
                the product workflow.
              </p>
            </div>

            <div className="grid gap-3 rounded-[1.75rem] border border-slate-200 bg-white p-5 shadow-sm">
              <div className="text-sm font-semibold text-slate-500">You submit</div>
              <div className="text-base font-medium text-slate-900">
                Transcript, brief, call notes, or Loom summary
              </div>
              <div className="text-sm font-semibold text-slate-500">You get back</div>
              <div className="text-base font-medium text-slate-900">
                Risk flags, missing-info prompts, and a clearer path to a safe proposal pack
              </div>
              <Link
                href="/risk-check"
                className="btn btn-large btn-dark mt-3"
              >
                Start the Scope Risk Check
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="section-shell py-8 md:py-[4.5rem]">
        <div className="section-heading">
          <span className="eyebrow">FAQ</span>
          <h2
            className="m-0 text-3xl font-semibold text-white md:text-4xl"
            style={{ fontFamily: "var(--font-display)" }}
          >
            Questions founders usually ask before sending a brief.
          </h2>
        </div>

        <div className="mt-10 grid gap-4">
          {faqs.map((faq) => (
            <div key={faq.question} className="glass-panel rounded-3xl px-5 py-5">
              <div className="text-lg font-semibold text-white">{faq.question}</div>
              <p className="m-0 mt-2 text-sm leading-7 text-slate-300">{faq.answer}</p>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
