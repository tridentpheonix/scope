import { describe, expect, it } from "vitest";
import { createSampleSubmission, sampleBriefs } from "./sample-scope";

describe("public sample scope demo", () => {
  it("creates demo-only analyzed submissions without persistence", () => {
    const submission = createSampleSubmission(sampleBriefs[0]);

    expect(submission.id).toMatch(/^sample-/);
    expect(submission.attachment).toBeNull();
    expect(submission.analysis.riskFlags.length).toBeGreaterThan(0);
    expect(submission.analysis.missingInfoPrompts.length).toBeGreaterThan(0);
  });
});
