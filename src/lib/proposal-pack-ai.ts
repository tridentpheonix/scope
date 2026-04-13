import { z } from "zod";
import {
  readAiMessageContent,
  resolveAiProviderConfig,
  type AiProviderConfig,
  type AiProviderName,
} from "./ai-provider";
import type { ChangeOrderDraft } from "./change-order";
import { buildChangeOrderSummary } from "./change-order";
import {
  getBriefSourceLabel,
  getProjectTypeLabel,
  getSummaryPreview,
} from "./risk-check-presenters";
import type { ProposalPackBlock, ProposalPackDraft } from "./proposal-pack";
import type { ProposalMemoryItem } from "./proposal-memory";
import type { SavedSubmission } from "./risk-check-storage";

export type ProposalPackAiMode = "fallback" | "llm";
export type ProposalPackAiConfidence = "low" | "medium" | "high";

export type ProposalPackAiSuggestion = {
  mode: ProposalPackAiMode;
  provider: AiProviderName | null;
  modelName: string | null;
  generatedAt: string;
  confidence: ProposalPackAiConfidence;
  blockUpdates: ProposalPackBlock[];
  rationale: string[];
  notes: string[];
};

export type ProposalPackAiContext = {
  submission: SavedSubmission;
  draft: ProposalPackDraft;
  proposalMemory: ProposalMemoryItem[];
  changeOrderDraft: ChangeOrderDraft | null;
};

const allowedBlockIds = [
  "deal-summary",
  "scope-snapshot",
  "deliverables",
  "pricing-tier-1",
  "pricing-tier-2",
  "pricing-tier-3",
  "commercial-terms",
  "assumptions",
  "exclusions",
  "timeline",
  "clarification-questions",
  "change-order",
] as const;

const proposalPackAiSchema = z.object({
  confidence: z.enum(["low", "medium", "high"]),
  rationale: z.array(z.string().trim().min(5).max(240)).max(6),
  notes: z.array(z.string().trim().min(5).max(240)).max(4),
  blockUpdates: z
    .array(
      z.object({
        id: z.enum(allowedBlockIds),
        title: z.string().trim().min(2).max(120),
        kind: z.enum(["section", "pricing"]),
        body: z.string().trim().min(20).max(12000),
      }),
    )
    .min(1)
    .max(12),
});

export type ProposalPackAiConfig = AiProviderConfig;

export const proposalPackAiResponseSchema = {
  name: "scopeos_proposal_pack_ai",
  strict: true,
  schema: {
    type: "object",
    additionalProperties: false,
    properties: {
      confidence: {
        type: "string",
        enum: ["low", "medium", "high"],
        description: "How confident the AI is that the rewrite improves clarity without changing scope.",
      },
      rationale: {
        type: "array",
        description:
          "Short bullets explaining the main improvements made to the proposal copy.",
        items: {
          type: "string",
          description: "One short rationale bullet.",
        },
      },
      notes: {
        type: "array",
        description:
          "Short implementation notes for the founder about how to review the rewritten pack.",
        items: {
          type: "string",
          description: "One short note.",
        },
      },
      blockUpdates: {
        type: "array",
        description:
          "The client-facing proposal blocks that should be replaced with clearer AI-written copy.",
        items: {
          type: "object",
          additionalProperties: false,
          properties: {
            id: {
              type: "string",
              enum: allowedBlockIds,
              description: "The proposal block identifier to replace.",
            },
            title: {
              type: "string",
              description: "The section title for the block.",
            },
            kind: {
              type: "string",
              enum: ["section", "pricing"],
              description: "Whether this block is a general section or a pricing block.",
            },
            body: {
              type: "string",
              description: "The rewritten client-facing body text for the block.",
            },
          },
          required: ["id", "title", "kind", "body"],
        },
      },
    },
    required: ["confidence", "rationale", "notes", "blockUpdates"],
  },
};

function getAiConfig(overrides?: Partial<ProposalPackAiConfig> | null) {
  return resolveAiProviderConfig(overrides);
}

function joinApiUrl(baseUrl: string, path: string) {
  return `${baseUrl.replace(/\/$/, "")}${path.startsWith("/") ? path : `/${path}`}`;
}

function toList(items: string[] | undefined | null) {
  return Array.from(new Set((items ?? []).map((item) => item.trim()).filter(Boolean)));
}

