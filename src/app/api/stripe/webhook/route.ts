import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { appEnv, isStripeConfigured, requireEnv } from "@/lib/env";
import { recordDiagnostic } from "@/lib/diagnostics";
import { getStripeServer } from "@/lib/stripe";
import { syncWorkspaceBillingFromStripeEvent } from "@/lib/stripe-billing-sync";

export const runtime = "nodejs";

export async function POST(request: Request) {
  if (!isStripeConfigured()) {
    void recordDiagnostic("warn", "webhook", "stripe_webhook_not_configured", {
      route: "/api/stripe/webhook",
      status: 503,
      message: "Stripe billing is not configured.",
    });
    return NextResponse.json(
      { ok: false, message: "Stripe billing is not configured." },
      { status: 503 },
    );
  }

  try {
    const stripe = getStripeServer();
    const rawBody = await request.text();
    const signature = (await headers()).get("stripe-signature");

    if (!signature) {
      void recordDiagnostic("warn", "webhook", "stripe_webhook_missing_signature", {
        route: "/api/stripe/webhook",
        status: 400,
        message: "Missing stripe-signature header.",
      });
      return NextResponse.json(
        { ok: false, message: "Missing stripe-signature header." },
        { status: 400 },
      );
    }

    const event = await stripe.webhooks.constructEventAsync(
      rawBody,
      signature,
      requireEnv(appEnv.stripeWebhookSecret, "STRIPE_WEBHOOK_SECRET"),
    );

    if (
      event.type === "checkout.session.completed" ||
      event.type === "customer.subscription.created" ||
      event.type === "customer.subscription.updated" ||
      event.type === "customer.subscription.deleted"
    ) {
      await syncWorkspaceBillingFromStripeEvent(event, stripe);
    }

    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (error) {
    console.error("stripe_webhook_failed", error);
    void recordDiagnostic("error", "webhook", "stripe_webhook_failed", {
      route: "/api/stripe/webhook",
      status: 400,
      error,
      message: "Stripe webhook handling failed.",
    });
    return NextResponse.json(
      { ok: false, message: "Stripe webhook handling failed." },
      { status: 400 },
    );
  }
}
