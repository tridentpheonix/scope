import { ensureMongoIndexes, getMongoCollection } from "./mongo";

export type SavedAiRunRecord = {
  id: string;
  workspaceId: string;
  submissionId: string;
  runType: string;
  modelName: string | null;
  status: string;
  inputJson: Record<string, unknown>;
  outputJson: Record<string, unknown>;
  errorText: string | null;
  createdAt: string;
};

export type SaveAiRunInput = {
  workspaceId: string;
  submissionId: string;
  runType: string;
  modelName: string | null;
  status: string;
  inputJson: Record<string, unknown>;
  outputJson: Record<string, unknown>;
  errorText?: string | null;
  createdAt?: string;
};

type AiRunDocument = {
  _id: string;
  workspaceId: string;
  submissionId: string;
  runType: string;
  modelName: string | null;
  status: string;
  inputJson: Record<string, unknown>;
  outputJson: Record<string, unknown>;
  errorText: string | null;
  createdAt: string;
};

export async function saveAiRun(input: SaveAiRunInput) {
  const id = crypto.randomUUID();
  const createdAt = input.createdAt ?? new Date().toISOString();

  await ensureMongoIndexes();
  const runs = await getMongoCollection<AiRunDocument>("ai_runs");
  await runs.insertOne({
    _id: id,
    workspaceId: input.workspaceId,
    submissionId: input.submissionId,
    runType: input.runType,
    modelName: input.modelName,
    status: input.status,
    inputJson: input.inputJson,
    outputJson: input.outputJson,
    errorText: input.errorText ?? null,
    createdAt,
  });

  return { id, createdAt };
}

export async function readAiRunsForSubmission(
  workspaceId: string,
  submissionId: string,
  runType?: string,
  limit = 5,
) {
  await ensureMongoIndexes();
  const runs = await getMongoCollection<AiRunDocument>("ai_runs");
  const rows = await runs.find(
    {
      workspaceId,
      submissionId,
      ...(runType ? { runType } : {}),
    },
    { sort: { createdAt: -1 }, limit },
  ).toArray();

  return rows.map((row) => ({
    id: row._id,
    workspaceId: row.workspaceId,
    submissionId: row.submissionId,
    runType: row.runType,
    modelName: row.modelName,
    status: row.status,
    inputJson: row.inputJson ?? {},
    outputJson: row.outputJson ?? {},
    errorText: row.errorText,
    createdAt: row.createdAt,
  })) satisfies SavedAiRunRecord[];
}
