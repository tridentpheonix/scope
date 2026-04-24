import { afterEach, describe, expect, it, vi } from "vitest";

const routeMocks = vi.hoisted(() => ({
  getCurrentOperatorContextOrNull: vi.fn(),
  isAlertingConfigured: vi.fn(),
  isObservabilityConfigured: vi.fn(),
  recordDiagnostic: vi.fn(),
}));

vi.mock("@/lib/operator-access", () => ({
  getCurrentOperatorContextOrNull: routeMocks.getCurrentOperatorContextOrNull,
}));

vi.mock("@/lib/env", () => ({
  isAlertingConfigured: routeMocks.isAlertingConfigured,
  isObservabilityConfigured: routeMocks.isObservabilityConfigured,
}));

vi.mock("@/lib/diagnostics", () => ({
  recordDiagnostic: routeMocks.recordDiagnostic,
}));

afterEach(() => {
  vi.clearAllMocks();
});

describe("/api/ops/alert-test", () => {
  it("rejects non-operator requests", async () => {
    routeMocks.getCurrentOperatorContextOrNull.mockResolvedValue(null);

    const { POST } = await import("./route");
    const response = await POST();

    expect(response.status).toBe(401);
    expect(await response.json()).toMatchObject({
      ok: false,
      message: "Unauthorized.",
    });
    expect(routeMocks.recordDiagnostic).not.toHaveBeenCalled();
  });

  it("records an operator alert self-test diagnostic", async () => {
    routeMocks.getCurrentOperatorContextOrNull.mockResolvedValue({
      user: {
        email: "owner@example.com",
      },
      workspace: {
        id: "workspace-1",
      },
    });
    routeMocks.isAlertingConfigured.mockReturnValue(true);
    routeMocks.isObservabilityConfigured.mockReturnValue(true);
    routeMocks.recordDiagnostic.mockResolvedValue({
      at: "2026-04-24T00:00:00.000Z",
      level: "error",
      area: "maintenance",
      event: "ops_alert_self_test",
    });

    const { POST } = await import("./route");
    const response = await POST();

    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({
      ok: true,
      alertingConfigured: true,
      observabilityConfigured: true,
      diagnostic: {
        level: "error",
        area: "maintenance",
        event: "ops_alert_self_test",
      },
    });
    expect(routeMocks.recordDiagnostic).toHaveBeenCalledWith(
      "error",
      "maintenance",
      "ops_alert_self_test",
      expect.objectContaining({
        route: "/api/ops/alert-test",
        workspaceId: "workspace-1",
        details: expect.objectContaining({
          operatorEmail: "owner@example.com",
          alertingConfigured: true,
          observabilityConfigured: true,
        }),
      }),
    );
  });
});
