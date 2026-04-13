import type Stripe from "stripe";
import { getPlanFromPriceId } from "./stripe";
import { getWorkspaceByStripeCustomerId, updateWorkspaceBilling } from "./workspace-billing";

type StripeLike = Pick<Stripe, "subscriptions">;

export type StripeBillingSyncResult = {
  customerId: string | null;
  subscriptionId: string | null;
  subscriptionStatus: string;
  priceId: string | null;
  planKey: "free" | "solo" | "team" | null;
};

function getMetadataPriceId(metadata: Stripe.Metadata | null | undefined) {
  const priceId = metadata?.priceId;
  return typeof priceId === "string" && priceId.trim().length > 0 ? priceId : null;
}

function getCustomerId(customer: string | Stripe.Customer | Stripe.DeletedCustomer | null | undefined) {
  if (!customer) {
    return null;
  }

  return typeof customer === "string" ? customer : "deleted" in customer ? null : customer.id;
}

function getSubscriptionPriceId(subscription: Pick<Stripe.Subscription, "items">) {
  return subscription.items.data[0]?.price?.id ?? null;
}

export async function extractStripeBillingSyncResult(
  event: Stripe.Event,
  stripe: StripeLike,
): Promise<StripeBillingSyncResult | null> {
  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const sessionCustomerId = getCustomerId(session.customer);
    const sessionSubscriptionId =
      typeof session.subscription === "string"
        ? session.subscription
        : session.subscription?.id ?? null;
    const checkoutPlanKey =
      session.metadata?.planKey === "solo" || session.metadata?.planKey === "team"
        ? session.metadata.planKey
        : null;
    const checkoutPriceId = getMetadataPriceId(session.metadata);

    if (!sessionSubscriptionId) {
      return {
        customerId: sessionCustomerId,
        subscriptionId: null,
        subscriptionStatus: "inactive",
        priceId: checkoutPriceId,
        planKey: checkoutPlanKey,
      };
    }

    let subscription: Stripe.Subscription | null = null;
    try {
      subscription = await stripe.subscriptions.retrieve(sessionSubscriptionId, {
        expand: ["items.data.price"],
      });
    } catch {
      subscription = null;
    }

    return {
      customerId: getCustomerId(subscription?.customer) ?? sessionCustomerId,
      subscriptionId: subscription?.id ?? sessionSubscriptionId,
      subscriptionStatus: subscription?.status ?? "active",
      priceId: subscription ? getSubscriptionPriceId(subscription) : checkoutPriceId,
      planKey:
        checkoutPlanKey ??
        (subscription ? getPlanFromPriceId(getSubscriptionPriceId(subscription)) : null),
    };
  }

  if (
    event.type === "customer.subscription.created" ||
    event.type === "customer.subscription.updated" ||
    event.type === "customer.subscription.deleted"
  ) {
    const subscription = event.data.object as Stripe.Subscription;
    const metadataPriceId = getMetadataPriceId(subscription.metadata);
    const subscriptionPriceId = getSubscriptionPriceId(subscription);
    return {
      customerId: getCustomerId(subscription.customer),
      subscriptionId: subscription.id,
      subscriptionStatus: subscription.status,
      priceId: subscriptionPriceId ?? metadataPriceId,
      planKey: getPlanFromPriceId(subscriptionPriceId ?? metadataPriceId),
    };
  }

  return null;
}

export async function syncWorkspaceBillingFromStripeEvent(event: Stripe.Event, stripe: StripeLike) {
  const syncResult = await extractStripeBillingSyncResult(event, stripe);
  if (!syncResult?.customerId) {
    return null;
  }

  const workspace = await getWorkspaceByStripeCustomerId(syncResult.customerId);
  if (!workspace) {
    return null;
  }

  const planKey =
    event.type === "customer.subscription.deleted"
      ? "free"
      : syncResult.planKey ?? getPlanFromPriceId(syncResult.priceId) ?? workspace.planKey;

  return await updateWorkspaceBilling(workspace.id, {
    planKey,
    subscriptionStatus:
      event.type === "customer.subscription.deleted"
        ? "canceled"
        : syncResult.subscriptionStatus,
    stripeCustomerId: syncResult.customerId,
    stripeSubscriptionId: syncResult.subscriptionId,
    stripePriceId: syncResult.priceId,
  });
}
