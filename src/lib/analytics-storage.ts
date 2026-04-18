import { promises as fs } from "node:fs";
import path from "node:path";
import { dbQuery, parseJson, serializeJson } from "./db";
import { isNeonConfigured } from "./env";
import { isPlainObject, tryParseJson } from "./json-safe";
import type { AnalyticsEvent } from "./analytics";
import { readExportBlockerSignals, type ExportBlockerSignal } from "./export-blocker-storage";

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
      .flatMap((line) => {
        const parsed = tryParseJson<AnalyticsEvent>(line);
        if (
          !isPlainObject(parsed) ||
          typeof parsed.name !== "string" ||
          typeof parsed.createdAt !== "string"
        ) {
          return [];
        }

        return [parsed as AnalyticsEvent];
      });
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

export type AnalyticsDashboard = {
  summary: AnalyticsSummary;
  exportBlockers: {
    totalSignals: number;
    recentSignals: ExportBlockerSignal[];
  };
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

export async function readAnalyticsDashboard(
  baseDir = defaultDataDir,
  workspaceId?: string,
  recentEventLimit = 25,
  recentBlockerLimit = 5,
) {
  if (shouldUseNeon(baseDir)) {
    if (!workspaceId) {
      return {
        summary: {
          totalEvents: 0,
          countsByName: {},
          recentEvents: [],
        },
        exportBlockers: {
          totalSignals: 0,
          recentSignals: [],
        },
      } satisfies AnalyticsDashboard;
    }

    const [eventCounts, recentEvents, eventTotal, blockerTotal, recentSignals] =
      await Promise.all([
        dbQuery<{ name: string; count: number }>(
          `
            SELECT name, COUNT(*)::int AS count
            FROM app_analytics_events
            WHERE workspace_id = $1
            GROUP BY name
            ORDER BY count DESC, name ASC
          `,
          [workspaceId],
        ),
        dbQuery<{
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
            LIMIT $2
          `,
          [workspaceId, recentEventLimit],
        ),
        dbQuery<{ total: number }>(
          `
            SELECT COUNT(*)::int AS total
            FROM app_analytics_events
            WHERE workspace_id = $1
          `,
          [workspaceId],
        ),
        dbQuery<{ total: number }>(
          `
            SELECT COUNT(*)::int AS total
            FROM app_export_feedback
            WHERE workspace_id = $1
          `,
          [workspaceId],
        ),
        dbQuery<{
          created_at: string;
          note: string;
          submission_id: string | null;
          outcome: ExportBlockerSignal["outcome"] | null;
          theme_preference: ExportBlockerSignal["themePreference"] | null;
          next_step: string | null;
        }>(
          `
            SELECT
              created_at,
              note,
              submission_id,
              outcome,
              theme_preference,
              next_step
            FROM app_export_feedback
            WHERE workspace_id = $1
            ORDER BY created_at DESC
            LIMIT $2
          `,
          [workspaceId, recentBlockerLimit],
        ),
      ]);

    return {
      summary: {
        totalEvents: eventTotal[0]?.total ?? 0,
        countsByName: Object.fromEntries(eventCounts.map((row) => [row.name, row.count])),
        recentEvents: recentEvents.map((row) => ({
          name: row.name,
          submissionId: row.submission_id ?? undefined,
          createdAt: row.created_at,
          metadata:
            parseJson<Record<string, string | number | boolean | null>>(row.metadata) ?? undefined,
        })),
      },
      exportBlockers: {
        totalSignals: blockerTotal[0]?.total ?? 0,
        recentSignals: recentSignals.map((row) => ({
          createdAt: row.created_at,
          note: row.note,
          submissionId: row.submission_id ?? undefined,
          outcome: row.outcome ?? undefined,
          themePreference: row.theme_preference ?? undefined,
          nextStep: row.next_step ?? undefined,
        })),
      },
    } satisfies AnalyticsDashboard;
  }

  const [events, exportBlockers] = await Promise.all([
    readAnalyticsEvents(baseDir, workspaceId),
    readExportBlockerSignals(baseDir, workspaceId),
  ]);

  const summary = summarizeAnalyticsEvents(events, recentEventLimit);
  const recentSignals = [...exportBlockers]
    .sort((left, right) => Date.parse(right.createdAt) - Date.parse(left.createdAt))
    .slice(0, recentBlockerLimit);

  return {
    summary,
    exportBlockers: {
      totalSignals: exportBlockers.length,
      recentSignals,
    },
  } satisfies AnalyticsDashboard;
}
