"use client";

import { useState } from "react";

type ExportBlockerFormProps = {
  onSaved?: () => void;
};

export function ExportBlockerForm({ onSaved }: ExportBlockerFormProps) {
  const [note, setNote] = useState("");
  const [outcome, setOutcome] = useState<
    "reduced-friction" | "needs-theme-options" | "needs-google-docs" | "other"
  >("reduced-friction");
  const [themePreference, setThemePreference] = useState<
    "light" | "dark" | "both" | "unspecified"
  >("unspecified");
  const [nextStep, setNextStep] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (note.trim().length < 8) {
      setStatus("Add a short note describing the branded export feedback.");
      return;
    }

    setIsSaving(true);
    setStatus(null);

    try {
      const response = await fetch("/api/export-blocker", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          note,
          outcome,
          themePreference,
          nextStep,
        }),
      });
      const result = (await response.json()) as { ok: boolean; message?: string };

      if (!response.ok || !result.ok) {
        throw new Error(result.message ?? "Save failed.");
      }

      setNote("");
      setNextStep("");
      setOutcome("reduced-friction");
      setThemePreference("unspecified");
      setStatus("Feedback note saved.");
      onSaved?.();
    } catch (error) {
      console.error("export_blocker_submit_failed", error);
      setStatus("Save failed. Try again.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-3">
      <label className="grid gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
        Outcome
        <select
          className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900"
          value={outcome}
          onChange={(event) =>
            setOutcome(
              event.target.value as
                | "reduced-friction"
                | "needs-theme-options"
                | "needs-google-docs"
                | "other",
            )
          }
        >
          <option value="reduced-friction">Reduced send-time friction</option>
          <option value="needs-theme-options">Needs more theme options</option>
          <option value="needs-google-docs">Still needs Google Docs</option>
          <option value="other">Other feedback</option>
        </select>
      </label>

      <label className="grid gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
        Theme preference
        <select
          className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900"
          value={themePreference}
          onChange={(event) =>
            setThemePreference(
              event.target.value as "light" | "dark" | "both" | "unspecified",
            )
          }
        >
          <option value="unspecified">No preference</option>
          <option value="light">Light theme</option>
          <option value="dark">Dark theme</option>
          <option value="both">Needs both</option>
        </select>
      </label>

      <textarea
        className="min-h-24 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900"
        placeholder="Paid user said: branded export helped, but we still need a Word template."
        value={note}
        onChange={(event) => setNote(event.target.value)}
      />
      <input
        className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900"
        placeholder="Suggested next step (optional)"
        value={nextStep}
        onChange={(event) => setNextStep(event.target.value)}
      />
      <button
        type="submit"
        className="inline-flex min-h-10 items-center justify-center rounded-full bg-slate-950 px-4 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-400"
        disabled={isSaving}
      >
        {isSaving ? "Saving..." : "Record branded export feedback"}
      </button>
      {status ? (
        <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2 text-xs text-slate-700">
          {status}
        </div>
      ) : null}
    </form>
  );
}
