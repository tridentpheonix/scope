import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { createDiagnosticEntry, recordDiagnostic } from "./diagnostics";

describe("diagnostics", () => {
  it("creates a structured diagnostic entry", () => {
    const entry = createDiagnosticEntry("error", "billing", "billing_checkout_failed", {
      route: "/api/billing/checkout",
      status: 500,
      message: "Could not create checkout",
      workspaceId: "workspace-1",
      submissionId: "submission-1",
      details: { planKey: "solo" },
      error: new Error("boom"),
    });

    expect(entry).toMatchObject({
      level: "error",
      area: "billing",
      event: "billing_checkout_failed",
      route: "/api/billing/checkout",
      status: 500,
      message: "Could not create checkout",
      workspaceId: "workspace-1",
      submissionId: "submission-1",
      details: { planKey: "solo" },
      error: {
        name: "Error",
        message: "boom",
      },
    });
  });

  it("writes diagnostics to a workspace log file", async () => {
    const baseDir = path.join(process.cwd(), "scratch", `diagnostics-${Date.now()}`);
    await recordDiagnostic("warn", "auth", "auth_unauthorized", {
      route: "/api/risk-check",
      message: "Unauthorized",
      details: { method: "POST" },
      baseDir,
    });

    const diagnosticsPath = path.join(baseDir, "diagnostics.ndjson");
    const content = readFileSync(diagnosticsPath, "utf8");
    expect(content).toContain("auth_unauthorized");
  });
});
