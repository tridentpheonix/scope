import { NextResponse } from "next/server";
import { getCurrentWorkspaceContextOrNull } from "@/lib/auth/server";
import { recordDiagnostic } from "@/lib/diagnostics";
import { canUseStripeBilling, getAbsoluteUrl, getStripeServer } from "@/lib/stripe";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const authContext = await getCurrentWorkspaceContextOrNull();
    if (!authContext?.user || !authContext.workspace) {
      void recordDiagnostic("warn", "billing", "billing_portal_unauthorized", {
        route: "/api/billing/portal",
        status: 401,
        message: "Unauthorized.",
      });
      return NextResponse.json({ ok: false, message: "Unauthorized." }, { status: 401 });
    }

    if (!canUseStripeBilling()) {
      void recordDiagnostic("warn", "billing", "billing_portal_not_configured", {
        route: "/api/billing/portal",
        status: 503,
        workspaceId: authContext.workspace.id,
        message: "Stripe billing is not configured.",
      });
      return NextResponse.json(
        { ok: false, message: "Stripe billing is not configured." },
        { status: 503 },
      );
    }

    if (!authContext.workspace.stripeCustomerId) {
      void recordDiagnostic("warn", "billing", "billing_portal_missing_customer", {
        route: "/api/billing/portal",
        status: 400,
        workspaceId: authContext.workspace.id,
        message: "No Stripe customer found for this workspace yet.",
      });
      return NextResponse.json(
        { ok: false, message: "No Stripe customer found for this workspace yet." },
        { status: 400 },
      );
    }

    const stripe = getStripeServer();
    const session = await stripe.billingPortal.sessions.create({
      customer: authContext.workspace.stripeCustomerId,
      return_url: getAbsoluteUrl(request, "/account"),
    });

    return NextResponse.json({ ok: true, url: session.url }, { status: 200 });
  } catch (error) {
    console.error("billing_portal_failed", error);
    void recordDiagnostic("error", "billing", "billing_portal_failed", {
      route: "/api/billing/portal",
      status: 500,
      error,
      message: "Could not open the billing portal.",
    });
    return NextResponse.json(
      { ok: false, message: "Could not open the billing portal." },
      { status: 500 },
    );
  }
}
