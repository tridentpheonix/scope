import { describe, expect, it } from "vitest";
import { buildProposalPackHtml, type ProposalPackDraft } from "./proposal-pack";

const draft = {
  title: "Proposal <script>",
  subtitle: "Client-ready draft",
  exportedAtLabel: "April 24, 2026",
  blocks: [
    {
      id: "scope",
      title: "Scope",
      kind: "section",
      body: "- Safe item\n<script>alert(1)</script>",
    },
  ],
  internalNotes: {
    summary: "",
    recommendedApproach: "",
    riskFlags: [],
    missingInfoQuestions: [],
    commercialDefaults: [],
  },
} satisfies ProposalPackDraft;

describe("branded proposal export", () => {
  it("applies brand settings and escapes editable proposal content", () => {
    const html = buildProposalPackHtml(draft, "light", {
      brandName: "Agency <b>",
      primaryColor: "#111827",
      accentColor: "#0ea5e9",
      exportFooter: "Prepared by Agency <b>",
    });

    expect(html).toContain("Agency &lt;b&gt;");
    expect(html).toContain("Prepared by Agency &lt;b&gt;");
    expect(html).toContain("&lt;script&gt;alert(1)&lt;/script&gt;");
    expect(html).not.toContain("<script>alert(1)</script>");
  });
});
