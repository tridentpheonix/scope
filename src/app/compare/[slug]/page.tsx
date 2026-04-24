import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { PublicFooterLinks, PublicPageShell } from "@/components/public-page-shell";
import { comparisons } from "@/lib/marketing-content";
import { getSiteUrl } from "@/lib/site";

type PageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const comparison = comparisons.find((item) => item.slug === slug);
  if (!comparison) {
    return {};
  }

  return {
    title: `${comparison.title} | ScopeOS`,
    description: comparison.summary,
    alternates: { canonical: getSiteUrl(`/compare/${comparison.slug}`) },
  };
}

export function generateStaticParams() {
  return comparisons.map((comparison) => ({ slug: comparison.slug }));
}

export default async function ComparisonPage({ params }: PageProps) {
  const { slug } = await params;
  const comparison = comparisons.find((item) => item.slug === slug);

  if (!comparison) {
    notFound();
  }

  return (
    <>
      <PublicPageShell
        eyebrow="Comparison"
        title={comparison.title}
        description={comparison.summary}
      >
        <div className="grid gap-6 lg:grid-cols-2">
          <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="m-0 text-2xl font-semibold text-slate-950">Use ScopeOS when...</h2>
            <ul className="mt-4 grid gap-3 p-0">
              {comparison.bestForScopeOS.map((item) => (
                <li key={item} className="list-none rounded-2xl border border-sky-100 bg-sky-50 px-4 py-3 text-sm leading-7 text-sky-950">
                  {item}
                </li>
              ))}
            </ul>
          </section>
          <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="m-0 text-2xl font-semibold text-slate-950">Use the alternative when...</h2>
            <ul className="mt-4 grid gap-3 p-0">
              {comparison.bestForAlternative.map((item) => (
                <li key={item} className="list-none rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm leading-7 text-slate-700">
                  {item}
                </li>
              ))}
            </ul>
          </section>
        </div>
      </PublicPageShell>
      <PublicFooterLinks />
    </>
  );
}
