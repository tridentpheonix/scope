import { promises as fs } from "node:fs";
import path from "node:path";
import { dbQuery } from "./db";
import { isNeonConfigured } from "./env";
import { tryParseJson } from "./json-safe";

export type PilotFeedbackSeverity = "blocker" | "high" | "medium" | "low";
export type PilotFeedbackBucket =
  | "auth"
  | "billing"
  | "intake"
  | "ai"
  | "deals"
  | "analytics"
  | "maintenance"
  | "performance"
  | "copy"
  | "data-integrity"
  | "support";
export type PilotFeedbackReproducibility = "always" | "sometimes" | "once" | "unknown";

export type PilotFeedbackEntry = {
  id: string;
  workspaceId: string;
  userId: string;
  submissionId?: string;
  severity: PilotFeedbackSeverity;
  bucket: PilotFeedbackBucket;
  whereHappened: string;
  triedToDo: string;
  expectedResult: string;
  actualResult: string;
  reproducibility: PilotFeedbackReproducibility;
  note: string;
  createdAt: string;
};

export type SavePilotFeedbackOptions = {
  baseDir?: string;
  workspaceId?: string;
};

const defaultDataDir = path.join(process.cwd(), "data");

function shouldUseNeon(baseDir?: string) {
  return isNeonConfigured() && (!baseDir || baseDir === defaultDataDir);
}

function normalizeEntry(value: unknown): PilotFeedbackEntry | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }

  const entry = value as Record<string, unknown>;
  const id = typeof entry.id === "string" ? entry.id : null;
  const workspaceId = typeof entry.workspaceId === "string" ? entry.workspaceId : null;
  const userId = typeof entry.userId === "string" ? entry.userId : null;
  const severity =
    entry.severity === "blocker" ||
    entry.severity === "high" ||
    entry.severity === "medium" ||
    entry.severity === "low"
      ? entry.severity
      : null;
  const bucket =
    entry.bucket === "auth" ||
    entry.bucket === "billing" ||
    entry.bucket === "intake" ||
    entry.bucket === "ai" ||
    entry.bucket === "deals" ||
    entry.bucket === "analytics" ||
    entry.bucket === "maintenance" ||
    entry.bucket === "performance" ||
    entry.bucket === "copy" ||
    entry.bucket === "data-integrity" ||
    entry.bucket === "support"
      ? entry.bucket
      : null;
  const whereHappened = typeof entry.whereHappened === "string" ? entry.whereHappened : null;
  const triedToDo = typeof entry.triedToDo === "string" ? entry.triedToDo : null;
  const expectedResult = typeof entry.expectedResult === "string" ? entry.expectedResult : null;
  const actualResult = typeof entry.actualResult === "string" ? entry.actualResult : null;
  const reproducibility =
    entry.reproducibility === "always" ||
    entry.reproducibility === "sometimes" ||
    entry.reproducibility === "once" ||
    entry.reproducibility === "unknown"
      ? entry.reproducibility
      : null;
  const note = typeof entry.note === "string" ? entry.note : null;
  const createdAt = typeof entry.createdAt === "string" ? entry.createdAt : null;

  if (
    !id ||
    !workspaceId ||
    !userId ||
    !severity ||
    !bucket ||
    !whereHappened ||
    !triedToDo ||
    !expectedResult ||
    !actualResult ||
    !reproducibility ||
    !note ||
    !createdAt
  ) {
    return null;
  }

  return {
    id,
    workspaceId,
    userId,
    submissionId: typeof entry.submissionId === "string" ? entry.submissionId : undefined,
    severity,
    bucket,
    whereHappened,
    triedToDo,
    expectedResult,
    actualResult,
    reproducibility,
    note,
    createdAt,
  };
}

