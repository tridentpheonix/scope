import { promises as fs } from "node:fs";
import path from "node:path";
import { isNeonConfigured } from "./env";
import { isPlainObject, tryParseJson } from "./json-safe";
import { assertWorkspaceOwnership } from "./workspace-scope";
import {
  normalizeChangeOrderDraft,
  type ChangeOrderDraft,
} from "./change-order";
import { ensureMongoIndexes, getMongoCollection } from "./mongo";

export type SavedChangeOrderRecord = {
  submissionId: string;
  updatedAt: string;
  draft: ChangeOrderDraft;
};

export type SaveChangeOrderOptions = {
  baseDir?: string;
  updatedAt?: string;
  workspaceId?: string;
};

type ChangeOrderDocument = {
  _id: string;
  workspaceId: string;
  updatedAt: string;
  draft: ChangeOrderDraft;
};

const defaultDataDir = path.join(process.cwd(), "data");

function shouldUseNeon(baseDir?: string) {
  return isNeonConfigured() && (!baseDir || baseDir === defaultDataDir);
}

async function ensureChangeOrderDir(baseDir: string) {
  const changeOrderDir = path.join(baseDir, "change-orders");
  await fs.mkdir(changeOrderDir, { recursive: true });
  return changeOrderDir;
}

function getChangeOrderPath(baseDir: string, submissionId: string) {
  return path.join(baseDir, "change-orders", `${submissionId}.json`);
}

export async function readChangeOrderRecord(
  submissionId: string,
  baseDir = defaultDataDir,
  workspaceId?: string,
) {
  if (shouldUseNeon(baseDir)) {
    if (!workspaceId) {
      return null;
    }

    await ensureMongoIndexes();
    const changeOrders = await getMongoCollection<ChangeOrderDocument>("change_orders");
    const row = await changeOrders.findOne({ _id: submissionId, workspaceId });

    if (!row) {
      return null;
    }

    return {
      submissionId: row._id,
      updatedAt: row.updatedAt,
      draft: normalizeChangeOrderDraft(
        row.draft ?? { driftItems: [], impactNotes: "" },
      ),
    } satisfies SavedChangeOrderRecord;
  }

  const filePath = getChangeOrderPath(baseDir, submissionId);

  try {
    const content = await fs.readFile(filePath, "utf8");
    const record = tryParseJson<SavedChangeOrderRecord>(content);

    if (
      !isPlainObject(record) ||
      typeof record.submissionId !== "string" ||
      typeof record.updatedAt !== "string" ||
      !isPlainObject(record.draft)
    ) {
      return null;
    }

    try {
      return {
        submissionId: record.submissionId,
        updatedAt: record.updatedAt,
        draft: normalizeChangeOrderDraft(record.draft as ChangeOrderDraft),
      } satisfies SavedChangeOrderRecord;
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

export async function saveChangeOrderRecord(
  submissionId: string,
  draft: ChangeOrderDraft,
  options: SaveChangeOrderOptions = {},
) {
  if (shouldUseNeon(options.baseDir)) {
    const workspaceId = options.workspaceId;
    if (!workspaceId) {
      throw new Error("workspaceId is required for Mongo-backed change-order storage.");
    }

    const updatedAt = options.updatedAt ?? new Date().toISOString();
    const normalizedDraft = normalizeChangeOrderDraft(draft);

    await ensureMongoIndexes();
    const changeOrders = await getMongoCollection<ChangeOrderDocument>("change_orders");
    const existing = await changeOrders.findOne({ _id: submissionId });

    assertWorkspaceOwnership("change-order draft", workspaceId, existing?.workspaceId);

    await changeOrders.updateOne(
      { _id: submissionId },
      {
        $set: {
          workspaceId,
          updatedAt,
          draft: normalizedDraft,
        },
      },
      { upsert: true },
    );

    return {
      submissionId,
      updatedAt,
      draft: normalizedDraft,
    } satisfies SavedChangeOrderRecord;
  }

  const baseDir = options.baseDir ?? defaultDataDir;
  await ensureChangeOrderDir(baseDir);

  const record: SavedChangeOrderRecord = {
    submissionId,
    updatedAt: options.updatedAt ?? new Date().toISOString(),
    draft: normalizeChangeOrderDraft(draft),
  };

  await fs.writeFile(
    getChangeOrderPath(baseDir, submissionId),
    `${JSON.stringify(record, null, 2)}\n`,
    "utf8",
  );

  return record;
}
