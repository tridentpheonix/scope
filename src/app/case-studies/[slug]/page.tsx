import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { PublicFooterLinks, PublicPageShell } from "@/components/public-page-shell";
import { caseStudies } from "@/lib/marketing-content";
import { getSiteUrl } from "@/lib/site";

type PageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const study = caseStudies.find((item) => item.slug === slug);
  if (!study) {
    return {};
  }

  return {
    title: `${study.title} | ScopeOS`,
    description: study.summary,
    alternates: { canonical: getSiteUrl(`/case-studies/${study.slug}`) },
  };
}

export function generateStaticParams() {
  return caseStudies.map((study) => ({ slug: study.slug }));
}

export default async function CaseStudyPage({ params }: PageProps) {
  const { slug } = await params;
  const study = caseStudies.find((item) => item.slug === slug);

  if (!study) {
    notFound();
  }

  return (
    <>
      <PublicPageShell
        eyebrow={study.label}
        title={study.title}
        description={study.summary}
      >
        <div className="grid gap-6 lg:grid-cols-2">
          <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
            <p className="eyebrow">Likely risk</p>
            <div className="mt-4 grid gap-3">
              {study.risks.map((risk) => (
                <div key={risk} className="rounded-2xl border border-rose-100 bg-rose-50 px-4 py-3 text-sm leading-7 text-rose-950">
                  {risk}
                </div>
              ))}
            </div>
          </section>
          <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
            <p className="eyebrow">ScopeOS move</p>
            <div className="mt-4 grid gap-3">
              {study.scopeMoves.map((move) => (
                <div key={move} className="rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm leading-7 text-emerald-950">
                  {move}
                </div>
              ))}
            </div>
          </section>
        </div>
      </PublicPageShell>
      <PublicFooterLinks />
    </>
  );
}
