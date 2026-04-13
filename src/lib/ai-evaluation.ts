import { conciergeTestCases } from "../../concierge-tests/cases";
import { applyExtractionReviewOverridesToProposalDraft, createExtractionReviewDraft } from "./extraction-review";
import { generateExtractionReviewAiSuggestion } from "./extraction-review-ai";
import { analyzeRiskCheckSubmission } from "./risk-check-analysis";
import { createProposalPackDraft } from "./proposal-pack";
import { generateProposalPackAiSuggestion } from "./proposal-pack-ai";
import type { ChangeOrderDraft } from "./change-order";
import {
  getAiProviderLabel,
  resolveAiProviderConfig,
  type AiProviderConfig,
  type AiProviderName,
} from "./ai-provider";
import type { ExtractionReviewAiSuggestion } from "./extraction-review-ai";
import type { ProposalPackAiSuggestion } from "./proposal-pack-ai";
import type { SavedSubmission } from "./risk-check-storage";
import type { RiskCheckAnalysis } from "./risk-check-analysis";
import type { ProposalPackDraft } from "./proposal-pack";
import type { ExtractionReviewDraft } from "./extraction-review";

export type AiEvalFlowName = "extraction-review" | "proposal-pack";
export type AiEvalMode = "fallback" | "live";
export type AiEvalCheckStatus = "pass" | "warn" | "fail";

type CoverageMatch = {
  term: string;
  found: boolean;
};

export type AiEvalCheck = {
  name: string;
  status: AiEvalCheckStatus;
  score: number;
  maxScore: number;
  detail: string;
};

export type AiEvalResult = {
  caseSlug: string;
  caseTitle: string;
  flow: AiEvalFlowName;
  mode: AiEvalMode;
  provider: AiProviderName | null;
  modelName: string | null;
  score: number;
  maxScore: number;
  passed: boolean;
  generatedAt: string;
  checks: AiEvalCheck[];
  coverage: CoverageMatch[];
  notes: string[];
};

export type AiEvalReport = {
  generatedAt: string;
  liveConfig: AiProviderConfig | null;
  results: AiEvalResult[];
  passed: boolean;
};

export type AiEvalCase = {
  slug: string;
  title: string;
  expectedSignals: string[];
  submission: SavedSubmission;
  analysis: RiskCheckAnalysis;
  reviewDraft: ExtractionReviewDraft;
  proposalDraft: ProposalPackDraft;
  changeOrderDraft: ChangeOrderDraft | null;
  coverageTerms: string[];
};

type ExtractionEvaluationInput = {
  suggestion: ExtractionReviewAiSuggestion;
  caseItem: AiEvalCase;
};

type ProposalEvaluationInput = {
  suggestion: ProposalPackAiSuggestion;
  caseItem: AiEvalCase;
};

const stopWords = new Set([
  "about",
  "after",
  "again",
  "along",
  "also",
  "because",
  "before",
  "being",
  "between",
  "client",
  "could",
  "design",
  "during",
  "final",
  "founder",
  "from",
  "have",
  "into",
  "more",
  "must",
  "need",
  "only",
  "other",
  "our",
  "over",
  "proposal",
  "scope",
  "should",
  "small",
  "some",
  "than",
  "that",
  "their",
  "there",
  "these",
  "this",
  "those",
  "through",
  "until",
  "want",
  "when",
  "where",
  "with",
  "would",
  "your",
]);

function unique(items: string[]) {
  return Array.from(new Set(items.map((item) => item.trim()).filter(Boolean)));
}

