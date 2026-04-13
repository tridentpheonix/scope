import { describe, expect, it } from "vitest";
import { conciergeTestCases } from "../../concierge-tests/cases";
import { createExtractionReviewDraft } from "./extraction-review";
import {
  generateExtractionReviewAiSuggestion,
  type ExtractionReviewAiContext,
} from "./extraction-review-ai";
import { analyzeRiskCheckSubmission } from "./risk-check-analysis";

function buildTestContext(): ExtractionReviewAiContext {
  const form = {
    ...conciergeTestCases[0].form,
    consent: true as const,
  };
  const analysis = analyzeRiskCheckSubmission(form);
  const submission = {
    id: "submission-ai-test",
    createdAt: "2026-04-13T00:00:00.000Z",
    payload: form,
    attachment: null,
    analysis,
  } as const;

  return {
    submission,
    review: createExtractionReviewDraft(submission),
  };
}

describe("generateExtractionReviewAiSuggestion", () => {
  it("falls back to the deterministic review when no AI provider is configured", async () => {
    const context = buildTestContext();

    const suggestion = await generateExtractionReviewAiSuggestion(context, {
      config: null,
    });

    expect(suggestion.mode).toBe("fallback");
    expect(suggestion.provider).toBeNull();
    expect(suggestion.modelName).toBeNull();
    expect(suggestion.suggestedReview.summary).toBe(context.review.summary);
    expect(suggestion.rationale.length).toBeGreaterThan(0);
  });

  it("parses a structured AI response and normalizes the result", async () => {
    const context = buildTestContext();
    const fetchImpl = async () =>
      new Response(
        JSON.stringify({
          choices: [
            {
              message: {
                content: JSON.stringify({
                  summary: "The brief needs a tighter internal read before pricing.",
                  pricingApproach:
                    "Keep the baseline tier tight and treat copy and migration as separate scope until confirmed.",
                  missingInfoQuestions: [
                    "Who owns content approval?",
                    "What is the final page count?",
                  ],
                  riskFlags: [
                    "Copy ownership is still unclear",
                    "Migration work could expand quickly",
                  ],
                  assumptions: [
                    "Client supplies approved copy",
                    "Migration is limited to approved pages",
                  ],
                  rationale: ["The review stays conservative.", "This reduces margin risk."],
                  notes: ["Use this review as the founder pass before proposal generation."],
                  confidence: "high",
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

    const suggestion = await generateExtractionReviewAiSuggestion(context, {
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
    expect(suggestion.confidence).toBe("high");
    expect(suggestion.suggestedReview.missingInfoQuestions).toHaveLength(2);
    expect(suggestion.notes[0]).toContain("founder pass");
  });
});
