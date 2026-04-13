import { z } from "zod";
import {
  readAiMessageContent,
  resolveAiProviderConfig,
  type AiProviderConfig,
  type AiProviderName,
} from "./ai-provider";
import { normalizeExtractionReviewDraft, type ExtractionReviewDraft } from "./extraction-review";
import { createRiskCheckAnalysisPreview } from "./risk-check-analysis";
import { getBriefSourceLabel, getProjectTypeLabel, getSummaryPreview } from "./risk-check-presenters";
import type { SavedSubmission } from "./risk-check-storage";

export type ExtractionReviewAiMode = "fallback" | "llm";
export type ExtractionReviewAiConfidence = "low" | "medium" | "high";

export type ExtractionReviewAiSuggestion = {
  mode: ExtractionReviewAiMode;
  provider: AiProviderName | null;
  modelName: string | null;
  generatedAt: string;
  confidence: ExtractionReviewAiConfidence;
  suggestedReview: ExtractionReviewDraft;
  rationale: string[];
  notes: string[];
};

const extractionReviewAiSchema = z.object({
  summary: z
    .string()
    .trim()
    .min(20, "Summary should contain a short internal read.")
    .max(1200, "Keep the summary concise."),
  pricingApproach: z
    .string()
    .trim()
    .min(20, "Pricing guidance should be practical, not vague.")
    .max(800, "Keep pricing guidance concise."),
  missingInfoQuestions: z
    .array(z.string().trim().min(5).max(240))
    .max(8, "Keep the question list short."),
  riskFlags: z
    .array(z.string().trim().min(5).max(240))
    .max(8, "Keep the risk list short."),
  assumptions: z
    .array(z.string().trim().min(5).max(240))
    .max(8, "Keep the assumptions list short."),
  rationale: z
    .array(z.string().trim().min(5).max(240))
    .max(6, "Keep the rationale short."),
  notes: z
    .array(z.string().trim().min(5).max(240))
    .max(4, "Keep the notes short."),
  confidence: z.enum(["low", "medium", "high"]),
});

export type ExtractionReviewAiConfig = AiProviderConfig;

export type ExtractionReviewAiContext = {
  submission: SavedSubmission;
  review: ExtractionReviewDraft;
};

export const extractionReviewAiResponseSchema = {
  name: "scopeos_extraction_review_ai",
  strict: true,
  schema: {
    type: "object",
    additionalProperties: false,
    properties: {
      summary: {
        type: "string",
        description:
          "A concise internal summary for a small web design agency. Keep it grounded in the deal details and scope risk.",
      },
      pricingApproach: {
        type: "string",
        description:
          "A practical pricing posture for the founder. State the pricing stance in plain English and avoid over-explaining.",
      },
      missingInfoQuestions: {
        type: "array",
        description:
          "A short list of the highest-value clarification questions that should be answered before final pricing.",
        items: {
          type: "string",
          description: "One clarification question the founder can ask the client.",
        },
      },
      riskFlags: {
        type: "array",
        description:
          "Short plain-English risk statements that explain what could break margin or scope clarity.",
        items: {
          type: "string",
          description: "One risk statement in plain English.",
        },
      },
      assumptions: {
        type: "array",
        description:
          "Assumptions that should carry into the proposal pack so the scope stays bounded.",
        items: {
          type: "string",
          description: "One short assumption sentence.",
        },
      },
      rationale: {
        type: "array",
        description:
          "A short set of bullets that explains why the review changed or stayed conservative.",
        items: {
          type: "string",
          description: "One short rationale bullet.",
        },
      },
      notes: {
        type: "array",
        description:
          "A few implementation notes for the founder about how to use this review.",
        items: {
          type: "string",
          description: "One short note.",
        },
      },
      confidence: {
        type: "string",
        enum: ["low", "medium", "high"],
        description: "How confident the AI is in the review quality.",
      },
    },
    required: [
      "summary",
      "pricingApproach",
      "missingInfoQuestions",
      "riskFlags",
      "assumptions",
      "rationale",
      "notes",
      "confidence",
    ],
  },
};

function getAiConfig(overrides?: Partial<ExtractionReviewAiConfig> | null) {
  return resolveAiProviderConfig(overrides);
}

function joinApiUrl(baseUrl: string, path: string) {
  return `${baseUrl.replace(/\/$/, "")}${path.startsWith("/") ? path : `/${path}`}`;
}

function toList(items: string[] | undefined | null) {
  return Array.from(new Set((items ?? []).map((item) => item.trim()).filter(Boolean)));
}

function buildCurrentReviewSnapshot(review: ExtractionReviewDraft) {
  const normalized = normalizeExtractionReviewDraft(review);

  return {
    summary: normalized.summary,
    pricingApproach: normalized.pricingApproach,
    missingInfoQuestions: normalized.missingInfoQuestions,
    riskFlags: normalized.riskFlags,
    assumptions: normalized.assumptions,
  };
}

