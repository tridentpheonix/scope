"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import type { RiskCheckAnalysisPreview } from "@/lib/risk-check-analysis";
import { DealDeleteButton } from "@/components/deal-delete-button";
import {
  acceptedAttachmentExtensions,
  briefSourceTypes,
  formatZodErrors,
  maxAttachmentSizeBytes,
  projectTypes,
  riskCheckSchema,
  type FieldErrors,
  type RiskCheckInput,
  validateAttachment,
} from "@/lib/risk-check-schema";

type FormState = Omit<RiskCheckInput, "consent"> & { consent: boolean };

const initialState: FormState = {
  name: "",
  email: "",
  agencyName: "",
  websiteUrl: "",
  projectType: "marketing-redesign",
  briefSource: "transcript",
  summary: "",
  consent: false,
};

const projectTypeLabels: Record<(typeof projectTypes)[number], string> = {
  "brochure-site": "Brochure website",
  "marketing-redesign": "Marketing website redesign",
  "webflow-build": "Webflow build",
  "wordpress-redesign": "WordPress redesign",
  other: "Other website project",
};

const briefSourceLabels: Record<(typeof briefSourceTypes)[number], string> = {
  "call-notes": "Call notes",
  transcript: "Meeting transcript",
  "client-brief": "Client brief",
  "email-thread": "Email thread",
  "loom-summary": "Loom summary",
  other: "Other source",
};

