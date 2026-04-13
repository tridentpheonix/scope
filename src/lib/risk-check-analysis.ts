import type { RiskCheckInput } from "./risk-check-schema";

export const riskFlagKinds = [
  "missing_input",
  "scope_ambiguity",
  "delivery_risk",
  "pricing_risk",
] as const;

export const riskFlagSeverities = ["low", "medium", "high"] as const;
export const pricingComplexities = ["low", "medium", "high"] as const;
export const pricingConfidences = ["low", "medium", "high"] as const;

export type RiskFlagKind = (typeof riskFlagKinds)[number];
export type RiskFlagSeverity = (typeof riskFlagSeverities)[number];
export type PricingComplexity = (typeof pricingComplexities)[number];
export type PricingConfidence = (typeof pricingConfidences)[number];

export type MissingInfoPrompt = {
  key: string;
  category: string;
  priority: "required_before_pricing" | "recommended_before_pricing";
  question: string;
  whyItMatters: string;
};

export type RiskFlag = {
  key: string;
  category: string;
  kind: RiskFlagKind;
  severity: RiskFlagSeverity;
  label: string;
  reason: string;
};

export type PricingTierSuggestion = {
  name: string;
  fit: string;
  summary: string;
  includes: string[];
  caution: string;
};

export type PricingGuidance = {
  complexity: PricingComplexity;
  pricingConfidence: PricingConfidence;
  recommendedApproach: string;
  rationale: string[];
  tiers: PricingTierSuggestion[];
};

export type RiskCheckAnalysis = {
  internalSummary: string;
  promptGuidance: string[];
  missingInfoPrompts: MissingInfoPrompt[];
  riskFlags: RiskFlag[];
  pricingGuidance: PricingGuidance;
};

export type RiskCheckAnalysisPreview = {
  internalSummary: string;
  recommendedApproach: string;
  pricingConfidence: PricingConfidence;
  topQuestions: string[];
  topRisks: string[];
};

type Detection = {
  key: string;
  category: string;
  priority: MissingInfoPrompt["priority"];
  kind: RiskFlagKind;
  severity: RiskFlagSeverity;
  label: string;
  question: string;
  whyItMatters: string;
  promptNote: string;
  pricingImpact: string;
  score: number;
};

function normalizeText(input: string) {
  return input.toLowerCase().replace(/\s+/g, " ").trim();
}

function containsAny(text: string, phrases: string[]) {
  return phrases.some((phrase) => text.includes(phrase));
}

function addDetection(
  detections: Detection[],
  detection: Detection,
  condition: boolean,
) {
  if (condition && !detections.some((item) => item.key === detection.key)) {
    detections.push(detection);
  }
}

function getProjectTypeComplexity(projectType: RiskCheckInput["projectType"]) {
  switch (projectType) {
    case "brochure-site":
      return 1;
    case "marketing-redesign":
      return 2;
    case "webflow-build":
      return 2;
    case "wordpress-redesign":
      return 3;
    case "other":
      return 2;
    default:
      return 2;
  }
}

function getPricingTiers(
  projectTypeLabel: string,
  detections: Detection[],
  recommendedApproach: string,
): PricingTierSuggestion[] {
  const hasMigration = detections.some((item) => item.key === "migration");
  const hasIntegrations = detections.some((item) => item.key === "integrations");
  const hasCopy = detections.some((item) => item.key === "copy-ownership");
  const hasSupport = detections.some((item) => item.key === "post-launch-support");

  return [
    {
      name: "Lean scope",
      fit: "Use when the client needs the smallest safe fixed-fee option.",
      summary: `Keep the ${projectTypeLabel} tightly bounded around the core page set and visual refresh.`,
      includes: [
        "Core page templates only",
        "Client-supplied copy and approved assets",
        hasIntegrations ? "Simple embed-only integrations" : "No custom integrations beyond basic embeds",
      ],
      caution:
        "Exclude uncertain items like migration, copywriting, or extra rounds unless they are separately approved.",
    },
    {
      name: "Core redesign",
      fit: "Recommended baseline tier for most qualified website redesign deals.",
      summary: `Anchor pricing around the safest deliverables you can stand behind for this ${projectTypeLabel}.`,
      includes: [
        "Full agreed page set with standard responsive QA",
        hasCopy ? "Light copy shaping only if ownership is confirmed first" : "Content implementation from client-approved copy",
        hasMigration
          ? "Migration only if page count, redirects, and cleanup rules are defined"
          : "Platform setup and launch support",
      ],
      caution:
        recommendedApproach,
    },
    {
      name: "Expanded rollout",
      fit: "Use when strategy, migration, integrations, or post-launch support stay in one package.",
      summary: "Bundle higher-touch work only after the unknowns are turned into explicit assumptions or scoped add-ons.",
      includes: [
        hasMigration ? "Migration and redirect planning" : "Expanded content and SEO support",
        hasIntegrations ? "Integration setup and QA" : "Optional conversion features",
        hasSupport ? "Post-launch support or training" : "Optional launch care / training block",
      ],
      caution:
        "This tier should absorb the ambiguous work, not hide it inside the middle tier.",
    },
  ];
}

