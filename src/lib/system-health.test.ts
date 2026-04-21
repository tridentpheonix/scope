import { afterEach, describe, expect, it, vi } from "vitest";

afterEach(() => {
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
  vi.resetModules();
});

describe("system health", () => {
  it("reports healthy when Mongo is configured and reachable", async () => {
    vi.stubEnv("MONGODB_URI", "mongodb://127.0.0.1:27017");
    vi.stubEnv("MONGODB_DB_NAME", "scopeos");

    const { getSystemHealthSnapshot } = await import("./system-health");
    const snapshot = await getSystemHealthSnapshot({
      now: new Date("2026-04-21T00:00:00.000Z"),
      pingMongoImpl: vi.fn(async () => {}),
    });

    expect(snapshot).toMatchObject({
      ok: true,
      status: "healthy",
      checks: {
        mongo: {
          configured: true,
          ok: true,
          error: null,
        },
        auth: {
          configured: true,
          ok: true,
        },
      },
    });
    expect(snapshot.checks.mongo.latencyMs).not.toBeNull();
  });

  it("reports unhealthy when Mongo ping fails", async () => {
    vi.stubEnv("MONGODB_URI", "mongodb://127.0.0.1:27017");
    vi.stubEnv("MONGODB_DB_NAME", "scopeos");

    const { getSystemHealthSnapshot } = await import("./system-health");
    const snapshot = await getSystemHealthSnapshot({
      pingMongoImpl: vi.fn(async () => {
        throw new Error("mongo unreachable");
      }),
    });

    expect(snapshot.ok).toBe(false);
    expect(snapshot.status).toBe("unhealthy");
    expect(snapshot.checks.mongo.ok).toBe(false);
    expect(snapshot.checks.mongo.error).toBe("mongo unreachable");
  });
});
