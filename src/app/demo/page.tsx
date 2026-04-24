import type { Metadata } from "next";
import { PublicFooterLinks, PublicPageShell } from "@/components/public-page-shell";
import { SampleDemo } from "@/components/sample-demo";
import { getSiteUrl } from "@/lib/site";

export const metadata: Metadata = {
  title: "Interactive ScopeOS demo | Website scope risk examples",
  description: "Switch between sample website briefs and see the scope risks ScopeOS surfaces before pricing.",
  alternates: { canonical: getSiteUrl("/demo") },
};

export default function DemoPage() {
  return (
    <>
      <PublicPageShell
        eyebrow="Interactive demo"
        title="See what ScopeOS catches before pricing."
        description="Explore sample website briefs and watch how ScopeOS turns messy source material into risk flags, pricing questions, and a safer proposal posture."
      >
        <SampleDemo />
      </PublicPageShell>
      <PublicFooterLinks />
    </>
  );
}
