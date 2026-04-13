"use client";

import Link from "next/link";
import { type ReactNode } from "react";
import { type ScopePlanKey } from "@/lib/billing-gates";

type PlanGateProps = {
  planKey: ScopePlanKey | null | undefined;
  gate: (planKey: ScopePlanKey | null | undefined) => boolean;
  featureName: string;
  children: ReactNode;
  fallback?: ReactNode;
};

export function PlanGate({ planKey, gate, featureName, children, fallback }: PlanGateProps) {
  const hasAccess = gate(planKey);

  if (hasAccess) {
    return <>{children}</>;
  }

  if (fallback) {
    return <>{fallback}</>;
  }

  return (
    <div className="relative overflow-hidden rounded-[2rem] border border-sky-200 bg-sky-50/50 p-6 md:p-8">
      <div className="absolute inset-0 z-0 bg-white/40 backdrop-blur-[2px]" />
      
      <div className="relative z-10 grid gap-4 text-center items-center justify-items-center">
        <div className="status-chip w-fit border-sky-400/30 bg-sky-400/10 text-slate-900">
          <span className="size-2 rounded-full bg-sky-500" />
          Premium feature
        </div>
        
        <div className="grid gap-2">
          <h3 className="m-0 text-xl font-semibold text-slate-950" style={{ fontFamily: "var(--font-display)" }}>
            Unlock {featureName}
          </h3>
          <p className="m-0 text-sm leading-7 text-slate-700 max-w-sm">
            This workspace is currently on the Free plan. Upgrade to Solo or Team to access {featureName} and other repeat-usage tools.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <Link
            href="/pricing"
            className="inline-flex min-h-11 items-center justify-center rounded-full bg-slate-950 px-5 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:bg-slate-800"
          >
            See pricing
          </Link>
          <button
            type="button"
            className="inline-flex min-h-11 items-center justify-center rounded-full border border-slate-300 bg-white px-5 text-sm font-semibold text-slate-900 transition hover:-translate-y-0.5 hover:border-slate-400"
            onClick={() => window.location.reload()}
          >
            Check status
          </button>
        </div>
      </div>
    </div>
  );
}
