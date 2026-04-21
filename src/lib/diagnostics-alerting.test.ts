import { promises as fs } from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("./alerting", () => ({
  shipDiagnosticToAlertWebhook: vi.fn().mockResolvedValue({ shipped: false }),
}));

import { recordDiagnostic } from "./diagnostics";
import { shipDiagnosticToAlertWebhook } from "./alerting";

let tempDir: string | null = null;

afterEach(async () => {
  vi.unstubAllEnvs();
  vi.clearAllMocks();
  if (tempDir) {
    await fs.rm(tempDir, { recursive: true, force: true });
    tempDir = null;
  }
});

async function createTempDir() {
  tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "scopeos-diagnostics-alerting-"));
  return tempDir;
}

describe("diagnostics alerting integration", () => {
  it("ships error diagnostics to the alert webhook", async () => {
    vi.stubEnv("OBSERVABILITY_WEBHOOK_URL", "");
    const baseDir = await createTempDir();

    await recordDiagnostic("error", "billing", "billing_checkout_failed", {
      route: "/api/billing/checkout",
      message: "Checkout failed",
      baseDir,
    });

    expect(shipDiagnosticToAlertWebhook).toHaveBeenCalledTimes(1);
    expect(shipDiagnosticToAlertWebhook).toHaveBeenCalledWith(
      expect.objectContaining({
        level: "error",
        area: "billing",
        event: "billing_checkout_failed",
      }),
    );
  });

  it("does not require alerting configuration to record diagnostics", async () => {
    vi.stubEnv("OBSERVABILITY_WEBHOOK_URL", "");
    const baseDir = await createTempDir();

    await recordDiagnostic("warn", "auth", "auth_sign_in_rate_limited", {
      route: "/api/auth/sign-in",
      message: "Rate limited",
      baseDir,
    });

    expect(shipDiagnosticToAlertWebhook).toHaveBeenCalled();
  });
});
