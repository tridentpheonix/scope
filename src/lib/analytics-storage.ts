import { promises as fs } from "node:fs";
import path from "node:path";
import { dbQuery, parseJson, serializeJson } from "./db";
import { isNeonConfigured } from "./env";
import type { AnalyticsEvent } from "./analytics";

const defaultDataDir = path.join(process.cwd(), "data");

function shouldUseNeon(baseDir?: string) {
  return isNeonConfigured() && (!baseDir || baseDir === defaultDataDir);
}

export async function readAnalyticsEvents(baseDir = defaultDataDir, workspaceId?: string) {
  if (shouldUseNeon(baseDir)) {
    if (!workspaceId) {
      return [] satisfies AnalyticsEvent[];
    }

    const rows = await dbQuery<{
      name: string;
      submission_id: string | null;
      created_at: string;
      metadata: unknown;
    }>(
      `
        SELECT name, submission_id, created_at, metadata
        FROM app_analytics_events
        WHERE workspace_id = $1
        ORDER BY created_at DESC
      `,
      [workspaceId],
    );

    return rows.map((row) => ({
      name: row.name,
      submissionId: row.submission_id ?? undefined,
      createdAt: row.created_at,
      metadata: parseJson<Record<string, string | number | boolean | null>>(row.metadata) ?? undefined,
    }));
  }

  const eventsFile = path.join(baseDir, "events.ndjson");

  try {
    const content = await fs.readFile(eventsFile, "utf8");

    return content
      .split(/\r?\n/)
      .filter(Boolean)
      .map((line) => JSON.parse(line) as AnalyticsEvent);
  } catch (error) {
    const nodeError = error as NodeJS.ErrnoException;
    if (nodeError.code === "ENOENT") {
      return [] satisfies AnalyticsEvent[];
    }

    throw error;
  }
}

export async function saveAnalyticsEvent(
  event: AnalyticsEvent,
  options: {
    baseDir?: string;
    workspaceId?: string;
  } = {},
) {
  if (shouldUseNeon(options.baseDir)) {
    if (!options.workspaceId) {
      throw new Error("workspaceId is required for Neon-backed analytics storage.");
    }

    await dbQuery(
      `
        INSERT INTO app_analytics_events (id, workspace_id, submission_id, name, metadata, created_at)
        VALUES ($1, $2, $3, $4, $5::jsonb, $6)
      `,
      [
        crypto.randomUUID(),
        options.workspaceId,
        event.submissionId ?? null,
        event.name,
        serializeJson(event.metadata),
        event.createdAt,
      ],
    );

    return event;
  }

  const baseDir = options.baseDir ?? defaultDataDir;
  const eventsFile = path.join(baseDir, "events.ndjson");
  await fs.mkdir(baseDir, { recursive: true });
  await fs.appendFile(eventsFile, `${JSON.stringify(event)}\n`, "utf8");
  return event;
}

export type AnalyticsSummary = {
  totalEvents: number;
  countsByName: Record<string, number>;
  recentEvents: AnalyticsEvent[];
};

export function summarizeAnalyticsEvents(events: AnalyticsEvent[], recentLimit = 20) {
  const countsByName: Record<string, number> = {};

  for (const event of events) {
    countsByName[event.name] = (countsByName[event.name] ?? 0) + 1;
  }

  const recentEvents = [...events]
    .sort((left, right) => Date.parse(right.createdAt) - Date.parse(left.createdAt))
    .slice(0, recentLimit);

  return {
    totalEvents: events.length,
    countsByName,
    recentEvents,
  } satisfies AnalyticsSummary;
}
