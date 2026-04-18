import { neon } from "@neondatabase/serverless";
import { appEnv, isNeonConfigured, requireEnv } from "./env";
import { neonMigrations } from "./neon-migrations";

let migrationPromise: Promise<void> | null = null;

function getSql() {
  return neon(requireEnv(appEnv.databaseUrl, "DATABASE_URL"));
}

async function runSchemaStatement(statement: string) {
  const sql = getSql();
  await sql.query(statement, []);
}

async function getAppliedMigrationIds() {
  const sql = getSql();
  const rows = (await sql.query(
    `
      SELECT id
      FROM app_schema_migrations
      ORDER BY applied_at ASC
    `,
    [],
  )) as Array<{ id: string }>;

  return new Set(rows.map((row) => row.id));
}

async function ensureMigrationTrackingTable() {
  await runSchemaStatement(`
    CREATE TABLE IF NOT EXISTS app_schema_migrations (
      id TEXT PRIMARY KEY,
      applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);
}

export async function runNeonMigrations() {
  if (!isNeonConfigured()) {
    return;
  }

  if (!migrationPromise) {
    migrationPromise = (async () => {
      await ensureMigrationTrackingTable();
      const appliedMigrationIds = await getAppliedMigrationIds();
      const sql = getSql();

      for (const migration of neonMigrations) {
        if (appliedMigrationIds.has(migration.id)) {
          continue;
        }

        for (const statement of migration.statements) {
          await sql.query(statement, []);
        }

        await sql.query(
          `
            INSERT INTO app_schema_migrations (id, applied_at)
            VALUES ($1, NOW())
          `,
          [migration.id],
        );
      }
    })();
  }

  await migrationPromise;
}

export async function ensureNeonSchema() {
  await runNeonMigrations();
}

export async function dbQuery<T = unknown>(query: string, params: unknown[] = []) {
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
