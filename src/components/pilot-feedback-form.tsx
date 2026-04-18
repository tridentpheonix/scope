"use client";

import { useState } from "react";
import type {
  PilotFeedbackBucket,
  PilotFeedbackReproducibility,
  PilotFeedbackSeverity,
} from "@/lib/pilot-feedback-storage";

type PilotFeedbackFormProps = {
  submissionId?: string;
  onSaved?: () => void;
};

const severityOptions: Array<{ value: PilotFeedbackSeverity; label: string }> = [
  { value: "blocker", label: "Blocker" },
  { value: "high", label: "High" },
  { value: "medium", label: "Medium" },
  { value: "low", label: "Low" },
];

const bucketOptions: Array<{ value: PilotFeedbackBucket; label: string }> = [
  { value: "support", label: "Support / general" },
  { value: "auth", label: "Auth / account" },
  { value: "billing", label: "Billing" },
  { value: "intake", label: "Intake / risk check" },
  { value: "ai", label: "AI output" },
  { value: "deals", label: "Saved deals" },
  { value: "analytics", label: "Analytics" },
  { value: "maintenance", label: "Maintenance / cleanup" },
  { value: "performance", label: "Performance" },
  { value: "copy", label: "Copy / wording" },
  { value: "data-integrity", label: "Data integrity" },
];

const reproducibilityOptions: Array<{ value: PilotFeedbackReproducibility; label: string }> = [
  { value: "always", label: "Always" },
  { value: "sometimes", label: "Sometimes" },
  { value: "once", label: "Once" },
  { value: "unknown", label: "Not sure" },
];

export function PilotFeedbackForm({
  submissionId: initialSubmissionId = "",
  onSaved,
}: PilotFeedbackFormProps) {
  const [submissionId, setSubmissionId] = useState(initialSubmissionId);
  const [severity, setSeverity] = useState<PilotFeedbackSeverity>("medium");
  const [bucket, setBucket] = useState<PilotFeedbackBucket>("support");
  const [whereHappened, setWhereHappened] = useState("");
  const [triedToDo, setTriedToDo] = useState("");
  const [expectedResult, setExpectedResult] = useState("");
  const [actualResult, setActualResult] = useState("");
  const [reproducibility, setReproducibility] =
    useState<PilotFeedbackReproducibility>("sometimes");
  const [note, setNote] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (whereHappened.trim().length < 3 || triedToDo.trim().length < 8) {
      setStatus("Add a few more details so the feedback is actionable.");
      return;
    }

    if (note.trim().length < 8) {
      setStatus("Add a short note summarizing the issue or request.");
      return;
    }

    setIsSaving(true);
    setStatus(null);

    try {
      const response = await fetch("/api/pilot-feedback", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          submissionId,
          severity,
          bucket,
          whereHappened,
          triedToDo,
          expectedResult,
          actualResult,
          reproducibility,
          note,
        }),
      });
      const result = (await response.json()) as { ok: boolean; message?: string };

      if (!response.ok || !result.ok) {
        throw new Error(result.message ?? "Save failed.");
      }

      setSubmissionId("");
      setSeverity("medium");
      setBucket("support");
      setWhereHappened("");
      setTriedToDo("");
      setExpectedResult("");
      setActualResult("");
      setReproducibility("sometimes");
      setNote("");
      setStatus("Pilot feedback saved.");
      onSaved?.();
    } catch (error) {
      console.error("pilot_feedback_submit_failed", error);
      setStatus("Save failed. Try again.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-4 rounded-[2rem] border border-slate-200 bg-white px-6 py-6 shadow-sm md:px-8">
      <div className="grid gap-3">
        <div className="text-sm font-semibold uppercase tracking-[0.16em] text-slate-500">
          Pilot feedback intake
        </div>
        <h2
          className="m-0 text-2xl font-semibold text-slate-950"
          style={{ fontFamily: "var(--font-display)" }}
        >
          Capture what blocked, slowed, or confused the pilot user.
        </h2>
        <p className="m-0 text-sm leading-7 text-slate-600">
          Use this when a real user reports friction so we can triage it with enough detail to fix
          the right thing once.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <label className="grid gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
          Severity
          <select
            className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900"
            value={severity}
            onChange={(event) => setSeverity(event.target.value as PilotFeedbackSeverity)}
          >
            {severityOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>

        <label className="grid gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
          Bucket
          <select
            className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900"
            value={bucket}
            onChange={(event) => setBucket(event.target.value as PilotFeedbackBucket)}
          >
            {bucketOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      <label className="grid gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
        Where it happened
        <input
          className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900"
          placeholder="Example: Launchpad, feedback page, /api/deals/[id]/attachment"
          value={whereHappened}
          onChange={(event) => setWhereHappened(event.target.value)}
        />
      </label>

      <div className="grid gap-4 md:grid-cols-2">
        <label className="grid gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
          Submission / deal ID
          <input
            className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900"
            placeholder="Optional"
            value={submissionId}
            onChange={(event) => setSubmissionId(event.target.value)}
          />
        </label>

        <label className="grid gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
          Reproducibility
          <select
            className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900"
            value={reproducibility}
            onChange={(event) =>
              setReproducibility(event.target.value as PilotFeedbackReproducibility)
            }
          >
            {reproducibilityOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      <label className="grid gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
        What were they trying to do?
        <textarea
          className="min-h-24 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900"
          placeholder="Example: Save the draft, download client materials, or complete checkout."
          value={triedToDo}
          onChange={(event) => setTriedToDo(event.target.value)}
        />
      </label>

      <div className="grid gap-4 md:grid-cols-2">
        <label className="grid gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
          What did they expect?
          <textarea
            className="min-h-24 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900"
            placeholder="What should have happened?"
            value={expectedResult}
            onChange={(event) => setExpectedResult(event.target.value)}
          />
        </label>

        <label className="grid gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
          What actually happened?
          <textarea
            className="min-h-24 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900"
            placeholder="What happened instead?"
            value={actualResult}
            onChange={(event) => setActualResult(event.target.value)}
          />
        </label>
      </div>

      <label className="grid gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
        Notes
        <textarea
          className="min-h-28 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900"
          placeholder="Short summary, severity rationale, or screenshots/links to follow up on."
          value={note}
          onChange={(event) => setNote(event.target.value)}
        />
      </label>

      <button
        type="submit"
        className="inline-flex min-h-10 items-center justify-center rounded-full bg-slate-950 px-4 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-400"
        disabled={isSaving}
      >
        {isSaving ? "Saving..." : "Record pilot feedback"}
      </button>

      {status ? (
        <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2 text-xs text-slate-700">
          {status}
        </div>
      ) : null}
    </form>
  );
}
