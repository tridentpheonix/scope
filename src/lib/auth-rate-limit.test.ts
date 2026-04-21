import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  AUTH_RATE_LIMIT_RULES,
  buildAuthRateLimitKey,
  checkAuthRateLimits,
  getRequestIp,
  normalizeRateLimitSubject,
} from "./auth-rate-limit";

const mongoMock = vi.hoisted(() => ({
  collection: {
    findOne: vi.fn(),
    updateOne: vi.fn(),
  },
  ensureMongoIndexes: vi.fn(async () => {}),
}));

vi.mock("./mongo", () => ({
  ensureMongoIndexes: mongoMock.ensureMongoIndexes,
  getMongoCollection: vi.fn(async () => mongoMock.collection),
}));

beforeEach(() => {
  mongoMock.collection.findOne.mockReset();
  mongoMock.collection.updateOne.mockReset();
  mongoMock.ensureMongoIndexes.mockClear();
});

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("auth rate limiting", () => {
  it("normalizes subjects and builds deterministic keys", () => {
    expect(normalizeRateLimitSubject("  Someone@Example.com ")).toBe("someone@example.com");
    expect(buildAuthRateLimitKey("auth_sign_in_email", " Someone@Example.com ")).toBe(
      "auth_sign_in_email:someone@example.com",
    );
  });

  it("reads the first forwarded IP address when present", () => {
    const request = new Request("https://example.com", {
      headers: {
        "x-forwarded-for": "203.0.113.10, 10.0.0.1",
      },
    });

    expect(getRequestIp(request)).toBe("203.0.113.10");
  });

  it("allows the first attempt in a fresh window", async () => {
    mongoMock.collection.findOne.mockResolvedValue(null);
    mongoMock.collection.updateOne.mockResolvedValue({ upsertedCount: 1, modifiedCount: 0 });

    const result = await checkAuthRateLimits(
      [
        {
          ...AUTH_RATE_LIMIT_RULES.signIn.ip,
          subject: "203.0.113.10",
        },
      ],
      new Date("2026-04-21T00:00:00.000Z"),
    );

    expect(result).toEqual({ allowed: true });
    expect(mongoMock.collection.updateOne).toHaveBeenCalledTimes(1);
  });

  it("blocks attempts after the configured limit", async () => {
    mongoMock.collection.findOne.mockResolvedValue({
      attempts: AUTH_RATE_LIMIT_RULES.signIn.ip.limit,
      expiresAt: new Date("2026-04-21T00:15:00.000Z"),
    });

    const result = await checkAuthRateLimits(
      [
        {
          ...AUTH_RATE_LIMIT_RULES.signIn.ip,
          subject: "203.0.113.10",
        },
      ],
      new Date("2026-04-21T00:00:00.000Z"),
    );

    expect(result.allowed).toBe(false);
    if (!result.allowed) {
      expect(result.retryAfterSeconds).toBe(900);
      expect(result.remaining).toBe(0);
      expect(result.key).toBe("auth_sign_in_ip:203.0.113.10");
    }
    expect(mongoMock.collection.updateOne).not.toHaveBeenCalled();
  });
});
