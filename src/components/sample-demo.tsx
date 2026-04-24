"use client";

import { useMemo, useState } from "react";
import { analyzeRiskCheckSubmission } from "@/lib/risk-check-analysis";
import { createSampleInput, sampleBriefs } from "@/lib/sample-scope";

export function SampleDemo() {
  const [selectedId, setSelectedId] = useState(sampleBriefs[0].id);
  const selected = sampleBriefs.find((sample) => sample.id === selectedId) ?? sampleBriefs[0];
  const analysis = useMemo(
    () => analyzeRiskCheckSubmission(createSampleInput(selected)),
    [selected],
  );

  return (
    <div className="grid gap-6 lg:grid-cols-[0.8fr_1.2fr]">
      <aside className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm">
        <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
          Sample briefs
        </div>
        <div className="mt-4 grid gap-3">
          {sampleBriefs.map((sample) => (
            <button
              key={sample.id}
              type="button"
              onClick={() => setSelectedId(sample.id)}
              className={`rounded-2xl border px-4 py-3 text-left text-sm transition ${
                sample.id === selected.id
                  ? "border-sky-300 bg-sky-50 text-sky-950"
                  : "border-slate-200 bg-white text-slate-700 hover:border-slate-300"
              }`}
            >
              <strong className="block text-base">{sample.title}</strong>
              <span className="mt-1 block leading-6">{sample.agencyName}</span>
            </button>
          ))}
        </div>
      </aside>

      <section className="grid gap-5">
        <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
          <p className="eyebrow">Input brief</p>
          <h2 className="m-0 mt-2 text-2xl font-semibold text-slate-950">{selected.title}</h2>
          <p className="m-0 mt-3 text-sm leading-7 text-slate-700">{selected.summary}</p>
        </div>

        <div className="grid gap-5 md:grid-cols-2">
          <div className="rounded-[2rem] border border-rose-100 bg-rose-50 p-5">
            <h3 className="m-0 text-lg font-semibold text-rose-950">Top scope risks</h3>
            <div className="mt-4 grid gap-3">
              {analysis.riskFlags.slice(0, 4).map((risk) => (
                <div key={risk.key} className="rounded-2xl bg-white/75 px-4 py-3 text-sm leading-6 text-rose-950">
                  <strong className="block">{risk.label}</strong>
                  {risk.reason}
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[2rem] border border-sky-100 bg-sky-50 p-5">
            <h3 className="m-0 text-lg font-semibold text-sky-950">Questions before pricing</h3>
            <div className="mt-4 grid gap-3">
              {analysis.missingInfoPrompts.slice(0, 4).map((prompt) => (
                <div key={prompt.key} className="rounded-2xl bg-white/75 px-4 py-3 text-sm leading-6 text-sky-950">
                  {prompt.question}
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
          <p className="eyebrow">Pricing posture</p>
          <h3 className="m-0 mt-2 text-2xl font-semibold text-slate-950">
            {analysis.pricingGuidance.pricingConfidence.toUpperCase()} confidence /{" "}
            {analysis.pricingGuidance.complexity.toUpperCase()} complexity
          </h3>
          <p className="m-0 mt-3 text-sm leading-7 text-slate-700">
            {analysis.pricingGuidance.recommendedApproach}
          </p>
        </div>
      </section>
    </div>
  );
}
