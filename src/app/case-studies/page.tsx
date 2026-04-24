import Link from "next/link";
import type { Metadata } from "next";
import { PublicFooterLinks, PublicPageShell } from "@/components/public-page-shell";
import { caseStudies } from "@/lib/marketing-content";
import { getSiteUrl } from "@/lib/site";

export const metadata: Metadata = {
  title: "Website scope teardown examples | ScopeOS",
  description: "Sample teardown pages showing how ScopeOS spots website proposal risk.",
  alternates: { canonical: getSiteUrl("/case-studies") },
};

export default function CaseStudiesPage() {
  return (
    <>
      <PublicPageShell
        eyebrow="Examples"
        title="Sample scope teardowns."
        description="These are honest sample/founder-analysis examples, not fake customer wins. They show the kind of scoping judgment ScopeOS helps agencies apply before pricing."
      >
        <div className="grid gap-5 md:grid-cols-2">
          {caseStudies.map((study) => (
            <Link
              key={study.slug}
              href={`/case-studies/${study.slug}`}
              className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
            >
              <div className="text-xs font-semibold uppercase tracking-[0.18em] text-sky-600">
                {study.label}
              </div>
              <h2 className="m-0 mt-3 text-2xl font-semibold text-slate-950">{study.title}</h2>
              <p className="m-0 mt-3 text-sm leading-7 text-slate-700">{study.summary}</p>
            </Link>
          ))}
        </div>
      </PublicPageShell>
      <PublicFooterLinks />
    </>
  );
}
