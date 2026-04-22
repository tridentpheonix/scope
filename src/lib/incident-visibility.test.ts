import { afterEach, describe, expect, it, vi } from "vitest";

const mongoMock = vi.hoisted(() => {
  const records: Array<Record<string, unknown>> = [];
  return {
    records,
    collection: {
      insertOne: vi.fn(async (doc) => {
        records.push(doc);
        return { insertedId: doc._id };
      }),
      find: vi.fn(() => ({
        sort: vi.fn(() => ({
          limit: vi.fn(() => ({
            toArray: vi.fn(async () => records),
          })),
        })),
      })),
    },
    ensureMongoIndexes: vi.fn(async () => {}),
    getMongoCollection: vi.fn(async () => mongoMock.collection),
    getSystemHealthSnapshot: vi.fn(async () => ({
      ok: true,
      status: "healthy",
      at: "2026-04-22T00:00:00.000Z",
      checks: {
        mongo: { configured: true, ok: true, latencyMs: 12, error: null },
        auth: { configured: true, ok: true },
        stripe: { configured: true },
        blob: { configured: false },
        observability: { configured: true },
        alerting: { configured: true },
        maintenance: { configured: true },
      },
    })),
  };
});

vi.mock("./mongo", () => ({
  ensureMongoIndexes: mongoMock.ensureMongoIndexes,
  getMongoCollection: mongoMock.getMongoCollection,
}));

vi.mock("./system-health", () => ({
  getSystemHealthSnapshot: mongoMock.getSystemHealthSnapshot,
}));

afterEach(() => {
  mongoMock.records.splice(0);
  vi.clearAllMocks();
  vi.unstubAllEnvs();
});

describe("incident visibility", () => {
  it("stores diagnostic events for later operator inspection", async () => {
    vi.stubEnv("MONGODB_URI", "mongodb://127.0.0.1:27017");
    vi.stubEnv("MONGODB_DB_NAME", "scopeos");

    const { mirrorDiagnosticEvent } = await import("./incident-visibility");
    const entry = {
      at: "2026-04-22T00:00:00.000Z",
      level: "error" as const,
      area: "billing" as const,
      event: "billing_checkout_failed",
      route: "/api/billing/checkout",
      message: "Checkout failed",
    };

    const result = await mirrorDiagnosticEvent(entry);

    expect(result.stored).toBe(true);
    expect(mongoMock.collection.insertOne).toHaveBeenCalledTimes(1);
    expect(mongoMock.records[0]).toMatchObject({
      level: "error",
      area: "billing",
      event: "billing_checkout_failed",
      route: "/api/billing/checkout",
    });
  });

  it("returns a combined incident snapshot", async () => {
    vi.stubEnv("MONGODB_URI", "mongodb://127.0.0.1:27017");
    vi.stubEnv("MONGODB_DB_NAME", "scopeos");

    mongoMock.records.push({
      _id: "diag-1",
      at: "2026-04-22T00:01:00.000Z",
      level: "error",
      area: "billing",
      event: "billing_checkout_failed",
      message: "Checkout failed",
      createdAt: new Date("2026-04-22T00:01:00.000Z"),
      expiresAt: new Date("2026-05-06T00:01:00.000Z"),
    });

    const { getIncidentVisibilitySnapshot } = await import("./incident-visibility");
    const snapshot = await getIncidentVisibilitySnapshot({ recentLimit: 5 });

    expect(snapshot.health.status).toBe("healthy");
    expect(snapshot.recentDiagnostics).toHaveLength(1);
    expect(snapshot.recentDiagnostics[0]).toMatchObject({
      id: "diag-1",
      level: "error",
      area: "billing",
      event: "billing_checkout_failed",
    });
  });
});
