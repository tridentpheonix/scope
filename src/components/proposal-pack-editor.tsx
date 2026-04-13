"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { trackEvent } from "@/lib/analytics";
import { applyClausePackToBodies, clausePacks } from "@/lib/clause-packs";
import {
  buildChangeOrderSummary,
  normalizeChangeOrderDraft,
  type ChangeOrderDraft,
} from "@/lib/change-order";
import {
  applyExtractionReviewOverridesToProposalDraft,
  parseExtractionReviewLocalBackup,
  getExtractionReviewStorageKey,
  shouldUseLocalExtractionReview,
} from "@/lib/extraction-review";
import {
  buildProposalPackHtml,
  buildProposalPackMarkdown,
  type ProposalPackBlock,
  type ProposalPackDraft,
  type ProposalPackTheme,
} from "@/lib/proposal-pack";
import type { ProposalMemoryItem } from "@/lib/proposal-memory";
import { ProposalPackAiPanel } from "@/components/proposal-pack-ai-panel";
import { DealDeleteButton } from "@/components/deal-delete-button";

type ProposalPackEditorProps = {
  submissionId: string;
  draft: ProposalPackDraft;
  reviewSavedAt: string | null;
  changeOrderDraft: ChangeOrderDraft | null;
  changeOrderSavedAt: string | null;
  proposalMemory: ProposalMemoryItem[];
  canUsePremiumExport: boolean;
};

function getInitialBodies(draft: ProposalPackDraft) {
  return Object.fromEntries(draft.blocks.map((block) => [block.id, block.body]));
}

