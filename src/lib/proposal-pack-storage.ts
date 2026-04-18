import { promises as fs } from "node:fs";
import path from "node:path";
import { isNeonConfigured } from "./env";
import { isPlainObject, tryParseJson } from "./json-safe";
import { assertWorkspaceOwnership } from "./workspace-scope";
import { ensureMongoIndexes, getMongoCollection } from "./mongo";

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

type ProposalPackDocument = {
  _id: string;
  workspaceId: string;
  updatedAt: string;
  clientBlocks: Record<string, string>;
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

    await ensureMongoIndexes();
    const proposalPacks = await getMongoCollection<ProposalPackDocument>("proposal_packs");
    const row = await proposalPacks.findOne({ _id: submissionId, workspaceId });
    if (!row) {
      return null;
    }

    return {
      submissionId: row._id,
      updatedAt: row.updatedAt,
      clientBlocks: row.clientBlocks ?? {},
    } satisfies SavedProposalPackRecord;
  }

  const filePath = getProposalPackPath(baseDir, submissionId);

  try {
    const content = await fs.readFile(filePath, "utf8");
    const record = tryParseJson<SavedProposalPackRecord>(content);
    if (
      !isPlainObject(record) ||
      typeof record.submissionId !== "string" ||
      typeof record.updatedAt !== "string" ||
      !isPlainObject(record.clientBlocks) ||
      !Object.values(record.clientBlocks).every((value) => typeof value === "string")
    ) {
      return null;
    }

    return {
      submissionId: record.submissionId,
      updatedAt: record.updatedAt,
      clientBlocks: record.clientBlocks as Record<string, string>,
    };
  } catch (error) {
    const nodeError = error as NodeJS.ErrnoException;
    if (nodeError.code === "ENOENT") {
      return null;
    }

    throw error;
  }
}

export async function readProposalPackRecords(
  baseDir = defaultDataDir,
  workspaceId?: string,
  limit?: number,
) {
  if (shouldUseNeon(baseDir)) {
    if (!workspaceId) {
      return [] satisfies SavedProposalPackRecord[];
    }

    await ensureMongoIndexes();
    const proposalPacks = await getMongoCollection<ProposalPackDocument>("proposal_packs");
    const rows = await proposalPacks.find(
      { workspaceId },
      {
        sort: { updatedAt: -1 },
        ...(typeof limit === "number" ? { limit } : {}),
      },
    ).toArray();

    return rows.map((row) => ({
      submissionId: row._id,
      updatedAt: row.updatedAt,
      clientBlocks: row.clientBlocks ?? {},
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
        const record = tryParseJson<SavedProposalPackRecord>(content);

        if (
          !isPlainObject(record) ||
          typeof record.submissionId !== "string" ||
          typeof record.updatedAt !== "string" ||
          !isPlainObject(record.clientBlocks)
        ) {
          return null;
        }

        return record as SavedProposalPackRecord;
      }),
    );

    const sortedRecords = records
      .filter((record): record is SavedProposalPackRecord => record !== null)
      .sort((left, right) => Date.parse(right.updatedAt) - Date.parse(left.updatedAt));

    return typeof limit === "number" ? sortedRecords.slice(0, limit) : sortedRecords;
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
    const workspaceId = options.workspaceId;
    if (!workspaceId) {
      throw new Error("workspaceId is required for Mongo-backed proposal pack storage.");
    }

    const updatedAt = options.updatedAt ?? new Date().toISOString();

    await ensureMongoIndexes();
    const proposalPacks = await getMongoCollection<ProposalPackDocument>("proposal_packs");
    const existing = await proposalPacks.findOne({ _id: submissionId });

    assertWorkspaceOwnership("proposal pack", workspaceId, existing?.workspaceId);

    await proposalPacks.updateOne(
      { _id: submissionId },
      {
        $set: {
          workspaceId,
          updatedAt,
          clientBlocks,
        },
      },
      { upsert: true },
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
