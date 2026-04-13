import { neon } from "@neondatabase/serverless";
import { appEnv, isNeonConfigured, requireEnv } from "./env";

let schemaPromise: Promise<void> | null = null;

function getSql() {
  return neon(requireEnv(appEnv.databaseUrl, "DATABASE_URL"));
}

async function runSchemaStatement(statement: string) {
  const sql = getSql();
  await sql.query(statement, []);
}

export async function ensureNeonSchema() {
  if (!isNeonConfigured()) {
    return;
  }

  if (!schemaPromise) {
    schemaPromise = (async () => {
      await runSchemaStatement(`
        CREATE TABLE IF NOT EXISTS app_workspaces (
          id TEXT PRIMARY KEY,
          owner_user_id TEXT NOT NULL,
          name TEXT NOT NULL,
          plan_key TEXT NOT NULL DEFAULT 'free',
          subscription_status TEXT NOT NULL DEFAULT 'inactive',
          stripe_customer_id TEXT UNIQUE,
          stripe_subscription_id TEXT UNIQUE,
          stripe_price_id TEXT,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
      `);

      await runSchemaStatement(`
        CREATE TABLE IF NOT EXISTS app_workspace_memberships (
          workspace_id TEXT NOT NULL REFERENCES app_workspaces(id) ON DELETE CASCADE,
          user_id TEXT NOT NULL,
          role TEXT NOT NULL DEFAULT 'owner',
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          PRIMARY KEY (workspace_id, user_id)
        )
      `);

      await runSchemaStatement(`
        CREATE TABLE IF NOT EXISTS app_risk_check_submissions (
          id TEXT PRIMARY KEY,
          workspace_id TEXT NOT NULL REFERENCES app_workspaces(id) ON DELETE CASCADE,
          created_at TIMESTAMPTZ NOT NULL,
          payload JSONB NOT NULL,
          attachment JSONB,
          attachment_content_base64 TEXT,
          analysis JSONB NOT NULL
        )
      `);

      await runSchemaStatement(`
        CREATE TABLE IF NOT EXISTS app_extraction_reviews (
          submission_id TEXT PRIMARY KEY REFERENCES app_risk_check_submissions(id) ON DELETE CASCADE,
          workspace_id TEXT NOT NULL REFERENCES app_workspaces(id) ON DELETE CASCADE,
          updated_at TIMESTAMPTZ NOT NULL,
          review JSONB NOT NULL
        )
      `);

      await runSchemaStatement(`
        CREATE TABLE IF NOT EXISTS app_proposal_packs (
          submission_id TEXT PRIMARY KEY REFERENCES app_risk_check_submissions(id) ON DELETE CASCADE,
          workspace_id TEXT NOT NULL REFERENCES app_workspaces(id) ON DELETE CASCADE,
          updated_at TIMESTAMPTZ NOT NULL,
          client_blocks JSONB NOT NULL
        )
      `);

      await runSchemaStatement(`
        CREATE TABLE IF NOT EXISTS app_change_orders (
          submission_id TEXT PRIMARY KEY REFERENCES app_risk_check_submissions(id) ON DELETE CASCADE,
          workspace_id TEXT NOT NULL REFERENCES app_workspaces(id) ON DELETE CASCADE,
          updated_at TIMESTAMPTZ NOT NULL,
          draft JSONB NOT NULL
        )
      `);

      await runSchemaStatement(`
        CREATE TABLE IF NOT EXISTS app_analytics_events (
          id TEXT PRIMARY KEY,
          workspace_id TEXT REFERENCES app_workspaces(id) ON DELETE SET NULL,
          submission_id TEXT,
          name TEXT NOT NULL,
          metadata JSONB,
          created_at TIMESTAMPTZ NOT NULL
        )
      `);

      await runSchemaStatement(`
        CREATE TABLE IF NOT EXISTS app_ai_runs (
          id TEXT PRIMARY KEY,
          workspace_id TEXT NOT NULL REFERENCES app_workspaces(id) ON DELETE CASCADE,
          submission_id TEXT NOT NULL REFERENCES app_risk_check_submissions(id) ON DELETE CASCADE,
          run_type TEXT NOT NULL,
          model_name TEXT,
          status TEXT NOT NULL,
          input_json JSONB NOT NULL,
          output_json JSONB NOT NULL,
          error_text TEXT,
          created_at TIMESTAMPTZ NOT NULL
        )
      `);

      await runSchemaStatement(`
        CREATE TABLE IF NOT EXISTS app_export_feedback (
          id TEXT PRIMARY KEY,
          workspace_id TEXT REFERENCES app_workspaces(id) ON DELETE SET NULL,
          submission_id TEXT,
          note TEXT NOT NULL,
          outcome TEXT,
          theme_preference TEXT,
          next_step TEXT,
          created_at TIMESTAMPTZ NOT NULL
        )
      `);

      await runSchemaStatement(`
        CREATE INDEX IF NOT EXISTS app_risk_check_submissions_workspace_idx
          ON app_risk_check_submissions (workspace_id, created_at DESC)
      `);

      await runSchemaStatement(`
        CREATE INDEX IF NOT EXISTS app_analytics_events_workspace_idx
          ON app_analytics_events (workspace_id, created_at DESC)
      `);

      await runSchemaStatement(`
        CREATE INDEX IF NOT EXISTS app_ai_runs_workspace_idx
          ON app_ai_runs (workspace_id, created_at DESC)
      `);

      await runSchemaStatement(`
        CREATE INDEX IF NOT EXISTS app_export_feedback_workspace_idx
          ON app_export_feedback (workspace_id, created_at DESC)
      `);
    })();
  }

  await schemaPromise;
}

export async function dbQuery<T = unknown>(query: string, params: unknown[] = []) {
  await ensureNeonSchema();
  const sql = getSql();
  return (await sql.query(query, params)) as T[];
}

export function serializeJson(value: unknown) {
  if (typeof value === "undefined") {
    return null;
  }

  return JSON.stringify(value);
}

export function parseJson<T>(value: unknown) {
  if (value === null || typeof value === "undefined") {
    return null;
  }

  if (typeof value === "string") {
    return JSON.parse(value) as T;
  }

  return value as T;
}
