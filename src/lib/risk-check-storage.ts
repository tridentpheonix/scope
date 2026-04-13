import { promises as fs } from "node:fs";
import path from "node:path";
import { dbQuery, parseJson, serializeJson } from "./db";
import { isNeonConfigured } from "./env";
import {
  analyzeRiskCheckSubmission,
  type RiskCheckAnalysis,
} from "./risk-check-analysis";
import type { RiskCheckInput } from "./risk-check-schema";

export type SavedAttachment = {
  originalName: string;
  storedName: string;
  mimeType: string;
  size: number;
  relativePath: string;
};

export type SavedSubmission = {
  id: string;
  createdAt: string;
  payload: RiskCheckInput;
  attachment: SavedAttachment | null;
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

function sanitizeFileName(name: string) {
  return name.replace(/[^a-zA-Z0-9._-]+/g, "-").replace(/-+/g, "-");
}

async function ensureDataDir(baseDir: string) {
  const uploadDir = path.join(baseDir, "uploads");
  await fs.mkdir(uploadDir, { recursive: true });
}

async function saveAttachment(
  id: string,
  file: File | null | undefined,
  baseDir: string,
) {
  if (!file || file.size === 0) {
    return null;
  }

  const safeName = sanitizeFileName(file.name);
  const storedName = `${id}-${safeName}`;
  const relativePath = path.join("uploads", storedName);
  const absolutePath = path.join(baseDir, relativePath);
  const buffer = Buffer.from(await file.arrayBuffer());

  await fs.writeFile(absolutePath, buffer);

  return {
    originalName: file.name,
    storedName,
    mimeType: file.type,
    size: file.size,
    relativePath,
  } satisfies SavedAttachment;
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
    const attachment =
      file && file.size > 0
        ? ({
            originalName: file.name,
            storedName: `${id}-${sanitizeFileName(file.name)}`,
            mimeType: file.type,
            size: file.size,
            relativePath: "stored-in-neon",
          } satisfies SavedAttachment)
        : null;

    const attachmentContentBase64 =
      file && file.size > 0
        ? Buffer.from(await file.arrayBuffer()).toString("base64")
        : null;

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
        VALUES ($1, $2, $3, $4::jsonb, $5::jsonb, $6, $7::jsonb)
      `,
      [
        submission.id,
        options.workspaceId,
        submission.createdAt,
        serializeJson(submission.payload),
        serializeJson(submission.attachment),
        attachmentContentBase64,
        serializeJson(submission.analysis),
      ],
    );

    return submission;
  }

  const baseDir = options.baseDir ?? defaultDataDir;
  const submissionsFile = path.join(baseDir, "risk-check-submissions.ndjson");
  await ensureDataDir(baseDir);

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
      analysis: unknown;
    }>(
      `
        SELECT id, created_at, payload, attachment, analysis
        FROM app_risk_check_submissions
        WHERE workspace_id = $1
        ORDER BY created_at DESC
      `,
      [workspaceId],
    );

    return rows.map((row) => ({
      id: row.id,
      createdAt: row.created_at,
      payload: parseJson<RiskCheckInput>(row.payload)!,
      attachment: parseJson<SavedAttachment | null>(row.attachment),
      analysis:
        parseJson<RiskCheckAnalysis>(row.analysis) ??
        analyzeRiskCheckSubmission(parseJson<RiskCheckInput>(row.payload)!),
    }));
  }

  const submissionsFile = path.join(baseDir, "risk-check-submissions.ndjson");

  try {
    const content = await fs.readFile(submissionsFile, "utf8");

    return content
      .split(/\r?\n/)
      .filter(Boolean)
      .map((line) => {
        const submission = JSON.parse(line) as SavedSubmission;

        return {
          ...submission,
          analysis:
            submission.analysis ?? analyzeRiskCheckSubmission(submission.payload),
        } satisfies SavedSubmission;
      });
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
      analysis: unknown;
    }>(
      `
        SELECT id, created_at, payload, attachment, analysis
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
      attachment: parseJson<SavedAttachment | null>(row.attachment),
      analysis: parseJson<RiskCheckAnalysis>(row.analysis) ?? analyzeRiskCheckSubmission(payload),
    } satisfies SavedSubmission;
  }

  const submissions = await readRiskCheckSubmissions(baseDir, workspaceId);
  return submissions.find((submission) => submission.id === id) ?? null;
}
