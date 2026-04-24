import { getAgencyDefaults } from "./agency-defaults";
import type {
  PricingTierSuggestion,
  RiskCheckAnalysis,
} from "./risk-check-analysis";
import {
  getBriefSourceLabel,
  getProjectTypeLabel,
} from "./risk-check-presenters";
import type { SavedSubmission } from "./risk-check-storage";

export type ProposalPackBlock = {
  id: string;
  title: string;
  kind: "section" | "pricing";
  body: string;
};

export type ProposalPackDraft = {
  title: string;
  subtitle: string;
  exportedAtLabel: string;
  blocks: ProposalPackBlock[];
  internalNotes: {
    summary: string;
    recommendedApproach: string;
    riskFlags: string[];
    missingInfoQuestions: string[];
    commercialDefaults: string[];
  };
};

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function unique(items: string[]) {
  return Array.from(new Set(items.filter(Boolean)));
}

function sentenceCase(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function getShortSummary(summary: string) {
  const trimmed = summary.trim();
  if (trimmed.length <= 260) {
    return trimmed;
  }

  const clipped = trimmed.slice(0, 257).trimEnd();
  return `${clipped}...`;
}

function createScopeSnapshot(submission: SavedSubmission) {
  const lines = [
    `Project type: ${getProjectTypeLabel(submission.payload.projectType)}`,
    `Source material: ${getBriefSourceLabel(submission.payload.briefSource)}`,
    `Agency: ${submission.payload.agencyName}`,
  ];

  if (submission.payload.websiteUrl) {
    lines.push(`Agency website: ${submission.payload.websiteUrl}`);
  }

  lines.push(
    `Working summary: ${getShortSummary(submission.payload.summary)}`,
    `Pricing posture: ${sentenceCase(submission.analysis.pricingGuidance.pricingConfidence)} confidence, ${submission.analysis.pricingGuidance.complexity} complexity`,
  );

  return lines.map((line) => `- ${line}`).join("\n");
}

function createDeliverables(
  projectType: SavedSubmission["payload"]["projectType"],
  analysis: RiskCheckAnalysis,
) {
  const baseDeliverables =
    projectType === "wordpress-redesign"
      ? [
          "Responsive redesign for the agreed page and template set",
          "WordPress implementation on the approved content and launch setup",
          "Launch QA across current desktop and mobile browsers",
        ]
      : projectType === "webflow-build"
        ? [
            "Responsive Webflow build for the agreed page and template set",
            "CMS setup only where explicitly listed in scope",
            "Launch QA across current desktop and mobile browsers",
          ]
        : [
            "Responsive website design and build for the agreed page and template set",
            "Core conversion sections and standard contact / lead capture setup",
            "Launch QA across current desktop and mobile browsers",
          ];

  if (analysis.riskFlags.some((flag) => flag.key === "integrations")) {
    baseDeliverables.push(
      "Only the explicitly listed integrations, embeds, or form connections",
    );
  }

  if (analysis.riskFlags.some((flag) => flag.key === "migration")) {
    baseDeliverables.push(
      "Migration work only where page count, redirect handling, and cleanup rules are defined",
    );
  }

  return unique(baseDeliverables)
    .map((item) => `- ${item}`)
    .join("\n");
}

function createAssumptions(analysis: RiskCheckAnalysis) {
  const assumptions = analysis.missingInfoPrompts.map((prompt) => {
    if (prompt.key === "copy-ownership") {
      return "Client supplies approved copy unless a separate copywriting scope is added.";
    }

    if (prompt.key === "migration") {
      return "Migration is limited to the pages, redirects, and cleanup tasks explicitly listed in the final scope.";
    }

    if (prompt.key === "integrations") {
      return "Only the named forms, CRM embeds, or automations are included in the quoted scope.";
    }

    if (prompt.key === "revisions") {
      return "Revision rounds are limited to the number stated in the final proposal tier.";
    }

    if (prompt.key === "timeline") {
      return "Timeline assumes on-time feedback, content delivery, and stakeholder approvals.";
    }

    return prompt.whyItMatters;
  });

  return unique(assumptions)
    .map((item) => `- ${item}`)
    .join("\n");
}

function createExclusions(analysis: RiskCheckAnalysis) {
  const exclusions = [
    "Any work not explicitly listed in the final approved scope or pricing tier",
  ];

  for (const flag of analysis.riskFlags) {
    if (flag.key === "copy-ownership") {
      exclusions.push("Copywriting, messaging strategy, and content collection unless separately priced");
    }
    if (flag.key === "migration") {
      exclusions.push("Unbounded content migration, redirect mapping, and plugin cleanup");
    }
    if (flag.key === "integrations") {
      exclusions.push("Custom integrations, advanced automation setup, and third-party workflow debugging");
    }
    if (flag.key === "revisions") {
      exclusions.push("Unlimited revisions or new requests introduced after signoff");
    }
    if (flag.key === "assets") {
      exclusions.push("Photography sourcing, asset cleanup, and production design work beyond approved assets");
    }
    if (flag.key === "post-launch-support") {
      exclusions.push("Ongoing support, maintenance, or training beyond the agreed launch window");
    }
  }

  return unique(exclusions)
    .map((item) => `- ${item}`)
    .join("\n");
}

function createTimelineSection(analysis: RiskCheckAnalysis) {
  const dependencies = [
    "Final page and template count confirmed before design starts",
    "Client feedback and approvals delivered within agreed review windows",
    "Content, imagery, and brand assets delivered in an approval-ready state",
  ];

  if (analysis.riskFlags.some((flag) => flag.key === "timeline")) {
    dependencies.push("Rush timing or campaign deadlines may require tighter scope or a priority fee");
  }

  if (analysis.riskFlags.some((flag) => flag.key === "migration")) {
    dependencies.push("Migration timing depends on redirect, cleanup, and content-move decisions being confirmed early");
  }

  return unique(dependencies)
    .map((item) => `- ${item}`)
    .join("\n");
}

function createClarificationQuestions(analysis: RiskCheckAnalysis) {
  return analysis.missingInfoPrompts
    .map((prompt) => `- ${prompt.question}`)
    .join("\n");
}

function createChangeOrderStarter(analysis: RiskCheckAnalysis) {
  const triggers = [
    "Additional pages, templates, or modules beyond the approved scope",
    "New integrations, automations, or workflow requirements added after signoff",
    "Late content, asset, or approval delays that require rework or timeline shifts",
  ];

  if (analysis.riskFlags.some((flag) => flag.key === "migration")) {
    triggers.push("Extra migration, redirect, or cleanup work discovered after kickoff");
  }

  return [
    "Any request outside the approved scope, timeline, or revision allowance will be quoted as a change order before work begins.",
    "",
    ...unique(triggers).map((item) => `- ${item}`),
  ].join("\n");
}

function createCommercialTerms(projectType: SavedSubmission["payload"]["projectType"], analysis: RiskCheckAnalysis) {
  const defaults = getAgencyDefaults(
    projectType,
    analysis.pricingGuidance.complexity,
  );

  return defaults.clientFacingTerms.map((item) => `- ${item}`).join("\n");
}

function createPricingBlock(tier: PricingTierSuggestion, index: number) {
  return {
    id: `pricing-tier-${index + 1}`,
    title: `${tier.name} pricing tier`,
    kind: "pricing" as const,
    body: [
      `Best fit: ${tier.fit}`,
      "",
      tier.summary,
      "",
      "Includes:",
      ...tier.includes.map((item) => `- ${item}`),
      "",
      `Caution: ${tier.caution}`,
    ].join("\n"),
  };
}

export function createProposalPackDraft(submission: SavedSubmission): ProposalPackDraft {
  const projectTypeLabel = getProjectTypeLabel(submission.payload.projectType);
  const analysis = submission.analysis;
  const agencyDefaults = getAgencyDefaults(
    submission.payload.projectType,
    analysis.pricingGuidance.complexity,
  );

  const blocks: ProposalPackBlock[] = [
    {
      id: "deal-summary",
      title: "Deal summary and client goals",
      kind: "section",
      body: [
        `This draft proposal pack is based on the submitted ${getBriefSourceLabel(submission.payload.briefSource).toLowerCase()} for a ${projectTypeLabel.toLowerCase()}.`,
        "",
        `Source summary: ${getShortSummary(submission.payload.summary)}`,
      ].join("\n"),
    },
    {
      id: "scope-snapshot",
      title: "Scope snapshot",
      kind: "section",
      body: createScopeSnapshot(submission),
    },
    {
      id: "deliverables",
      title: "Deliverables",
      kind: "section",
      body: createDeliverables(submission.payload.projectType, analysis),
    },
    ...analysis.pricingGuidance.tiers.map(createPricingBlock),
    {
      id: "commercial-terms",
      title: "Commercial terms",
      kind: "section",
      body: createCommercialTerms(submission.payload.projectType, analysis),
    },
    {
      id: "assumptions",
      title: "Assumptions",
      kind: "section",
      body: createAssumptions(analysis),
    },
    {
      id: "exclusions",
      title: "Exclusions",
      kind: "section",
      body: createExclusions(analysis),
    },
    {
      id: "timeline",
      title: "Timeline and dependencies",
      kind: "section",
      body: createTimelineSection(analysis),
    },
    {
      id: "clarification-questions",
      title: "Clarification questions",
      kind: "section",
      body: createClarificationQuestions(analysis),
    },
    {
      id: "change-order",
      title: "Change-order starter language",
      kind: "section",
      body: createChangeOrderStarter(analysis),
    },
  ];

  return {
    title: `${submission.payload.agencyName} proposal pack draft`,
    subtitle: `${projectTypeLabel} - reference ${submission.id}`,
    exportedAtLabel: submission.createdAt,
    blocks,
    internalNotes: {
      summary: analysis.internalSummary,
      recommendedApproach: analysis.pricingGuidance.recommendedApproach,
      riskFlags: analysis.riskFlags.map((flag) => `${flag.label}: ${flag.reason}`),
      missingInfoQuestions: analysis.missingInfoPrompts.map((item) => item.question),
      commercialDefaults: agencyDefaults.internalSummary,
    },
  };
}

export function applySavedProposalPackClientBlocks(
  draft: ProposalPackDraft,
  clientBlocks: Record<string, string>,
) {
  return {
    ...draft,
    blocks: draft.blocks.map((block) => ({
      ...block,
      body: clientBlocks[block.id] ?? block.body,
    })),
  };
}

export function buildProposalPackMarkdown(draft: ProposalPackDraft) {
  const sections = [
    `# ${draft.title}`,
    "",
    `${draft.subtitle}`,
    "",
    `Created from ScopeOS intake reference on ${draft.exportedAtLabel}.`,
    "",
  ];

  for (const block of draft.blocks) {
    sections.push(`## ${block.title}`, "", block.body, "");
  }

  return sections.join("\n");
}

export type ProposalPackTheme = "light" | "dark";
export type ProposalPackBrandSettings = {
  brandName?: string;
  logoUrl?: string;
  primaryColor?: string;
  accentColor?: string;
  exportFooter?: string;
};

export function buildProposalPackHtml(
  draft: ProposalPackDraft,
  theme: ProposalPackTheme = "light",
  brandSettings: ProposalPackBrandSettings = {},
) {
  const sectionMarkup = draft.blocks
    .map((block) => {
      const lines = block.body.split("\n");
      const parts: string[] = [];
      let listBuffer: string[] = [];

      const flushList = () => {
        if (listBuffer.length === 0) {
          return;
        }
        parts.push(`<ul>${listBuffer.join("")}</ul>`);
        listBuffer = [];
      };

      for (const line of lines) {
        if (!line) {
          flushList();
          parts.push("<div class=\"spacer\"></div>");
          continue;
        }

        if (line.startsWith("- ")) {
          listBuffer.push(`<li>${escapeHtml(line.slice(2))}</li>`);
          continue;
        }

        flushList();
        parts.push(`<p>${escapeHtml(line)}</p>`);
      }

      flushList();

      return `
        <section class="section">
          <h2>${escapeHtml(block.title)}</h2>
          <div class="section-body">
            ${parts.join("")}
          </div>
        </section>
      `;
    })
    .join("");

  const themeStyles =
    theme === "dark"
      ? `
      :root {
        color-scheme: dark;
        --ink: #e2e8f0;
        --muted: #94a3b8;
        --accent: #38bdf8;
        --paper: #0b1120;
        --border: #1e293b;
        --panel: #111827;
      }
    `
      : `
      :root {
        color-scheme: light;
        --ink: #0f172a;
        --muted: #475569;
        --accent: #1d4ed8;
        --paper: #f8fafc;
        --border: #e2e8f0;
        --panel: #ffffff;
      }
    `;
  const brandName = brandSettings.brandName?.trim() || "ScopeOS";
  const logoUrl = brandSettings.logoUrl?.trim();
  const primaryColor = brandSettings.primaryColor?.trim() || null;
  const accentColor = brandSettings.accentColor?.trim() || null;
  const footer =
    brandSettings.exportFooter?.trim() ||
    "Generated by ScopeOS. Final review and send remain manual.";
  const brandStyles = `
      :root {
        ${primaryColor ? `--ink: ${primaryColor};` : ""}
        ${accentColor ? `--accent: ${accentColor};` : ""}
      }
    `;

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${escapeHtml(draft.title)}</title>
    <style>
      ${themeStyles}
      ${brandStyles}
      * { box-sizing: border-box; }
      body {
        margin: 0;
        background: var(--paper);
        color: var(--ink);
        font-family: "Inter", "Segoe UI", system-ui, -apple-system, sans-serif;
        line-height: 1.6;
      }
      .page {
        max-width: 860px;
        margin: 48px auto;
        background: var(--panel);
        border: 1px solid var(--border);
        border-radius: 20px;
        padding: 48px;
        box-shadow: 0 20px 50px rgba(15, 23, 42, 0.08);
      }
      .eyebrow {
        text-transform: uppercase;
        letter-spacing: 0.2em;
        font-size: 12px;
        color: var(--muted);
      }
      h1 {
        margin: 16px 0 8px;
        font-size: 32px;
        line-height: 1.2;
      }
      h2 {
        margin: 0 0 12px;
        font-size: 20px;
      }
      .subtitle {
        margin: 0 0 24px;
        color: var(--muted);
      }
      .meta {
        display: grid;
        gap: 4px;
        font-size: 13px;
        color: var(--muted);
        border-left: 4px solid var(--accent);
        padding-left: 12px;
        margin-bottom: 32px;
      }
      .section {
        padding: 24px 0;
        border-top: 1px solid var(--border);
      }
      .section:first-of-type {
        border-top: none;
      }
      .section-body p {
        margin: 0 0 10px;
      }
      .section-body ul {
        margin: 0 0 12px;
        padding-left: 20px;
      }
      .section-body li {
        margin: 0 0 6px;
      }
      .section-body p:last-child {
        margin-bottom: 0;
      }
      .spacer {
        height: 10px;
      }
      .footer {
        margin-top: 32px;
        font-size: 12px;
        color: var(--muted);
        border-top: 1px solid var(--border);
        padding-top: 16px;
      }
      @media print {
        body { background: white; }
        .page { box-shadow: none; border: none; padding: 0; }
      }
      .brand {
        display: flex;
        align-items: center;
        gap: 12px;
        margin-bottom: 24px;
      }
      .brand img {
        max-height: 42px;
        max-width: 160px;
        object-fit: contain;
      }
      .brand-name {
        font-weight: 700;
        letter-spacing: -0.02em;
      }
    </style>
  </head>
  <body>
    <main class="page">
      <div class="brand">
        ${logoUrl ? `<img src="${escapeHtml(logoUrl)}" alt="${escapeHtml(brandName)} logo" />` : ""}
        <span class="brand-name">${escapeHtml(brandName)}</span>
      </div>
      <div class="eyebrow">ScopeOS branded proposal pack</div>
      <h1>${escapeHtml(draft.title)}</h1>
      <p class="subtitle">${escapeHtml(draft.subtitle)}</p>
      <div class="meta">
        <span>Created from ScopeOS intake reference on ${escapeHtml(draft.exportedAtLabel)}.</span>
        <span>Theme: ${theme === "dark" ? "Dark" : "Light"}.</span>
        <span>Prepared for internal review and client-ready export.</span>
      </div>
      ${sectionMarkup}
      <div class="footer">
        ${escapeHtml(footer)}
      </div>
    </main>
  </body>
</html>`;
}
