import { describe, expect, it, vi } from "vitest";
import type Stripe from "stripe";
import { extractStripeBillingSyncResult } from "./stripe-billing-sync";

describe("extractStripeBillingSyncResult", () => {
  it("retrieves the subscription price for checkout completion events", async () => {
    const retrieve = vi.fn(async () => ({
      id: "sub_123",
      customer: "cus_123",
      status: "active",
      items: {
        data: [
          {
            price: { id: "price_solo" },
          },
        ],
      },
    }));

    const result = await extractStripeBillingSyncResult(
      {
        id: "evt_123",
        type: "checkout.session.completed",
        data: {
          object: {
            customer: "cus_123",
            subscription: "sub_123",
            metadata: {
              planKey: "solo",
            },
          },
        },
      } as unknown as Stripe.Event,
      {
        subscriptions: {
          retrieve,
        },
      } as unknown as Pick<Stripe, "subscriptions">,
    );

    expect(retrieve).toHaveBeenCalledWith("sub_123", {
      expand: ["items.data.price"],
    });
    expect(result).toEqual({
      customerId: "cus_123",
      subscriptionId: "sub_123",
      subscriptionStatus: "active",
      priceId: "price_solo",
      planKey: "solo",
    });
  });

  it("maps deleted subscriptions to a canceled status and free plan later in sync", async () => {
    const result = await extractStripeBillingSyncResult(
      {
        id: "evt_456",
        type: "customer.subscription.deleted",
        data: {
          object: {
            id: "sub_456",
            customer: "cus_456",
            status: "canceled",
            items: {
              data: [
                {
                  price: { id: "price_team" },
                },
              ],
            },
          },
        },
      } as unknown as Stripe.Event,
      {
        subscriptions: {
          retrieve: vi.fn(),
        },
      } as unknown as Pick<Stripe, "subscriptions">,
    );

    expect(result).toEqual({
      customerId: "cus_456",
      subscriptionId: "sub_456",
      subscriptionStatus: "canceled",
      priceId: "price_team",
      planKey: null,
    });
  });
});
