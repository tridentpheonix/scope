"use client";

import { useState } from "react";
import type { WorkspaceBrandSettings } from "@/lib/workspace-settings";

export function WorkspaceBrandForm({
  initialSettings,
  canExport,
}: {
  initialSettings: WorkspaceBrandSettings;
  canExport: boolean;
}) {
  const [settings, setSettings] = useState(initialSettings);
  const [status, setStatus] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus(null);
    setIsSaving(true);

    try {
      const response = await fetch("/api/workspace/brand", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });
      const payload = (await response.json()) as {
        ok?: boolean;
        settings?: WorkspaceBrandSettings;
        message?: string;
      };
      if (!response.ok || !payload.ok || !payload.settings) {
        throw new Error(payload.message ?? "Could not save brand settings.");
      }
      setSettings(payload.settings);
      setStatus("Brand settings saved.");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Could not save brand settings.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <form className="grid gap-4" onSubmit={handleSubmit}>
      <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm leading-7 text-slate-700">
        {canExport
          ? "Your paid workspace can export branded proposal packs."
          : "Free workspaces can preview branding. Upgrade to export branded packs."}
      </div>
      <label className="grid gap-2 text-sm font-medium text-slate-800">
        Brand / agency name
        <input
          className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-base text-slate-950"
          value={settings.brandName}
          onChange={(event) => setSettings({ ...settings, brandName: event.target.value })}
          placeholder="Your agency name"
        />
      </label>
      <label className="grid gap-2 text-sm font-medium text-slate-800">
        Logo URL
        <input
          className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-base text-slate-950"
          value={settings.logoUrl}
          onChange={(event) => setSettings({ ...settings, logoUrl: event.target.value })}
          placeholder="https://..."
        />
      </label>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="grid gap-2 text-sm font-medium text-slate-800">
          Primary color
          <input
            className="h-12 rounded-2xl border border-slate-200 bg-white px-2"
            type="color"
            value={settings.primaryColor}
            onChange={(event) => setSettings({ ...settings, primaryColor: event.target.value })}
          />
        </label>
        <label className="grid gap-2 text-sm font-medium text-slate-800">
          Accent color
          <input
            className="h-12 rounded-2xl border border-slate-200 bg-white px-2"
            type="color"
            value={settings.accentColor}
            onChange={(event) => setSettings({ ...settings, accentColor: event.target.value })}
          />
        </label>
      </div>
      <label className="grid gap-2 text-sm font-medium text-slate-800">
        Export footer
        <textarea
          className="min-h-24 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-base text-slate-950"
          value={settings.exportFooter}
          onChange={(event) => setSettings({ ...settings, exportFooter: event.target.value })}
        />
      </label>
      {status ? (
        <div className="rounded-2xl border border-sky-200 bg-sky-50 px-4 py-3 text-sm text-sky-800">
          {status}
        </div>
      ) : null}
      <button type="submit" className="btn btn-dark w-fit" disabled={isSaving}>
        {isSaving ? "Saving..." : "Save brand settings"}
      </button>
    </form>
  );
}
