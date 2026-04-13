"use client";

import { useState } from "react";
import { type PaidPlanKey } from "@/lib/stripe";

type PlanCheckoutButtonProps = {
  planKey: PaidPlanKey;
  label: string;
  isCurrent?: boolean;
  className?: string;
};

export function PlanCheckoutButton({ planKey, label, isCurrent, className }: PlanCheckoutButtonProps) {
  const [isBusy, setIsBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function startCheckout() {
    setIsBusy(true);
    setError(null);

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
    } catch (err) {
      console.error("plan_checkout_failed", err);
      setError("Failed to start checkout. Check Stripe config.");
      setIsBusy(false);
    }
  }

  if (isCurrent) {
    return (
      <div className={`btn btn-outline border-sky-300 bg-sky-100/50 text-sky-900 cursor-default hover:translate-y-0 ${className}`}>
        Current plan
      </div>
    );
  }

  return (
    <div className="grid gap-2">
      <button
        type="button"
        onClick={startCheckout}
        disabled={isBusy}
        className={`btn btn-dark ${className}`}
      >
        {isBusy ? "Starting..." : label}
      </button>
      {error && (
        <span className="text-[10px] text-rose-600 font-medium px-2">{error}</span>
      )}
    </div>
  );
}
