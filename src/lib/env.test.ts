import { afterEach, describe, expect, it, vi } from "vitest";

async function loadEnv() {
  vi.resetModules();
  return await import("./env");
}

afterEach(() => {
  vi.unstubAllEnvs();
  vi.resetModules();
});

describe("Stripe env guards", () => {
  it("allows checkout without a webhook secret", async () => {
    vi.stubEnv("STRIPE_SECRET_KEY", "sk_test_123");
    vi.stubEnv("STRIPE_PRICE_SOLO_MONTHLY", "price_solo");
    vi.stubEnv("STRIPE_PRICE_TEAM_MONTHLY", "price_team");
    vi.stubEnv("STRIPE_WEBHOOK_SECRET", "");

    const env = await loadEnv();

    expect(env.isStripeCheckoutConfigured()).toBe(true);
    expect(env.isStripeWebhookConfigured()).toBe(false);
    expect(env.isStripeConfigured()).toBe(false);
  });

  it("requires a webhook secret for webhook sync", async () => {
    vi.stubEnv("STRIPE_SECRET_KEY", "sk_test_123");
    vi.stubEnv("STRIPE_PRICE_SOLO_MONTHLY", "price_solo");
    vi.stubEnv("STRIPE_PRICE_TEAM_MONTHLY", "price_team");
    vi.stubEnv("STRIPE_WEBHOOK_SECRET", "whsec_123");

    const env = await loadEnv();

    expect(env.isStripeCheckoutConfigured()).toBe(true);
    expect(env.isStripeWebhookConfigured()).toBe(true);
    expect(env.isStripeConfigured()).toBe(true);
  });
});

describe("Google auth env guards", () => {
  it("requires both the client id and secret", async () => {
    vi.stubEnv("GOOGLE_CLIENT_ID", "google-client-id");
    vi.stubEnv("GOOGLE_CLIENT_SECRET", "");

    let env = await loadEnv();
    expect(env.isGoogleAuthConfigured()).toBe(false);

    vi.stubEnv("GOOGLE_CLIENT_SECRET", "google-client-secret");
    env = await loadEnv();
    expect(env.isGoogleAuthConfigured()).toBe(true);
  });
});

describe("App origin resolution", () => {
  it("falls back to the request origin when no app base URL is configured", async () => {
    const env = await loadEnv();

    expect(env.resolveAppOrigin(new Request("https://scope-wheat.vercel.app/auth/sign-in"))).toBe(
      "https://scope-wheat.vercel.app",
    );
  });

  it("ignores a localhost app base URL for non-local production requests", async () => {
    vi.stubEnv("APP_BASE_URL", "http://localhost:3000");

    const env = await loadEnv();

    expect(env.resolveAppOrigin(new Request("https://scope-wheat.vercel.app/auth/sign-in"))).toBe(
      "https://scope-wheat.vercel.app",
    );
  });

  it("still honors a configured non-local canonical origin", async () => {
    vi.stubEnv("APP_BASE_URL", "https://app.scopeos.com");

    const env = await loadEnv();

    expect(env.resolveAppOrigin(new Request("https://scope-wheat.vercel.app/auth/sign-in"))).toBe(
      "https://app.scopeos.com",
    );
  });
});
