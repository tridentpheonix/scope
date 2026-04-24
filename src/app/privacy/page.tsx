import type { Metadata } from "next";
import { PublicFooterLinks, PublicPageShell } from "@/components/public-page-shell";
import { legalUpdatedLabel } from "@/lib/marketing-content";
import { getSiteUrl } from "@/lib/site";

export const metadata: Metadata = {
  title: "Privacy Policy | ScopeOS",
  description: "How ScopeOS handles account, brief, billing, and operational data.",
  alternates: { canonical: getSiteUrl("/privacy") },
};

const sections = [
  [
    "What we collect",
    "Account email/name, workspace data, website brief content you submit, proposal edits, billing identifiers from Stripe, and operational logs needed to keep the service safe.",
  ],
  [
    "How we use it",
    "To authenticate you, generate and save scope-risk outputs, manage billing, provide support, diagnose failures, and improve the product for small web agencies.",
  ],
  [
    "What not to submit",
    "Do not submit secrets, passwords, payment card data, or highly sensitive personal information inside client briefs.",
  ],
  [
    "Third-party processors",
    "ScopeOS currently uses MongoDB Atlas, Vercel, Stripe, Vercel Blob where configured, Google OAuth, Resend for transactional email, and optional AI providers for generation.",
  ],
  [
    "Deletion",
    "You can delete client materials from the app where deletion controls exist, or contact support for manual deletion during the pilot.",
  ],
] as const;

export default function PrivacyPage() {
  return (
    <>
      <PublicPageShell
        eyebrow="Privacy"
        title="Privacy policy."
        description={`Last updated ${legalUpdatedLabel}. This plain-English policy explains what ScopeOS collects, why it is used, and how pilot users can ask for deletion.`}
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
