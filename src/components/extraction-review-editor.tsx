"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { ExtractionReviewAiPanel } from "@/components/extraction-review-ai-panel";
import {
  createExtractionReviewLocalBackup,
  getExtractionReviewStorageKey,
  normalizeExtractionReviewDraft,
  parseExtractionReviewLocalBackup,
  shouldUseLocalExtractionReview,
  type ExtractionReviewDraft,
} from "@/lib/extraction-review";

type ExtractionReviewEditorProps = {
  submissionId: string;
  draft: ExtractionReviewDraft;
  workspaceUpdatedAt: string | null;
};

function listToText(items: string[]) {
  return items.join("\n");
}

function textToList(value: string) {
  return value
    .split(/\r?\n/)
    .map((item) => item.trim())
    .filter(Boolean);
}

type ExtractionReviewEditorState = {
  summary: string;
  pricingApproach: string;
  questions: string;
  risks: string;
  assumptions: string;
  restoredFromBrowserBackup: boolean;
};

function getDefaultState(draft: ExtractionReviewDraft): ExtractionReviewEditorState {
  const normalizedDraft = normalizeExtractionReviewDraft(draft);

  return {
    summary: normalizedDraft.summary,
    pricingApproach: normalizedDraft.pricingApproach,
    questions: listToText(normalizedDraft.missingInfoQuestions),
    risks: listToText(normalizedDraft.riskFlags),
    assumptions: listToText(normalizedDraft.assumptions),
    restoredFromBrowserBackup: false,
  };
}

function getInitialState(
  storageKey: string,
  draft: ExtractionReviewDraft,
  workspaceUpdatedAt: string | null,
): ExtractionReviewEditorState {
  const defaultState = getDefaultState(draft);

  if (typeof window === "undefined") {
    return defaultState;
  }

  const backup = parseExtractionReviewLocalBackup(
    window.localStorage.getItem(storageKey),
  );

  if (
    !backup ||
    !shouldUseLocalExtractionReview(backup.updatedAt, workspaceUpdatedAt)
  ) {
    return defaultState;
  }

  return {
    summary: backup.review.summary,
    pricingApproach: backup.review.pricingApproach,
    questions: listToText(backup.review.missingInfoQuestions),
    risks: listToText(backup.review.riskFlags),
    assumptions: listToText(backup.review.assumptions),
    restoredFromBrowserBackup: true,
  };
}

function buildDraftFromState(
  reviewState: ExtractionReviewEditorState,
): ExtractionReviewDraft {
  return normalizeExtractionReviewDraft({
    summary: reviewState.summary,
    pricingApproach: reviewState.pricingApproach,
    missingInfoQuestions: textToList(reviewState.questions),
    riskFlags: textToList(reviewState.risks),
    assumptions: textToList(reviewState.assumptions),
  });
}

