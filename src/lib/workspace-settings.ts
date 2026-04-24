import { isMongoConfigured } from "./env";
import { ensureMongoIndexes, getMongoCollection } from "./mongo";

export type WorkspaceBrandSettings = {
  workspaceId: string;
  brandName: string;
  logoUrl: string;
  primaryColor: string;
  accentColor: string;
  exportFooter: string;
  updatedAt: string;
};

type WorkspaceBrandSettingsDocument = WorkspaceBrandSettings & { _id: string };

const fallbackSettings = new Map<string, WorkspaceBrandSettings>();

export const defaultBrandSettings = {
  brandName: "",
  logoUrl: "",
  primaryColor: "#0f172a",
  accentColor: "#38bdf8",
  exportFooter: "Prepared with ScopeOS.",
};

function isHexColor(value: string) {
  return /^#[0-9a-fA-F]{6}$/.test(value);
}

export function normalizeBrandSettingsInput(
  input: Partial<Omit<WorkspaceBrandSettings, "workspaceId" | "updatedAt">>,
) {
  return {
    brandName: (input.brandName ?? "").trim().slice(0, 120),
    logoUrl: (input.logoUrl ?? "").trim().slice(0, 500),
    primaryColor: isHexColor(input.primaryColor ?? "")
      ? input.primaryColor!
      : defaultBrandSettings.primaryColor,
    accentColor: isHexColor(input.accentColor ?? "")
      ? input.accentColor!
      : defaultBrandSettings.accentColor,
    exportFooter: (input.exportFooter ?? defaultBrandSettings.exportFooter)
      .trim()
      .slice(0, 240),
  };
}

export async function readWorkspaceBrandSettings(workspaceId: string) {
  if (isMongoConfigured()) {
    await ensureMongoIndexes();
    const collection =
      await getMongoCollection<WorkspaceBrandSettingsDocument>("workspace_settings");
    const row = await collection.findOne({ _id: workspaceId });
    if (row) {
      return {
        workspaceId: row.workspaceId,
        brandName: row.brandName,
        logoUrl: row.logoUrl,
        primaryColor: row.primaryColor,
        accentColor: row.accentColor,
        exportFooter: row.exportFooter,
        updatedAt: row.updatedAt,
      } satisfies WorkspaceBrandSettings;
    }
  }

  return (
    fallbackSettings.get(workspaceId) ?? {
      workspaceId,
      ...defaultBrandSettings,
      updatedAt: new Date(0).toISOString(),
    }
  );
}

export async function saveWorkspaceBrandSettings(
  workspaceId: string,
  input: Partial<Omit<WorkspaceBrandSettings, "workspaceId" | "updatedAt">>,
) {
  const now = new Date().toISOString();
  const settings = {
    workspaceId,
    ...normalizeBrandSettingsInput(input),
    updatedAt: now,
  } satisfies WorkspaceBrandSettings;

  if (isMongoConfigured()) {
    await ensureMongoIndexes();
    const collection =
      await getMongoCollection<WorkspaceBrandSettingsDocument>("workspace_settings");
    await collection.updateOne(
      { _id: workspaceId },
      { $set: { _id: workspaceId, ...settings } },
      { upsert: true },
    );
  } else {
    fallbackSettings.set(workspaceId, settings);
  }

  return settings;
}