export function RiskCheckForm() {
  const [form, setForm] = useState<FormState>(initialState);
  const [attachment, setAttachment] = useState<File | null>(null);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const [submittedId, setSubmittedId] = useState<string | null>(null);
  const [analysisPreview, setAnalysisPreview] = useState<RiskCheckAnalysisPreview | null>(
    null,
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  const summaryCount = useMemo(() => form.summary.trim().length, [form.summary]);

  function updateField<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((current) => ({ ...current, [key]: value }));
    setErrors((current) => ({ ...current, [key]: undefined }));
    setServerError(null);
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmittedId(null);
    setAnalysisPreview(null);
    setServerError(null);

    const parsed = riskCheckSchema.safeParse(form);
    const attachmentError = validateAttachment(attachment);

    if (!parsed.success || attachmentError) {
      setErrors({
        ...(parsed.success ? {} : formatZodErrors(parsed.error)),
        ...(attachmentError ? { attachment: attachmentError } : {}),
      });
      return;
    }

    const payload = new FormData();
    payload.append("name", form.name);
    payload.append("email", form.email);
    payload.append("agencyName", form.agencyName);
    payload.append("websiteUrl", form.websiteUrl);
    payload.append("projectType", form.projectType);
    payload.append("briefSource", form.briefSource);
    payload.append("summary", form.summary);
    payload.append("consent", String(form.consent));
    if (attachment) {
      payload.append("attachment", attachment);
    }

    setIsSubmitting(true);
    setErrors({});

    try {
      const response = await fetch("/api/risk-check", {
        method: "POST",
        body: payload,
      });
      const result = (await response.json()) as
        | { ok: true; id: string; analysisPreview: RiskCheckAnalysisPreview }
        | { ok: false; message: string; fieldErrors?: FieldErrors };

      if (!response.ok || !result.ok) {
        setErrors(result.ok ? {} : result.fieldErrors ?? {});
        setServerError(result.ok ? "Something went wrong." : result.message);
        return;
      }

      setSubmittedId(result.id);
      setAnalysisPreview(result.analysisPreview);
      setForm(initialState);
      setAttachment(null);
    } catch (error) {
      console.error("risk_check_submit_failed", error);
      setServerError(
        "We could not submit your brief just now. Please retry — your draft is still in the form.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form className="grid gap-6" onSubmit={handleSubmit} noValidate>
      <div className="grid gap-4 md:grid-cols-2">
        <label className="grid gap-2 text-sm font-medium text-slate-800">
          Your name
          <input
            className="focus-ring rounded-2xl border border-slate-200 bg-white px-4 py-3 text-base text-slate-950"
            name="name"
            value={form.name}
            onChange={(event) => updateField("name", event.target.value)}
            placeholder="Satya"
            autoComplete="name"
          />
          {errors.name ? <span className="field-error">{errors.name}</span> : null}
        </label>
        <label className="grid gap-2 text-sm font-medium text-slate-800">
          Work email
          <input
            className="focus-ring rounded-2xl border border-slate-200 bg-white px-4 py-3 text-base text-slate-950"
            name="email"
            type="email"
            value={form.email}
            onChange={(event) => updateField("email", event.target.value)}
            placeholder="hello@agency.com"
            autoComplete="email"
          />
          {errors.email ? <span className="field-error">{errors.email}</span> : null}
        </label>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <label className="grid gap-2 text-sm font-medium text-slate-800">
          Agency or studio name
          <input
            className="focus-ring rounded-2xl border border-slate-200 bg-white px-4 py-3 text-base text-slate-950"
            name="agencyName"
            value={form.agencyName}
            onChange={(event) => updateField("agencyName", event.target.value)}
            placeholder="Northline Studio"
            autoComplete="organization"
          />
          {errors.agencyName ? (
            <span className="field-error">{errors.agencyName}</span>
          ) : null}
        </label>
        <label className="grid gap-2 text-sm font-medium text-slate-800">
          Agency website <span className="text-slate-400">(optional)</span>
          <input
            className="focus-ring rounded-2xl border border-slate-200 bg-white px-4 py-3 text-base text-slate-950"
            name="websiteUrl"
            value={form.websiteUrl}
            onChange={(event) => updateField("websiteUrl", event.target.value)}
            placeholder="https://agency.com"
            autoComplete="url"
          />
          {errors.websiteUrl ? (
            <span className="field-error">{errors.websiteUrl}</span>
          ) : null}
        </label>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <label className="grid gap-2 text-sm font-medium text-slate-800">
          Project type
          <select
            className="focus-ring rounded-2xl border border-slate-200 bg-white px-4 py-3 text-base text-slate-950"
            name="projectType"
            value={form.projectType}
            onChange={(event) =>
              updateField("projectType", event.target.value as FormState["projectType"])
            }
          >
            {projectTypes.map((type) => (
              <option value={type} key={type}>
                {projectTypeLabels[type]}
              </option>
            ))}
          </select>
        </label>

        <label className="grid gap-2 text-sm font-medium text-slate-800">
          Main source
          <select
            className="focus-ring rounded-2xl border border-slate-200 bg-white px-4 py-3 text-base text-slate-950"
            name="briefSource"
            value={form.briefSource}
            onChange={(event) =>
              updateField("briefSource", event.target.value as FormState["briefSource"])
            }
          >
            {briefSourceTypes.map((type) => (
              <option value={type} key={type}>
                {briefSourceLabels[type]}
              </option>
            ))}
          </select>
        </label>
      </div>

      <label className="grid gap-2 text-sm font-medium text-slate-800">
        Brief, transcript, or notes
        <textarea
          className="focus-ring min-h-56 rounded-3xl border border-slate-200 bg-white px-4 py-4 text-base leading-7 text-slate-950"
          name="summary"
          value={form.summary}
          onChange={(event) => updateField("summary", event.target.value)}
          placeholder="Paste the client brief, transcript excerpt, or call notes. Include goals, timeline pressure, content ownership, pages/features discussed, platform hints, revisions, and any vague asks."
        />
        <div className="flex items-center justify-between text-sm text-slate-500">
          <span>Target at least 120 characters so ScopeOS can flag missing scope safely.</span>
          <span>{summaryCount} / 6000</span>
        </div>
        {errors.summary ? <span className="field-error">{errors.summary}</span> : null}
      </label>

      <label className="grid gap-2 text-sm font-medium text-slate-800">
        Optional attachment
        <input
          className="focus-ring rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-4 text-sm text-slate-700 file:mr-4 file:rounded-full file:border-0 file:bg-slate-900 file:px-4 file:py-2 file:text-sm file:font-medium file:text-white"
          type="file"
          accept={acceptedAttachmentExtensions.join(",")}
          onChange={(event) => {
            const nextFile = event.target.files?.[0] ?? null;
            setAttachment(nextFile);
            setErrors((current) => ({ ...current, attachment: undefined }));
          }}
        />
        <span className="text-sm text-slate-500">
          Upload TXT, DOCX, or PDF under {Math.round(maxAttachmentSizeBytes / 1024 / 1024)} MB.
        </span>
        {errors.attachment ? <span className="field-error">{errors.attachment}</span> : null}
      </label>

      <label className="light-panel grid gap-3 rounded-3xl p-5 text-sm text-slate-700">
        <span className="text-sm font-semibold text-slate-950">Privacy + review note</span>
        <p className="m-0 leading-6">
          ScopeOS uses this material to produce a manual-first Scope Risk Check for brochure and
          marketing website projects. Nothing is sent to your client automatically, and source
          material can be deleted later.
        </p>
        <span className="flex items-start gap-3 text-sm font-medium text-slate-900">
          <input
            className="mt-1 size-4 rounded border-slate-300"
            type="checkbox"
            checked={form.consent}
            onChange={(event) => updateField("consent", event.target.checked)}
          />
          I confirm this material can be reviewed for a Scope Risk Check and I understand the first
          response is manual.
        </span>
        {errors.consent ? <span className="field-error">{errors.consent}</span> : null}
      </label>

      {serverError ? (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {serverError}
        </div>
      ) : null}

      {submittedId ? (
        <div className="grid gap-4 rounded-3xl border border-emerald-200 bg-emerald-50 px-5 py-4 text-sm text-emerald-800">
          <div>
            <strong className="block text-base text-emerald-950">Brief received.</strong>
            Your Scope Risk Check is in the queue. Use reference{" "}
            <span className="font-semibold">{submittedId}</span> if you need to follow up.
          </div>

          <div className="flex flex-wrap gap-3">
            <Link
              href={`/extraction-review/${submittedId}`}
              className="btn btn-dark"
            >
              Review extracted scope
            </Link>
            <Link
              href="/deals"
              className="btn btn-outline"
            >
              Open saved deals
            </Link>
            <span className="inline-flex min-h-11 items-center rounded-full border border-emerald-200 bg-white px-4 text-sm text-slate-700">
              Review internal scope first, then open the client-facing proposal draft.
            </span>
          </div>

          <div className="rounded-3xl border border-rose-200 bg-rose-50 px-4 py-4 text-sm text-rose-700">
            <div className="text-sm font-semibold text-rose-900">
              Delete this brief if needed
            </div>
            <p className="m-0 mt-2 text-sm leading-6 text-rose-800">
              You can remove the stored brief and any generated drafts at any time. This action
              cannot be undone.
            </p>
            <div className="mt-3">
              <DealDeleteButton
                submissionId={submittedId}
                onDeleted={() => {
                  setSubmittedId(null);
                  setAnalysisPreview(null);
                }}
              />
            </div>
          </div>

          {analysisPreview ? (
            <div className="grid gap-4 rounded-3xl border border-emerald-200/80 bg-white/70 p-4 text-slate-900">
              <div className="grid gap-1">
                <span className="text-xs font-semibold uppercase tracking-[0.16em] text-emerald-700">
                  Internal scope preview
                </span>
                <p className="m-0 text-sm leading-6 text-slate-700">
                  {analysisPreview.internalSummary}
                </p>
              </div>

              <div className="grid gap-2">
                <div className="text-sm font-semibold text-slate-950">
                  Pricing posture ({analysisPreview.pricingConfidence} confidence)
                </div>
                <p className="m-0 text-sm leading-6 text-slate-700">
                  {analysisPreview.recommendedApproach}
                </p>
              </div>

              <div className="grid gap-2 md:grid-cols-2">
                <div className="grid gap-2">
                  <div className="text-sm font-semibold text-slate-950">
                    Questions to lock before pricing
                  </div>
                  <ul className="m-0 grid gap-2 pl-5 text-sm leading-6 text-slate-700">
                    {analysisPreview.topQuestions.map((question) => (
                      <li key={question}>{question}</li>
                    ))}
                  </ul>
                </div>

                <div className="grid gap-2">
                  <div className="text-sm font-semibold text-slate-950">
                    Main scope risks detected
                  </div>
                  <ul className="m-0 grid gap-2 pl-5 text-sm leading-6 text-slate-700">
                    {analysisPreview.topRisks.map((risk) => (
                      <li key={risk}>{risk}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          ) : null}
        </div>
      ) : null}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="m-0 text-sm text-slate-500">
          Early release note: submissions are stored for concierge follow-up and do not trigger
          automatic proposal generation yet.
        </p>
        <button
          type="submit"
          className="btn btn-large btn-dark"
          disabled={isSubmitting}
        >
          {isSubmitting ? "Submitting your brief…" : "Submit for a free Scope Risk Check"}
        </button>
      </div>
    </form>
  );
}
