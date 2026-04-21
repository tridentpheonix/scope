import { promises as fs } from "node:fs";
import path from "node:path";
import { isMongoConfigured } from "./env";
import { isPlainObject, tryParseJson } from "./json-safe";
import {
  analyzeRiskCheckSubmission,
  type RiskCheckAnalysis,
} from "./risk-check-analysis";
import type { RiskCheckInput } from "./risk-check-schema";
import { normalizeSavedAttachment, saveAttachment, type SavedAttachment } from "./attachment-storage";
import { ensureMongoIndexes, getMongoCollection } from "./mongo";

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

type RiskCheckSubmissionDocument = {
  _id: string;
  workspaceId: string;
  createdAt: string;
  payload: RiskCheckInput;
  attachment: SavedAttachment | null;
  attachmentContentBase64?: string | null;
  analysis: RiskCheckAnalysis;
};

const defaultDataDir = path.join(process.cwd(), "data");

function shouldUseMongo(baseDir?: string) {
  return isMongoConfigured() && (!baseDir || baseDir === defaultDataDir);
}

export async function persistRiskCheckSubmission(
  payload: RiskCheckInput,
  file: File | null | undefined,
  analysis: RiskCheckAnalysis,
  options: PersistRiskCheckSubmissionOptions = {},
) {
  if (shouldUseMongo(options.baseDir)) {
    if (!options.workspaceId) {
      throw new Error("workspaceId is required for Mongo-backed risk check storage.");
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

    await ensureMongoIndexes();
    const submissions = await getMongoCollection<RiskCheckSubmissionDocument>("risk_check_submissions");
    await submissions.insertOne({
      _id: submission.id,
      workspaceId: options.workspaceId,
      createdAt: submission.createdAt,
      payload: submission.payload,
      attachment: submission.attachment,
      attachmentContentBase64: null,
      analysis: submission.analysis,
    });

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
  if (shouldUseMongo(baseDir)) {
    if (!workspaceId) {
      return [] satisfies SavedSubmission[];
    }

    await ensureMongoIndexes();
    const submissions = await getMongoCollection<RiskCheckSubmissionDocument>("risk_check_submissions");
    const rows = await submissions.find(
      { workspaceId },
      {
        sort: { createdAt: -1 },
        ...(typeof limit === "number" ? { limit } : {}),
      },
    ).toArray();

    return rows.map((row) => ({
      id: row._id,
      createdAt: row.createdAt,
      payload: row.payload,
      attachment:
        normalizeSavedAttachment(row.attachment) ??
        (row.attachmentContentBase64
          ? {
              originalName: "legacy-upload",
              storedName: `${row._id}-legacy-upload`,
              mimeType: "application/octet-stream",
              size: 0,
              storageKind: "legacy-db",
              storageRef: "stored-in-database",
            }
          : null),
      attachmentContentBase64: row.attachmentContentBase64 ?? null,
      analysis: row.analysis ?? analyzeRiskCheckSubmission(row.payload),
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
  if (shouldUseMongo(baseDir)) {
    if (!workspaceId) {
      return null;
    }

    await ensureMongoIndexes();
    const submissions = await getMongoCollection<RiskCheckSubmissionDocument>("risk_check_submissions");
    const row = await submissions.findOne({ _id: id, workspaceId });
    if (!row) {
      return null;
    }

    const payload = row.payload;
    return {
      id: row._id,
      createdAt: row.createdAt,
      payload,
      attachment:
        normalizeSavedAttachment(row.attachment) ??
        (row.attachmentContentBase64
          ? {
              originalName: "legacy-upload",
              storedName: `${row._id}-legacy-upload`,
              mimeType: "application/octet-stream",
              size: 0,
              storageKind: "legacy-db",
              storageRef: "stored-in-database",
            }
          : null),
      attachmentContentBase64: row.attachmentContentBase64 ?? null,
      analysis: row.analysis ?? analyzeRiskCheckSubmission(payload),
    } satisfies SavedSubmission;
  }

  const submissions = await readRiskCheckSubmissions(baseDir, workspaceId);
  return submissions.find((submission) => submission.id === id) ?? null;
}
