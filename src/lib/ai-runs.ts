import { dbQuery, parseJson, serializeJson } from "./db";

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

export async function saveAiRun(input: SaveAiRunInput) {
  const id = crypto.randomUUID();
  const createdAt = input.createdAt ?? new Date().toISOString();

  await dbQuery(
    `
      INSERT INTO app_ai_runs (
        id,
        workspace_id,
        submission_id,
        run_type,
        model_name,
        status,
        input_json,
        output_json,
        error_text,
        created_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7::jsonb, $8::jsonb, $9, $10)
    `,
    [
      id,
      input.workspaceId,
      input.submissionId,
      input.runType,
      input.modelName,
      input.status,
      serializeJson(input.inputJson),
      serializeJson(input.outputJson),
      input.errorText ?? null,
      createdAt,
    ],
  );

  return { id, createdAt };
}

export async function readAiRunsForSubmission(
  workspaceId: string,
  submissionId: string,
  runType?: string,
  limit = 5,
) {
  const rows = await dbQuery<{
    id: string;
    workspace_id: string;
    submission_id: string;
    run_type: string;
    model_name: string | null;
    status: string;
    input_json: unknown;
    output_json: unknown;
    error_text: string | null;
    created_at: string;
  }>(
    `
      SELECT id, workspace_id, submission_id, run_type, model_name, status, input_json, output_json, error_text, created_at
      FROM app_ai_runs
      WHERE workspace_id = $1
        AND submission_id = $2
        AND ($3::text IS NULL OR run_type = $3)
      ORDER BY created_at DESC
      LIMIT $4
    `,
    [workspaceId, submissionId, runType ?? null, limit],
  );

  return rows.map((row) => ({
    id: row.id,
    workspaceId: row.workspace_id,
    submissionId: row.submission_id,
    runType: row.run_type,
    modelName: row.model_name,
    status: row.status,
    inputJson: parseJson<Record<string, unknown>>(row.input_json) ?? {},
    outputJson: parseJson<Record<string, unknown>>(row.output_json) ?? {},
    errorText: row.error_text,
    createdAt: row.created_at,
  })) satisfies SavedAiRunRecord[];
}
