import { NextResponse } from "next/server";
import { getCurrentWorkspaceContextOrNull } from "@/lib/auth/server";
import { recordDiagnostic } from "@/lib/diagnostics";
import { canUseStripeBilling, getAbsoluteUrl, getPriceIdForPlan, getStripeServer, type PaidPlanKey } from "@/lib/stripe";
import { updateWorkspaceBilling } from "@/lib/workspace-billing";
import { readJsonBody } from "@/lib/request-body";

export const runtime = "nodejs";

type CheckoutBody = {
  planKey?: PaidPlanKey;
};

export async function POST(request: Request) {
  try {
    const authContext = await getCurrentWorkspaceContextOrNull();
    if (!authContext?.user || !authContext.workspace) {
      void recordDiagnostic("warn", "billing", "billing_checkout_unauthorized", {
        route: "/api/billing/checkout",
        status: 401,
        message: "Unauthorized.",
      });
      return NextResponse.json({ ok: false, message: "Unauthorized." }, { status: 401 });
    }

    if (!canUseStripeBilling()) {
      void recordDiagnostic("warn", "billing", "billing_checkout_not_configured", {
        route: "/api/billing/checkout",
        status: 503,
        workspaceId: authContext.workspace.id,
        message: "Stripe billing is not configured.",
      });
      return NextResponse.json(
        { ok: false, message: "Stripe billing is not configured." },
        { status: 503 },
      );
    }

    const body = await readJsonBody<CheckoutBody>(request);
    if (!body) {
      void recordDiagnostic("warn", "billing", "billing_checkout_invalid_payload", {
        route: "/api/billing/checkout",
        status: 400,
        workspaceId: authContext.workspace.id,
        message: "Billing checkout payload is invalid.",
      });
      return NextResponse.json(
        { ok: false, message: "Billing checkout payload is invalid." },
        { status: 400 },
      );
    }

    if (body.planKey !== "solo" && body.planKey !== "team") {
      void recordDiagnostic("warn", "billing", "billing_checkout_invalid_plan", {
        route: "/api/billing/checkout",
        status: 400,
        workspaceId: authContext.workspace.id,
        message: "Choose a valid paid plan.",
        details: { planKey: body.planKey ?? null },
      });
      return NextResponse.json(
        { ok: false, message: "Choose a valid paid plan." },
        { status: 400 },
      );
    }

    const stripe = getStripeServer();
    let customerId = authContext.workspace.stripeCustomerId;
    const priceId = getPriceIdForPlan(body.planKey);

    if (!customerId) {
      const customer = await stripe.customers.create({
        email: authContext.user.email,
        name: authContext.user.name ?? authContext.workspace.name,
        metadata: {
          workspaceId: authContext.workspace.id,
          userId: authContext.user.id,
        },
      });
      customerId = customer.id;

      await updateWorkspaceBilling(authContext.workspace.id, {
        stripeCustomerId: customerId,
      });
    }

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      customer: customerId,
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      allow_promotion_codes: true,
      client_reference_id: authContext.workspace.id,
      metadata: {
        workspaceId: authContext.workspace.id,
        planKey: body.planKey,
        priceId,
      },
      subscription_data: {
        metadata: {
          workspaceId: authContext.workspace.id,
          planKey: body.planKey,
          priceId,
        },
      },
      success_url: getAbsoluteUrl(request, "/account?billing=success"),
      cancel_url: getAbsoluteUrl(request, "/pricing?billing=cancelled"),
    });

    return NextResponse.json({ ok: true, url: session.url }, { status: 200 });
  } catch (error) {
    console.error("billing_checkout_failed", error);
    void recordDiagnostic("error", "billing", "billing_checkout_failed", {
      route: "/api/billing/checkout",
      status: 500,
      error,
      message: "Could not create the checkout session.",
    });
    return NextResponse.json(
      { ok: false, message: "Could not create the checkout session." },
      { status: 500 },
    );
  }
}
