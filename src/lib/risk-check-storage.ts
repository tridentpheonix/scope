import { promises as fs } from "node:fs";
import path from "node:path";
import { dbQuery, parseJson, serializeJson } from "./db";
import { isNeonConfigured } from "./env";
import { isPlainObject, tryParseJson } from "./json-safe";
import {
  analyzeRiskCheckSubmission,
  type RiskCheckAnalysis,
} from "./risk-check-analysis";
import type { RiskCheckInput } from "./risk-check-schema";
import { normalizeSavedAttachment, saveAttachment, type SavedAttachment } from "./attachment-storage";

export type SavedSubmission = {
  id: string;
  createdAt: string;
  payload: RiskCheckInput;
  attachment: SavedAttachment | null;
  attachmentContentBase64?: string | null;
  analysis: RiskCheckAnalysis;
};

export type PersistRiskCheckSubmissionOptions = {
  baseDir?: string;
  id?: string;
  createdAt?: string;
  workspaceId?: string;
};

const defaultDataDir = path.join(process.cwd(), "data");

function shouldUseNeon(baseDir?: string) {
  return isNeonConfigured() && (!baseDir || baseDir === defaultDataDir);
}

export async function persistRiskCheckSubmission(
  payload: RiskCheckInput,
  file: File | null | undefined,
  analysis: RiskCheckAnalysis,
  options: PersistRiskCheckSubmissionOptions = {},
) {
  if (shouldUseNeon(options.baseDir)) {
    if (!options.workspaceId) {
      throw new Error("workspaceId is required for Neon-backed risk check storage.");
    }

    const id = options.id ?? crypto.randomUUID();
    const attachment = await saveAttachment(id, file, options.baseDir ?? defaultDataDir);

    const submission: SavedSubmission = {
      id,
      createdAt: options.createdAt ?? new Date().toISOString(),
      payload,
      attachment,
      analysis,
    };

    await dbQuery(
      `
        INSERT INTO app_risk_check_submissions (
          id, workspace_id, created_at, payload, attachment, attachment_content_base64, analysis
        )
        VALUES ($1, $2, $3, $4::jsonb, $5::jsonb, NULL, $6::jsonb)
      `,
      [
        submission.id,
        options.workspaceId,
        submission.createdAt,
        serializeJson(submission.payload),
        serializeJson(submission.attachment),
        serializeJson(submission.analysis),
      ],
    );

    return submission;
  }

  const baseDir = options.baseDir ?? defaultDataDir;
  const submissionsFile = path.join(baseDir, "risk-check-submissions.ndjson");

  const id = options.id ?? crypto.randomUUID();
  const attachment = await saveAttachment(id, file, baseDir);

  const submission: SavedSubmission = {
    id,
    createdAt: options.createdAt ?? new Date().toISOString(),
    payload,
    attachment,
    analysis,
  };

  await fs.appendFile(submissionsFile, `${JSON.stringify(submission)}\n`, "utf8");

  return submission;
}

export async function readRiskCheckSubmissions(
  baseDir = defaultDataDir,
  workspaceId?: string,
  limit?: number,
) {
  if (shouldUseNeon(baseDir)) {
    if (!workspaceId) {
      return [] satisfies SavedSubmission[];
    }

    const rows = await dbQuery<{
      id: string;
      created_at: string;
      payload: unknown;
      attachment: unknown;
      attachment_content_base64: string | null;
      analysis: unknown;
    }>(
      `
        SELECT id, created_at, payload, attachment, attachment_content_base64, analysis
        FROM app_risk_check_submissions
        WHERE workspace_id = $1
        ORDER BY created_at DESC
        ${typeof limit === "number" ? "LIMIT $2" : ""}
      `,
      typeof limit === "number" ? [workspaceId, limit] : [workspaceId],
    );

    return rows.map((row) => ({
      id: row.id,
      createdAt: row.created_at,
      payload: parseJson<RiskCheckInput>(row.payload)!,
      attachment:
        normalizeSavedAttachment(row.attachment) ??
        (row.attachment_content_base64
          ? {
              originalName: "legacy-upload",
              storedName: `${row.id}-legacy-upload`,
              mimeType: "application/octet-stream",
              size: 0,
              storageKind: "legacy-db",
              storageRef: "stored-in-neon",
            }
          : null),
      attachmentContentBase64: row.attachment_content_base64,
      analysis:
        parseJson<RiskCheckAnalysis>(row.analysis) ??
        analyzeRiskCheckSubmission(parseJson<RiskCheckInput>(row.payload)!),
    }));
  }

  const submissionsFile = path.join(baseDir, "risk-check-submissions.ndjson");

  try {
    const content = await fs.readFile(submissionsFile, "utf8");
    const submissions = content
      .split(/\r?\n/)
      .filter(Boolean)
      .flatMap((line) => {
        const submission = tryParseJson<SavedSubmission>(line);
        if (
          !isPlainObject(submission) ||
          typeof submission.id !== "string" ||
          typeof submission.createdAt !== "string" ||
          !isPlainObject(submission.payload)
        ) {
          return [];
        }

        try {
          const typedSubmission = submission as SavedSubmission;

          return {
            ...typedSubmission,
            analysis:
              typedSubmission.analysis ??
              analyzeRiskCheckSubmission(typedSubmission.payload),
          } satisfies SavedSubmission;
        } catch {
          return [];
        }
      });

    const sortedSubmissions = submissions.sort(
      (left, right) => Date.parse(right.createdAt) - Date.parse(left.createdAt),
    );

    return typeof limit === "number" ? sortedSubmissions.slice(0, limit) : sortedSubmissions;
  } catch (error) {
    const nodeError = error as NodeJS.ErrnoException;
    if (nodeError.code === "ENOENT") {
      return [] satisfies SavedSubmission[];
    }

    throw error;
  }
}

export async function readRiskCheckSubmissionById(
  id: string,
  baseDir = defaultDataDir,
  workspaceId?: string,
) {
  if (shouldUseNeon(baseDir)) {
    if (!workspaceId) {
      return null;
    }

    const rows = await dbQuery<{
      id: string;
      created_at: string;
      payload: unknown;
      attachment: unknown;
      attachment_content_base64: string | null;
      analysis: unknown;
    }>(
      `
        SELECT id, created_at, payload, attachment, attachment_content_base64, analysis
        FROM app_risk_check_submissions
        WHERE id = $1 AND workspace_id = $2
        LIMIT 1
      `,
      [id, workspaceId],
    );

    const row = rows[0];
    if (!row) {
      return null;
    }

    const payload = parseJson<RiskCheckInput>(row.payload)!;
    return {
      id: row.id,
      createdAt: row.created_at,
      payload,
      attachment:
        normalizeSavedAttachment(row.attachment) ??
        (row.attachment_content_base64
          ? {
              originalName: "legacy-upload",
              storedName: `${row.id}-legacy-upload`,
              mimeType: "application/octet-stream",
              size: 0,
              storageKind: "legacy-db",
              storageRef: "stored-in-neon",
            }
          : null),
      attachmentContentBase64: row.attachment_content_base64,
      analysis: parseJson<RiskCheckAnalysis>(row.analysis) ?? analyzeRiskCheckSubmission(payload),
    } satisfies SavedSubmission;
  }

  const submissions = await readRiskCheckSubmissions(baseDir, workspaceId);
  return submissions.find((submission) => submission.id === id) ?? null;
}
