"use client";

import { useState } from "react";

type BillingActionsProps = {
  canManageBilling: boolean;
};

export function BillingActions({ canManageBilling }: BillingActionsProps) {
  const [status, setStatus] = useState<string | null>(null);
  const [isBusy, setIsBusy] = useState<string | null>(null);

  async function startCheckout(planKey: "solo" | "team") {
    setStatus(null);
    setIsBusy(planKey);

    try {
      const response = await fetch("/api/billing/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ planKey }),
      });
      const result = (await response.json()) as { ok: boolean; url?: string; message?: string };

      if (!response.ok || !result.ok || !result.url) {
        throw new Error(result.message ?? "Checkout failed.");
      }

      window.location.href = result.url;
    } catch (error) {
      console.error("billing_checkout_client_failed", error);
      setStatus("Could not start checkout. Verify Stripe configuration and retry.");
      setIsBusy(null);
    }
  }

  async function openPortal() {
    setStatus(null);
    setIsBusy("portal");

    try {
      const response = await fetch("/api/billing/portal", {
        method: "POST",
      });
      const result = (await response.json()) as { ok: boolean; url?: string; message?: string };

      if (!response.ok || !result.ok || !result.url) {
        throw new Error(result.message ?? "Portal failed.");
      }

      window.location.href = result.url;
    } catch (error) {
      console.error("billing_portal_client_failed", error);
      setStatus("Could not open the billing portal.");
      setIsBusy(null);
    }
  }

  return (
    <div className="grid gap-3">
      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          onClick={() => startCheckout("solo")}
          className="btn btn-dark"
          disabled={Boolean(isBusy)}
        >
          {isBusy === "solo" ? "Starting..." : "Upgrade to Solo"}
        </button>
        <button
          type="button"
          onClick={() => startCheckout("team")}
          className="btn btn-outline"
          disabled={Boolean(isBusy)}
        >
          {isBusy === "team" ? "Starting..." : "Upgrade to Team"}
        </button>
        {canManageBilling ? (
          <button
            type="button"
            onClick={openPortal}
            className="btn btn-small border-emerald-200 bg-emerald-50 text-emerald-800 hover:bg-emerald-100 hover:border-emerald-300"
            disabled={Boolean(isBusy)}
          >
            {isBusy === "portal" ? "Opening..." : "Manage billing"}
          </button>
        ) : null}
      </div>
      {status ? (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {status}
        </div>
      ) : null}
    </div>
  );
}
