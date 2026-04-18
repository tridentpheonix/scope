export type NeonMigration = {
  id: string;
  statements: string[];
};

export const neonMigrations: NeonMigration[] = [
  {
    id: "001_initial_schema",
    statements: [
      `CREATE TABLE IF NOT EXISTS app_workspaces (
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
      )`,
      `CREATE TABLE IF NOT EXISTS app_workspace_memberships (
        workspace_id TEXT NOT NULL REFERENCES app_workspaces(id) ON DELETE CASCADE,
        user_id TEXT NOT NULL,
        role TEXT NOT NULL DEFAULT 'owner',
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        PRIMARY KEY (workspace_id, user_id)
      )`,
      `CREATE TABLE IF NOT EXISTS app_risk_check_submissions (
        id TEXT PRIMARY KEY,
        workspace_id TEXT NOT NULL REFERENCES app_workspaces(id) ON DELETE CASCADE,
        created_at TIMESTAMPTZ NOT NULL,
        payload JSONB NOT NULL,
        attachment JSONB,
        attachment_content_base64 TEXT,
        analysis JSONB NOT NULL
      )`,
      `CREATE TABLE IF NOT EXISTS app_extraction_reviews (
        submission_id TEXT PRIMARY KEY REFERENCES app_risk_check_submissions(id) ON DELETE CASCADE,
        workspace_id TEXT NOT NULL REFERENCES app_workspaces(id) ON DELETE CASCADE,
        updated_at TIMESTAMPTZ NOT NULL,
        review JSONB NOT NULL
      )`,
      `CREATE TABLE IF NOT EXISTS app_proposal_packs (
        submission_id TEXT PRIMARY KEY REFERENCES app_risk_check_submissions(id) ON DELETE CASCADE,
        workspace_id TEXT NOT NULL REFERENCES app_workspaces(id) ON DELETE CASCADE,
        updated_at TIMESTAMPTZ NOT NULL,
        client_blocks JSONB NOT NULL
      )`,
      `CREATE TABLE IF NOT EXISTS app_change_orders (
        submission_id TEXT PRIMARY KEY REFERENCES app_risk_check_submissions(id) ON DELETE CASCADE,
        workspace_id TEXT NOT NULL REFERENCES app_workspaces(id) ON DELETE CASCADE,
        updated_at TIMESTAMPTZ NOT NULL,
        draft JSONB NOT NULL
      )`,
      `CREATE TABLE IF NOT EXISTS app_analytics_events (
        id TEXT PRIMARY KEY,
        workspace_id TEXT REFERENCES app_workspaces(id) ON DELETE SET NULL,
        submission_id TEXT,
        name TEXT NOT NULL,
        metadata JSONB,
        created_at TIMESTAMPTZ NOT NULL
      )`,
      `CREATE TABLE IF NOT EXISTS app_ai_runs (
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
      )`,
      `CREATE TABLE IF NOT EXISTS app_export_feedback (
        id TEXT PRIMARY KEY,
        workspace_id TEXT REFERENCES app_workspaces(id) ON DELETE SET NULL,
        submission_id TEXT,
        note TEXT NOT NULL,
        outcome TEXT,
        theme_preference TEXT,
        next_step TEXT,
        created_at TIMESTAMPTZ NOT NULL
      )`,
      `CREATE INDEX IF NOT EXISTS app_risk_check_submissions_workspace_idx
        ON app_risk_check_submissions (workspace_id, created_at DESC)`,
      `CREATE INDEX IF NOT EXISTS app_analytics_events_workspace_idx
        ON app_analytics_events (workspace_id, created_at DESC)`,
      `CREATE INDEX IF NOT EXISTS app_ai_runs_workspace_idx
        ON app_ai_runs (workspace_id, created_at DESC)`,
      `CREATE INDEX IF NOT EXISTS app_export_feedback_workspace_idx
        ON app_export_feedback (workspace_id, created_at DESC)`,
    ],
  },
  {
    id: "002_tenant_guardrails",
    statements: [
      `CREATE OR REPLACE FUNCTION app_assert_submission_workspace_match()
        RETURNS TRIGGER
        LANGUAGE plpgsql
      AS $$
      DECLARE
        submission_workspace_id TEXT;
      BEGIN
        IF NEW.submission_id IS NULL THEN
          RETURN NEW;
        END IF;

        IF TG_OP = 'UPDATE' AND NEW.workspace_id IS NULL THEN
          RETURN NEW;
        END IF;

        IF NEW.workspace_id IS NULL THEN
          RAISE EXCEPTION 'workspace_id is required when submission_id is set'
            USING ERRCODE = '23514';
        END IF;

        SELECT workspace_id
        INTO submission_workspace_id
        FROM app_risk_check_submissions
        WHERE id = NEW.submission_id;

        IF submission_workspace_id IS NULL THEN
          RAISE EXCEPTION 'submission % does not exist', NEW.submission_id
            USING ERRCODE = '23503';
        END IF;

        IF submission_workspace_id <> NEW.workspace_id THEN
          RAISE EXCEPTION 'workspace mismatch for submission %', NEW.submission_id
            USING ERRCODE = '23514';
        END IF;

        RETURN NEW;
      END;
      $$`,
      `DROP TRIGGER IF EXISTS app_ai_runs_workspace_guard ON app_ai_runs`,
      `CREATE TRIGGER app_ai_runs_workspace_guard
        BEFORE INSERT OR UPDATE ON app_ai_runs
        FOR EACH ROW
        EXECUTE FUNCTION app_assert_submission_workspace_match()`,
      `DROP TRIGGER IF EXISTS app_analytics_events_workspace_guard ON app_analytics_events`,
      `CREATE TRIGGER app_analytics_events_workspace_guard
        BEFORE INSERT OR UPDATE ON app_analytics_events
        FOR EACH ROW
        EXECUTE FUNCTION app_assert_submission_workspace_match()`,
      `DROP TRIGGER IF EXISTS app_export_feedback_workspace_guard ON app_export_feedback`,
      `CREATE TRIGGER app_export_feedback_workspace_guard
        BEFORE INSERT OR UPDATE ON app_export_feedback
        FOR EACH ROW
        EXECUTE FUNCTION app_assert_submission_workspace_match()`,
      `DROP TRIGGER IF EXISTS app_extraction_reviews_workspace_guard ON app_extraction_reviews`,
      `CREATE TRIGGER app_extraction_reviews_workspace_guard
        BEFORE INSERT OR UPDATE ON app_extraction_reviews
        FOR EACH ROW
        EXECUTE FUNCTION app_assert_submission_workspace_match()`,
      `DROP TRIGGER IF EXISTS app_proposal_packs_workspace_guard ON app_proposal_packs`,
      `CREATE TRIGGER app_proposal_packs_workspace_guard
        BEFORE INSERT OR UPDATE ON app_proposal_packs
        FOR EACH ROW
        EXECUTE FUNCTION app_assert_submission_workspace_match()`,
      `DROP TRIGGER IF EXISTS app_change_orders_workspace_guard ON app_change_orders`,
      `CREATE TRIGGER app_change_orders_workspace_guard
        BEFORE INSERT OR UPDATE ON app_change_orders
        FOR EACH ROW
        EXECUTE FUNCTION app_assert_submission_workspace_match()`,
      `CREATE INDEX IF NOT EXISTS app_analytics_events_workspace_submission_idx
        ON app_analytics_events (workspace_id, submission_id, created_at DESC)`,
      `CREATE INDEX IF NOT EXISTS app_export_feedback_workspace_submission_idx
        ON app_export_feedback (workspace_id, submission_id, created_at DESC)`,
      `CREATE INDEX IF NOT EXISTS app_ai_runs_workspace_submission_idx
        ON app_ai_runs (workspace_id, submission_id, created_at DESC)`,
    ],
  },
  {
    id: "003_tenant_guardrails_v2",
    statements: [
      `CREATE OR REPLACE FUNCTION app_assert_submission_workspace_match()
        RETURNS TRIGGER
        LANGUAGE plpgsql
      AS $$
      DECLARE
        submission_workspace_id TEXT;
      BEGIN
        IF NEW.submission_id IS NULL THEN
          RETURN NEW;
        END IF;

        IF NEW.workspace_id IS NULL THEN
          IF TG_OP = 'UPDATE'
            AND OLD.workspace_id IS NOT NULL
            AND NEW.submission_id = OLD.submission_id
          THEN
            RETURN NEW;
          END IF;

          RAISE EXCEPTION 'workspace_id is required when submission_id is set'
            USING ERRCODE = '23514';
        END IF;

        SELECT workspace_id
        INTO submission_workspace_id
        FROM app_risk_check_submissions
        WHERE id = NEW.submission_id;

        IF submission_workspace_id IS NULL THEN
          RAISE EXCEPTION 'submission % does not exist', NEW.submission_id
            USING ERRCODE = '23503';
        END IF;

        IF submission_workspace_id <> NEW.workspace_id THEN
          RAISE EXCEPTION 'workspace mismatch for submission %', NEW.submission_id
            USING ERRCODE = '23514';
        END IF;

        RETURN NEW;
      END;
      $$`,
    ],
  },
  {
    id: "004_pilot_feedback",
    statements: [
      `CREATE TABLE IF NOT EXISTS app_pilot_feedback (
        id TEXT PRIMARY KEY,
        workspace_id TEXT NOT NULL REFERENCES app_workspaces(id) ON DELETE CASCADE,
        user_id TEXT NOT NULL,
        submission_id TEXT REFERENCES app_risk_check_submissions(id) ON DELETE SET NULL,
        severity TEXT NOT NULL,
        bucket TEXT NOT NULL,
        where_happened TEXT NOT NULL,
        tried_to_do TEXT NOT NULL,
        expected_result TEXT NOT NULL,
        actual_result TEXT NOT NULL,
        reproducibility TEXT NOT NULL,
        note TEXT NOT NULL,
        created_at TIMESTAMPTZ NOT NULL
      )`,
      `CREATE INDEX IF NOT EXISTS app_pilot_feedback_workspace_idx
        ON app_pilot_feedback (workspace_id, created_at DESC)`,
      `CREATE INDEX IF NOT EXISTS app_pilot_feedback_workspace_submission_idx
        ON app_pilot_feedback (workspace_id, submission_id, created_at DESC)`,
      `DROP TRIGGER IF EXISTS app_pilot_feedback_workspace_guard ON app_pilot_feedback`,
      `CREATE TRIGGER app_pilot_feedback_workspace_guard
        BEFORE INSERT OR UPDATE ON app_pilot_feedback
        FOR EACH ROW
        EXECUTE FUNCTION app_assert_submission_workspace_match()`,
    ],
  },
];
