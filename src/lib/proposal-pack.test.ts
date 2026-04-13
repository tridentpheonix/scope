import { describe, expect, it } from "vitest";
import { conciergeTestCases } from "../../concierge-tests/cases";
import { analyzeRiskCheckSubmission } from "./risk-check-analysis";
import {
  buildProposalPackHtml,
  buildProposalPackMarkdown,
  createProposalPackDraft,
} from "./proposal-pack";

describe("createProposalPackDraft", () => {
  it("creates an editable proposal pack with exportable sections and pricing tiers", () => {
    const testCase = conciergeTestCases[0];
    const draft = createProposalPackDraft({
      id: "case-1",
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
    });

    expect(draft.title).toContain(testCase.form.agencyName);
    expect(draft.blocks.some((block) => block.title === "Scope snapshot")).toBe(true);
    expect(draft.blocks.filter((block) => block.kind === "pricing")).toHaveLength(3);
    expect(draft.internalNotes.riskFlags.length).toBeGreaterThan(0);
  });

  it("builds markdown that includes proposal sections but not internal-only notes", () => {
    const testCase = conciergeTestCases[1];
    const draft = createProposalPackDraft({
      id: "case-2",
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
    });

    const markdown = buildProposalPackMarkdown(draft);

    expect(markdown).toContain("## Scope snapshot");
    expect(markdown).toContain("## Lean scope pricing tier");
    expect(markdown).not.toContain("Not exported");
    expect(markdown).not.toContain("## Internal prep notes");
    expect(markdown).not.toContain("## Questions to resolve");
  });

  it("builds branded HTML with title and sections", () => {
    const testCase = conciergeTestCases[2];
    const draft = createProposalPackDraft({
      id: "case-3",
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
    });

    const html = buildProposalPackHtml(draft, "light");

    expect(html).toContain(draft.title);
    expect(html).toContain("Scope snapshot");
    expect(html).toContain("ScopeOS branded proposal pack");
  });

  it("supports dark theme HTML output", () => {
    const testCase = conciergeTestCases[0];
    const draft = createProposalPackDraft({
      id: "case-4",
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
    });

    const html = buildProposalPackHtml(draft, "dark");

    expect(html).toContain("Theme: Dark");
    expect(html).toContain("--paper");
  });
});
