import { describe, expect, it } from "vitest";
import { conciergeTestCases } from "../../concierge-tests/cases";
import { createProposalPackDraft } from "./proposal-pack";
import { applyExtractionReviewOverridesToProposalDraft, createExtractionReviewDraft } from "./extraction-review";
import { analyzeRiskCheckSubmission } from "./risk-check-analysis";
import { generateProposalPackAiSuggestion, type ProposalPackAiContext } from "./proposal-pack-ai";

function buildTestContext(): ProposalPackAiContext {
  const form = {
    ...conciergeTestCases[0].form,
    consent: true as const,
  };
  const analysis = analyzeRiskCheckSubmission(form);
  const submission = {
    id: "submission-proposal-ai-test",
    createdAt: "2026-04-13T00:00:00.000Z",
    payload: form,
    attachment: null,
    analysis,
  } as const;
  const baseDraft = createProposalPackDraft(submission);
  const reviewedDraft = applyExtractionReviewOverridesToProposalDraft(
    baseDraft,
    createExtractionReviewDraft(submission),
  );

  return {
    submission,
    draft: reviewedDraft,
    proposalMemory: [],
    changeOrderDraft: {
      driftItems: ["Add two extra landing pages"],
      impactNotes: "This would extend design and implementation time by one week.",
    },
  };
}

describe("generateProposalPackAiSuggestion", () => {
  it("falls back to the deterministic proposal pack when no AI provider is configured", async () => {
    const context = buildTestContext();

    const suggestion = await generateProposalPackAiSuggestion(context, {
      config: null,
    });

    expect(suggestion.mode).toBe("fallback");
    expect(suggestion.provider).toBeNull();
    expect(suggestion.modelName).toBeNull();
    expect(suggestion.blockUpdates).toHaveLength(context.draft.blocks.length);
    expect(suggestion.rationale.length).toBeGreaterThan(0);
  });

  it("parses a structured AI response and preserves proposal block ids", async () => {
    const context = buildTestContext();
    const fetchImpl = async () =>
      new Response(
        JSON.stringify({
          choices: [
            {
              message: {
                content: JSON.stringify({
                  confidence: "high",
                  rationale: ["The rewrite keeps the scope narrow.", "The language is tighter."],
                  notes: ["Review the pricing tiers before sending."],
                  blockUpdates: context.draft.blocks.map((block) => ({
                    id: block.id,
                    title: block.title,
                    kind: block.kind,
                    body: `${block.body}\n\nAI polish applied.`,
                  })),
                }),
              },
            },
          ],
        }),
        {
          status: 200,
          headers: {
            "Content-Type": "application/json",
          },
        },
      );

    const suggestion = await generateProposalPackAiSuggestion(context, {
      config: {
        baseUrl: "https://api.openai.com/v1",
        apiKey: "test-key",
        model: "gpt-test",
      },
      fetchImpl,
    });

    expect(suggestion.mode).toBe("llm");
    expect(suggestion.provider).toBe("openai");
    expect(suggestion.modelName).toBe("gpt-test");
    expect(suggestion.blockUpdates).toHaveLength(context.draft.blocks.length);
    expect(suggestion.blockUpdates[0].body).toContain("AI polish applied.");
    expect(suggestion.notes[0]).toContain("pricing tiers");
  });
});
