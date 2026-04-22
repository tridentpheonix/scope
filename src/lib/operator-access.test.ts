import { afterEach, describe, expect, it, vi } from "vitest";

afterEach(() => {
  vi.unstubAllEnvs();
  vi.resetModules();
});

describe("operator access", () => {
  it("recognizes allowlisted operator emails", async () => {
    vi.stubEnv("OPS_OPERATOR_EMAILS", "owner@example.com, admin@example.com");

    const { canAccessOpsDashboard } = await import("./operator-access");

    expect(canAccessOpsDashboard("owner@example.com")).toBe(true);
    expect(canAccessOpsDashboard("ADMIN@example.com")).toBe(true);
    expect(canAccessOpsDashboard("user@example.com")).toBe(false);
  });

  it("disables ops access when no allowlist is configured", async () => {
    vi.stubEnv("OPS_OPERATOR_EMAILS", "");

    const { canAccessOpsDashboard } = await import("./operator-access");

    expect(canAccessOpsDashboard("owner@example.com")).toBe(false);
  });
});
