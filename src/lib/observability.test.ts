import { describe, expect, it, vi, afterEach } from "vitest";
import { buildObservabilityPayload, shipDiagnosticToWebhook } from "./observability";
import { createDiagnosticEntry } from "./diagnostics";

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("observability", () => {
  it("builds a stable webhook payload", () => {
    vi.stubEnv("NODE_ENV", "test");

    const entry = createDiagnosticEntry("warn", "maintenance", "attachment_reconciliation_finished", {
      route: "/scripts/reconcile-orphan-attachments",
      message: "Done",
    });

    expect(buildObservabilityPayload(entry)).toMatchObject({
      source: "scopeos",
      environment: "test",
      level: "warn",
      area: "maintenance",
      event: "attachment_reconciliation_finished",
      route: "/scripts/reconcile-orphan-attachments",
      message: "Done",
    });
  });

  it("does not ship info diagnostics to the webhook", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    const result = await shipDiagnosticToWebhook(
      createDiagnosticEntry("info", "maintenance", "attachment_reconciliation_started", {
        route: "/scripts/reconcile-orphan-attachments",
      }),
    );

    expect(result).toEqual({ shipped: false });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("ships warn diagnostics with the secret header when configured", async () => {
    vi.stubEnv("OBSERVABILITY_WEBHOOK_URL", "https://example.com/webhook");
    vi.stubEnv("OBSERVABILITY_WEBHOOK_SECRET", "super-secret");

    const fetchMock = vi.fn().mockResolvedValue(new Response(null, { status: 204 }));
    vi.stubGlobal("fetch", fetchMock);

    const entry = createDiagnosticEntry("warn", "deals", "deal_attachment_missing", {
      route: "/api/deals/[id]/attachment",
      submissionId: "submission-1",
      message: "Attachment not found",
    });

    const result = await shipDiagnosticToWebhook(entry);

    expect(result).toEqual({ shipped: true, status: 204 });
    expect(fetchMock).toHaveBeenCalledTimes(1);

    const [url, init] = fetchMock.mock.calls[0] ?? [];
    expect(url).toBe("https://example.com/webhook");
    expect(init).toMatchObject({
      method: "POST",
    });

    const headers = new Headers((init as RequestInit).headers);
    expect(headers.get("content-type")).toBe("application/json");
    expect(headers.get("x-observability-secret")).toBe("super-secret");

    const payload = JSON.parse((init as RequestInit).body as string);
    expect(payload).toMatchObject({
      source: "scopeos",
      level: "warn",
      area: "deals",
      event: "deal_attachment_missing",
      submissionId: "submission-1",
      message: "Attachment not found",
    });
  });
});