export function analyzeRiskCheckSubmission(input: RiskCheckInput): RiskCheckAnalysis {
  const text = normalizeText(input.summary);
  const mentionsLargeBlogMigration = containsAny(text, [
    "80 existing blog posts",
    "80 blog posts",
    "blog posts",
  ]);
  const mentionsHubSpot = containsAny(text, ["hubspot"]);
  const projectTypeLabel =
    input.projectType === "marketing-redesign"
      ? "marketing website redesign"
      : input.projectType === "wordpress-redesign"
        ? "WordPress redesign"
        : input.projectType === "webflow-build"
          ? "Webflow build"
          : input.projectType === "brochure-site"
            ? "brochure website project"
            : "website project";

  const detections: Detection[] = [];

  addDetection(
    detections,
    {
      key: "copy-ownership",
      category: "content",
      priority: "required_before_pricing",
      kind: "pricing_risk",
      severity: "high",
      label: "Copy ownership is unclear",
      question: "Who owns copywriting, content collection, and final approvals before design starts?",
      whyItMatters:
        "Copy ownership is not confirmed, so copywriting should stay out of the base price until the client assigns it.",
      promptNote:
        "Treat copywriting as an assumption or add-on until ownership, draft quality, and approval cycles are explicit.",
      pricingImpact:
        "Keep copy strategy or copywriting outside the base tier unless the brief clearly confirms ownership and process.",
      score: 2,
    },
    containsAny(text, [
      "copy",
      "content",
      "who writes",
      "not written",
      "partial copy",
      "content ownership",
    ]),
  );

  addDetection(
    detections,
    {
      key: "migration",
      category: "migration",
      priority: "required_before_pricing",
      kind: "scope_ambiguity",
      severity: "high",
      label: "Migration work may be larger than it looks",
      question:
        mentionsLargeBlogMigration
          ? "How many blog posts, redirects, and cleanup tasks are truly included in the migration scope?"
          : "What existing pages, blog posts, redirects, and plugin/content cleanup tasks are included in migration scope?",
      whyItMatters:
        mentionsLargeBlogMigration
          ? "Blog migration effort is ambiguous."
          : "CMS migration assumptions could affect pricing.",
      promptNote:
        "Do not treat migration as background admin work; isolate page count, redirect handling, and cleanup expectations.",
      pricingImpact:
        "Quote migration as bounded work or a separate add-on when blog, redirect, or cleanup scope is still fuzzy.",
      score: 2,
    },
    input.projectType === "wordpress-redesign" ||
      containsAny(text, [
        "migration",
        "migrate",
        "blog",
        "redirect",
        "redirects",
        "plugin",
        "cleanup",
        "keep rankings",
      ]),
  );

  addDetection(
    detections,
    {
      key: "integrations",
      category: "integrations",
      priority: "required_before_pricing",
      kind: "delivery_risk",
      severity: "medium",
      label: "Integration scope is still loose",
      question:
        "Which forms, CRM tools, automations, or quote-request flows must be configured, tested, and supported at launch?",
      whyItMatters:
        mentionsHubSpot
          ? "HubSpot form scope needs clarification before pricing."
          : "Integration setup and testing still need clarification before pricing.",
      promptNote:
        "Treat integrations as scoped deliverables with explicit setup, QA, and handoff rules rather than implied website work.",
      pricingImpact:
        "Keep the base tier integration-light and move setup, QA, or automation work into higher tiers or change orders.",
      score: 1,
    },
    containsAny(text, [
      "hubspot",
      "crm",
      "form",
      "forms",
      "automation",
      "automations",
      "quote-request",
      "intake form",
      "integrations",
      "integration",
    ]),
  );

  addDetection(
    detections,
    {
      key: "revisions",
      category: "revisions",
      priority: "required_before_pricing",
      kind: "pricing_risk",
      severity: "high",
      label: "Revision boundaries are vague",
      question:
        "How many revision rounds are included, what counts as feedback vs new scope, and who signs off each round?",
      whyItMatters:
        "Revision rounds are not defined, so fixed-fee pricing is exposed.",
      promptNote:
        "Write revision limits explicitly and separate normal feedback from new requests or late-arriving content changes.",
      pricingImpact:
        "Price the core tier around a fixed number of rounds and push additional iterations into add-ons or change-order rules.",
      score: 2,
    },
    containsAny(text, [
      "revision",
      "revisions",
      "review",
      "feedback",
      "edits",
      "quick feedback",
      "loose idea of what edits",
    ]),
  );

  addDetection(
    detections,
    {
      key: "assets",
      category: "assets",
      priority: "recommended_before_pricing",
      kind: "delivery_risk",
      severity: "medium",
      label: "Asset readiness could slow delivery",
      question:
        "What copy, photography, brand files, and case-study assets are ready now, and what has to be created or cleaned up?",
      whyItMatters:
        "Asset readiness is uncertain and may slow design iterations.",
      promptNote:
        "Flag asset readiness early because missing photos or half-finished copy turns design work into hidden production work.",
      pricingImpact:
        "Keep asset creation or cleanup out of the base scope unless the handoff package is already defined.",
      score: 1,
    },
    containsAny(text, [
      "photo",
      "photography",
      "assets",
      "mixed photo",
      "partial copy",
      "case study",
      "case-study",
    ]),
  );

  addDetection(
    detections,
    {
      key: "timeline",
      category: "timeline",
      priority: "recommended_before_pricing",
      kind: "delivery_risk",
      severity: "medium",
      label: "Timeline pressure may compress approvals",
      question:
        "What launch date is real, what approvals are required, and what happens if client content or feedback arrives late?",
      whyItMatters:
        "Fast launch pressure can turn normal scoping ambiguity into delivery risk.",
      promptNote:
        "When a client wants a fast turnaround, call out approval dependencies and content deadlines before promising a fixed timeline.",
      pricingImpact:
        "Use timeline urgency to justify approval deadlines, rush fees, or tighter baseline scope.",
      score: 1,
    },
    containsAny(text, [
      "six weeks",
      "one month",
      "fast launch",
      "launch in",
      "before a referral campaign",
      "before summer ads",
      "event",
      "campaign",
    ]),
  );

  addDetection(
    detections,
    {
      key: "seo",
      category: "seo",
      priority: "required_before_pricing",
      kind: "scope_ambiguity",
      severity: "medium",
      label: "SEO protection work is implied but not bounded",
      question:
        "Are redirects, metadata carryover, sitemap handling, and ranking-protection tasks in scope or excluded?",
      whyItMatters:
        "SEO redirect responsibility needs confirmation.",
      promptNote:
        "Treat SEO preservation as an explicit deliverable or exclusion instead of assuming it rides along with the redesign.",
      pricingImpact:
        "If rankings matter, scope redirects and metadata handling separately or attach them to the expanded tier.",
      score: 1,
    },
    containsAny(text, ["seo", "rankings", "redirect", "redirects", "metadata"]),
  );

  addDetection(
    detections,
    {
      key: "compliance",
      category: "compliance",
      priority: "recommended_before_pricing",
      kind: "pricing_risk",
      severity: "medium",
      label: "Compliance expectations may add hidden review work",
      question:
        "What accessibility, regulated-industry, or intake-form requirements need explicit review, remediation, and signoff?",
      whyItMatters:
        "ADA and intake form requirements may change delivery effort.",
      promptNote:
        "Where legal, healthcare, or accessibility expectations appear, avoid implying compliance work is fully covered unless reviewed.",
      pricingImpact:
        "Protect the quote by limiting compliance work to defined checks or pricing a separate review/remediation block.",
      score: 1,
    },
    containsAny(text, ["ada", "accessibility", "law firm", "legal", "compliance"]),
  );

  addDetection(
    detections,
    {
      key: "post-launch-support",
      category: "support",
      priority: "recommended_before_pricing",
      kind: "scope_ambiguity",
      severity: "medium",
      label: "Support expectations may spill past launch",
      question:
        "What post-launch support, training, bug-fix window, or maintenance expectations should be included vs excluded?",
      whyItMatters:
        "Post-launch support is mentioned loosely and can expand without clear boundaries.",
      promptNote:
        "Separate launch scope from post-launch support so the proposal does not quietly inherit maintenance work.",
      pricingImpact:
        "Use launch care or training as an optional higher-tier element instead of quietly bundling it into the core price.",
      score: 1,
    },
    containsAny(text, [
      "post-launch",
      "after launch",
      "support",
      "maintenance",
      "training",
    ]),
  );

  addDetection(
    detections,
    {
      key: "page-scope-expansion",
      category: "scope",
      priority: "recommended_before_pricing",
      kind: "scope_ambiguity",
      severity: "medium",
      label: "Page count or module count may grow",
      question:
        "What exact page count, reusable templates, and optional modules are included in the fixed-fee scope?",
      whyItMatters:
        "Location-page and review-module scope could expand quickly.",
      promptNote:
        "Turn vague page and module mentions into an explicit count before generating pricing tiers.",
      pricingImpact:
        "Anchor the middle tier to a fixed page/template count and treat expansions as upsell or change-order scope.",
      score: 1,
    },
    containsAny(text, [
      "page",
      "pages",
      "location pages",
      "service pages",
      "review section",
      "review sections",
      "templates",
    ]),
  );

  const totalScore =
    getProjectTypeComplexity(input.projectType) +
    detections.reduce((sum, detection) => sum + detection.score, 0);

  const complexity: PricingComplexity =
    totalScore >= 9 ? "high" : totalScore >= 5 ? "medium" : "low";

  const requiredUnknowns = detections.filter(
    (item) => item.priority === "required_before_pricing",
  ).length;

  const pricingConfidence: PricingConfidence =
    requiredUnknowns >= 4 || totalScore >= 9
      ? "low"
      : requiredUnknowns >= 2 || totalScore >= 5
        ? "medium"
        : "high";

  const recommendedApproach =
    pricingConfidence === "low"
      ? "Use a tightly protected middle tier and push ambiguous work into explicit assumptions, add-ons, or a paid discovery block before final pricing."
      : pricingConfidence === "medium"
        ? "Anchor the middle tier around the safest agreed deliverables and keep migration, integrations, or extra rounds behind explicit guardrails."
        : "A normal three-tier fixed-fee structure is viable if the remaining assumptions are written clearly.";

  const internalSummary =
    pricingConfidence === "low"
      ? `High-ambiguity ${projectTypeLabel}: protect pricing around the biggest unknowns before locking the proposal pack.`
      : pricingConfidence === "medium"
        ? `Moderate-risk ${projectTypeLabel}: the brief is workable, but a few scope gaps still need to be priced carefully.`
        : `Lower-risk ${projectTypeLabel}: the brief is relatively clean, but core assumptions should still be written explicitly.`;

  const promptGuidance = [
    "Mark inferred scope items as assumptions, not confirmed facts.",
    "Keep internal risk notes separate from client-facing proposal copy.",
    ...detections.map((detection) => detection.promptNote),
    ...detections.map((detection) => detection.pricingImpact),
  ];

  const pricingGuidance: PricingGuidance = {
    complexity,
    pricingConfidence,
    recommendedApproach,
    rationale: detections.map((detection) => detection.pricingImpact),
    tiers: getPricingTiers(projectTypeLabel, detections, recommendedApproach),
  };

  return {
    internalSummary,
    promptGuidance,
    missingInfoPrompts: detections.map((detection) => ({
      key: detection.key,
      category: detection.category,
      priority: detection.priority,
      question: detection.question,
      whyItMatters: detection.whyItMatters,
    })),
    riskFlags: detections.map((detection) => ({
      key: detection.key,
      category: detection.category,
      kind: detection.kind,
      severity: detection.severity,
      label: detection.label,
      reason: detection.whyItMatters,
    })),
    pricingGuidance,
  };
}

export function createRiskCheckAnalysisPreview(
  analysis: RiskCheckAnalysis,
): RiskCheckAnalysisPreview {
  return {
    internalSummary: analysis.internalSummary,
    recommendedApproach: analysis.pricingGuidance.recommendedApproach,
    pricingConfidence: analysis.pricingGuidance.pricingConfidence,
    topQuestions: analysis.missingInfoPrompts.slice(0, 3).map((item) => item.question),
    topRisks: analysis.riskFlags.slice(0, 3).map((item) => item.label),
  };
}
