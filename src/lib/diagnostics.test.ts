import { promises as fs, readFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";
import { createDiagnosticEntry, recordDiagnostic } from "./diagnostics";

const tempDirs: string[] = [];

async function createTempDataDir() {
  const directory = await fs.mkdtemp(path.join(os.tmpdir(), "scopeos-diagnostics-"));
  tempDirs.push(directory);
  return directory;
}

afterEach(async () => {
  await Promise.all(tempDirs.splice(0).map((directory) => fs.rm(directory, { recursive: true, force: true })));
});

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
    vi.stubEnv("OBSERVABILITY_WEBHOOK_URL", "");
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    const baseDir = await createTempDataDir();

    try {
      await recordDiagnostic("warn", "auth", "auth_unauthorized", {
        route: "/api/risk-check",
        message: "Unauthorized",
        details: { method: "POST" },
        baseDir,
      });

      const diagnosticsPath = path.join(baseDir, "diagnostics.ndjson");
      const content = readFileSync(diagnosticsPath, "utf8");
      expect(content).toContain("auth_unauthorized");
    } finally {
      warnSpy.mockRestore();
    }
  });

  it("supports deal-related diagnostics", () => {
    const entry = createDiagnosticEntry("warn", "deals", "deal_attachment_missing", {
      route: "/api/deals/[id]/attachment",
      submissionId: "submission-1",
      message: "Attachment not found",
    });

    expect(entry).toMatchObject({
      level: "warn",
      area: "deals",
      event: "deal_attachment_missing",
      route: "/api/deals/[id]/attachment",
      submissionId: "submission-1",
      message: "Attachment not found",
    });
  });

  it("supports analytics diagnostics", () => {
    const entry = createDiagnosticEntry("error", "analytics", "analytics_event_save_failed", {
      route: "/api/events",
      message: "Could not save event",
    });

    expect(entry).toMatchObject({
      level: "error",
      area: "analytics",
      event: "analytics_event_save_failed",
      route: "/api/events",
      message: "Could not save event",
    });
  });

  it("supports support diagnostics", () => {
    const entry = createDiagnosticEntry("warn", "support", "pilot_feedback_invalid_payload", {
      route: "/api/pilot-feedback",
      message: "Feedback payload is invalid.",
    });

    expect(entry).toMatchObject({
      level: "warn",
      area: "support",
      event: "pilot_feedback_invalid_payload",
      route: "/api/pilot-feedback",
      message: "Feedback payload is invalid.",
    });
  });

  it("supports maintenance diagnostics", () => {
    const entry = createDiagnosticEntry("info", "maintenance", "attachment_reconciliation_started", {
      route: "/scripts/reconcile-orphan-attachments",
      message: "Attachment reconciliation started.",
    });

    expect(entry).toMatchObject({
      level: "info",
      area: "maintenance",
      event: "attachment_reconciliation_started",
      route: "/scripts/reconcile-orphan-attachments",
      message: "Attachment reconciliation started.",
    });
  });
});
