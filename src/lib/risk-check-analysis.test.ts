import { describe, expect, it } from "vitest";
import { conciergeTestCases } from "../../concierge-tests/cases";
import {
  analyzeRiskCheckSubmission,
  createRiskCheckAnalysisPreview,
} from "./risk-check-analysis";

describe("analyzeRiskCheckSubmission", () => {
  it("surfaces the repeated missing-info and pricing signals from concierge cases", () => {
    for (const testCase of conciergeTestCases) {
      const analysis = analyzeRiskCheckSubmission({
        ...testCase.form,
        consent: true,
      });
      const searchableText = [
        analysis.internalSummary,
        analysis.pricingGuidance.recommendedApproach,
        ...analysis.promptGuidance,
        ...analysis.missingInfoPrompts.map((item) => item.whyItMatters),
        ...analysis.riskFlags.map((item) => item.reason),
      ]
        .join(" ")
        .toLowerCase();

      for (const signal of testCase.expectedSignals) {
        expect(searchableText, `${testCase.slug} should include ${signal}`).toContain(
          signal.toLowerCase(),
        );
      }
    }
  });

  it("creates a UI-safe preview with top questions and risks", () => {
    const analysis = analyzeRiskCheckSubmission({
      ...conciergeTestCases[0].form,
      consent: true,
    });

    const preview = createRiskCheckAnalysisPreview(analysis);

    expect(preview.topQuestions.length).toBeGreaterThan(0);
    expect(preview.topQuestions.length).toBeLessThanOrEqual(3);
    expect(preview.topRisks.length).toBeGreaterThan(0);
    expect(preview.recommendedApproach.length).toBeGreaterThan(20);
  });
});
