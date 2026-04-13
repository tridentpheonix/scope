import { promises as fs } from "node:fs";
import path from "node:path";
import { dbQuery, parseJson, serializeJson } from "./db";
import { isNeonConfigured } from "./env";

export type SavedProposalPackRecord = {
  submissionId: string;
  updatedAt: string;
  clientBlocks: Record<string, string>;
};

export type SaveProposalPackOptions = {
  baseDir?: string;
  updatedAt?: string;
  workspaceId?: string;
};

const defaultDataDir = path.join(process.cwd(), "data");

function shouldUseNeon(baseDir?: string) {
  return isNeonConfigured() && (!baseDir || baseDir === defaultDataDir);
}

async function ensureProposalPackDir(baseDir: string) {
  const proposalPackDir = path.join(baseDir, "proposal-packs");
  await fs.mkdir(proposalPackDir, { recursive: true });
  return proposalPackDir;
}

function getProposalPackPath(baseDir: string, submissionId: string) {
  return path.join(baseDir, "proposal-packs", `${submissionId}.json`);
}

export async function readProposalPackRecord(
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
      client_blocks: unknown;
    }>(
      `
        SELECT submission_id, updated_at, client_blocks
        FROM app_proposal_packs
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
      clientBlocks: parseJson<Record<string, string>>(row.client_blocks) ?? {},
    } satisfies SavedProposalPackRecord;
  }

  const filePath = getProposalPackPath(baseDir, submissionId);

  try {
    const content = await fs.readFile(filePath, "utf8");
    return JSON.parse(content) as SavedProposalPackRecord;
  } catch (error) {
    const nodeError = error as NodeJS.ErrnoException;
    if (nodeError.code === "ENOENT") {
      return null;
    }

    throw error;
  }
}

export async function readProposalPackRecords(baseDir = defaultDataDir, workspaceId?: string) {
  if (shouldUseNeon(baseDir)) {
    if (!workspaceId) {
      return [] satisfies SavedProposalPackRecord[];
    }

    const rows = await dbQuery<{
      submission_id: string;
      updated_at: string;
      client_blocks: unknown;
    }>(
      `
        SELECT submission_id, updated_at, client_blocks
        FROM app_proposal_packs
        WHERE workspace_id = $1
        ORDER BY updated_at DESC
      `,
      [workspaceId],
    );

    return rows.map((row) => ({
      submissionId: row.submission_id,
      updatedAt: row.updated_at,
      clientBlocks: parseJson<Record<string, string>>(row.client_blocks) ?? {},
    }));
  }

  const proposalPackDir = path.join(baseDir, "proposal-packs");

  try {
    const entries = await fs.readdir(proposalPackDir, { withFileTypes: true });
    const fileNames = entries
      .filter((entry) => entry.isFile() && entry.name.endsWith(".json"))
      .map((entry) => entry.name);

    const records = await Promise.all(
      fileNames.map(async (fileName) => {
        const content = await fs.readFile(path.join(proposalPackDir, fileName), "utf8");
        return JSON.parse(content) as SavedProposalPackRecord;
      }),
    );

    return records;
  } catch (error) {
    const nodeError = error as NodeJS.ErrnoException;
    if (nodeError.code === "ENOENT") {
      return [] satisfies SavedProposalPackRecord[];
    }

    throw error;
  }
}

export async function saveProposalPackRecord(
  submissionId: string,
  clientBlocks: Record<string, string>,
  options: SaveProposalPackOptions = {},
) {
  if (shouldUseNeon(options.baseDir)) {
    if (!options.workspaceId) {
      throw new Error("workspaceId is required for Neon-backed proposal pack storage.");
    }

    const updatedAt = options.updatedAt ?? new Date().toISOString();
    await dbQuery(
      `
        INSERT INTO app_proposal_packs (submission_id, workspace_id, updated_at, client_blocks)
        VALUES ($1, $2, $3, $4::jsonb)
        ON CONFLICT (submission_id)
        DO UPDATE SET
          workspace_id = EXCLUDED.workspace_id,
          updated_at = EXCLUDED.updated_at,
          client_blocks = EXCLUDED.client_blocks
      `,
      [submissionId, options.workspaceId, updatedAt, serializeJson(clientBlocks)],
    );

    return {
      submissionId,
      updatedAt,
      clientBlocks,
    } satisfies SavedProposalPackRecord;
  }

  const baseDir = options.baseDir ?? defaultDataDir;
  await ensureProposalPackDir(baseDir);

  const record: SavedProposalPackRecord = {
    submissionId,
    updatedAt: options.updatedAt ?? new Date().toISOString(),
    clientBlocks,
  };

  await fs.writeFile(
    getProposalPackPath(baseDir, submissionId),
    `${JSON.stringify(record, null, 2)}\n`,
    "utf8",
  );

  return record;
}
