"use client";

import { useEffect, useState } from "react";
import type { SavedAiRunRecord } from "@/lib/ai-runs";
import { getAiProviderLabel } from "@/lib/ai-provider";
import type { ProposalPackBlock } from "@/lib/proposal-pack";
import type { ProposalPackAiSuggestion } from "@/lib/proposal-pack-ai";

type ProposalPackAiPanelProps = {
  submissionId: string;
  onApplySuggestion: (updates: ProposalPackBlock[]) => void;
};

type AiApiSuccess = ProposalPackAiSuggestion & {
  ok: true;
  submissionId: string;
  runId: string;
};

type ProposalPackAiRun = SavedAiRunRecord & {
  outputJson: {
    mode: "fallback" | "llm";
    provider: "nvidia" | "openai" | null;
    confidence: "low" | "medium" | "high";
    blockUpdates: ProposalPackBlock[];
    rationale: string[];
    notes: string[];
  };
};

export function ProposalPackAiPanel({
  submissionId,
  onApplySuggestion,
}: ProposalPackAiPanelProps) {
  const [status, setStatus] = useState<string | null>(null);
  const [result, setResult] = useState<AiApiSuccess | null>(null);
  const [history, setHistory] = useState<ProposalPackAiRun[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function loadHistory() {
      try {
        const response = await fetch(`/api/ai/runs/${submissionId}?runType=proposal_pack&limit=3`);
        const payload = (await response.json()) as { ok: true; runs: ProposalPackAiRun[] } | { ok: false };

        if (!response.ok || !payload.ok) {
          return;
        }

        if (isMounted) {
          setHistory(payload.runs);
        }
      } catch (error) {
        console.error("proposal_pack_ai_history_failed", error);
      }
    }

    void loadHistory();

    return () => {
      isMounted = false;
    };
  }, [submissionId]);

  async function generateAiPass() {
    setIsLoading(true);
    setStatus("Running the proposal AI pass...");

    try {
      const response = await fetch(`/api/ai/proposal-pack/${submissionId}`, {
        method: "POST",
      });

      const payload = (await response.json()) as AiApiSuccess | { ok: false; message: string };

      if (!response.ok || !payload.ok) {
        setStatus(payload.ok ? "AI pass failed." : payload.message);
        return;
      }

      setResult(payload);
      setHistory((current) => {
        const next = current.filter((run) => run.id !== payload.runId);
        return [
          {
            id: payload.runId,
            workspaceId: "",
            submissionId: payload.submissionId,
            runType: "proposal_pack",
            modelName: payload.modelName,
            status: payload.mode,
            inputJson: {},
            outputJson: {
              mode: payload.mode,
              provider: payload.provider,
              confidence: payload.confidence,
              blockUpdates: payload.blockUpdates,
              rationale: payload.rationale,
              notes: payload.notes,
            },
            errorText: null,
            createdAt: payload.generatedAt,
          },
          ...next,
        ].slice(0, 3);
      });
      setStatus(
        payload.mode === "llm"
          ? "AI proposal rewrite ready."
          : "Deterministic proposal draft ready.",
      );
    } catch (error) {
      console.error("proposal_pack_ai_panel_failed", error);
      setStatus("We could not run the proposal AI pass just now.");
    } finally {
      setIsLoading(false);
    }
  }

  function restoreRun(run: ProposalPackAiRun) {
    onApplySuggestion(run.outputJson.blockUpdates);
    setStatus(
      run.outputJson.mode === "llm"
        ? "Restored the saved AI rewrite from history."
        : "Restored the saved fallback proposal draft from history.",
    );
  }

  return (
    <div className="grid gap-4 rounded-[1.75rem] border border-slate-200 bg-white p-5 shadow-sm">
      <div className="grid gap-2">
        <div className="eyebrow">AI-assisted rewrite</div>
        <h2 className="m-0 text-xl font-semibold text-slate-950">Run the proposal pack AI pass</h2>
        <p className="m-0 text-sm leading-7 text-slate-600">
          ScopeOS can tighten the client-facing proposal copy while keeping the deal scope and
          commercial posture intact. If no AI provider is connected, it falls back to the current
          deterministic draft.
        </p>
      </div>

      <button
        type="button"
        className="btn btn-dark w-fit"
        onClick={generateAiPass}
        disabled={isLoading}
      >
        {isLoading ? "Running AI..." : "Generate AI rewrite"}
      </button>

      {status ? (
        <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
          {status}
        </div>
      ) : null}

      {result ? (
        <div className="grid gap-4 rounded-[1.5rem] border border-sky-200 bg-sky-50 px-4 py-4">
          <div className="flex flex-wrap gap-2 text-xs font-medium uppercase tracking-[0.16em] text-sky-700">
            <span className="rounded-full bg-white px-3 py-1">
              Mode: {result.mode === "llm" ? "LLM" : "Fallback"}
            </span>
            {result.provider ? (
              <span className="rounded-full bg-white px-3 py-1">
                Provider: {getAiProviderLabel(result.provider)}
              </span>
            ) : null}
            <span className="rounded-full bg-white px-3 py-1">
              Confidence: {result.confidence}
            </span>
            {result.modelName ? (
              <span className="rounded-full bg-white px-3 py-1">{result.modelName}</span>
            ) : null}
          </div>

          <div className="grid gap-3 text-sm leading-7 text-slate-700">
            <div>
              <div className="font-semibold text-slate-900">Rationale</div>
              <ul className="m-0 mt-1 grid gap-1 pl-5">
                {result.rationale.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>

            <div>
              <div className="font-semibold text-slate-900">Updated sections</div>
              <p className="m-0 mt-1">
                {result.blockUpdates.length} sections are ready to replace in the draft.
              </p>
            </div>
          </div>

          <button
            type="button"
            className="btn btn-outline w-fit"
            onClick={() => onApplySuggestion(result.blockUpdates)}
          >
            Apply AI rewrite
          </button>
        </div>
      ) : null}

      <div className="grid gap-3 rounded-[1.5rem] border border-slate-200 bg-slate-50 px-4 py-4">
        <div className="text-sm font-semibold text-slate-900">Recent AI runs</div>
        {history.length === 0 ? (
          <p className="m-0 text-sm leading-7 text-slate-600">
            No saved AI runs yet for this proposal pack.
          </p>
        ) : (
          <div className="grid gap-3">
            {history.map((run) => (
              <div key={run.id} className="rounded-2xl border border-slate-200 bg-white px-4 py-4">
                <div className="flex flex-wrap items-center gap-2 text-xs uppercase tracking-[0.14em] text-slate-500">
                  <span>{run.outputJson.mode}</span>
                  <span>•</span>
                  <span>{getAiProviderLabel(run.outputJson.provider)}</span>
                  <span>•</span>
                  <span>{run.modelName ?? "fallback"}</span>
                  <span>•</span>
                  <span>{new Date(run.createdAt).toLocaleString()}</span>
                </div>
                <p className="m-0 mt-2 text-sm leading-6 text-slate-700">
                  {run.outputJson.blockUpdates[0]?.body.slice(0, 140) ?? "Saved AI rewrite"}
                </p>
                <button
                  type="button"
                  className="btn btn-small mt-3 btn-outline"
                  onClick={() => restoreRun(run)}
                >
                  Restore this run
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
