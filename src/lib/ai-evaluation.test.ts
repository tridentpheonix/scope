import { describe, expect, it } from "vitest";
import { buildAiEvalCases, formatAiEvaluationReport, runAiEvaluationSuite } from "./ai-evaluation";

function extractSnapshotFromPrompt(prompt: string) {
  const start = prompt.indexOf("{");
  const end = prompt.lastIndexOf("}");

  if (start < 0 || end < start) {
    return null;
  }

  try {
    return JSON.parse(prompt.slice(start, end + 1)) as {
      blocks?: Array<{ id: string; title: string; kind: "section" | "pricing" }>;
    };
  } catch {
    return null;
  }
}

function createMockFetch(mode: "good" | "bad") {
  return async (input: RequestInfo | URL, init?: RequestInit) => {
    const body = typeof init?.body === "string" ? JSON.parse(init.body) : null;
    const schemaName = body?.response_format?.json_schema?.name;
    const prompt = body?.messages?.[1]?.content;
    const snapshot = typeof prompt === "string" ? extractSnapshotFromPrompt(prompt) : null;

    if (mode === "bad") {
      if (schemaName === "scopeos_extraction_review_ai") {
        return new Response(
          JSON.stringify({
            choices: [
              {
                message: {
                  content: JSON.stringify({
                    summary:
                      "The brief is vague enough that pricing should stay conservative until more decisions are confirmed.",
                    pricingApproach:
                      "Keep the scope small and delay fixed pricing until the missing decisions are answered.",
                    missingInfoQuestions: [],
                    riskFlags: [],
                    assumptions: [],
                    rationale: ["The scope is still too vague to price confidently."],
                    notes: ["Use this as a fallback only."],
                    confidence: "low",
                  }),
                },
              },
            ],
          }),
          {
            status: 200,
            headers: { "Content-Type": "application/json" },
          },
        );
      }

      return new Response(
        JSON.stringify({
          choices: [
            {
              message: {
                content: JSON.stringify({
                  confidence: "low",
                  rationale: [],
                  notes: [],
                  blockUpdates: (snapshot?.blocks ?? []).map(
                    (block: { id: string; title: string; kind: "section" | "pricing" }) => ({
                      id: block.id,
                      title: block.title,
                      kind: block.kind,
                      body: "Keep the approved scope tight and do not add new services.",
                    }),
                  ),
                }),
              },
            },
          ],
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" },
        },
      );
    }

    if (schemaName === "scopeos_extraction_review_ai") {
      return new Response(
        JSON.stringify({
          choices: [
            {
              message: {
                content: JSON.stringify({
                  summary:
                    "Copy ownership, migration, SEO, assets, and revision boundaries still need a tighter internal read before pricing.",
                  pricingApproach:
                    "Keep copy, migration, integrations, revisions, support, and launch cleanup outside the base fee until they are confirmed.",
                  missingInfoQuestions: [
                    "Who owns copy approval and collection?",
                    "How many redirects, blog posts, and migration tasks are included?",
                    "Are HubSpot forms or other integrations part of launch?",
                  ],
                  riskFlags: [
                    "Copy ownership is unclear",
                    "Migration and redirect work could expand quickly",
                    "Revision scope and support expectations still need boundaries",
                  ],
                  assumptions: [
                    "Client supplies approved copy",
                    "Only the named migration tasks are included",
                    "Launch support is limited to the agreed window",
                  ],
                  rationale: [
                    "The review keeps the scope conservative.",
                    "It keeps ambiguous work from hiding inside the base price.",
                  ],
                  notes: [
                    "Use this as the founder pass before proposal generation.",
                    "Keep the conversation tight around scope, approval, and launch boundaries.",
                  ],
                  confidence: "high",
                }),
              },
            },
          ],
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" },
        },
      );
    }

    const blocks = snapshot?.blocks ?? [];
    return new Response(
      JSON.stringify({
        choices: [
          {
            message: {
              content: JSON.stringify({
                confidence: "high",
                rationale: [
                  "The rewrite keeps copy, migration, and revision scope tight.",
                  "The proposal stays sellable without broadening the service offering.",
                ],
                notes: [
                  "Review the pricing tiers and change-order language before sending.",
                ],
                blockUpdates: blocks.map((block: { id: string; title: string; kind: "section" | "pricing" }) => ({
                  id: block.id,
                  title: block.title,
                  kind: block.kind,
                  body: [
                    `${block.title} keeps the scope anchored to the approved work.`,
                    "Copy, migration, SEO, revisions, support, and launch dependencies stay bounded.",
                    `Block id ${block.id} remains intact for safe replacement.`,
                  ].join("\n\n"),
                })),
              }),
            },
          },
        ],
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      },
    );
  };
}

describe("AI evaluation harness", () => {
  it("builds the representative concierge cases", () => {
    const cases = buildAiEvalCases();
    expect(cases).toHaveLength(3);
    expect(cases[0].coverageTerms.length).toBeGreaterThan(0);
  });

  it("passes fallback-only evaluation for the built-in cases", async () => {
    const report = await runAiEvaluationSuite({
      includeLive: false,
    });

    expect(report.passed).toBe(true);
    expect(report.results.every((result) => result.mode === "fallback")).toBe(true);
    expect(formatAiEvaluationReport(report)).toContain("AI evaluation report: PASS");
  });

  it("passes live-style evaluation against structured mock completions", async () => {
    const report = await runAiEvaluationSuite({
      config: {
        provider: "openai",
        baseUrl: "https://api.openai.com/v1",
        apiKey: "test-key",
        model: "gpt-test",
      },
      fetchImpl: createMockFetch("good"),
    });

    expect(report.passed).toBe(true);
    expect(report.results.some((result) => result.mode === "live")).toBe(true);
    expect(report.results.every((result) => result.score >= 75)).toBe(true);
  });

  it("flags obviously broken completions as regressions", async () => {
    const report = await runAiEvaluationSuite({
      config: {
        provider: "openai",
        baseUrl: "https://api.openai.com/v1",
        apiKey: "test-key",
        model: "gpt-test",
      },
      fetchImpl: createMockFetch("bad"),
    });

    expect(report.passed).toBe(false);
    expect(report.results.some((result) => result.score < 75)).toBe(true);
  });
});
