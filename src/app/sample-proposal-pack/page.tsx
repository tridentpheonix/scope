import Link from "next/link";
import type { Metadata } from "next";
import { PublicFooterLinks, PublicPageShell } from "@/components/public-page-shell";
import { createProposalPackDraft } from "@/lib/proposal-pack";
import { createSampleSubmission, sampleBriefs } from "@/lib/sample-scope";
import { getSiteUrl } from "@/lib/site";

export const metadata: Metadata = {
  title: "Sample proposal pack | ScopeOS",
  description: "A public read-only sample showing ScopeOS assumptions, exclusions, pricing posture, and change-order language.",
  alternates: { canonical: getSiteUrl("/sample-proposal-pack") },
};

export default function SampleProposalPackPage() {
  const draft = createProposalPackDraft(createSampleSubmission(sampleBriefs[0]));

  return (
    <>
      <PublicPageShell
        eyebrow="Sample output"
        title="A proposal pack that makes assumptions visible."
        description="This sample is read-only and generated from example source material. It shows the kind of proposal-ready structure ScopeOS creates after risk review."
      >
        <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm md:p-8">
          <div className="mb-6 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm leading-7 text-amber-950">
            Sample only. Review every output before sending anything to a real client.
          </div>
          <h2 className="m-0 text-3xl font-semibold text-slate-950">{draft.title}</h2>
          <p className="m-0 mt-2 text-sm leading-7 text-slate-600">{draft.subtitle}</p>
          <div className="mt-8 grid gap-5">
            {draft.blocks.map((block) => (
              <section key={block.id} className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-5">
                <h3 className="m-0 text-xl font-semibold text-slate-950">{block.title}</h3>
                <div className="mt-3 whitespace-pre-wrap text-sm leading-7 text-slate-700">
                  {block.body}
                </div>
              </section>
            ))}
          </div>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/risk-check" className="btn btn-dark">
              Run this on your own brief
            </Link>
            <Link href="/pricing" className="btn btn-outline bg-white">
              View paid plans
            </Link>
          </div>
        </div>
      </PublicPageShell>
      <PublicFooterLinks />
    </>
  );
}
