export type ClausePack = {
  id: string;
  title: string;
  description: string;
  assumptions: string[];
  exclusions: string[];
  commercialTerms: string[];
};

export const clausePacks: ClausePack[] = [
  {
    id: "webflow-build",
    title: "Webflow build + hosting",
    description:
      "Use when the project is expected to ship on Webflow with light animations and a managed handoff.",
    assumptions: [
      "Client provides final Webflow-ready copy and brand assets before build starts.",
      "Site uses standard Webflow CMS collections (no custom apps or complex data logic).",
      "Client owns ongoing Webflow hosting plan after launch.",
    ],
    exclusions: [
      "Custom Webflow app development or API-driven data integrations.",
      "E-commerce setup or subscription workflows beyond standard CMS templates.",
      "Ongoing post-launch content updates outside the included handoff window.",
    ],
    commercialTerms: [
      "Two live review rounds included in Webflow staging before launch.",
      "Additional Webflow support billed at the agency hourly rate after handoff.",
    ],
  },
  {
    id: "wordpress-migration",
    title: "WordPress migration + plugin audit",
    description:
      "Use when the project requires moving an existing WordPress site, cleaning plugins, or replatforming.",
    assumptions: [
      "Client supplies full WordPress admin access and hosting credentials before migration.",
      "Content migration is limited to agreed page count and core blog posts.",
      "All required plugins are confirmed before build begins.",
    ],
    exclusions: [
      "Custom plugin development or major theme refactors outside the agreed scope.",
      "Legacy hosting fixes unrelated to the new site build.",
      "Ongoing SEO recovery or performance optimization beyond launch checks.",
    ],
    commercialTerms: [
      "Migration QA includes one regression pass for core templates and forms.",
      "Additional plugin or hosting remediation billed as change-order work.",
    ],
  },
  {
    id: "seo-analytics",
    title: "SEO + analytics baseline",
    description:
      "Use when the client expects SEO-ready pages and analytics baselines as part of the redesign.",
    assumptions: [
      "Client provides keyword priorities and current GA4 / Search Console access.",
      "On-page SEO updates are limited to metadata and copy adjustments per approved pages.",
      "Tracking events are limited to core funnel actions (contact, lead, form submit).",
    ],
    exclusions: [
      "Content strategy, blog calendars, or ongoing SEO content production.",
      "Paid search or multi-channel campaign management.",
      "Complex attribution modeling or BI dashboard builds.",
    ],
    commercialTerms: [
      "SEO and analytics review delivered as a launch checklist PDF.",
      "Additional tracking or SEO support billed as add-on work.",
    ],
  },
];

type ProposalBlockBodies = Record<string, string>;

function appendPackSection(current: string | undefined, title: string, items: string[]) {
  if (items.length === 0) {
    return current ?? "";
  }

  const trimmed = current?.trim() ?? "";
  const marker = `Pack: ${title}`;

  if (trimmed.includes(marker)) {
    return trimmed;
  }

  const body = `${marker}\n${items.map((item) => `- ${item}`).join("\n")}`;

  if (!trimmed) {
    return body;
  }

  return `${trimmed}\n\n${body}`;
}

export function applyClausePackToBodies(
  bodies: ProposalBlockBodies,
  pack: ClausePack,
): ProposalBlockBodies {
  return {
    ...bodies,
    assumptions: appendPackSection(bodies.assumptions, pack.title, pack.assumptions),
    exclusions: appendPackSection(bodies.exclusions, pack.title, pack.exclusions),
    "commercial-terms": appendPackSection(
      bodies["commercial-terms"],
      pack.title,
      pack.commercialTerms,
    ),
  };
}
