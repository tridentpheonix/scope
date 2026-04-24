import { describe, expect, it } from "vitest";
import { normalizeBrandSettingsInput } from "./workspace-settings";

describe("workspace brand settings", () => {
  it("normalizes invalid colors and trims long text inputs", () => {
    const settings = normalizeBrandSettingsInput({
      brandName: "  Scope Studio  ",
      primaryColor: "javascript:alert(1)",
      accentColor: "#22c55e",
      exportFooter: "  Prepared for review.  ",
    });

    expect(settings.brandName).toBe("Scope Studio");
    expect(settings.primaryColor).toBe("#0f172a");
    expect(settings.accentColor).toBe("#22c55e");
    expect(settings.exportFooter).toBe("Prepared for review.");
  });
});
