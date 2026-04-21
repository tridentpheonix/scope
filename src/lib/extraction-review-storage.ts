import { promises as fs } from "node:fs";
import path from "node:path";
import { isMongoConfigured } from "./env";
import { isPlainObject, tryParseJson } from "./json-safe";
import { assertWorkspaceOwnership } from "./workspace-scope";
import {
  normalizeExtractionReviewDraft,
  type ExtractionReviewDraft,
} from "./extraction-review";
import { ensureMongoIndexes, getMongoCollection } from "./mongo";

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

type ExtractionReviewDocument = {
  _id: string;
  workspaceId: string;
  updatedAt: string;
  review: ExtractionReviewDraft;
};

const defaultDataDir = path.join(process.cwd(), "data");

function shouldUseMongo(baseDir?: string) {
  return isMongoConfigured() && (!baseDir || baseDir === defaultDataDir);
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
  if (shouldUseMongo(baseDir)) {
    if (!workspaceId) {
      return null;
    }

    await ensureMongoIndexes();
    const reviews = await getMongoCollection<ExtractionReviewDocument>("extraction_reviews");
    const row = await reviews.findOne({ _id: submissionId, workspaceId });

    if (!row) {
      return null;
    }

    return {
      submissionId: row._id,
      updatedAt: row.updatedAt,
      review: normalizeExtractionReviewDraft(
        row.review ?? ({} as ExtractionReviewDraft),
      ),
    } satisfies SavedExtractionReviewRecord;
  }

  const filePath = getExtractionReviewPath(baseDir, submissionId);

  try {
    const content = await fs.readFile(filePath, "utf8");
    const record = tryParseJson<SavedExtractionReviewRecord>(content);

    if (
      !isPlainObject(record) ||
      typeof record.submissionId !== "string" ||
      typeof record.updatedAt !== "string" ||
      !isPlainObject(record.review)
    ) {
      return null;
    }

    try {
      return {
        submissionId: record.submissionId,
        updatedAt: record.updatedAt,
        review: normalizeExtractionReviewDraft(record.review as ExtractionReviewDraft),
      } satisfies SavedExtractionReviewRecord;
    } catch {
      return null;
    }
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
  limit?: number,
) {
  if (shouldUseMongo(baseDir)) {
    if (!workspaceId) {
      return [] satisfies SavedExtractionReviewRecord[];
    }

    await ensureMongoIndexes();
    const reviews = await getMongoCollection<ExtractionReviewDocument>("extraction_reviews");
    const rows = await reviews.find(
      { workspaceId },
      {
        sort: { updatedAt: -1 },
        ...(typeof limit === "number" ? { limit } : {}),
      },
    ).toArray();

    return rows.map((row) => ({
      submissionId: row._id,
      updatedAt: row.updatedAt,
      review: normalizeExtractionReviewDraft(
        row.review ?? ({} as ExtractionReviewDraft),
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
        const record = tryParseJson<SavedExtractionReviewRecord>(content);

        if (
          !isPlainObject(record) ||
          typeof record.submissionId !== "string" ||
          typeof record.updatedAt !== "string" ||
          !isPlainObject(record.review)
        ) {
          return null;
        }

        try {
          return {
            submissionId: record.submissionId,
            updatedAt: record.updatedAt,
            review: normalizeExtractionReviewDraft(record.review as ExtractionReviewDraft),
          } satisfies SavedExtractionReviewRecord;
        } catch {
          return null;
        }
      }),
    );

    const sortedRecords = records
      .filter((record): record is SavedExtractionReviewRecord => record !== null)
      .sort((left, right) => Date.parse(right.updatedAt) - Date.parse(left.updatedAt));

    return typeof limit === "number" ? sortedRecords.slice(0, limit) : sortedRecords;
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
  if (shouldUseMongo(options.baseDir)) {
    const workspaceId = options.workspaceId;
    if (!workspaceId) {
      throw new Error("workspaceId is required for Mongo-backed extraction review storage.");
    }

    const updatedAt = options.updatedAt ?? new Date().toISOString();
    const normalizedReview = normalizeExtractionReviewDraft(review);

    await ensureMongoIndexes();
    const reviews = await getMongoCollection<ExtractionReviewDocument>("extraction_reviews");
    const existing = await reviews.findOne({ _id: submissionId });

    assertWorkspaceOwnership("extraction review", workspaceId, existing?.workspaceId);

    await reviews.updateOne(
      { _id: submissionId },
      {
        $set: {
          workspaceId,
          updatedAt,
          review: normalizedReview,
        },
      },
      { upsert: true },
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
