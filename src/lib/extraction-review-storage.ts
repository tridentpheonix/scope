import { promises as fs } from "node:fs";
import path from "node:path";
import { dbQuery, parseJson, serializeJson } from "./db";
import { isNeonConfigured } from "./env";
import {
  normalizeExtractionReviewDraft,
  type ExtractionReviewDraft,
} from "./extraction-review";

export type SavedExtractionReviewRecord = {
  submissionId: string;
  updatedAt: string;
  review: ExtractionReviewDraft;
};

export type SaveExtractionReviewOptions = {
  baseDir?: string;
  updatedAt?: string;
  workspaceId?: string;
};

const defaultDataDir = path.join(process.cwd(), "data");

function shouldUseNeon(baseDir?: string) {
  return isNeonConfigured() && (!baseDir || baseDir === defaultDataDir);
}

async function ensureExtractionReviewDir(baseDir: string) {
  const extractionReviewDir = path.join(baseDir, "extraction-reviews");
  await fs.mkdir(extractionReviewDir, { recursive: true });
  return extractionReviewDir;
}

function getExtractionReviewPath(baseDir: string, submissionId: string) {
  return path.join(baseDir, "extraction-reviews", `${submissionId}.json`);
}

export async function readExtractionReviewRecord(
  submissionId: string,
  baseDir = defaultDataDir,
  workspaceId?: string,
) {
  if (shouldUseNeon(baseDir)) {
    if (!workspaceId) {
      return null;
    }

    const rows = await dbQuery<{
      submission_id: string;
      updated_at: string;
      review: unknown;
    }>(
      `
        SELECT submission_id, updated_at, review
        FROM app_extraction_reviews
        WHERE submission_id = $1 AND workspace_id = $2
        LIMIT 1
      `,
      [submissionId, workspaceId],
    );

    const row = rows[0];
    if (!row) {
      return null;
    }

    return {
      submissionId: row.submission_id,
      updatedAt: row.updated_at,
      review: normalizeExtractionReviewDraft(
        parseJson<ExtractionReviewDraft>(row.review) ?? ({} as ExtractionReviewDraft),
      ),
    } satisfies SavedExtractionReviewRecord;
  }

  const filePath = getExtractionReviewPath(baseDir, submissionId);

  try {
    const content = await fs.readFile(filePath, "utf8");
    const record = JSON.parse(content) as SavedExtractionReviewRecord;

    return {
      ...record,
      review: normalizeExtractionReviewDraft(record.review),
    } satisfies SavedExtractionReviewRecord;
  } catch (error) {
    const nodeError = error as NodeJS.ErrnoException;
    if (nodeError.code === "ENOENT") {
      return null;
    }

    throw error;
  }
}

export async function readExtractionReviewRecords(
  baseDir = defaultDataDir,
  workspaceId?: string,
) {
  if (shouldUseNeon(baseDir)) {
    if (!workspaceId) {
      return [] satisfies SavedExtractionReviewRecord[];
    }

    const rows = await dbQuery<{
      submission_id: string;
      updated_at: string;
      review: unknown;
    }>(
      `
        SELECT submission_id, updated_at, review
        FROM app_extraction_reviews
        WHERE workspace_id = $1
        ORDER BY updated_at DESC
      `,
      [workspaceId],
    );

    return rows.map((row) => ({
      submissionId: row.submission_id,
      updatedAt: row.updated_at,
      review: normalizeExtractionReviewDraft(
        parseJson<ExtractionReviewDraft>(row.review) ?? ({} as ExtractionReviewDraft),
      ),
    }));
  }

  const extractionReviewDir = path.join(baseDir, "extraction-reviews");

  try {
    const entries = await fs.readdir(extractionReviewDir, { withFileTypes: true });
    const fileNames = entries
      .filter((entry) => entry.isFile() && entry.name.endsWith(".json"))
      .map((entry) => entry.name);

    const records = await Promise.all(
      fileNames.map(async (fileName) => {
        const content = await fs.readFile(
          path.join(extractionReviewDir, fileName),
          "utf8",
        );
        const record = JSON.parse(content) as SavedExtractionReviewRecord;

        return {
          ...record,
          review: normalizeExtractionReviewDraft(record.review),
        } satisfies SavedExtractionReviewRecord;
      }),
    );

    return records;
  } catch (error) {
    const nodeError = error as NodeJS.ErrnoException;
    if (nodeError.code === "ENOENT") {
      return [] satisfies SavedExtractionReviewRecord[];
    }

    throw error;
  }
}

export async function saveExtractionReviewRecord(
  submissionId: string,
  review: ExtractionReviewDraft,
  options: SaveExtractionReviewOptions = {},
) {
  if (shouldUseNeon(options.baseDir)) {
    if (!options.workspaceId) {
      throw new Error("workspaceId is required for Neon-backed extraction review storage.");
    }

    const updatedAt = options.updatedAt ?? new Date().toISOString();
    const normalizedReview = normalizeExtractionReviewDraft(review);

    await dbQuery(
      `
        INSERT INTO app_extraction_reviews (submission_id, workspace_id, updated_at, review)
        VALUES ($1, $2, $3, $4::jsonb)
        ON CONFLICT (submission_id)
        DO UPDATE SET
          workspace_id = EXCLUDED.workspace_id,
          updated_at = EXCLUDED.updated_at,
          review = EXCLUDED.review
      `,
      [submissionId, options.workspaceId, updatedAt, serializeJson(normalizedReview)],
    );

    return {
      submissionId,
      updatedAt,
      review: normalizedReview,
    } satisfies SavedExtractionReviewRecord;
  }

  const baseDir = options.baseDir ?? defaultDataDir;
  await ensureExtractionReviewDir(baseDir);

  const record: SavedExtractionReviewRecord = {
    submissionId,
    updatedAt: options.updatedAt ?? new Date().toISOString(),
    review: normalizeExtractionReviewDraft(review),
  };

  await fs.writeFile(
    getExtractionReviewPath(baseDir, submissionId),
    `${JSON.stringify(record, null, 2)}\n`,
    "utf8",
  );

  return record;
}
