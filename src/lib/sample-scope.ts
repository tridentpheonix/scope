import { analyzeRiskCheckSubmission } from "./risk-check-analysis";
import type { RiskCheckInput } from "./risk-check-schema";
import type { SavedSubmission } from "./risk-check-storage";

export const sampleBriefs = [
  {
    id: "saas-redesign",
    title: "B2B SaaS marketing redesign",
    agencyName: "Northstar Web Studio",
    projectType: "marketing-redesign",
    briefSource: "call-notes",
    websiteUrl: "https://example-saas.test",
    summary:
      "Client wants a sharper marketing website for an upcoming product launch in six weeks. They mentioned a homepage, product pages, pricing, about, contact, and a resources section. The existing WordPress site has around 80 blog posts and they want the useful ones migrated, but they have not decided who will audit content or own redirects. They also want HubSpot forms, a newsletter embed, and analytics cleaned up. Copy exists in different docs, but the founder said the agency can 'tighten it up as needed'. Stakeholders include founder, marketing lead, and sales. They want two concept directions and revisions until leadership is comfortable.",
  },
  {
    id: "local-services",
    title: "Local services brochure refresh",
    agencyName: "Cedar & Co Studio",
    projectType: "brochure-site",
    briefSource: "client-brief",
    websiteUrl: "https://example-local.test",
    summary:
      "Client runs a local home services company and wants a modern five to ten page brochure website. They want stronger trust signals, service pages, team photos, reviews, and better contact forms. They are not sure whether they will provide copy or ask the agency to rewrite service descriptions. Photography may come later. They asked for a fast turnaround before a seasonal campaign and said the exact service areas can be finalized after kickoff. They also want help deciding whether to keep their current CMS or move to Webflow.",
  },
  {
    id: "webflow-build",
    title: "Webflow build from rough Figma direction",
    agencyName: "Launchline Creative",
    projectType: "webflow-build",
    briefSource: "loom-summary",
    websiteUrl: "https://example-webflow.test",
    summary:
      "Client has a rough Figma direction and wants the agency to turn it into a polished Webflow site. The sitemap includes homepage, features, integrations, pricing, blog, careers, and landing page templates. They mentioned CMS collections for blog, jobs, authors, and integrations. There is no final responsive design yet. They want forms routed to their CRM and would like post-launch training. They also asked whether small copy changes can be handled during build because the messaging is still being refined.",
  },
] satisfies Array<{
  id: string;
  title: string;
  agencyName: string;
  projectType: RiskCheckInput["projectType"];
  briefSource: RiskCheckInput["briefSource"];
  websiteUrl: string;
  summary: string;
}>;

export function createSampleInput(sample: (typeof sampleBriefs)[number]): RiskCheckInput {
  return {
    name: "Sample Agency Owner",
    email: "sample@scopeos.com",
    agencyName: sample.agencyName,
    websiteUrl: sample.websiteUrl,
    projectType: sample.projectType,
    briefSource: sample.briefSource,
    summary: sample.summary,
    consent: true,
  };
}

export function createSampleSubmission(sample = sampleBriefs[0]): SavedSubmission {
  const payload = createSampleInput(sample);
  return {
    id: `sample-${sample.id}`,
    createdAt: "2026-04-24T00:00:00.000Z",
    payload,
    attachment: null,
    analysis: analyzeRiskCheckSubmission(payload),
  };
}
