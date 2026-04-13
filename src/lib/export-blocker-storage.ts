import { promises as fs } from "node:fs";
import path from "node:path";
import { dbQuery } from "./db";
import { isNeonConfigured } from "./env";

export type ExportBlockerSignal = {
  createdAt: string;
  note: string;
  submissionId?: string;
  outcome?: "reduced-friction" | "needs-theme-options" | "needs-google-docs" | "other";
  themePreference?: "light" | "dark" | "both" | "unspecified";
  nextStep?: string;
};

const defaultDataDir = path.join(process.cwd(), "data");

function shouldUseNeon(baseDir?: string) {
  return isNeonConfigured() && (!baseDir || baseDir === defaultDataDir);
}

export async function readExportBlockerSignals(baseDir = defaultDataDir, workspaceId?: string) {
  if (shouldUseNeon(baseDir)) {
    if (!workspaceId) {
      return [] satisfies ExportBlockerSignal[];
    }

    return await dbQuery<ExportBlockerSignal & { submission_id?: string }>(
      `
        SELECT
          created_at AS "createdAt",
          note,
          submission_id AS "submissionId",
          outcome,
          theme_preference AS "themePreference",
          next_step AS "nextStep"
        FROM app_export_feedback
        WHERE workspace_id = $1
        ORDER BY created_at DESC
      `,
      [workspaceId],
    );
  }

  const filePath = path.join(baseDir, "export-blockers.ndjson");

  try {
    const content = await fs.readFile(filePath, "utf8");
    return content
      .split(/\r?\n/)
      .filter(Boolean)
      .map((line) => JSON.parse(line) as ExportBlockerSignal);
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

  if (shouldUseNeon(baseDir)) {
    if (!workspaceId) {
      throw new Error("workspaceId is required for Neon-backed export feedback storage.");
    }

    await dbQuery(
      `
        INSERT INTO app_export_feedback (
          id, workspace_id, submission_id, note, outcome, theme_preference, next_step, created_at
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      `,
      [
        crypto.randomUUID(),
        workspaceId,
        submissionId ?? null,
        payload.note,
        payload.outcome ?? null,
        payload.themePreference ?? null,
        payload.nextStep ?? null,
        payload.createdAt,
      ],
    );

    return payload;
  }

  const filePath = path.join(baseDir, "export-blockers.ndjson");
  await fs.mkdir(baseDir, { recursive: true });
  await fs.appendFile(filePath, `${JSON.stringify(payload)}\n`, "utf8");

  return payload;
}
