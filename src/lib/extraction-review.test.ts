import { describe, expect, it } from "vitest";
import { conciergeTestCases } from "../../concierge-tests/cases";
import { analyzeRiskCheckSubmission } from "./risk-check-analysis";
import {
  applyExtractionReviewOverridesToProposalDraft,
  createExtractionReviewDraft,
} from "./extraction-review";
import { createProposalPackDraft } from "./proposal-pack";

describe("extraction review helpers", () => {
  it("creates an editable extraction review draft from a saved submission", () => {
    const testCase = conciergeTestCases[0];
    const submission = {
      id: "review-1",
      createdAt: "2026-04-11T00:00:00.000Z",
      payload: {
        ...testCase.form,
        consent: true,
      },
      attachment: null,
      analysis: analyzeRiskCheckSubmission({
        ...testCase.form,
        consent: true,
      }),
    };

    const draft = createExtractionReviewDraft(submission);

    expect(draft.summary.length).toBeGreaterThan(20);
    expect(draft.missingInfoQuestions.length).toBeGreaterThan(0);
    expect(draft.assumptions.length).toBeGreaterThan(0);
  });

  it("applies extraction review edits into the proposal draft without exposing internal sections", () => {
    const testCase = conciergeTestCases[2];
    const submission = {
      id: "review-2",
      createdAt: "2026-04-11T00:00:00.000Z",
      payload: {
        ...testCase.form,
        consent: true,
      },
      attachment: null,
      analysis: analyzeRiskCheckSubmission({
        ...testCase.form,
        consent: true,
      }),
    };

    const proposalDraft = createProposalPackDraft(submission);
    const reviewedDraft = applyExtractionReviewOverridesToProposalDraft(proposalDraft, {
      summary: "Tighten this Webflow deal around asset readiness and revision limits.",
      pricingApproach: "Keep the middle tier narrow and push optional automations into add-ons.",
      missingInfoQuestions: ["Who owns the final copy and photography approval?"],
      riskFlags: ["Revision boundaries are vague and should stay out of the base scope."],
      assumptions: ["Client delivers final copy before build starts."],
    });

    expect(reviewedDraft.internalNotes.summary).toContain("Tighten this Webflow deal");
    expect(
      reviewedDraft.blocks.find((block) => block.id === "assumptions")?.body,
    ).toContain("Client delivers final copy before build starts.");
    expect(
      reviewedDraft.blocks.find((block) => block.id === "clarification-questions")?.body,
    ).toContain("Who owns the final copy and photography approval?");
  });
});
