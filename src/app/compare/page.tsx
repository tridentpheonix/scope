import Link from "next/link";
import type { Metadata } from "next";
import { PublicFooterLinks, PublicPageShell } from "@/components/public-page-shell";
import { comparisons } from "@/lib/marketing-content";
import { getSiteUrl } from "@/lib/site";

export const metadata: Metadata = {
  title: "ScopeOS comparisons | Website proposal scoping",
  description: "Compare ScopeOS with general AI writing tools and proposal software.",
  alternates: { canonical: getSiteUrl("/compare") },
};

export default function ComparePage() {
  return (
    <>
      <PublicPageShell
        eyebrow="Compare"
        title="Where ScopeOS fits in your agency stack."
        description="ScopeOS does not try to replace every tool. It focuses on the dangerous pre-proposal stage where missing scope details become margin leaks."
      >
        <div className="grid gap-5 md:grid-cols-2">
          {comparisons.map((comparison) => (
            <Link
              key={comparison.slug}
              href={`/compare/${comparison.slug}`}
              className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
            >
              <h2 className="m-0 text-2xl font-semibold text-slate-950">{comparison.title}</h2>
              <p className="m-0 mt-3 text-sm leading-7 text-slate-700">{comparison.summary}</p>
            </Link>
          ))}
        </div>
      </PublicPageShell>
      <PublicFooterLinks />
    </>
  );
}
