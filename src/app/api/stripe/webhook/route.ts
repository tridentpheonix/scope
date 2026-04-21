import { NextResponse } from "next/server";
import { appEnv, isStripeConfigured, requireEnv } from "@/lib/env";
import { recordDiagnostic } from "@/lib/diagnostics";
import { getStripeServer } from "@/lib/stripe";
import { syncWorkspaceBillingFromStripeEvent } from "@/lib/stripe-billing-sync";
import {
  markStripeWebhookEventFailed,
  markStripeWebhookEventProcessed,
  reserveStripeWebhookEvent,
} from "@/lib/stripe-webhook-events";

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

  const stripe = getStripeServer();
  const rawBody = await request.text();
  const signature = request.headers.get("stripe-signature");

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

  let eventId: string | null = null;

  try {
    const event = await stripe.webhooks.constructEventAsync(
      rawBody,
      signature,
      requireEnv(appEnv.stripeWebhookSecret, "STRIPE_WEBHOOK_SECRET"),
    );
    eventId = event.id;

    const reservation = await reserveStripeWebhookEvent(event);
    if (!reservation.reserved) {
      void recordDiagnostic("info", "webhook", "stripe_webhook_duplicate_ignored", {
        route: "/api/stripe/webhook",
        status: 200,
        message: "Stripe webhook event already processed or in progress.",
        details: {
          eventId: event.id,
          eventType: event.type,
          reason: reservation.reason,
        },
      });

      return NextResponse.json({ ok: true, duplicate: true }, { status: 200 });
    }

    if (
      event.type === "checkout.session.completed" ||
      event.type === "customer.subscription.created" ||
      event.type === "customer.subscription.updated" ||
      event.type === "customer.subscription.deleted"
    ) {
      await syncWorkspaceBillingFromStripeEvent(event, stripe);
    }

    await markStripeWebhookEventProcessed(event.id);
    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (error) {
    console.error("stripe_webhook_failed", error);

    if (eventId) {
      try {
        await markStripeWebhookEventFailed(eventId, error);
      } catch {
        // Never let failure bookkeeping mask the original webhook error.
      }
    }

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
