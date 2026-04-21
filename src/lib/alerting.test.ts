import { afterEach, describe, expect, it, vi } from "vitest";
import { buildAlertPayload, shipDiagnosticToAlertWebhook } from "./alerting";
import { createDiagnosticEntry } from "./diagnostics";

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("alerting", () => {
  it("builds a stable alert payload", () => {
    vi.stubEnv("NODE_ENV", "test");

    const entry = createDiagnosticEntry("error", "billing", "billing_checkout_failed", {
      route: "/api/billing/checkout",
      message: "Could not create checkout",
    });

    expect(buildAlertPayload(entry)).toMatchObject({
      source: "scopeos",
      kind: "alert",
      environment: "test",
      level: "error",
      area: "billing",
      event: "billing_checkout_failed",
      route: "/api/billing/checkout",
      message: "Could not create checkout",
    });
  });

  it("does not ship non-error diagnostics to the alert webhook", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    const result = await shipDiagnosticToAlertWebhook(
      createDiagnosticEntry("warn", "auth", "auth_sign_in_rate_limited", {
        route: "/api/auth/sign-in",
      }),
    );

    expect(result).toEqual({ shipped: false });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("ships error diagnostics with the secret header when configured", async () => {
    vi.stubEnv("ALERT_WEBHOOK_URL", "https://example.com/alert");
    vi.stubEnv("ALERT_WEBHOOK_SECRET", "super-secret");

    const fetchMock = vi.fn().mockResolvedValue(new Response(null, { status: 204 }));
    vi.stubGlobal("fetch", fetchMock);

    const entry = createDiagnosticEntry("error", "billing", "billing_checkout_failed", {
      route: "/api/billing/checkout",
      submissionId: "submission-1",
      message: "Checkout failed",
    });

    const result = await shipDiagnosticToAlertWebhook(entry);

    expect(result).toEqual({ shipped: true, status: 204 });
    expect(fetchMock).toHaveBeenCalledTimes(1);

    const [url, init] = fetchMock.mock.calls[0] ?? [];
    expect(url).toBe("https://example.com/alert");
    expect(init).toMatchObject({
      method: "POST",
    });

    const headers = new Headers((init as RequestInit).headers);
    expect(headers.get("content-type")).toBe("application/json");
    expect(headers.get("x-alert-secret")).toBe("super-secret");

    const payload = JSON.parse((init as RequestInit).body as string);
    expect(payload).toMatchObject({
      source: "scopeos",
      kind: "alert",
      level: "error",
      area: "billing",
      event: "billing_checkout_failed",
      submissionId: "submission-1",
      message: "Checkout failed",
    });
  });
});
