import { promises as fs } from "node:fs";
import path from "node:path";
import { dbQuery, parseJson, serializeJson } from "./db";
import { isNeonConfigured } from "./env";
import { isPlainObject, tryParseJson } from "./json-safe";
import { assertWorkspaceOwnership } from "./workspace-scope";
import {
  normalizeChangeOrderDraft,
  type ChangeOrderDraft,
} from "./change-order";

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

    const rows = await dbQuery<{
      submission_id: string;
      updated_at: string;
      draft: unknown;
    }>(
      `
        SELECT submission_id, updated_at, draft
        FROM app_change_orders
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
      draft: normalizeChangeOrderDraft(
        parseJson<ChangeOrderDraft>(row.draft) ?? { driftItems: [], impactNotes: "" },
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
      throw new Error("workspaceId is required for Neon-backed change-order storage.");
    }

    const updatedAt = options.updatedAt ?? new Date().toISOString();
    const normalizedDraft = normalizeChangeOrderDraft(draft);
    const existingRows = await dbQuery<{ workspace_id: string }>(
      `
        SELECT workspace_id
        FROM app_change_orders
        WHERE submission_id = $1
        LIMIT 1
      `,
      [submissionId],
    );

    assertWorkspaceOwnership("change-order draft", workspaceId, existingRows[0]?.workspace_id);

    await dbQuery(
      `
        INSERT INTO app_change_orders (submission_id, workspace_id, updated_at, draft)
        VALUES ($1, $2, $3, $4::jsonb)
        ON CONFLICT (submission_id)
        DO UPDATE SET
          workspace_id = EXCLUDED.workspace_id,
          updated_at = EXCLUDED.updated_at,
          draft = EXCLUDED.draft
        WHERE app_change_orders.workspace_id = EXCLUDED.workspace_id
      `,
      [submissionId, workspaceId, updatedAt, serializeJson(normalizedDraft)],
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
