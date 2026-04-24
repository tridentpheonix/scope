import type { Metadata } from "next";
import { PublicFooterLinks, PublicPageShell } from "@/components/public-page-shell";
import { legalUpdatedLabel } from "@/lib/marketing-content";
import { getSiteUrl } from "@/lib/site";

export const metadata: Metadata = {
  title: "Terms of Service | ScopeOS",
  description: "ScopeOS pilot terms for website proposal scoping workflows.",
  alternates: { canonical: getSiteUrl("/terms") },
};

const sections = [
  [
    "Use of ScopeOS",
    "ScopeOS helps agencies review website briefs, draft assumptions, and prepare proposal language. You remain responsible for final pricing, client commitments, and legal review.",
  ],
  [
    "Accounts",
    "Keep your login secure. Team members should use their own accounts. You are responsible for activity in your workspace.",
  ],
  [
    "Billing",
    "Paid plans are handled through Stripe. Subscription state shown inside ScopeOS depends on Stripe webhook delivery and may be corrected if provider state differs.",
  ],
  [
    "AI and output quality",
    "Generated or assisted output can be wrong or incomplete. Review every proposal, exclusion, and change-order statement before sending it to a client.",
  ],
  [
    "Pilot availability",
    "ScopeOS is an early-stage product and may change quickly. We aim to keep data safe and workflows reliable, but beta features can change.",
  ],
] as const;

export default function TermsPage() {
  return (
    <>
      <PublicPageShell
        eyebrow="Terms"
        title="Terms of service."
        description={`Last updated ${legalUpdatedLabel}. These terms keep the early ScopeOS pilot clear: use it as a scoping assistant, not as legal, financial, or final pricing advice.`}
      >
        <div className="grid gap-5 rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm md:p-8">
          {sections.map(([heading, body]) => (
            <section key={heading} className="grid gap-2">
              <h2 className="m-0 text-xl font-semibold text-slate-950">{heading}</h2>
              <p className="m-0 text-sm leading-7 text-slate-700">{body}</p>
            </section>
          ))}
        </div>
      </PublicPageShell>
      <PublicFooterLinks />
    </>
  );
}