function normalizeForSearch(input: string) {
  return input.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

function tokenize(input: string) {
  return normalizeForSearch(input)
    .split(/\s+/)
    .map((item) => item.trim())
    .filter((item) => item.length >= 4 && !stopWords.has(item));
}

function deriveCoverageTerms(caseItem: {
  expectedSignals: string[];
  analysis: RiskCheckAnalysis;
  submission: SavedSubmission;
}) {
  const sources = [
    ...caseItem.expectedSignals,
    caseItem.analysis.internalSummary,
    caseItem.analysis.pricingGuidance.recommendedApproach,
    ...caseItem.analysis.riskFlags.map((flag) => `${flag.label} ${flag.reason}`),
    ...caseItem.analysis.missingInfoPrompts.map(
      (prompt) => `${prompt.question} ${prompt.whyItMatters}`,
    ),
    caseItem.submission.payload.summary,
  ];

  return unique(sources.flatMap(tokenize)).slice(0, 28);
}

function countCoverageMatches(text: string, terms: string[]) {
  const normalized = normalizeForSearch(text);
  return terms.map((term) => ({
    term,
    found: normalized.includes(normalizeForSearch(term)),
  }));
}

function scoreCoverage(matches: CoverageMatch[]) {
  const matchedCount = matches.filter((item) => item.found).length;
  const totalCount = matches.length || 1;
  const ratio = matchedCount / totalCount;

  return {
    matchedCount,
    totalCount,
    ratio,
  };
}

function createCaseFromSubmission(
  submission: SavedSubmission,
  caseTitle: string,
  expectedSignals: string[],
): AiEvalCase {
  const reviewDraft = createExtractionReviewDraft(submission);
  const proposalDraft = applyExtractionReviewOverridesToProposalDraft(
    createProposalPackDraft(submission),
    reviewDraft,
  );

  return {
    slug: submission.id,
    title: caseTitle,
    expectedSignals,
    submission,
    analysis: submission.analysis,
    reviewDraft,
    proposalDraft,
    changeOrderDraft: {
      driftItems: [
        `Add one extra requested item tied to ${submission.payload.projectType}`,
        "Treat the addition as out-of-scope until it is quoted separately.",
      ],
      impactNotes:
        "This keeps the evaluation path exercising the change-order summary without broadening the core scope.",
    },
    coverageTerms: deriveCoverageTerms({
      expectedSignals,
      analysis: submission.analysis,
      submission,
    }),
  };
}

export function buildAiEvalCases(): AiEvalCase[] {
  return conciergeTestCases.map((testCase) => {
    const form = {
      ...testCase.form,
      consent: true as const,
    };
    const analysis = analyzeRiskCheckSubmission(form);
    const submission: SavedSubmission = {
      id: `ai-eval-${testCase.slug}`,
      createdAt: "2026-04-13T00:00:00.000Z",
      payload: form,
      attachment: null,
      analysis,
    };

    return createCaseFromSubmission(submission, testCase.title, testCase.expectedSignals);
  });
}

function createChecksBase(
  name: string,
  status: AiEvalCheckStatus,
  score: number,
  maxScore: number,
  detail: string,
): AiEvalCheck {
  return { name, status, score, maxScore, detail };
}

function makeStatus(score: number, maxScore: number): AiEvalCheckStatus {
  if (score >= maxScore) {
    return "pass";
  }

  if (score >= Math.ceil(maxScore * 0.6)) {
    return "warn";
  }

  return "fail";
}

function summarizeCoverage(matches: CoverageMatch[]) {
  const matched = matches.filter((item) => item.found).map((item) => item.term);
  const missed = matches.filter((item) => !item.found).map((item) => item.term);

  return {
    matched,
    missed,
  };
}

function evaluateExtractionSuggestion(
  input: ExtractionEvaluationInput,
): Omit<AiEvalResult, "generatedAt"> {
  const { suggestion, caseItem } = input;
  const combinedText = [
    suggestion.suggestedReview.summary,
    suggestion.suggestedReview.pricingApproach,
    ...suggestion.suggestedReview.missingInfoQuestions,
    ...suggestion.suggestedReview.riskFlags,
    ...suggestion.suggestedReview.assumptions,
    ...suggestion.rationale,
    ...suggestion.notes,
  ].join("\n");

  const coverage = countCoverageMatches(combinedText, caseItem.coverageTerms);
  const coverageStats = scoreCoverage(coverage);

  const checks: AiEvalCheck[] = [];
  let score = 0;
  const maxScore = 100;

  if (suggestion.mode === "fallback") {
    const exactReviewMatch =
      JSON.stringify(suggestion.suggestedReview) === JSON.stringify(caseItem.reviewDraft);
    const exactScore = exactReviewMatch ? 25 : 0;
    checks.push(
      createChecksBase(
        "fallback review parity",
        makeStatus(exactScore, 25),
        exactScore,
        25,
        exactReviewMatch
          ? "Fallback review matches the deterministic draft."
          : "Fallback review drifted from the deterministic draft.",
      ),
    );
    score += exactScore;
  } else {
    const liveScore =
      suggestion.provider && suggestion.modelName ? 25 : 0;
    checks.push(
      createChecksBase(
        "live provider context",
        makeStatus(liveScore, 25),
        liveScore,
        25,
        suggestion.provider && suggestion.modelName
          ? `Live provider ${getAiProviderLabel(suggestion.provider)} / ${suggestion.modelName} is present.`
          : "Live provider metadata is missing.",
      ),
    );
    score += liveScore;
  }

  const structureScore =
    suggestion.suggestedReview.summary.trim().length >= 20 &&
    suggestion.suggestedReview.pricingApproach.trim().length >= 20 &&
    suggestion.suggestedReview.missingInfoQuestions.length >= 1 &&
    suggestion.suggestedReview.riskFlags.length >= 1 &&
    suggestion.suggestedReview.assumptions.length >= 1
      ? 25
      : 0;

  checks.push(
    createChecksBase(
      "review structure",
      makeStatus(structureScore, 25),
      structureScore,
      25,
      structureScore === 25
        ? "Review output has the expected sections and minimum content."
        : "Review output is missing one or more required sections.",
    ),
  );
  score += structureScore;

  const clarityScore =
    suggestion.rationale.length >= 1 &&
    suggestion.notes.length >= 1 &&
    suggestion.confidence !== null
      ? 25
      : 0;

  checks.push(
    createChecksBase(
      "review clarity",
      makeStatus(clarityScore, 25),
      clarityScore,
      25,
      clarityScore === 25
        ? "Rationale and notes are present."
        : "Rationale or notes are missing.",
    ),
  );
  score += clarityScore;

  const coverageScore = coverageStats.ratio >= 0.25 ? 25 : coverageStats.ratio >= 0.15 ? 15 : 0;
  checks.push(
    createChecksBase(
      "scope signal coverage",
      makeStatus(coverageScore, 25),
      coverageScore,
      25,
      coverageStats.ratio >= 0.25
        ? `Covered ${coverageStats.matchedCount}/${coverageStats.totalCount} signal terms.`
        : `Only covered ${coverageStats.matchedCount}/${coverageStats.totalCount} signal terms.`,
    ),
  );
  score += coverageScore;

  const notes = [
    ...summarizeCoverage(coverage).matched.slice(0, 4).map((term) => `matched:${term}`),
    ...summarizeCoverage(coverage).missed.slice(0, 4).map((term) => `missed:${term}`),
  ];

  return {
    caseSlug: caseItem.slug,
    caseTitle: caseItem.title,
    flow: "extraction-review",
    mode: suggestion.mode === "llm" ? "live" : "fallback",
    provider: suggestion.provider,
    modelName: suggestion.modelName,
    score,
    maxScore,
    passed: score >= 75,
    checks,
    coverage,
    notes,
  };
}

function evaluateProposalSuggestion(
  input: ProposalEvaluationInput,
): Omit<AiEvalResult, "generatedAt"> {
  const { suggestion, caseItem } = input;
  const combinedText = [
    ...suggestion.blockUpdates.map((block) => `${block.title}\n${block.body}`),
    ...suggestion.rationale,
    ...suggestion.notes,
  ].join("\n");

  const coverage = countCoverageMatches(combinedText, caseItem.coverageTerms);
  const coverageStats = scoreCoverage(coverage);
  const requiredBlockIds = new Set(caseItem.proposalDraft.blocks.map((block) => block.id));
  const seenBlockIds = new Set(suggestion.blockUpdates.map((block) => block.id));

  const checks: AiEvalCheck[] = [];
  let score = 0;
  const maxScore = 100;

  if (suggestion.mode === "fallback") {
    const fallbackMatches =
      suggestion.blockUpdates.length === caseItem.proposalDraft.blocks.length &&
      suggestion.blockUpdates.every((block, index) => {
        const reference = caseItem.proposalDraft.blocks[index];
        return (
          reference &&
          block.id === reference.id &&
          block.title === reference.title &&
          block.kind === reference.kind &&
          block.body === reference.body
        );
      });
    const exactScore = fallbackMatches ? 25 : 0;
    checks.push(
      createChecksBase(
        "fallback draft parity",
        makeStatus(exactScore, 25),
        exactScore,
        25,
        fallbackMatches
          ? "Fallback proposal draft matches the deterministic pack."
          : "Fallback proposal draft drifted from the deterministic pack.",
      ),
    );
    score += exactScore;
  } else {
    const liveScore =
      suggestion.provider && suggestion.modelName ? 25 : 0;
    checks.push(
      createChecksBase(
        "live provider context",
        makeStatus(liveScore, 25),
        liveScore,
        25,
        suggestion.provider && suggestion.modelName
          ? `Live provider ${getAiProviderLabel(suggestion.provider)} / ${suggestion.modelName} is present.`
          : "Live provider metadata is missing.",
      ),
    );
    score += liveScore;
  }

  const structureScore =
    suggestion.blockUpdates.length >= 1 &&
    suggestion.rationale.length >= 1 &&
    suggestion.notes.length >= 1 &&
    [...requiredBlockIds].every((blockId) => seenBlockIds.has(blockId)) &&
    seenBlockIds.size === suggestion.blockUpdates.length
      ? 25
      : 0;

  checks.push(
    createChecksBase(
      "proposal structure",
      makeStatus(structureScore, 25),
      structureScore,
      25,
      structureScore === 25
        ? "Proposal output preserves the required section ids."
        : "Proposal output is missing section ids or contains duplicates.",
    ),
  );
  score += structureScore;

  const fidelityScore =
    suggestion.blockUpdates.every((block) => block.body.trim().length >= 20) &&
    suggestion.confidence !== null
      ? 25
      : 0;

  checks.push(
    createChecksBase(
      "proposal fidelity",
      makeStatus(fidelityScore, 25),
      fidelityScore,
      25,
      fidelityScore === 25
        ? "Proposal bodies are populated and readable."
        : "Proposal rewrite content is too thin.",
    ),
  );
  score += fidelityScore;

  const coverageScore = coverageStats.ratio >= 0.25 ? 25 : coverageStats.ratio >= 0.15 ? 15 : 0;
  checks.push(
    createChecksBase(
      "scope signal coverage",
      makeStatus(coverageScore, 25),
      coverageScore,
      25,
      coverageStats.ratio >= 0.25
        ? `Covered ${coverageStats.matchedCount}/${coverageStats.totalCount} signal terms.`
        : `Only covered ${coverageStats.matchedCount}/${coverageStats.totalCount} signal terms.`,
    ),
  );
  score += coverageScore;

  const notes = [
    ...summarizeCoverage(coverage).matched.slice(0, 4).map((term) => `matched:${term}`),
    ...summarizeCoverage(coverage).missed.slice(0, 4).map((term) => `missed:${term}`),
  ];

  return {
    caseSlug: caseItem.slug,
    caseTitle: caseItem.title,
    flow: "proposal-pack",
    mode: suggestion.mode === "llm" ? "live" : "fallback",
    provider: suggestion.provider,
    modelName: suggestion.modelName,
    score,
    maxScore,
    passed: score >= 75,
    checks,
    coverage,
    notes,
  };
}

async function evaluateExtractionCase(
  caseItem: AiEvalCase,
  options?: {
    config?: Partial<AiProviderConfig> | null;
    fetchImpl?: typeof fetch;
    includeLive?: boolean;
  },
) {
  const fallbackSuggestion = await generateExtractionReviewAiSuggestion(
    {
      submission: caseItem.submission,
      review: caseItem.reviewDraft,
    },
    { config: null, fetchImpl: options?.fetchImpl },
  );

  const liveConfig =
    options?.includeLive === false ? null : resolveAiProviderConfig(options?.config);
  const liveSuggestion = liveConfig
    ? await generateExtractionReviewAiSuggestion(
        {
          submission: caseItem.submission,
          review: caseItem.reviewDraft,
        },
        {
          config: liveConfig,
          fetchImpl: options?.fetchImpl,
        },
      )
    : null;

  const fallbackResult = evaluateExtractionSuggestion({
    suggestion: fallbackSuggestion,
    caseItem,
  });

  const liveResult = liveSuggestion
    ? evaluateExtractionSuggestion({
        suggestion: liveSuggestion,
        caseItem,
      })
    : null;

  return { fallbackResult, liveResult, liveConfig };
}

async function evaluateProposalCase(
  caseItem: AiEvalCase,
  options?: {
    config?: Partial<AiProviderConfig> | null;
    fetchImpl?: typeof fetch;
    includeLive?: boolean;
  },
) {
  const fallbackSuggestion = await generateProposalPackAiSuggestion(
    {
      submission: caseItem.submission,
      draft: caseItem.proposalDraft,
      proposalMemory: [],
      changeOrderDraft: caseItem.changeOrderDraft,
    },
    { config: null, fetchImpl: options?.fetchImpl },
  );

  const liveConfig =
    options?.includeLive === false ? null : resolveAiProviderConfig(options?.config);
  const liveSuggestion = liveConfig
    ? await generateProposalPackAiSuggestion(
        {
          submission: caseItem.submission,
          draft: caseItem.proposalDraft,
          proposalMemory: [],
          changeOrderDraft: caseItem.changeOrderDraft,
        },
        {
          config: liveConfig,
          fetchImpl: options?.fetchImpl,
        },
      )
    : null;

  const fallbackResult = evaluateProposalSuggestion({
    suggestion: fallbackSuggestion,
    caseItem,
  });

  const liveResult = liveSuggestion
    ? evaluateProposalSuggestion({
        suggestion: liveSuggestion,
        caseItem,
      })
    : null;

  return { fallbackResult, liveResult, liveConfig };
}

export async function runAiEvaluationSuite(options?: {
  config?: Partial<AiProviderConfig> | null;
  fetchImpl?: typeof fetch;
  includeLive?: boolean;
}) {
  const cases = buildAiEvalCases();
  const results: AiEvalResult[] = [];

  for (const caseItem of cases) {
    const extraction = await evaluateExtractionCase(caseItem, options);
    results.push({
      ...extraction.fallbackResult,
      mode: "fallback",
      generatedAt: new Date().toISOString(),
    });

    if (extraction.liveResult) {
      results.push({
        ...extraction.liveResult,
        mode: "live",
        generatedAt: new Date().toISOString(),
      });
    }

    const proposal = await evaluateProposalCase(caseItem, options);
    results.push({
      ...proposal.fallbackResult,
      mode: "fallback",
      generatedAt: new Date().toISOString(),
    });

    if (proposal.liveResult) {
      results.push({
        ...proposal.liveResult,
        mode: "live",
        generatedAt: new Date().toISOString(),
      });
    }
  }

  const passed = results.every((result) => result.passed);

  return {
    generatedAt: new Date().toISOString(),
    liveConfig:
      options?.includeLive === false ? null : resolveAiProviderConfig(options?.config),
    results,
    passed,
  } satisfies AiEvalReport;
}

export function formatAiEvaluationReport(report: AiEvalReport) {
  const lines = [
    `AI evaluation report: ${report.passed ? "PASS" : "FAIL"}`,
    `Generated at: ${report.generatedAt}`,
    `Live provider: ${report.liveConfig ? getAiProviderLabel(report.liveConfig.provider) : "skipped"}`,
    "",
  ];

  for (const result of report.results) {
    lines.push(
      `${result.flow} | ${result.caseTitle} | ${result.mode} | ${result.score}/${result.maxScore} | ${result.passed ? "PASS" : "FAIL"}`,
    );

    for (const check of result.checks) {
      lines.push(`  - ${check.name}: ${check.status} (${check.score}/${check.maxScore})`);
      lines.push(`    ${check.detail}`);
    }

    const matched = result.coverage.filter((item) => item.found).map((item) => item.term);
    lines.push(`  coverage: ${matched.join(", ") || "none"}`);
    lines.push("");
  }

  return lines.join("\n");
}