export function ProposalPackEditor({
  submissionId,
  draft,
  reviewSavedAt,
  changeOrderDraft,
  changeOrderSavedAt,
  proposalMemory,
  canUsePremiumExport,
}: ProposalPackEditorProps) {
  const router = useRouter();
  const storageKey = `scopeos-proposal-pack:${submissionId}`;
  const changeOrderStorageKey = `scopeos-change-order:${submissionId}`;
  const [effectiveDraft, setEffectiveDraft] = useState<ProposalPackDraft>(draft);
  const defaultBodies = useMemo(() => getInitialBodies(effectiveDraft), [effectiveDraft]);
  const [bodies, setBodies] = useState<Record<string, string>>(defaultBodies);
  const [status, setStatus] = useState<string | null>(null);
  const [clauseStatus, setClauseStatus] = useState<string | null>(null);
  const [exportTheme, setExportTheme] = useState<ProposalPackTheme>("light");
  const [loadedSavedDraft, setLoadedSavedDraft] = useState(false);
  const [loadedReviewOverrides, setLoadedReviewOverrides] = useState(false);
  const [workspaceStatus, setWorkspaceStatus] = useState("Draft ready.");
  const [changeOrderStatus, setChangeOrderStatus] = useState(
    changeOrderSavedAt ? "Saved change-order notes loaded." : "Change-order notes not saved yet.",
  );
  const [driftItems, setDriftItems] = useState("");
  const [impactNotes, setImpactNotes] = useState("");
  const skipFirstWorkspaceSave = useRef(true);
  const skipFirstChangeOrderSave = useRef(true);

  useEffect(() => {
    setBodies(defaultBodies);
  }, [defaultBodies]);

  useEffect(() => {
    trackEvent({
      name: "proposal_pack_opened",
      submissionId,
    });
  }, [submissionId]);

  useEffect(() => {
    try {
      setLoadedReviewOverrides(false);
      const savedReview = parseExtractionReviewLocalBackup(
        window.localStorage.getItem(getExtractionReviewStorageKey(submissionId)),
      );

      if (
        !savedReview ||
        !shouldUseLocalExtractionReview(savedReview.updatedAt, reviewSavedAt)
      ) {
        setEffectiveDraft(draft);
        return;
      }

      setEffectiveDraft(
        applyExtractionReviewOverridesToProposalDraft(draft, savedReview.review),
      );
      setLoadedReviewOverrides(true);
    } catch (error) {
      console.error("proposal_pack_review_overrides_failed", error);
      setEffectiveDraft(draft);
    }
  }, [draft, reviewSavedAt, submissionId]);

  useEffect(() => {
    try {
      const savedDraft = window.localStorage.getItem(storageKey);
      if (savedDraft) {
        const parsed = JSON.parse(savedDraft) as Record<string, string>;
        setBodies((current) => ({ ...current, ...parsed }));
        setLoadedSavedDraft(true);
      }
    } catch (error) {
      console.error("proposal_pack_restore_failed", error);
    }
  }, [storageKey]);

  useEffect(() => {
    try {
      window.localStorage.setItem(storageKey, JSON.stringify(bodies));
    } catch (error) {
      console.error("proposal_pack_autosave_failed", error);
    }
  }, [bodies, storageKey]);

  useEffect(() => {
    if (skipFirstWorkspaceSave.current) {
      skipFirstWorkspaceSave.current = false;
      return;
    }

    const timeout = window.setTimeout(async () => {
      setWorkspaceStatus("Saving draft to workspace...");

      try {
        const response = await fetch(`/api/proposal-pack/${submissionId}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ clientBlocks: bodies }),
        });

        if (!response.ok) {
          throw new Error(`Save failed with status ${response.status}`);
        }

        setWorkspaceStatus("Saved to workspace.");
        trackEvent({
          name: "proposal_pack_saved",
          submissionId,
          metadata: {
            blockCount: Object.keys(bodies).length,
          },
        });
      } catch (error) {
        console.error("proposal_pack_workspace_save_failed", error);
        setWorkspaceStatus(
          "Workspace save failed. Your browser copy is still available on this device.",
        );
      }
    }, 900);

    return () => window.clearTimeout(timeout);
  }, [bodies, submissionId]);

  useEffect(() => {
    const workspaceDraft = changeOrderDraft
      ? normalizeChangeOrderDraft(changeOrderDraft)
      : null;

    if (workspaceDraft) {
      setDriftItems(workspaceDraft.driftItems.join("\n"));
      setImpactNotes(workspaceDraft.impactNotes);
      return;
    }

    const savedLocal = window.localStorage.getItem(changeOrderStorageKey);
    if (!savedLocal) {
      return;
    }

    try {
      const parsed = JSON.parse(savedLocal) as ChangeOrderDraft;
      setDriftItems(parsed.driftItems.join("\n"));
      setImpactNotes(parsed.impactNotes ?? "");
    } catch (error) {
      console.error("change_order_restore_failed", error);
    }
  }, [changeOrderDraft, changeOrderStorageKey]);

  useEffect(() => {
    const draftPayload = normalizeChangeOrderDraft({
      driftItems: driftItems.split(/\r?\n/),
      impactNotes,
    });

    try {
      window.localStorage.setItem(changeOrderStorageKey, JSON.stringify(draftPayload));
    } catch (error) {
      console.error("change_order_autosave_failed", error);
    }
  }, [changeOrderStorageKey, driftItems, impactNotes]);

  useEffect(() => {
    if (skipFirstChangeOrderSave.current) {
      skipFirstChangeOrderSave.current = false;
      return;
    }

    const draftPayload = normalizeChangeOrderDraft({
      driftItems: driftItems.split(/\r?\n/),
      impactNotes,
    });

    const timeout = window.setTimeout(async () => {
      setChangeOrderStatus("Saving change-order notes...");

      try {
        const response = await fetch(`/api/change-order/${submissionId}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ draft: draftPayload }),
        });

        if (!response.ok) {
          throw new Error(`Save failed with status ${response.status}`);
        }

        setChangeOrderStatus("Saved change-order notes to workspace.");
      } catch (error) {
        console.error("change_order_save_failed", error);
        setChangeOrderStatus(
          "Change-order save failed. Your browser backup is still available on this device.",
        );
      }
    }, 700);

    return () => window.clearTimeout(timeout);
  }, [driftItems, impactNotes, submissionId]);

  function updateBody(id: string, value: string) {
    setBodies((current) => ({ ...current, [id]: value }));
    setStatus(null);
    setClauseStatus(null);
  }

  async function copyText(
    value: string,
    successMessage: string,
    eventName?: string,
    metadata?: Record<string, string | number | boolean | null>,
  ) {
    try {
      await navigator.clipboard.writeText(value);
      setStatus(successMessage);
      if (eventName) {
        trackEvent({
          name: eventName,
          submissionId,
          metadata,
        });
      }
    } catch (error) {
      console.error("proposal_pack_copy_failed", error);
      setStatus("Copy failed. You can still select the text manually.");
    }
  }

  function buildDraftWithEdits(): ProposalPackDraft {
    return {
      ...effectiveDraft,
      blocks: effectiveDraft.blocks.map((block) => ({
        ...block,
        body: bodies[block.id] ?? block.body,
      })),
    };
  }

  async function copyFullPack() {
    await copyText(
      buildProposalPackMarkdown(buildDraftWithEdits()),
      "Full proposal pack copied.",
      "proposal_pack_copy_full",
    );
  }

  function downloadMarkdown() {
    try {
      const markdown = buildProposalPackMarkdown(buildDraftWithEdits());
      const blob = new Blob([markdown], { type: "text/markdown;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = `${submissionId}-proposal-pack.md`;
      anchor.click();
      URL.revokeObjectURL(url);
      setStatus("Markdown export downloaded.");
      trackEvent({
        name: "proposal_pack_download_markdown",
        submissionId,
      });
    } catch (error) {
      console.error("proposal_pack_download_failed", error);
      setStatus("Download failed. Copy the full pack instead.");
    }
  }

  function openBrandedExport() {
    const html = buildProposalPackHtml(buildDraftWithEdits(), exportTheme);
    const popup = window.open("", "_blank");
    if (!popup) {
      setStatus("Pop-up blocked. Allow pop-ups to open the branded export.");
      return;
    }

    popup.document.open();
    popup.document.write(html);
    popup.document.close();
    popup.focus();
    setStatus("Branded export opened in a new tab. Use Print to save as PDF.");
    trackEvent({
      name: "proposal_pack_open_branded_export",
      submissionId,
      metadata: {
        theme: exportTheme,
      },
    });
  }

  function downloadBrandedHtml() {
    try {
      const html = buildProposalPackHtml(buildDraftWithEdits(), exportTheme);
      const blob = new Blob([html], { type: "text/html;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = `${submissionId}-proposal-pack.html`;
      anchor.click();
      URL.revokeObjectURL(url);
      setStatus("Branded HTML export downloaded.");
      trackEvent({
        name: "proposal_pack_download_branded_html",
        submissionId,
        metadata: {
          theme: exportTheme,
        },
      });
    } catch (error) {
      console.error("proposal_pack_branded_download_failed", error);
      setStatus("Branded export failed. Try the markdown download instead.");
    }
  }

  function resetDraft() {
    setBodies(defaultBodies);
    window.localStorage.removeItem(storageKey);
    setLoadedSavedDraft(false);
    setStatus("Draft reset to the generated version.");
  }

  function applyClausePack(packId: string) {
    const pack = clausePacks.find((item) => item.id === packId);
    if (!pack) {
      return;
    }

    setBodies((current) => applyClausePackToBodies(current, pack));
    setClauseStatus(`Applied "${pack.title}" clause pack.`);
  }

  function applyAiRewrite(updates: ProposalPackBlock[]) {
    if (updates.length === 0) {
      setStatus("The AI rewrite did not include any section updates.");
      return;
    }

    setBodies((current) => {
      const nextBodies = { ...current };

      for (const update of updates) {
        nextBodies[update.id] = update.body;
      }

      return nextBodies;
    });
    setStatus(`Applied AI rewrite to ${updates.length} sections.`);
  }

  function handleDeleteComplete() {
    window.localStorage.removeItem(storageKey);
    window.localStorage.removeItem(changeOrderStorageKey);
    window.localStorage.removeItem(getExtractionReviewStorageKey(submissionId));
    router.push("/deals");
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr]">
      <div className="grid gap-6">
        <div className="light-panel rounded-[2rem] p-6 md:p-8">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div className="grid gap-2">
              <span className="eyebrow">Editable export flow</span>
              <h1
                className="m-0 text-3xl font-semibold tracking-[-0.04em] text-slate-950 md:text-5xl"
                style={{ fontFamily: "var(--font-display)" }}
              >
                {draft.title}
              </h1>
              <p className="m-0 text-sm leading-7 text-slate-600">{draft.subtitle}</p>
            </div>

            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={copyFullPack}
                className="btn btn-dark"
              >
                Copy full pack
              </button>
              <button
                type="button"
                onClick={openBrandedExport}
                className="btn btn-outline"
                disabled={!canUsePremiumExport}
              >
                Open branded export
              </button>
              <button
                type="button"
                onClick={downloadBrandedHtml}
                className="btn btn-small border-slate-200 bg-slate-50 text-slate-700 hover:border-slate-300 hover:bg-white"
                disabled={!canUsePremiumExport}
              >
                Download branded HTML
              </button>
              <button
                type="button"
                onClick={downloadMarkdown}
                className="btn btn-outline"
              >
                Download markdown
              </button>
              <button
                type="button"
                onClick={resetDraft}
                className="btn btn-small border-slate-200 bg-slate-50 text-slate-700 hover:border-slate-300 hover:bg-white"
              >
                Reset draft
              </button>
            </div>
          </div>

          <div className="mt-5 grid gap-3 text-sm text-slate-600 md:grid-cols-2">
            <div className="rounded-3xl border border-slate-200 bg-white px-4 py-4">
              Edits autosave in this browser and sync to the workspace draft file.
            </div>
            <div className="rounded-3xl border border-slate-200 bg-white px-4 py-4">
              Export actions use only the editable proposal blocks, not the internal notes.
            </div>
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-3 rounded-3xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700">
            <span className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
              Branded export theme
            </span>
            <div className="flex flex-wrap gap-2">
              {(["light", "dark"] as const).map((theme) => (
                <button
                  key={theme}
                  type="button"
                  onClick={() => setExportTheme(theme)}
                  className={`btn btn-small ${
                    exportTheme === theme
                      ? "bg-slate-900 text-white"
                      : "btn-outline bg-white text-slate-700"
                  } disabled:opacity-50`}
                  disabled={!canUsePremiumExport}
                >
                  {theme === "light" ? "Light theme" : "Dark theme"}
                </button>
              ))}
            </div>
            <span className="text-xs text-slate-500">
              Theme applies to branded HTML + print output only.
            </span>
          </div>

          {canUsePremiumExport ? (
            <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm leading-6 text-amber-950">
              <strong className="block text-base">Branded export is available</strong>
              Use the branded export to generate a client-ready PDF via your browser print flow or
              download the HTML for sharing with your team. Copy + markdown are still available for
              quick handoff into Docs.
            </div>
          ) : (
            <div className="mt-4 rounded-2xl border border-sky-200 bg-sky-50 px-4 py-3 text-sm leading-6 text-sky-900">
              <strong className="block text-base">Upgrade to unlock branded export</strong>
              Free workspaces keep copy + markdown export. Solo and Team plans unlock branded HTML
              and print-to-PDF export for client-ready delivery.{' '}
              <a href="/pricing" className="font-semibold underline underline-offset-2">
                Compare plans
              </a>
              .
            </div>
          )}

          <div className="mt-4 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700">
            {workspaceStatus}
          </div>

          {loadedSavedDraft ? (
            <div className="mt-4 rounded-2xl border border-sky-200 bg-sky-50 px-4 py-3 text-sm text-sky-800">
              Restored your last local draft for this proposal pack.
            </div>
          ) : null}

          {loadedReviewOverrides ? (
            <div className="mt-4 rounded-2xl border border-violet-200 bg-violet-50 px-4 py-3 text-sm text-violet-800">
              Applied your extraction-review edits to this proposal draft.
            </div>
          ) : null}

          {status ? (
            <div className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
              {status}
            </div>
          ) : null}

          {clauseStatus ? (
            <div className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
              {clauseStatus}
            </div>
          ) : null}
        </div>

        <ProposalPackAiPanel
          submissionId={submissionId}
          onApplySuggestion={applyAiRewrite}
        />

        <div className="grid gap-4">
          {draft.blocks.map((block) => (
            <section
              key={block.id}
              className={`rounded-[1.75rem] border p-5 shadow-sm ${
                block.kind === "pricing"
                  ? "border-sky-200 bg-sky-50/70"
                  : "border-slate-200 bg-white"
              }`}
            >
              <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div>
                  <h2 className="m-0 text-xl font-semibold text-slate-950">{block.title}</h2>
                  <p className="m-0 mt-1 text-sm text-slate-500">
                    {block.kind === "pricing"
                      ? "Client-facing pricing block"
                      : "Editable export section"}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    copyText(
                      `## ${block.title}\n\n${bodies[block.id] ?? block.body}`,
                      `${block.title} copied.`,
                      "proposal_pack_copy_section",
                      { sectionId: block.id },
                    )
                  }
                  className="btn btn-small btn-outline bg-white"
                >
                  Copy section
                </button>
              </div>

              <textarea
                className="focus-ring min-h-56 w-full rounded-[1.5rem] border border-slate-200 bg-white px-4 py-4 text-sm leading-7 text-slate-900"
                value={bodies[block.id] ?? block.body}
                onChange={(event) => updateBody(block.id, event.target.value)}
              />
            </section>
          ))}
        </div>
      </div>

      <aside className="grid h-fit gap-4 lg:sticky lg:top-24">
        <div className="glass-panel rounded-[1.75rem] p-5">
          <div className="grid gap-3">
            <div>
              <div className="eyebrow">Internal prep notes</div>
              <h2
                className="m-0 mt-2 text-2xl font-semibold text-white"
                style={{ fontFamily: "var(--font-display)" }}
              >
                Not exported
              </h2>
            </div>
            <p className="m-0 text-sm leading-7 text-slate-300">
              {draft.internalNotes.summary}
            </p>
            <div className="rounded-3xl border border-white/10 bg-white/4 px-4 py-4 text-sm leading-7 text-slate-200">
              {draft.internalNotes.recommendedApproach}
            </div>
            <a
              href={`/extraction-review/${submissionId}`}
              className="btn btn-secondary"
            >
              Re-open extraction review
            </a>
          </div>
        </div>

        <div className="glass-panel rounded-[1.75rem] p-5">
          <div className="text-sm font-semibold uppercase tracking-[0.16em] text-sky-200">
            Top risks
          </div>
          <ul className="m-0 mt-4 grid gap-3 pl-5 text-sm leading-6 text-slate-200">
            {draft.internalNotes.riskFlags.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>

        <div className="glass-panel rounded-[1.75rem] p-5">
          <div className="text-sm font-semibold uppercase tracking-[0.16em] text-sky-200">
            Questions to resolve
          </div>
          <ul className="m-0 mt-4 grid gap-3 pl-5 text-sm leading-6 text-slate-200">
            {draft.internalNotes.missingInfoQuestions.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>

        <div className="glass-panel rounded-[1.75rem] p-5">
          <div className="text-sm font-semibold uppercase tracking-[0.16em] text-sky-200">
            Agency defaults in use
          </div>
          <ul className="m-0 mt-4 grid gap-3 pl-5 text-sm leading-6 text-slate-200">
            {draft.internalNotes.commercialDefaults.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>

        <div className="glass-panel rounded-[1.75rem] p-5">
          <div className="text-sm font-semibold uppercase tracking-[0.16em] text-sky-200">
            Proposal memory
          </div>
          <div className="mt-4 grid gap-4 text-sm text-slate-200">
            {proposalMemory.length === 0 ? (
              <p className="m-0 text-sm leading-6 text-slate-300">
                No prior proposal drafts saved yet. Once you have another deal saved, you can reuse
                assumptions, exclusions, and commercial terms here.
              </p>
            ) : (
              proposalMemory.map((memory) => (
                <div key={memory.submissionId} className="rounded-2xl border border-white/10 p-4">
                  <div className="text-sm font-semibold text-white">{memory.title}</div>
                  <div className="mt-1 text-xs text-slate-400">
                    Updated {new Date(memory.updatedAt).toLocaleString()}
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => updateBody("assumptions", memory.blocks.assumptions)}
                      className="btn btn-small border-white/20 bg-white/5 text-white hover:bg-white/10"
                    >
                      Use assumptions
                    </button>
                    <button
                      type="button"
                      onClick={() => updateBody("exclusions", memory.blocks.exclusions)}
                      className="btn btn-small border-white/20 bg-white/5 text-white hover:bg-white/10"
                    >
                      Use exclusions
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        updateBody("commercial-terms", memory.blocks.commercialTerms)
                      }
                      className="btn btn-small border-white/20 bg-white/5 text-white hover:bg-white/10"
                    >
                      Use commercial terms
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="glass-panel rounded-[1.75rem] p-5">
          <div className="text-sm font-semibold uppercase tracking-[0.16em] text-sky-200">
            Clause packs
          </div>
          <p className="m-0 mt-3 text-sm leading-6 text-slate-300">
            Apply niche clauses to assumptions, exclusions, and commercial terms. Packs append to
            the current draft so you can edit or remove them before sending.
          </p>
          <div className="mt-4 grid gap-3 text-sm text-slate-200">
            {clausePacks.map((pack) => (
              <div key={pack.id} className="rounded-2xl border border-white/10 p-4">
                <div className="text-sm font-semibold text-white">{pack.title}</div>
                <p className="m-0 mt-2 text-xs leading-5 text-slate-300">{pack.description}</p>
                <button
                  type="button"
                  onClick={() => applyClausePack(pack.id)}
                  className="btn btn-small mt-3 border-white/20 bg-white/5 text-white hover:bg-white/10"
                >
                  Apply clause pack
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="glass-panel rounded-[1.75rem] p-5">
          <div className="text-sm font-semibold uppercase tracking-[0.16em] text-sky-200">
            Scope drift & change order
          </div>
          <p className="m-0 mt-3 text-sm leading-6 text-slate-300">
            Capture scope drift as it appears. ScopeOS will turn it into a client-ready change
            order note before you respond.
          </p>
          <div className="mt-4 grid gap-3 text-sm text-slate-200">
            <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-xs text-slate-200">
              {changeOrderStatus}
            </div>
            <label className="grid gap-2 text-xs font-semibold uppercase tracking-[0.12em] text-slate-300">
              Drift items (one per line)
              <textarea
                className="min-h-28 rounded-2xl border border-white/10 bg-white/5 px-3 py-3 text-sm text-white"
                value={driftItems}
                onChange={(event) => setDriftItems(event.target.value)}
              />
            </label>
            <label className="grid gap-2 text-xs font-semibold uppercase tracking-[0.12em] text-slate-300">
              Impact notes
              <textarea
                className="min-h-24 rounded-2xl border border-white/10 bg-white/5 px-3 py-3 text-sm text-white"
                value={impactNotes}
                onChange={(event) => setImpactNotes(event.target.value)}
              />
            </label>
            <button
              type="button"
              onClick={() =>
                copyText(
                  buildChangeOrderSummary({
                    driftItems: driftItems.split(/\r?\n/),
                    impactNotes,
                  }),
                  "Change-order draft copied.",
                )
              }
              className="btn btn-secondary"
            >
              Copy change-order draft
            </button>
          </div>
        </div>

        <div className="glass-panel rounded-[1.75rem] p-5">
          <div className="text-sm font-semibold uppercase tracking-[0.16em] text-sky-200">
            Sensitive material controls
          </div>
          <p className="m-0 mt-3 text-sm leading-6 text-slate-300">
            Remove this brief, proposal draft, and related files from the workspace if you no
            longer need them.
          </p>
          <div className="mt-4">
            <DealDeleteButton submissionId={submissionId} onDeleted={handleDeleteComplete} />
          </div>
        </div>
      </aside>
    </div>
  );
}