export function ExtractionReviewEditor({
  submissionId,
  draft,
  workspaceUpdatedAt,
}: ExtractionReviewEditorProps) {
  const storageKey = getExtractionReviewStorageKey(submissionId);
  const [reviewState, setReviewState] = useState<ExtractionReviewEditorState>(() =>
    getInitialState(storageKey, draft, workspaceUpdatedAt),
  );
  const [status, setStatus] = useState<string | null>(null);
  const [workspaceStatus, setWorkspaceStatus] = useState(
    workspaceUpdatedAt
      ? "Saved workspace review loaded."
      : "Review not yet saved to the workspace.",
  );
  const skipFirstWorkspaceSave = useRef(true);

  useEffect(() => {
    try {
      const backup = createExtractionReviewLocalBackup(buildDraftFromState(reviewState));
      window.localStorage.setItem(storageKey, JSON.stringify(backup));
    } catch (error) {
      console.error("extraction_review_autosave_failed", error);
    }
  }, [reviewState, storageKey]);

  useEffect(() => {
    if (skipFirstWorkspaceSave.current) {
      skipFirstWorkspaceSave.current = false;
      return;
    }

    const review = buildDraftFromState(reviewState);
    const timeout = window.setTimeout(async () => {
      setWorkspaceStatus("Saving review to workspace...");

      try {
        const response = await fetch(`/api/extraction-review/${submissionId}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ review }),
        });

        if (!response.ok) {
          throw new Error(`Save failed with status ${response.status}`);
        }

        setWorkspaceStatus("Saved review to workspace.");
      } catch (error) {
        console.error("extraction_review_workspace_save_failed", error);
        setWorkspaceStatus(
          "Workspace save failed. Your browser backup is still available on this device.",
        );
      }
    }, 700);

    return () => window.clearTimeout(timeout);
  }, [reviewState, submissionId]);

  function updateField(
    key: Exclude<keyof ExtractionReviewEditorState, "restoredFromBrowserBackup">,
    value: string,
  ) {
    setReviewState((current) => ({
      ...current,
      [key]: value,
      restoredFromBrowserBackup: false,
    }));
    setStatus(null);
  }

  function resetReview() {
    setReviewState(getDefaultState(draft));
    window.localStorage.removeItem(storageKey);
    setStatus("Review reset to the current generated extraction output.");
  }

  function applyAiSuggestion(review: ExtractionReviewDraft) {
    setReviewState({
      summary: review.summary,
      pricingApproach: review.pricingApproach,
      questions: listToText(review.missingInfoQuestions),
      risks: listToText(review.riskFlags),
      assumptions: listToText(review.assumptions),
      restoredFromBrowserBackup: false,
    });
    setStatus("Applied the AI-assisted review suggestions.");
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[1.15fr_0.85fr]">
      <div className="grid gap-6">
        <div className="light-panel rounded-[2rem] p-6 md:p-8">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div className="grid gap-2">
              <span className="eyebrow">Phase 03 - extraction review</span>
              <h1
                className="m-0 text-3xl font-semibold tracking-[-0.04em] text-slate-950 md:text-5xl"
                style={{ fontFamily: "var(--font-display)" }}
              >
                Review the extracted scope before proposal generation
              </h1>
              <p className="m-0 max-w-3xl text-sm leading-7 text-slate-600 md:text-base">
                This step now saves internal review edits to the workspace so the scoping logic can
                follow the deal across browser sessions and devices before the proposal draft is
                opened.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <Link
                href={`/proposal-pack/${submissionId}`}
                className="btn btn-dark"
              >
                Continue to proposal pack
              </Link>
              <button
                type="button"
                onClick={resetReview}
                className="btn btn-outline"
              >
                Reset review
              </button>
            </div>
          </div>

          <div className="mt-5 grid gap-3 text-sm text-slate-600 md:grid-cols-2">
            <div className="rounded-3xl border border-slate-200 bg-white px-4 py-4">
              Edits autosave to the workspace and keep a browser backup on this device.
            </div>
            <div className="rounded-3xl border border-slate-200 bg-white px-4 py-4">
              Only internal review fields are edited here. Client-facing export still happens in
              the proposal draft workspace.
            </div>
          </div>

          <div className="mt-4 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700">
            {workspaceStatus}
          </div>

          {workspaceUpdatedAt ? (
            <div className="mt-4 rounded-2xl border border-violet-200 bg-violet-50 px-4 py-3 text-sm text-violet-800">
              Loaded the last saved workspace review for this deal.
            </div>
          ) : null}

          {reviewState.restoredFromBrowserBackup ? (
            <div className="mt-4 rounded-2xl border border-sky-200 bg-sky-50 px-4 py-3 text-sm text-sky-800">
              Restored a newer browser backup for this submission on this device.
            </div>
          ) : null}

          {status ? (
            <div className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
              {status}
            </div>
          ) : null}
        </div>

        <section className="rounded-[1.75rem] border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="m-0 text-xl font-semibold text-slate-950">Internal summary</h2>
          <p className="m-0 mt-1 text-sm text-slate-500">
            Rewrite the internal read on this deal before pricing is anchored.
          </p>
          <textarea
            className="focus-ring mt-4 min-h-36 w-full rounded-[1.5rem] border border-slate-200 bg-white px-4 py-4 text-sm leading-7 text-slate-900"
            value={reviewState.summary}
            onChange={(event) => updateField("summary", event.target.value)}
          />
        </section>

        <ExtractionReviewAiPanel
          submissionId={submissionId}
          onApplySuggestion={applyAiSuggestion}
        />

        <section className="rounded-[1.75rem] border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="m-0 text-xl font-semibold text-slate-950">Pricing posture</h2>
          <p className="m-0 mt-1 text-sm text-slate-500">
            Tighten the internal pricing guidance before it shapes the proposal tiers.
          </p>
          <textarea
            className="focus-ring mt-4 min-h-36 w-full rounded-[1.5rem] border border-slate-200 bg-white px-4 py-4 text-sm leading-7 text-slate-900"
            value={reviewState.pricingApproach}
            onChange={(event) => updateField("pricingApproach", event.target.value)}
          />
        </section>

        <section className="grid gap-4 md:grid-cols-2">
          <div className="rounded-[1.75rem] border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="m-0 text-xl font-semibold text-slate-950">
              Questions to answer before pricing
            </h2>
            <p className="m-0 mt-1 text-sm text-slate-500">One question per line.</p>
            <textarea
              className="focus-ring mt-4 min-h-64 w-full rounded-[1.5rem] border border-slate-200 bg-white px-4 py-4 text-sm leading-7 text-slate-900"
              value={reviewState.questions}
              onChange={(event) => updateField("questions", event.target.value)}
            />
          </div>

          <div className="rounded-[1.75rem] border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="m-0 text-xl font-semibold text-slate-950">Main risk flags</h2>
            <p className="m-0 mt-1 text-sm text-slate-500">One risk per line.</p>
            <textarea
              className="focus-ring mt-4 min-h-64 w-full rounded-[1.5rem] border border-slate-200 bg-white px-4 py-4 text-sm leading-7 text-slate-900"
              value={reviewState.risks}
              onChange={(event) => updateField("risks", event.target.value)}
            />
          </div>
        </section>

        <section className="rounded-[1.75rem] border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="m-0 text-xl font-semibold text-slate-950">Assumptions to carry forward</h2>
          <p className="m-0 mt-1 text-sm text-slate-500">
            These shape the assumptions section in the editable proposal draft.
          </p>
          <textarea
            className="focus-ring mt-4 min-h-48 w-full rounded-[1.5rem] border border-slate-200 bg-white px-4 py-4 text-sm leading-7 text-slate-900"
            value={reviewState.assumptions}
            onChange={(event) => updateField("assumptions", event.target.value)}
          />
        </section>
      </div>

      <aside className="grid h-fit gap-4 lg:sticky lg:top-24">
        <div className="glass-panel rounded-[1.75rem] p-5">
          <div className="grid gap-3">
            <div>
              <div className="eyebrow">What this step is for</div>
              <h2
                className="m-0 mt-2 text-2xl font-semibold text-white"
                style={{ fontFamily: "var(--font-display)" }}
              >
                Review before proposal
              </h2>
            </div>
            <p className="m-0 text-sm leading-7 text-slate-300">
              Use this screen to decide what is still unknown, what belongs in assumptions, and
              what should stay out of the base scope before you generate the client-facing pack.
            </p>
          </div>
        </div>

        <div className="glass-panel rounded-[1.75rem] p-5">
          <div className="text-sm font-semibold uppercase tracking-[0.16em] text-sky-200">
            Founder checklist
          </div>
          <ul className="m-0 mt-4 grid gap-3 pl-5 text-sm leading-6 text-slate-200">
            <li>Confirm the internal summary matches the real deal risk.</li>
            <li>Keep pricing posture tighter than the client brief language.</li>
            <li>Write only the questions that truly block safe pricing.</li>
            <li>Carry forward assumptions that reduce margin exposure.</li>
          </ul>
        </div>
      </aside>
    </div>
  );
}
