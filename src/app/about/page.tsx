import type { Metadata } from "next";
import { PublicFooterLinks, PublicPageShell } from "@/components/public-page-shell";
import { getSiteUrl } from "@/lib/site";

export const metadata: Metadata = {
  title: "About ScopeOS | Built for safer website scoping",
  description: "Why ScopeOS focuses on margin protection for small web design agencies.",
  alternates: { canonical: getSiteUrl("/about") },
};

const notes = [
  [
    "Why narrow?",
    "Small web agencies do not need another generic writing surface. They need a repeatable way to see what can hurt margin.",
  ],
  [
    "Why now?",
    "Clients expect fast proposals, but the risky parts of a website brief are often hidden in migration, content, revisions, integrations, and timelines.",
  ],
  [
    "How we build",
    "ScopeOS stays practical: modular monolith, MongoDB, Stripe, operational visibility, and visible assumptions over magical black boxes.",
  ],
] as const;

export default function AboutPage() {
  return (
    <>
      <PublicPageShell
        eyebrow="Founder note"
        title="Built for the expensive moment before a proposal is sent."
        description="ScopeOS focuses on one painful agency workflow: turning incomplete website briefs into safer scope, assumptions, exclusions, and change-order boundaries before pricing goes out."
      >
        <div className="grid gap-6 md:grid-cols-3">
          {notes.map(([heading, body]) => (
            <article
              key={heading}
              className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm"
            >
              <h2 className="m-0 text-xl font-semibold text-slate-950">{heading}</h2>
              <p className="m-0 mt-3 text-sm leading-7 text-slate-700">{body}</p>
            </article>
          ))}
        </div>
      </PublicPageShell>
      <PublicFooterLinks />
    </>
  );
}