function buildDraftSnapshot(context: ProposalPackAiContext) {
  return {
    submissionId: context.submission.id,
    agencyName: context.submission.payload.agencyName,
    projectType: context.submission.payload.projectType,
    projectTypeLabel: getProjectTypeLabel(context.submission.payload.projectType),
    briefSource: context.submission.payload.briefSource,
    briefSourceLabel: getBriefSourceLabel(context.submission.payload.briefSource),
    briefPreview: getSummaryPreview(context.submission.payload.summary, 300),
    draftTitle: context.draft.title,
    draftSubtitle: context.draft.subtitle,
    blocks: context.draft.blocks.map((block) => ({
      id: block.id,
      title: block.title,
      kind: block.kind,
      body: block.body,
    })),
    internalNotes: context.draft.internalNotes,
    proposalMemory: context.proposalMemory.map((item) => ({
      title: item.title,
      updatedAt: item.updatedAt,
      assumptions: getSummaryPreview(item.blocks.assumptions, 180),
      exclusions: getSummaryPreview(item.blocks.exclusions, 180),
      commercialTerms: getSummaryPreview(item.blocks.commercialTerms, 180),
    })),
    changeOrderSummary: context.changeOrderDraft
      ? buildChangeOrderSummary(context.changeOrderDraft)
      : "No current change order captured.",
  };
}

function buildSystemPrompt() {
  return [
    "You are ScopeOS, a proposal-writing copilot for small web design agencies.",
    "Your job is to tighten the client-facing proposal pack without changing the business decision.",
    "Preserve scope boundaries, keep commercial terms conservative, and avoid adding broad services.",
    "Return only JSON that matches the schema.",
  ].join(" ");
}

function buildUserPrompt(context: ProposalPackAiContext) {
  const snapshot = buildDraftSnapshot(context);

  return [
    "Proposal pack context:",
    JSON.stringify(snapshot, null, 2),
    "",
    "Task:",
    "Rewrite the client-facing proposal pack blocks so the copy is clearer, more concise, and more sellable for a small web design agency.",
    "",
    "Rules:",
    "- Keep the deal scope narrow and do not broaden the service offering.",
    "- Preserve the pricing stance and the meaning of the current draft.",
    "- Rewrite the whole pack if needed, but do not invent new services or legal terms.",
    "- Make assumptions, exclusions, and change-order language crisp and founder-friendly.",
    "- Use the memory examples only as reuse hints, not as rigid templates.",
  ].join("\n");
}

function buildFallbackSuggestion(
  context: ProposalPackAiContext,
  notes: string[],
  provider: AiProviderName | null = null,
): ProposalPackAiSuggestion {
  return {
    mode: "fallback",
    provider,
    modelName: null,
    generatedAt: new Date().toISOString(),
    confidence: context.submission.analysis.pricingGuidance.pricingConfidence,
    blockUpdates: context.draft.blocks,
    rationale: [
      "ScopeOS used the deterministic proposal draft because no AI provider is connected yet.",
      "The current draft still reflects the reviewed scope, pricing posture, and clause logic.",
    ],
    notes: toList([
      ...notes,
      "Connect an AI provider later to get an AI rewrite of the proposal copy.",
    ]),
  };
}

async function callOpenAiCompatibleCompletion(
  config: ProposalPackAiConfig,
  context: ProposalPackAiContext,
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
          json_schema: proposalPackAiResponseSchema,
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

    const parsed = proposalPackAiSchema.parse(JSON.parse(content) as unknown);

    return {
      mode: "llm" as const,
      provider: config.provider,
      modelName: config.model,
      generatedAt: new Date().toISOString(),
      confidence: parsed.confidence,
      blockUpdates: parsed.blockUpdates,
      rationale: toList(parsed.rationale),
      notes: toList(parsed.notes),
    } satisfies ProposalPackAiSuggestion;
  } finally {
    globalThis.clearTimeout(timeoutId);
  }
}

export async function generateProposalPackAiSuggestion(
  context: ProposalPackAiContext,
  options?: {
    config?: Partial<ProposalPackAiConfig> | null;
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
    console.error("proposal_pack_ai_generation_failed", error);
    return buildFallbackSuggestion(context, [
      "AI generation failed or timed out, so ScopeOS returned the deterministic proposal draft instead.",
    ], config.provider);
  }
}
