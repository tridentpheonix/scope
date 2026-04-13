import type { ProposalPackDraft } from "./proposal-pack";
import type { SavedSubmission } from "./risk-check-storage";

export type ExtractionReviewDraft = {
  summary: string;
  pricingApproach: string;
  missingInfoQuestions: string[];
  riskFlags: string[];
  assumptions: string[];
};

export type ExtractionReviewOverrides = ExtractionReviewDraft;
export type ExtractionReviewLocalBackup = {
  review: ExtractionReviewDraft;
  updatedAt: string | null;
};

function unique(items: string[]) {
  return Array.from(new Set(items.map((item) => item.trim()).filter(Boolean)));
}

function listToMarkdown(items: string[]) {
  return unique(items)
    .map((item) => `- ${item}`)
    .join("\n");
}

function replaceSectionBody(
  draft: ProposalPackDraft,
  sectionId: string,
  body: string,
): ProposalPackDraft {
  return {
    ...draft,
    blocks: draft.blocks.map((block) =>
      block.id === sectionId ? { ...block, body } : block,
    ),
  };
}

export function getExtractionReviewStorageKey(submissionId: string) {
  return `scopeos-extraction-review:${submissionId}`;
}

function isExtractionReviewDraft(value: unknown): value is ExtractionReviewDraft {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return false;
  }

  const draft = value as Record<string, unknown>;

  return (
    typeof draft.summary === "string" &&
    typeof draft.pricingApproach === "string" &&
    Array.isArray(draft.missingInfoQuestions) &&
    draft.missingInfoQuestions.every((item) => typeof item === "string") &&
    Array.isArray(draft.riskFlags) &&
    draft.riskFlags.every((item) => typeof item === "string") &&
    Array.isArray(draft.assumptions) &&
    draft.assumptions.every((item) => typeof item === "string")
  );
}

export function normalizeExtractionReviewDraft(
  draft: ExtractionReviewDraft,
): ExtractionReviewDraft {
  return {
    summary: draft.summary.trim(),
    pricingApproach: draft.pricingApproach.trim(),
    missingInfoQuestions: unique(draft.missingInfoQuestions),
    riskFlags: unique(draft.riskFlags),
    assumptions: unique(draft.assumptions),
  };
}

export function createExtractionReviewLocalBackup(
  draft: ExtractionReviewDraft,
  updatedAt = new Date().toISOString(),
): ExtractionReviewLocalBackup {
  return {
    review: normalizeExtractionReviewDraft(draft),
    updatedAt,
  };
}

export function parseExtractionReviewLocalBackup(raw: string | null) {
  if (!raw) {
    return null;
  }

  try {
    const parsed = JSON.parse(raw) as unknown;

    if (isExtractionReviewDraft(parsed)) {
      return {
        review: normalizeExtractionReviewDraft(parsed),
        updatedAt: null,
      } satisfies ExtractionReviewLocalBackup;
    }

    if (
      parsed &&
      typeof parsed === "object" &&
      !Array.isArray(parsed) &&
      "review" in parsed &&
      isExtractionReviewDraft((parsed as Record<string, unknown>).review)
    ) {
      const backup = parsed as {
        review: ExtractionReviewDraft;
        updatedAt?: unknown;
      };

      return {
        review: normalizeExtractionReviewDraft(backup.review),
        updatedAt:
          typeof backup.updatedAt === "string" && !Number.isNaN(Date.parse(backup.updatedAt))
            ? backup.updatedAt
            : null,
      } satisfies ExtractionReviewLocalBackup;
    }
  } catch (error) {
    console.error("extraction_review_backup_parse_failed", error);
  }

  return null;
}

export function shouldUseLocalExtractionReview(
  localUpdatedAt: string | null,
  workspaceUpdatedAt?: string | null,
) {
  if (!workspaceUpdatedAt) {
    return true;
  }

  if (!localUpdatedAt) {
    return false;
  }

  return Date.parse(localUpdatedAt) > Date.parse(workspaceUpdatedAt);
}

export function createExtractionReviewDraft(
  submission: SavedSubmission,
): ExtractionReviewDraft {
  const assumptions = submission.analysis.missingInfoPrompts.map((prompt) => {
    if (prompt.key === "copy-ownership") {
      return "Client supplies approved copy unless copywriting is separately added.";
    }
    if (prompt.key === "migration") {
      return "Migration is limited to the pages, redirects, and cleanup tasks explicitly approved.";
    }
    if (prompt.key === "revisions") {
      return "Revision rounds stay fixed and extra feedback cycles become change-order scope.";
    }
    if (prompt.key === "integrations") {
      return "Only the named integrations and tested launch requirements are included.";
    }

    return prompt.whyItMatters;
  });

  return normalizeExtractionReviewDraft({
    summary: submission.analysis.internalSummary,
    pricingApproach: submission.analysis.pricingGuidance.recommendedApproach,
    missingInfoQuestions: submission.analysis.missingInfoPrompts.map(
      (prompt) => prompt.question,
    ),
    riskFlags: submission.analysis.riskFlags.map(
      (flag) => `${flag.label}: ${flag.reason}`,
    ),
    assumptions,
  });
}

export function applyExtractionReviewOverridesToProposalDraft(
  draft: ProposalPackDraft,
  overrides: ExtractionReviewOverrides,
) {
  const normalizedOverrides = normalizeExtractionReviewDraft(overrides);
  let nextDraft: ProposalPackDraft = {
    ...draft,
    internalNotes: {
      ...draft.internalNotes,
      summary: normalizedOverrides.summary,
      recommendedApproach: normalizedOverrides.pricingApproach,
      riskFlags: normalizedOverrides.riskFlags,
      missingInfoQuestions: normalizedOverrides.missingInfoQuestions,
    },
  };

  nextDraft = replaceSectionBody(
    nextDraft,
    "deal-summary",
    [
      nextDraft.blocks.find((block) => block.id === "deal-summary")?.body.split("\n\n")[0] ??
        "Generated from ScopeOS review.",
      "",
      `Scope review summary: ${normalizedOverrides.summary}`,
    ].join("\n"),
  );

  nextDraft = replaceSectionBody(
    nextDraft,
    "assumptions",
    listToMarkdown(normalizedOverrides.assumptions),
  );

  nextDraft = replaceSectionBody(
    nextDraft,
    "clarification-questions",
    listToMarkdown(normalizedOverrides.missingInfoQuestions),
  );

  return nextDraft;
}