export async function readPilotFeedbackEntries(
  baseDir = defaultDataDir,
  workspaceId?: string,
  limit = 20,
) {
  if (shouldUseNeon(baseDir)) {
    if (!workspaceId) {
      return [] satisfies PilotFeedbackEntry[];
    }

    const rows = await dbQuery<{
      id: string;
      workspace_id: string;
      user_id: string;
      submission_id: string | null;
      severity: PilotFeedbackSeverity;
      bucket: PilotFeedbackBucket;
      where_happened: string;
      tried_to_do: string;
      expected_result: string;
      actual_result: string;
      reproducibility: PilotFeedbackReproducibility;
      note: string;
      created_at: string;
    }>(
      `
        SELECT
          id,
          workspace_id,
          user_id,
          submission_id,
          severity,
          bucket,
          where_happened,
          tried_to_do,
          expected_result,
          actual_result,
          reproducibility,
          note,
          created_at
        FROM app_pilot_feedback
        WHERE workspace_id = $1
        ORDER BY created_at DESC
        LIMIT $2
      `,
      [workspaceId, limit],
    );

    return rows.map((row) => ({
      id: row.id,
      workspaceId: row.workspace_id,
      userId: row.user_id,
      submissionId: row.submission_id ?? undefined,
      severity: row.severity,
      bucket: row.bucket,
      whereHappened: row.where_happened,
      triedToDo: row.tried_to_do,
      expectedResult: row.expected_result,
      actualResult: row.actual_result,
      reproducibility: row.reproducibility,
      note: row.note,
      createdAt: row.created_at,
    }));
  }

  const filePath = path.join(baseDir, "pilot-feedback.ndjson");

  try {
    const content = await fs.readFile(filePath, "utf8");
    const entries = content
      .split(/\r?\n/)
      .filter(Boolean)
      .flatMap((line) => {
        const parsed = tryParseJson<PilotFeedbackEntry>(line);
        const entry = normalizeEntry(parsed);
        if (!entry) {
          return [];
        }

        if (workspaceId && entry.workspaceId !== workspaceId) {
          return [];
        }

        return [entry];
      })
      .sort((left, right) => Date.parse(right.createdAt) - Date.parse(left.createdAt));

    return entries.slice(0, limit);
  } catch (error) {
    const nodeError = error as NodeJS.ErrnoException;
    if (nodeError.code === "ENOENT") {
      return [] satisfies PilotFeedbackEntry[];
    }

    throw error;
  }
}

export async function savePilotFeedbackEntry(
  entry: Omit<PilotFeedbackEntry, "id" | "createdAt" | "workspaceId"> & {
    workspaceId?: string;
    createdAt?: string;
    id?: string;
  },
  options: SavePilotFeedbackOptions = {},
) {
  const workspaceId = options.workspaceId ?? entry.workspaceId;

  if (shouldUseNeon(options.baseDir)) {
    if (!workspaceId) {
      throw new Error("workspaceId is required for Neon-backed pilot feedback storage.");
    }

    const saved = {
      id: entry.id ?? crypto.randomUUID(),
      workspaceId,
      userId: entry.userId,
      submissionId: entry.submissionId,
      severity: entry.severity,
      bucket: entry.bucket,
      whereHappened: entry.whereHappened.trim(),
      triedToDo: entry.triedToDo.trim(),
      expectedResult: entry.expectedResult.trim(),
      actualResult: entry.actualResult.trim(),
      reproducibility: entry.reproducibility,
      note: entry.note.trim(),
      createdAt: entry.createdAt ?? new Date().toISOString(),
    } satisfies PilotFeedbackEntry;

    await dbQuery(
      `
        INSERT INTO app_pilot_feedback (
          id,
          workspace_id,
          user_id,
          submission_id,
          severity,
          bucket,
          where_happened,
          tried_to_do,
          expected_result,
          actual_result,
          reproducibility,
          note,
          created_at
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
      `,
      [
        saved.id,
        saved.workspaceId,
        saved.userId,
        saved.submissionId ?? null,
        saved.severity,
        saved.bucket,
        saved.whereHappened,
        saved.triedToDo,
        saved.expectedResult,
        saved.actualResult,
        saved.reproducibility,
        saved.note,
        saved.createdAt,
      ],
    );

    return saved;
  }

  const baseDir = options.baseDir ?? defaultDataDir;
  const filePath = path.join(baseDir, "pilot-feedback.ndjson");
  await fs.mkdir(baseDir, { recursive: true });

  const saved = {
    id: entry.id ?? crypto.randomUUID(),
    workspaceId: workspaceId ?? "local-workspace",
    userId: entry.userId,
    submissionId: entry.submissionId,
    severity: entry.severity,
    bucket: entry.bucket,
    whereHappened: entry.whereHappened.trim(),
    triedToDo: entry.triedToDo.trim(),
    expectedResult: entry.expectedResult.trim(),
    actualResult: entry.actualResult.trim(),
    reproducibility: entry.reproducibility,
    note: entry.note.trim(),
    createdAt: entry.createdAt ?? new Date().toISOString(),
  } satisfies PilotFeedbackEntry;

  await fs.appendFile(filePath, `${JSON.stringify(saved)}\n`, "utf8");

  return saved;
}
