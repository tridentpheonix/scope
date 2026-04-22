import { describe, expect, it } from "vitest";
import { shouldRecreateWorkspaceStripeCustomerIndex } from "./mongo";

describe("workspace stripe customer index compatibility", () => {
  it("recreates the legacy sparse unique index", () => {
    expect(
      shouldRecreateWorkspaceStripeCustomerIndex({
        name: "workspaces_stripe_customer_unique",
        key: { stripeCustomerId: 1 },
        unique: true,
        sparse: true,
      }),
    ).toBe(true);
  });

  it("keeps the partial-filtered unique index", () => {
    expect(
      shouldRecreateWorkspaceStripeCustomerIndex({
        name: "workspaces_stripe_customer_unique",
        key: { stripeCustomerId: 1 },
        unique: true,
        partialFilterExpression: {
          stripeCustomerId: {
            $type: "string",
          },
        },
      }),
    ).toBe(false);
  });
});
