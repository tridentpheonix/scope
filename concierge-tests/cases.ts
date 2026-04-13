export type ConciergeTestCase = {
  slug: string;
  title: string;
  attachmentFileName: string | null;
  expectedSignals: string[];
  form: {
    name: string;
    email: string;
    agencyName: string;
    websiteUrl: string;
    projectType:
      | "brochure-site"
      | "marketing-redesign"
      | "webflow-build"
      | "wordpress-redesign"
      | "other";
    briefSource:
      | "call-notes"
      | "transcript"
      | "client-brief"
      | "email-thread"
      | "loom-summary"
      | "other";
    summary: string;
    consent: "true";
  };
};

export const conciergeTestCases: ConciergeTestCase[] = [
  {
    slug: "industrial-b2b-marketing-redesign",
    title: "Industrial B2B marketing redesign with unclear copy and CRM scope",
    attachmentFileName: "01-industrial-b2b-marketing-redesign.txt",
    expectedSignals: [
      "copy ownership is not confirmed",
      "HubSpot form scope needs clarification",
      "CMS migration assumptions could affect pricing",
    ],
    form: {
      name: "Avery Chen",
      email: "avery@northlinestudio.com",
      agencyName: "Northline Studio",
      websiteUrl: "https://northlinestudio.com",
      projectType: "marketing-redesign",
      briefSource: "transcript",
      summary:
        "Client wants a seven-page marketing site redesign for an industrial parts distributor. The sales team wants stronger messaging, a cleaner case-study section, and better lead capture. They mentioned keeping the current blog if possible, maybe connecting HubSpot forms, and launching in six weeks. They have not confirmed who writes copy, who provides photography, or whether the current WordPress content needs migration or cleanup.",
      consent: "true",
    },
  },
  {
    slug: "law-firm-wordpress-redesign",
    title: "Law firm WordPress redesign with migration and ADA pressure",
    attachmentFileName: null,
    expectedSignals: [
      "blog migration effort is ambiguous",
      "SEO redirect responsibility needs confirmation",
      "ADA and intake form requirements may change delivery effort",
    ],
    form: {
      name: "Maya Patel",
      email: "maya@briefharbor.co",
      agencyName: "Brief Harbor",
      websiteUrl: "https://briefharbor.co",
      projectType: "wordpress-redesign",
      briefSource: "client-brief",
      summary:
        "A small law firm needs a WordPress redesign for roughly 25 pages plus about 80 existing blog posts. They want a more premium look, faster mobile performance, clearer practice-area pages, and better intake conversion. The client also mentioned ADA concerns, wants to keep rankings, and expects a fast launch before a referral campaign. They have not defined who handles redirects, plugin cleanup, intake-form integrations, or post-launch support.",
      consent: "true",
    },
  },
  {
    slug: "home-services-webflow-rebuild",
    title: "Home services Webflow rebuild with fast timeline and loose revision scope",
    attachmentFileName: "03-home-services-webflow-rebuild.txt",
    expectedSignals: [
      "revision rounds are not defined",
      "asset readiness is uncertain",
      "location-page and review-module scope could expand quickly",
    ],
    form: {
      name: "Jordan Lee",
      email: "jordan@brightdock.design",
      agencyName: "Bright Dock Design",
      websiteUrl: "",
      projectType: "webflow-build",
      briefSource: "loom-summary",
      summary:
        "A HVAC company wants a Webflow rebuild from an old Wix site. The owner wants a polished brochure-style site with service pages, financing CTA blocks, review sections, and location coverage pages. They want it live in one month so they can start summer ads. The client has partial copy, mixed photo quality, and a loose idea of what edits they expect after first review. They also mentioned maybe adding quote-request automations later.",
      consent: "true",
    },
  },
];
