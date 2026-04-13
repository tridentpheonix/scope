import { describe, expect, it } from "vitest";
import { applyClausePackToBodies, clausePacks } from "./clause-packs";

describe("applyClausePackToBodies", () => {
  it("appends clause pack content to proposal blocks", () => {
    const pack = clausePacks[0];
    const result = applyClausePackToBodies(
      {
        assumptions: "- Existing assumption.",
        exclusions: "",
        "commercial-terms": "",
      },
      pack,
    );

    expect(result.assumptions).toContain("Pack:");
    expect(result.assumptions).toContain(pack.assumptions[0]);
    expect(result.exclusions).toContain(pack.exclusions[0]);
    expect(result["commercial-terms"]).toContain(pack.commercialTerms[0]);
  });

  it("avoids duplicating the same pack", () => {
    const pack = clausePacks[1];
    const once = applyClausePackToBodies(
      {
        assumptions: "",
        exclusions: "",
        "commercial-terms": "",
      },
      pack,
    );
    const twice = applyClausePackToBodies(once, pack);

    const occurrences = twice.assumptions.split(`Pack: ${pack.title}`).length - 1;
    expect(occurrences).toBe(1);
  });
});
