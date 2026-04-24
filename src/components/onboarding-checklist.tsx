"use client";

import Link from "next/link";
import type { Route } from "next";
import { useState } from "react";
import type {
  OnboardingStepId,
  WorkspaceOnboardingRecord,
} from "@/lib/workspace-onboarding";

const steps = [
  {
    id: "create-risk-check",
    title: "Create first risk check",
    href: "/risk-check",
  },
  {
    id: "review-extraction",
    title: "Review extraction",
    href: "/deals",
  },
  {
    id: "generate-proposal-pack",
    title: "Generate proposal pack",
    href: "/deals",
  },
  {
    id: "try-branded-export",
    title: "Try branded export",
    href: "/account",
  },
  {
    id: "visit-account",
    title: "Set account and brand basics",
    href: "/account",
  },
  {
    id: "submit-feedback",
    title: "Submit pilot feedback",
    href: "/feedback",
  },
] satisfies Array<{ id: OnboardingStepId; title: string; href: Route }>;

export function OnboardingChecklist({
  initialRecord,
}: {
  initialRecord: WorkspaceOnboardingRecord;
}) {
  const [completedSteps, setCompletedSteps] = useState(initialRecord.completedSteps);
  const completed = new Set(completedSteps);
  const progress = Math.round((completed.size / steps.length) * 100);

  async function toggleStep(step: OnboardingStepId) {
    const next = completed.has(step)
      ? completedSteps.filter((item) => item !== step)
      : [...completedSteps, step];

    setCompletedSteps(next);
    await fetch("/api/workspace/onboarding", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ completedSteps: next }),
    }).catch(() => setCompletedSteps(completedSteps));
  }

  return (
    <div className="rounded-[2rem] border border-white/10 bg-slate-950/55 p-6 md:p-7">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <span className="eyebrow">Activation checklist</span>
          <h2
            className="m-0 mt-2 text-2xl font-semibold text-white"
            style={{ fontFamily: "var(--font-display)" }}
          >
            Get paid-launch ready.
          </h2>
        </div>
        <span className="rounded-full border border-sky-300/25 bg-sky-400/10 px-3 py-1 text-sm font-semibold text-sky-100">
          {progress}%
        </span>
      </div>

      <div className="mt-5 grid gap-3">
        {steps.map((step) => (
          <div
            key={step.id}
            className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3"
          >
            <button
              type="button"
              onClick={() => void toggleStep(step.id)}
              className="flex items-center gap-3 text-left text-sm font-semibold text-white"
            >
              <span
                className={`grid size-6 place-items-center rounded-full border text-xs ${
                  completed.has(step.id)
                    ? "border-emerald-300 bg-emerald-300 text-emerald-950"
                    : "border-white/20 text-slate-300"
                }`}
              >
                {completed.has(step.id) ? "✓" : ""}
              </span>
              {step.title}
            </button>
            <Link href={step.href} className="text-xs font-semibold uppercase tracking-[0.16em] text-sky-200 hover:text-white">
              Open
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
}
