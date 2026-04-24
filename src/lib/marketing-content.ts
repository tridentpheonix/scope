export const caseStudies = [
  {
    slug: "saas-redesign-migration",
    label: "Sample teardown",
    title: "SaaS redesign with hidden migration risk",
    summary:
      "A marketing-site redesign looked simple until blog migration, redirect ownership, and HubSpot routing appeared in the brief.",
    audience: "Small B2B SaaS redesign",
    risks: [
      "Content migration was mentioned but page count and redirect ownership were not defined.",
      "HubSpot forms were assumed to be simple embeds, but no routing or field map was confirmed.",
      "The deadline was tied to a launch campaign without a fallback scope.",
    ],
    scopeMoves: [
      "Move migration into a separately priced line item until page inventory is known.",
      "Ask for the CRM owner and field/routing requirements before fixed-fee pricing.",
      "Add a launch-critical change-order trigger for late content and approvals.",
    ],
  },
  {
    slug: "local-services-rebrand",
    label: "Founder analysis",
    title: "Local services rebrand with vague content ownership",
    summary:
      "A brochure-site refresh had enough design direction to start, but not enough content ownership to price safely.",
    audience: "Local services brochure site",
    risks: [
      "The client wanted clearer messaging but had not assigned copywriting ownership.",
      "Photography and service-area page count were unresolved.",
      "Revision expectations were described as 'until it feels right'.",
    ],
    scopeMoves: [
      "Separate light copy shaping from net-new copywriting.",
      "Cap page/template count before quoting implementation.",
      "Turn revision rounds into a visible proposal assumption.",
    ],
  },
] as const;

export const comparisons = [
  {
    slug: "scopeos-vs-chatgpt",
    title: "ScopeOS vs ChatGPT for website proposal scoping",
    summary:
      "ChatGPT is flexible. ScopeOS is narrower: it is designed to catch website-scope risk, proposal assumptions, exclusions, and change-order triggers before pricing.",
    bestForScopeOS: [
      "Small agencies pricing fixed-fee website work",
      "Repeatable scope review before proposal writing",
      "Keeping risky assumptions visible instead of buried in copy",
    ],
    bestForAlternative: [
      "General writing and brainstorming",
      "One-off copy variations",
      "Non-website project categories",
    ],
  },
  {
    slug: "scopeos-vs-proposal-tools",
    title: "ScopeOS vs proposal tools",
    summary:
      "Proposal tools help you send polished documents. ScopeOS helps before that: deciding what should, and should not, go into the proposal.",
    bestForScopeOS: [
      "Finding missing client inputs before pricing",
      "Drafting assumptions, exclusions, and scope boundaries",
      "Reducing margin leaks before the proposal is designed",
    ],
    bestForAlternative: [
      "E-signature and acceptance workflows",
      "Proposal templates and client portals",
      "CRM-connected sales document management",
    ],
  },
] as const;

export const legalUpdatedLabel = "April 24, 2026";
