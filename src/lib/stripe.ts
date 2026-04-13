import Stripe from "stripe";
import { appEnv, isStripeConfigured, requireEnv } from "./env";

let stripeInstance: Stripe | null = null;

export type PaidPlanKey = "solo" | "team";

export function getStripeServer() {
  if (!stripeInstance) {
    stripeInstance = new Stripe(requireEnv(appEnv.stripeSecretKey, "STRIPE_SECRET_KEY"), {
      apiVersion: "2026-03-25.dahlia",
    });
  }

  return stripeInstance;
}

export function getPriceIdForPlan(planKey: PaidPlanKey) {
  if (planKey === "solo") {
    return requireEnv(appEnv.stripePriceSoloMonthly, "STRIPE_PRICE_SOLO_MONTHLY");
  }

  return requireEnv(appEnv.stripePriceTeamMonthly, "STRIPE_PRICE_TEAM_MONTHLY");
}

export function getPlanFromPriceId(priceId: string | null | undefined): PaidPlanKey | null {
  if (!priceId) {
    return null;
  }

  if (priceId === appEnv.stripePriceSoloMonthly) {
    return "solo";
  }

  if (priceId === appEnv.stripePriceTeamMonthly) {
    return "team";
  }

  return null;
}

export function getAbsoluteUrl(request: Request, path: string) {
  const origin = appEnv.appBaseUrl ?? new URL(request.url).origin;
  return new URL(path, origin).toString();
}

export function canUseStripeBilling() {
  return isStripeConfigured();
}

