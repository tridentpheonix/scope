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
