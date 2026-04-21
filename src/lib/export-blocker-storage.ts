import { promises as fs } from "node:fs";
import path from "node:path";
import { isMongoConfigured } from "./env";
import { isPlainObject, tryParseJson } from "./json-safe";
import { ensureMongoIndexes, getMongoCollection } from "./mongo";

export type ExportBlockerSignal = {
  createdAt: string;
  note: string;
  submissionId?: string;
  outcome?: "reduced-friction" | "needs-theme-options" | "needs-google-docs" | "other";
  themePreference?: "light" | "dark" | "both" | "unspecified";
  nextStep?: string;
};

type ExportFeedbackDocument = {
  _id: string;
  workspaceId: string;
  createdAt: string;
  note: string;
  submissionId?: string;
  outcome?: ExportBlockerSignal["outcome"];
  themePreference?: ExportBlockerSignal["themePreference"];
  nextStep?: string;
};

const defaultDataDir = path.join(process.cwd(), "data");

function shouldUseMongo(baseDir?: string) {
  return isMongoConfigured() && (!baseDir || baseDir === defaultDataDir);
}

export async function readExportBlockerSignals(
  baseDir = defaultDataDir,
  workspaceId?: string,
  limit?: number,
) {
  if (shouldUseMongo(baseDir)) {
    if (!workspaceId) {
      return [] satisfies ExportBlockerSignal[];
    }

    await ensureMongoIndexes();
    const feedback = await getMongoCollection<ExportFeedbackDocument>("export_feedback");
    const rows = await feedback.find(
      { workspaceId },
      {
        sort: { createdAt: -1 },
        ...(typeof limit === "number" ? { limit } : {}),
      },
    ).toArray();

    return rows.map((row) => ({
      createdAt: row.createdAt,
      note: row.note,
      submissionId: row.submissionId,
      outcome: row.outcome,
      themePreference: row.themePreference,
      nextStep: row.nextStep,
    }));
  }

  const filePath = path.join(baseDir, "export-blockers.ndjson");

  try {
    const content = await fs.readFile(filePath, "utf8");
    const signals = content
      .split(/\r?\n/)
      .filter(Boolean)
      .flatMap((line) => {
        const parsed = tryParseJson<ExportBlockerSignal>(line);
        if (
          !isPlainObject(parsed) ||
          typeof parsed.createdAt !== "string" ||
          typeof parsed.note !== "string"
        ) {
          return [];
        }

        return [parsed as ExportBlockerSignal];
      })
      .sort((left, right) => Date.parse(right.createdAt) - Date.parse(left.createdAt));

    return typeof limit === "number" ? signals.slice(0, limit) : signals;
  } catch (error) {
    const nodeError = error as NodeJS.ErrnoException;
    if (nodeError.code === "ENOENT") {
      return [] satisfies ExportBlockerSignal[];
    }

    throw error;
  }
}

export async function saveExportBlockerSignal(
  note: string,
  submissionId?: string,
  baseDir = defaultDataDir,
  metadata?: Pick<ExportBlockerSignal, "outcome" | "themePreference" | "nextStep">,
  workspaceId?: string,
) {
  const payload: ExportBlockerSignal = {
    createdAt: new Date().toISOString(),
    note: note.trim(),
    submissionId,
    ...metadata,
  };

  if (shouldUseMongo(baseDir)) {
    if (!workspaceId) {
      throw new Error("workspaceId is required for Mongo-backed export feedback storage.");
    }

    await ensureMongoIndexes();
    const feedback = await getMongoCollection<ExportFeedbackDocument>("export_feedback");
    await feedback.insertOne({
      _id: crypto.randomUUID(),
      workspaceId,
      createdAt: payload.createdAt,
      note: payload.note,
      submissionId: payload.submissionId,
      outcome: payload.outcome,
      themePreference: payload.themePreference,
      nextStep: payload.nextStep,
    });

    return payload;
  }

  const filePath = path.join(baseDir, "export-blockers.ndjson");
  await fs.mkdir(baseDir, { recursive: true });
  await fs.appendFile(filePath, `${JSON.stringify(payload)}\n`, "utf8");

  return payload;
}