function buildSubmissionSnapshot(context: ExtractionReviewAiContext) {
  const preview = createRiskCheckAnalysisPreview(context.submission.analysis);

  return {
    submissionId: context.submission.id,
    createdAt: context.submission.createdAt,
    agencyName: context.submission.payload.agencyName,
    projectType: context.submission.payload.projectType,
    projectTypeLabel: getProjectTypeLabel(context.submission.payload.projectType),
    briefSource: context.submission.payload.briefSource,
    briefSourceLabel: getBriefSourceLabel(context.submission.payload.briefSource),
    briefPreview: getSummaryPreview(context.submission.payload.summary, 300),
    analysisPreview: preview,
    currentReview: buildCurrentReviewSnapshot(context.review),
  };
}

function buildSystemPrompt() {
  return [
    "You are ScopeOS, an internal scoping copilot for small web design agencies.",
    "Your job is to tighten a founder's internal extraction review before proposal generation.",
    "Stay conservative, preserve scope boundaries, and do not invent deliverables or broader product features.",
    "Return only JSON that matches the requested schema.",
  ].join(" ");
}

function buildUserPrompt(context: ExtractionReviewAiContext) {
  const snapshot = buildSubmissionSnapshot(context);

  return [
    "Review context:",
    JSON.stringify(snapshot, null, 2),
    "",
    "Task:",
    "Refine the internal summary, pricing approach, clarification questions, risk flags, assumptions, rationale, and notes for this deal.",
    "",
    "Rules:",
    "- Keep the summary short and operational.",
    "- Keep the pricing approach decisive and grounded in the actual scope signals.",
    "- Keep questions and risks short enough for a founder to scan quickly.",
    "- Preserve conservative assumptions; do not broaden the project beyond the website scope.",
    "- If the deterministic review is already strong, improve clarity instead of adding more text.",
  ].join("\n");
}

function buildFallbackSuggestion(
  context: ExtractionReviewAiContext,
  notes: string[],
  provider: AiProviderName | null = null,
): ExtractionReviewAiSuggestion {
  const review = normalizeExtractionReviewDraft(context.review);
  const preview = createRiskCheckAnalysisPreview(context.submission.analysis);

  return {
    mode: "fallback",
    provider,
    modelName: null,
    generatedAt: new Date().toISOString(),
    confidence: preview.pricingConfidence,
    suggestedReview: review,
    rationale: [
      "ScopeOS used the deterministic extraction review because no AI provider is connected yet.",
      `The current review already tracks the top risks: ${preview.topRisks.slice(0, 2).join(", ") || "the main scope risks"}.`,
    ],
    notes: toList([
      ...notes,
      "Connect an AI provider later to get a generated pass on top of the deterministic review.",
    ]),
  };
}

async function callOpenAiCompatibleCompletion(
  config: ExtractionReviewAiConfig,
  context: ExtractionReviewAiContext,
  fetchImpl: typeof fetch = fetch,
) {
  const requestTimeoutMs = 60_000;
  const abortController = new AbortController();
  const timeoutId = globalThis.setTimeout(() => abortController.abort(), requestTimeoutMs);

  try {
    const response = await fetchImpl(joinApiUrl(config.baseUrl, "/chat/completions"), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${config.apiKey}`,
      },
      body: JSON.stringify({
        model: config.model,
        temperature: 0.2,
        messages: [
          { role: "system", content: buildSystemPrompt() },
          { role: "user", content: buildUserPrompt(context) },
        ],
        response_format: {
          type: "json_schema",
          json_schema: extractionReviewAiResponseSchema,
        },
      }),
      signal: abortController.signal,
    });

    if (!response.ok) {
      throw new Error(`AI request failed with status ${response.status}`);
    }

    const payload = (await response.json()) as {
      choices?: Array<{ message?: { content?: unknown } }>;
    };

    const content = readAiMessageContent(payload.choices?.[0]?.message);
    if (!content) {
      throw new Error("AI response did not include content.");
    }

    const parsed = extractionReviewAiSchema.parse(JSON.parse(content) as unknown);

    return {
      mode: "llm" as const,
      provider: config.provider,
      modelName: config.model,
      generatedAt: new Date().toISOString(),
      confidence: parsed.confidence,
      suggestedReview: normalizeExtractionReviewDraft({
        summary: parsed.summary,
        pricingApproach: parsed.pricingApproach,
        missingInfoQuestions: toList(parsed.missingInfoQuestions),
        riskFlags: toList(parsed.riskFlags),
        assumptions: toList(parsed.assumptions),
      }),
      rationale: toList(parsed.rationale),
      notes: toList(parsed.notes),
    } satisfies ExtractionReviewAiSuggestion;
  } finally {
    globalThis.clearTimeout(timeoutId);
  }
}

export async function generateExtractionReviewAiSuggestion(
  context: ExtractionReviewAiContext,
  options?: {
    config?: Partial<ExtractionReviewAiConfig> | null;
    fetchImpl?: typeof fetch;
  },
) {
  const config = getAiConfig(options?.config);
  if (!config) {
    return buildFallbackSuggestion(context, []);
  }

  try {
    return await callOpenAiCompatibleCompletion(
      config,
      context,
      options?.fetchImpl ?? fetch,
    );
  } catch (error) {
    console.error("extraction_review_ai_generation_failed", error);
    return buildFallbackSuggestion(context, [
      "AI generation failed or timed out, so ScopeOS returned the deterministic review instead.",
    ], config.provider);
  }
}
